import os
from dotenv import load_dotenv
import google.generativeai as genai
from ultralytics import YOLO
from datetime import datetime
from PIL import Image

# ============================================================
# 🧠 STEP 1️⃣: CONFIGURE GEMINI API
# ============================================================
load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")
MODEL_NAME = os.getenv("GOOGLE_AI_MODEL", "gemini-2.5-flash")

if not API_KEY:
    raise ValueError("❌ GOOGLE_API_KEY is missing from .env file!")

genai.configure(api_key=API_KEY)
model_gemini = genai.GenerativeModel(MODEL_NAME)
print(f"✅ Gemini Model Loaded: {MODEL_NAME}")

# ============================================================
# 🧠 STEP 2️⃣: LOAD TRAINED YOLO MODEL
# ============================================================
print("\n============================================================")
print("🧠 STEP 2️⃣: LOADING TRAINED YOLO MODEL")
print("============================================================")

model_path = r"runs\detect\train2\weights\best.pt"

if not os.path.exists(model_path):
    raise FileNotFoundError(f"❌ Model not found at {model_path}")

model = YOLO(model_path)
print(f"✅ Model loaded successfully from: {model_path}")
print(f"📦 Total Classes: {len(model.names)}")

# ============================================================
# 🧠 STEP 3️⃣: LOAD TEST IMAGE
# ============================================================
test_image_path = r"test.JPG"
if not os.path.exists(test_image_path):
    raise FileNotFoundError(f"❌ Test image not found at: {test_image_path}")

image = Image.open(test_image_path)
print(f"\n✅ Test image loaded successfully: {test_image_path}")
print(f"🖼️ Image Size: {image.size}")

# ============================================================
# 🧠 STEP 4️⃣: RUN YOLO DETECTION
# ============================================================
print("\n============================================================")
print("🧠 STEP 4️⃣: RUNNING YOLO DETECTION")
print("============================================================")
results = model.predict(source=test_image_path, save=True, conf=0.25)

detected_classes = []
for result in results:
    for box in result.boxes:
        cls_id = int(box.cls)
        class_name = model.names[cls_id]
        detected_classes.append(class_name)

if not detected_classes:
    print("⚠️ No plant disease detected.")
else:
    print(f"✅ Detected Classes: {detected_classes}")

# ============================================================
# 🧠 STEP 5️⃣: GEMINI EXPLANATION
# ============================================================
if detected_classes:
    print("\n============================================================")
    print("🧠 STEP 5️⃣: GENERATING AI EXPLANATION FROM GEMINI")
    print("============================================================")

    for disease in detected_classes:
        prompt = f"""
        You are a plant disease expert.
        Explain about {disease} in detail.
        Include:
        1. What causes this disease?
        2. Symptoms on the plant.
        3. Is it curable?
        4. Effective cure or treatment methods.
        5. Prevention tips for farmers.
        """
        try:
            response = model_gemini.generate_content(prompt)
            print(f"\n🌿 Disease Name: {disease}")
            print("------------------------------------------------------------")
            print(response.text)
            print("------------------------------------------------------------")
        except Exception as e:
            print(f"❌ Error generating Gemini response for {disease}: {str(e)}")

# ============================================================
# 🧠 STEP 6️⃣: FINAL SUMMARY
# ============================================================
print("\n============================================================")
print("✅ AI Analysis Completed Successfully!")
print(f"🕒 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("📂 Results saved in: runs/detect/predict")
print("============================================================")
