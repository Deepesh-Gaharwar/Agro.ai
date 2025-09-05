from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from datetime import datetime, timedelta
import uuid
from models import db, User, Detection, Plant
from yolo_inference import YOLODetector
import base64
from PIL import Image
import io

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///crop_health.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Initialize extensions
db.init_app(app)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})
jwt = JWTManager(app)

# Initialize YOLO detector
yolo_detector = YOLODetector()

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=generate_password_hash(data['password'])
        )
        
        db.session.add(user)
        db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': {
                'id': user.id,
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
        user = User.query.filter_by(email=data['email']).first()
        
        if user and check_password_hash(user.password_hash, data['password']):
            access_token = create_access_token(identity=user.id)
            
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'user': {
                    'id': user.id,
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
        
        # Handle base64 image data
        if 'image' in request.json:
            image_data = request.json['image']
            # Remove data URL prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Save image temporarily
            filename = f"{uuid.uuid4()}.jpg"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(filepath)
            
        # Handle file upload
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
        
        # Save detection to database
        detection = Detection(
            user_id=user_id,
            image_path=filepath,
            disease_detected=detection_result['disease_detected'],
            confidence_score=detection_result['confidence'],
            disease_type=detection_result.get('disease_type'),
            severity_level=detection_result.get('severity_level'),
            treatment_recommendation=detection_result.get('treatment_recommendation')
        )
        
        db.session.add(detection)
        db.session.commit()
        
        return jsonify({
            'detection_id': detection.id,
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
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        
        detections = Detection.query.filter_by(user_id=user_id)\
            .order_by(Detection.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        history = []
        for detection in detections.items:
            history.append({
                'id': detection.id,
                'disease_detected': detection.disease_detected,
                'confidence': detection.confidence_score,
                'disease_type': detection.disease_type,
                'severity_level': detection.severity_level,
                'treatment_recommendation': detection.treatment_recommendation,
                'timestamp': detection.created_at.isoformat()
            })
        
        return jsonify({
            'history': history,
            'total': detections.total,
            'pages': detections.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/plants', methods=['GET'])
def get_plants():
    try:
        plants = Plant.query.all()
        plants_data = []
        
        for plant in plants:
            plants_data.append({
                'id': plant.id,
                'name': plant.name,
                'scientific_name': plant.scientific_name,
                'common_diseases': plant.common_diseases.split(',') if plant.common_diseases else []
            })
        
        return jsonify({'plants': plants_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
@jwt_required()
def get_user_stats():
    try:
        user_id = get_jwt_identity()
        
        total_detections = Detection.query.filter_by(user_id=user_id).count()
        diseased_detections = Detection.query.filter_by(user_id=user_id, disease_detected=True).count()
        healthy_detections = total_detections - diseased_detections
        
        return jsonify({
            'total_detections': total_detections,
            'diseased_detections': diseased_detections,
            'healthy_detections': healthy_detections,
            'detection_rate': (diseased_detections / total_detections * 100) if total_detections > 0 else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Create sample plants data
        if not Plant.query.first():
            sample_plants = [
                Plant(name='Tomato', scientific_name='Solanum lycopersicum', 
                      common_diseases='Early Blight,Late Blight,Leaf Mold,Septoria Leaf Spot'),
                Plant(name='Potato', scientific_name='Solanum tuberosum',
                      common_diseases='Early Blight,Late Blight,Healthy'),
                Plant(name='Corn', scientific_name='Zea mays',
                      common_diseases='Northern Leaf Blight,Common Rust,Healthy')
            ]
            
            for plant in sample_plants:
                db.session.add(plant)
            db.session.commit()
    
    app.run(debug=True, host='0.0.0.0', port=5000)