import os
import random
import shutil
from tqdm import tqdm

# Paths
DATASET_DIR = r"C:\Minor Project\agro-ai\CNN_YOLO_MODEL\data\small_dataset"
YOLO_DIR = r"C:\Minor Project\agro-ai\CNN_YOLO_MODEL\data\yolo_small"

# Split ratios
TRAIN_RATIO = 0.8
VAL_RATIO = 0.2

# Create folder structure
for subdir in ['images/train', 'images/val', 'labels/train', 'labels/val']:
    os.makedirs(os.path.join(YOLO_DIR, subdir), exist_ok=True)

# Classes list
classes = [cls for cls in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, cls))]
classes.sort()
print(f"Total classes: {len(classes)}")

# Save class names to file
with open(os.path.join(YOLO_DIR, 'classes.txt'), 'w') as f:
    for cls in classes:
        f.write(cls + '\n')

# Dummy label generator (since we only demonstrate training)
for idx, cls in enumerate(tqdm(classes, desc="Converting dataset")):
    class_dir = os.path.join(DATASET_DIR, cls)
    images = [f for f in os.listdir(class_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    random.shuffle(images)

    split_idx = int(len(images) * TRAIN_RATIO)
    train_imgs = images[:split_idx]
    val_imgs = images[split_idx:]

    for img_list, split in [(train_imgs, 'train'), (val_imgs, 'val')]:
        for img in img_list:
            src_img_path = os.path.join(class_dir, img)
            dst_img_path = os.path.join(YOLO_DIR, f'images/{split}', img)
            shutil.copy(src_img_path, dst_img_path)

            # Dummy YOLO label (centered box) — just for demo training
            label_name = os.path.splitext(img)[0] + '.txt'
            label_path = os.path.join(YOLO_DIR, f'labels/{split}', label_name)
            with open(label_path, 'w') as lf:
                lf.write(f"{idx} 0.5 0.5 0.5 0.5\n")

print("\n✅ YOLO-format dataset created successfully!")
print(f"Saved at: {YOLO_DIR}")
