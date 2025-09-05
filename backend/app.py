from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
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
load_dotenv()


app = Flask(__name__)

# --------------------
# Configuration
# --------------------
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# --------------------
# Init extensions
# --------------------
connect(
    db="AgroAi",
    host=os.environ.get("DATABASE_URL")
)
CORS(app, origins=["http://localhost:5173"])
jwt = JWTManager(app)

# --------------------
# Init YOLO detector
# --------------------
yolo_detector = YOLODetector()

# Ensure upload dir exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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


@app.route('/api/detect', methods=['POST'])
@jwt_required()
def detect_disease():
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Handle base64 image
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

        # Run YOLO detection
        detection_result = yolo_detector.detect(filepath)

        # Save detection in MongoDB
        detection = Detection(
            user=user,
            image_path=filepath,
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
def get_plants():
    try:
        plants = Plant.objects()
        plants_data = []
        for p in plants:
            plants_data.append({
                'id': str(p.id),
                'name': p.name,
                'scientific_name': p.scientific_name,
                'common_diseases': p.common_diseases
            })

        return jsonify({'plants': plants_data}), 200

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
