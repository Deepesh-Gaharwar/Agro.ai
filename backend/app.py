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
from ultralytics import YOLO
import google.generativeai as genai
import threading
from mongoengine.errors import NotUniqueError, ValidationError
import re
from datetime import datetime



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
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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


# ====================================================
# 🌱 GLOBAL CONFIGURATION
# ====================================================
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Load YOLO model once (global)
YOLO_MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../CNN_YOLO_MODEL/runs/detect/train2/weights/best.pt")
)

if not os.path.exists(YOLO_MODEL_PATH):
    raise FileNotFoundError(f"❌ YOLO model not found at: {YOLO_MODEL_PATH}")

print(f"✅ Loading YOLO model from: {YOLO_MODEL_PATH}")
yolo_model = YOLO(YOLO_MODEL_PATH)
print(f"✅ YOLO Model loaded successfully with {len(yolo_model.names)} classes")

# Thread lock for safe model inference
yolo_lock = threading.Lock()



@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json(force=True)

        # --- Basic Validation ---
        required_fields = ['username', 'email', 'password']
        missing_fields = [f for f in required_fields if f not in data or not data[f].strip()]
        if missing_fields:
            return jsonify({'error': f"Missing fields: {', '.join(missing_fields)}"}), 400

        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password'].strip()

        # --- Email format validation ---
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({'error': 'Invalid email format'}), 400

        # --- Password validation ---
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400

        # --- Check if email already registered ---
        if User.objects(email=email).first():
            return jsonify({'error': 'Email is already registered'}), 400

        # --- Create User ---
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password)
        )
        user.save()

        # --- Generate JWT ---
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

    except NotUniqueError:
        return jsonify({'error': 'Email already exists'}), 400

    except ValidationError as ve:
        return jsonify({'error': f'Validation Error: {str(ve)}'}), 400

    except Exception as e:
        print("Registration error:", str(e))
        return jsonify({'error': 'Internal server error. Please try again later.'}), 500

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

# ====================================================
# 🌿 DETECTION ENDPOINT
# ====================================================
@app.route('/api/detect', methods=['POST'])
@jwt_required()
def detect_disease():
    filepath = None
    try:
        print("\n=== 🚀 YOLO Detection Started ===")
        
        # ------------------------------
        # 1️⃣ Validate user
        # ------------------------------
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # ------------------------------
        # 2️⃣ Handle image upload and normalize
        # ------------------------------
        if request.is_json and 'image' in request.json:
            image_data = request.json['image'].split(',')[1] if ',' in request.json['image'] else request.json['image']
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        elif 'file' in request.files:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            image = Image.open(file.stream).convert("RGB")
        else:
            return jsonify({'error': 'No image provided'}), 400

        # ✅ Force uniform dimensions for YOLO
        image = image.resize((640, 640))
        
        # Save a consistent temp JPG file
        filename = f"{uuid.uuid4()}.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(filepath, format="JPEG", quality=95)
        print(f"📂 Saved normalized image: {filepath}")

        # ------------------------------
        # 3️⃣ Run YOLO detection
        # ------------------------------
        print("🧠 Running YOLO inference...")
        results = yolo_model.predict(source=filepath, imgsz=640, conf=0.05, save=False, verbose=True)

        detected_classes = []
        confidences = []

        for result in results:
            if result.boxes is not None and len(result.boxes) > 0:
                for box in result.boxes:
                    cls_id = int(box.cls.item())
                    conf = float(box.conf.item())
                    class_name = yolo_model.names[cls_id]
                    detected_classes.append(class_name)
                    confidences.append(conf)

        print(f"🎯 Detected classes: {detected_classes} with confidences: {confidences}")

        # ------------------------------
        # 4️⃣ Handle detection results
        # ------------------------------
        if not detected_classes:
            detected_disease = "No disease found"
            confidence = 0.0
            explanation = "The plant appears healthy with no visible disease symptoms."
        else:
            top_idx = confidences.index(max(confidences))
            detected_disease = detected_classes[top_idx]
            confidence = round(confidences[top_idx], 3)

            # ------------------------------
            # 5️⃣ Generate Gemini AI explanation
            # ------------------------------
            print("🤖 Generating AI explanation...")
            model_gemini = genai.GenerativeModel(model_name=os.getenv("GOOGLE_AI_MODEL", "gemini-2.5-flash"))
            prompt = f"""
            You are an expert plant pathologist.
            Explain briefly:
            Disease Name: {detected_disease}
            Include: cause, symptoms, cure, prevention.
            """
            try:
                ai_response = model_gemini.generate_content(prompt)
                if hasattr(ai_response, "text") and ai_response.text:
                    explanation = ai_response.text.strip()
                else:
                    explanation = "AI did not return any explanation."
            except Exception as e:
                explanation = f"Error generating explanation: {str(e)}"

        # ------------------------------
        # 6️⃣ Upload to Cloudinary
        # ------------------------------
        upload_result = cloudinary.uploader.upload(filepath)
        image_url = upload_result.get('secure_url')

        # Cleanup
        if os.path.exists(filepath):
            os.remove(filepath)

        # ------------------------------
        # 7️⃣ Save to DB
        # ------------------------------
        detection = Detection(
            user=user,
            image_url=image_url,
            disease_detected=detected_disease,
            confidence_score=confidence,
            disease_type="Leaf Disease" if detected_disease != "No disease found" else "Healthy",
            severity_level="High" if confidence > 0.8 else ("Moderate" if confidence > 0.5 else "Low"),
            treatment_recommendation=explanation
        )
        detection.save()

        # ------------------------------
        # 8️⃣ Respond
        # ------------------------------
        print("✅ YOLO Detection Completed Successfully!")
        return jsonify({
            'detection_id': str(detection.id),
            'disease_detected': detected_disease if detected_disease != "No disease found" else None,
            'confidence': confidence,
            'severity_level': detection.severity_level,
            'ai_explanation': explanation,
            'image_url': image_url,
            'timestamp': detection.created_at.isoformat()
        }), 200

    except Exception as e:
        import traceback
        print("❌ DETECTION ERROR:", traceback.format_exc())
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': str(e)}), 500


# ------------------------------
# 🆕 NEW CHAT ENDPOINT
# ------------------------------
@app.route('/api/chat/disease', methods=['POST'])
@jwt_required()
def chat_about_disease():
    try:
        # ✅ Ensure Gemini is configured (safe even if called multiple times)
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

        # ✅ Validate user
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # ✅ Parse input
        data = request.get_json()
        user_message = data.get('message', '').strip()
        detection_id = data.get('detection_id')
        chat_history = data.get('chat_history', [])

        if not user_message:
            return jsonify({'error': 'Message is required'}), 400

        # ✅ Detection context
        context = ""
        if detection_id:
            detection = Detection.objects(id=detection_id).first()
            if detection:
                context = f"""
                Detection Info:
                Disease: {detection.disease_detected}
                Confidence: {detection.confidence_score * 100:.1f}%
                Severity: {detection.severity_level}
                Type: {detection.disease_type}
                Recommendation: {detection.treatment_recommendation}
                """

        # ✅ Chat history limit
        history_context = ""
        if chat_history:
            history_context = "\n\nRecent Chat:\n" + "\n".join(
                [f"{msg.get('role', 'user').capitalize()}: {msg.get('content', '')}" for msg in chat_history[-5:]]
            )

        # ✅ Combine prompt
        full_prompt = f"""
        You are an expert plant pathologist assistant.
        Be concise, helpful, and professional.
        {context}
        {history_context}

        User: {user_message}
        """

        # ✅ Generate response
        model_gemini = genai.GenerativeModel(model_name=os.getenv("GOOGLE_AI_MODEL", "gemini-2.5-flash"))
        ai_response = model_gemini.generate_content(full_prompt)

        if hasattr(ai_response, "text") and ai_response.text:
            bot_reply = ai_response.text.strip()
        else:
            bot_reply = "I couldn’t generate a response. Please try again."

        return jsonify({
            'message': bot_reply,
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    except Exception as e:
        import traceback
        print("❌ CHAT ERROR:", traceback.format_exc())
        return jsonify({'error': 'Failed to process chat message', 'details': str(e)}), 500


    
import uuid as _uuid
# import json

@app.route('/api/debug_detect', methods=['POST'])
def debug_detect():
    """
    Accepts multipart form file 'file'. Returns JSON with raw YOLO boxes,
    class names, confidences and a link to an annotated image saved in uploads.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Send file as form field "file"'}), 400

        f = request.files['file']
        temp_name = f"{_uuid.uuid4()}_{secure_filename(f.filename)}"
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_name)
        f.save(temp_path)

        # ensure RGB and jpeg
        with Image.open(temp_path) as im:
            im = im.convert('RGB')
            im.save(temp_path, format='JPEG', quality=95)

        # run model with low conf and verbose info
        res = yolo_model.predict(source=temp_path, imgsz=640, conf=0.1, save=False, verbose=False)

        out = []
        for r in res:
            boxes = []
            for b in r.boxes:
                try:
                    cls_id = int(b.cls.item())
                    conf = float(b.conf.item())
                    xyxy = b.xyxy.tolist() if hasattr(b, 'xyxy') else None
                except Exception:
                    # fallback if structure differs
                    cls_id = int(b.cls)
                    conf = float(b.conf)
                    xyxy = None
                name = yolo_model.names[cls_id] if cls_id in yolo_model.names else yolo_model.names.get(cls_id, str(cls_id))
                boxes.append({'cls_id': cls_id, 'class_name': name, 'conf': conf, 'xyxy': xyxy})
            out.append({'boxes': boxes})

        # save annotated image produced by results.render() if available
        try:
            img_annotated = res[0].plot()  # returns numpy array with boxes drawn (ultralytics 8+)
            ann_path = os.path.join(app.config['UPLOAD_FOLDER'], f"debug_{_uuid.uuid4()}.jpg")
            from PIL import Image as PILImage
            PILImage.fromarray(img_annotated).save(ann_path, format='JPEG', quality=90)
            annotated_url = ann_path
        except Exception as e:
            annotated_url = None
            print("Could not create annotated image:", e)

        # cleanup temp input file
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception:
            pass

        return jsonify({'result': out, 'annotated_image_path': annotated_url, 'model_classes': yolo_model.names}), 200

    except Exception as e:
        import traceback
        print("DEBUG ERROR", traceback.format_exc())
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