import os
import random
import shutil

# Original dataset ka path (jahan 39 folders hain)
SRC_DIR = r"C:\Minor Project\agro-ai\CNN_YOLO_MODEL\data\Plant_leave_diseases_dataset_with_augmentation"

# Naya small dataset ka path
DST_DIR = r"C:\Minor Project\agro-ai\CNN_YOLO_MODEL\data\small_dataset"

# Har class me kitni images chahiye
IMAGES_PER_CLASS = 75

# Output folder create karo
os.makedirs(DST_DIR, exist_ok=True)

# Saare classes list karo
all_classes = [d for d in os.listdir(SRC_DIR) if os.path.isdir(os.path.join(SRC_DIR, d))]
print(f"Total classes found: {len(all_classes)}")

# Har class se limited images copy karo
for cls in all_classes:
    src_path = os.path.join(SRC_DIR, cls)
    dst_path = os.path.join(DST_DIR, cls)
    os.makedirs(dst_path, exist_ok=True)

    # sirf images list lo
    images = [f for f in os.listdir(src_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

    # agar images kam hain to sari le lo
    sampled = random.sample(images, min(IMAGES_PER_CLASS, len(images)))

    for img in sampled:
        shutil.copy(os.path.join(src_path, img), os.path.join(dst_path, img))

print("\n✅ Small dataset created successfully!")
print(f"Location: {DST_DIR}")
print(f"Total classes: {len(all_classes)} | Approx total images: {len(all_classes) * IMAGES_PER_CLASS}")

