from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from mongoengine import connect
import os
from datetime import timedelta
import uuid
from models import User, Detection, Plant, DiseaseInfo
from yolo_inference import YOLODetector
import base64
from PIL import Image
import io
from dotenv import load_dotenv
from urllib.parse import quote_plus
import cloudinary
import cloudinary.uploader


# Load environment variables from .env file
load_dotenv()

# Create Flask app instance
app = Flask(__name__)

# --------------------
# Configuration
# --------------------
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure the upload folder exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Initialize JWT and MongoDB
jwt = JWTManager(app)

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# --------------------
# Init extensions
# --------------------
MONGO_USER = os.environ.get("MONGO_USER")
MONGO_PASS = os.environ.get("MONGO_PASS")
MONGO_HOST = os.environ.get("MONGO_HOST")
MONGO_DB   = os.environ.get("MONGO_DB")

# Encode username and password safely for URI
if MONGO_USER and MONGO_PASS:
    MONGO_URI = f"mongodb+srv://{quote_plus(MONGO_USER)}:{quote_plus(MONGO_PASS)}@{MONGO_HOST}/{MONGO_DB}?retryWrites=true&w=majority"
else:
    # fallback: use DATABASE_URL if directly provided
    MONGO_URI = os.environ.get("DATABASE_URL")

connect(
    db=MONGO_DB,
    host=MONGO_URI
)

CORS(app, origins=["http://localhost:5173"])

# --------------------
# Init YOLO detector
# --------------------
yolo_detector = YOLODetector()


# --------------------
# Routes
# --------------------
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        if User.objects(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400

        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password'])
        )
        user.save()

        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email
            }
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = User.objects(email=data['email']).first()

        if user and check_password_hash(user.password_hash, data['password']):
            access_token = create_access_token(identity=str(user.id))

            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': {
                    'id': str(user.id),
                    'username': user.username,
                    'email': user.email
                }
            }), 200

        return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --------------------
# GET Profile
# --------------------
@app.route('/api/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'settings': {
                'notifications': user.settings.notifications,
                'history': user.settings.history,
                'analytics': user.settings.analytics
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --------------------
# Update Profile (username/email/password)
# --------------------
@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            existing = User.objects(email=data['email']).first()
            if existing and str(existing.id) != str(user.id):
                return jsonify({'error': 'Email already in use'}), 400
            user.email = data['email']
        if 'password' in data:
            user.password_hash = generate_password_hash(data['password'])

        user.save()

        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --------------------
# Update Settings (toggles)
# --------------------
@app.route('/api/profile/settings', methods=['PUT'])
@jwt_required()
def update_profile_settings():
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        if 'notifications' in data:
            user.settings.notifications = data['notifications']
        if 'history' in data:
            user.settings.history = data['history']
        if 'analytics' in data:
            user.settings.analytics = data['analytics']

        user.save()

        return jsonify({
            'message': 'Settings updated successfully',
            'settings': {
                'notifications': user.settings.notifications,
                'history': user.settings.history,
                'analytics': user.settings.analytics
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --------------------
# Delete Profile
# --------------------
@app.route('/api/profile', methods=['DELETE'])
@jwt_required()
def delete_profile():
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        Detection.objects(user=user).delete()
        user.delete()

        return jsonify({'message': 'Account deleted successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --------------------
# Detect Disease (with Cloudinary)
# --------------------
@app.route('/api/detect', methods=['POST'])
@jwt_required()
def detect_disease():
    filepath = None
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # --- 1. Temporarily save the image to the local upload folder ---
        if 'image' in request.json:
            image_data = request.json['image']
            if ',' in image_data:
                image_data = image_data.split(',')[1]

            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))

            filename = f"{uuid.uuid4()}.jpg"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(filepath)

        elif 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400

            filename = secure_filename(file.filename)
            filename = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
        else:
            return jsonify({'error': 'No image provided'}), 400

        # Run YOLO detection on the local file
        detection_result = yolo_detector.detect(filepath)

        # --- 2. Upload the locally saved file to Cloudinary ---
        upload_result = cloudinary.uploader.upload(filepath)
        image_url = upload_result.get('secure_url')

        if not image_url:
            raise Exception("Cloudinary upload failed")

        # --- 3. Remove the temporary local file after successful upload ---
        if os.path.exists(filepath):
            os.remove(filepath)

        # --- 4. Save the Cloudinary URL to MongoDB ---
        detection = Detection(
            user=user,
            image_url=image_url,  # Store the Cloudinary URL
            disease_detected=detection_result['disease_detected'],
            confidence_score=detection_result['confidence'],
            disease_type=detection_result.get('disease_type'),
            severity_level=detection_result.get('severity_level'),
            treatment_recommendation=detection_result.get('treatment_recommendation')
        )
        detection.save()

        return jsonify({
            'detection_id': str(detection.id),
            'disease_detected': detection_result['disease_detected'],
            'confidence': detection_result['confidence'],
            'disease_type': detection_result.get('disease_type'),
            'severity_level': detection_result.get('severity_level'),
            'treatment_recommendation': detection_result.get('treatment_recommendation'),
            'timestamp': detection.created_at.isoformat()
        }), 200

    except Exception as e:
        # Clean up the local file if an error occurs after saving it
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': str(e)}), 500


@app.route('/api/history', methods=['GET'])
@jwt_required()
def get_detection_history():
    try:
        user_id = get_jwt_identity()
        detections = Detection.objects(user=user_id).order_by('-created_at')

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        total = detections.count()

        items = detections.skip((page - 1) * per_page).limit(per_page)

        history = []
        for d in items:
            history.append({
                'id': str(d.id),
                'image_url': d.image_url,  # Fetch the Cloudinary URL
                'disease_detected': d.disease_detected,
                'confidence': d.confidence_score,
                'disease_type': d.disease_type,
                'severity_level': d.severity_level,
                'treatment_recommendation': d.treatment_recommendation,
                'timestamp': d.created_at.isoformat()
            })

        return jsonify({
            'history': history,
            'total': total,
            'pages': (total + per_page - 1) // per_page,
            'current_page': page
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/plants', methods=['GET'])
@jwt_required()
def get_plants():
    try:
        # get the currently logged-in user's id (from token)
        current_user = get_jwt_identity()

        plants = Plant.objects()
        plants_data = []
        for p in plants:
            plants_data.append({
                'id': str(p.id),
                'name': p.name,
                'scientific_name': p.scientific_name,
                'common_diseases': p.common_diseases
            })

        return jsonify({'plants': plants_data, 'requested_by': current_user}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    try:
        user_id = get_jwt_identity()
        total_detections = Detection.objects(user=user_id).count()
        diseased_detections = Detection.objects(user=user_id, disease_detected=True).count()
        healthy_detections = total_detections - diseased_detections

        return jsonify({
            'total_detections': total_detections,
            'diseased_detections': diseased_detections,
            'healthy_detections': healthy_detections,
            'detection_rate': (diseased_detections / total_detections * 100) if total_detections > 0 else 0
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --------------------
# Error handlers
# --------------------
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    # Insert sample plants if empty
    if Plant.objects().count() == 0:
        sample_plants = [
            Plant(name='Tomato', scientific_name='Solanum lycopersicum',
                  common_diseases=['Early Blight', 'Late Blight', 'Leaf Mold', 'Septoria Leaf Spot']),
            Plant(name='Potato', scientific_name='Solanum tuberosum',
                  common_diseases=['Early Blight', 'Late Blight', 'Healthy']),
            Plant(name='Corn', scientific_name='Zea mays',
                  common_diseases=['Northern Leaf Blight', 'Common Rust', 'Healthy'])
        ]
        for plant in sample_plants:
            plant.save()

    app.run(debug=True, host='0.0.0.0', port=5000)