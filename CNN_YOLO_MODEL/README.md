# CNN YOLO Model for Plant Disease Detection

This directory contains the YOLO model implementation for detecting plant diseases in crop images.

## Directory Structure

```
CNN_YOLO_Model/
├── train_yolo.py          # Main training script
├── data_preparation.py    # Dataset preparation utilities
├── inference.py           # Model inference and detection
├── model_utils.py         # Model analysis and utilities
├── requirements.txt       # Python dependencies
├── models/               # Trained model files
├── data/                 # Dataset directory
├── training/             # Training scripts and configs
└── results/              # Training results and outputs
```

## Setup Instructions

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Prepare Dataset**
```python
from data_preparation import PlantVillageDataset

# Initialize dataset preparation
dataset = PlantVillageDataset('data')

# Download and prepare PlantVillage dataset
dataset.download_dataset()
dataset.convert_to_yolo_format()
dataset.augment_dataset()
dataset.validate_dataset()
```

3. **Train Model**
```python
from train_yolo import YOLOTrainer

# Initialize trainer
trainer = YOLOTrainer(data_dir='data', model_size='n')

# Prepare dataset
trainer.prepare_dataset()

# Train model
results = trainer.train_model(epochs=100, imgsz=640, batch_size=16)
```

4. **Run Inference**
```python
from inference import PlantDiseaseDetector

# Initialize detector
detector = PlantDiseaseDetector('models/best.pt')

# Detect disease in single image
result = detector.detect_disease('path/to/image.jpg', save_result=True)

# Batch detection
results = detector.batch_detect('path/to/image/directory')
```

## Model Classes

The model is trained to detect the following plant disease classes:

1. **healthy** - Healthy plant tissue
2. **bacterial_spot** - Bacterial spot disease
3. **early_blight** - Early blight disease
4. **late_blight** - Late blight disease
5. **leaf_mold** - Leaf mold disease
6. **septoria_leaf_spot** - Septoria leaf spot
7. **spider_mites** - Spider mite damage
8. **target_spot** - Target spot disease
9. **mosaic_virus** - Mosaic virus infection
10. **yellow_leaf_curl_virus** - Yellow leaf curl virus

## Training Configuration

- **Model Architecture**: YOLOv8 (nano, small, medium, large, or extra-large)
- **Input Size**: 640x640 pixels
- **Dataset**: PlantVillage dataset with YOLO format annotations
- **Training Epochs**: 100 (with early stopping)
- **Batch Size**: 16 (adjustable based on GPU memory)
- **Learning Rate**: 0.01 (initial)

## Output Format

The model outputs detection results in the following format:

```json
{
  "image_path": "path/to/image.jpg",
  "detections": [
    {
      "class_name": "early_blight",
      "confidence": 0.85,
      "bbox": [x1, y1, x2, y2],
      "severity_percentage": 15.2,
      "severity_level": "Medium",
      "is_diseased": true
    }
  ],
  "total_detections": 1,
  "diseased_detections": 1,
  "overall_health": "Diseased"
}
```

## Performance Metrics

- **mAP@0.5**: Mean Average Precision at IoU threshold 0.5
- **mAP@0.5:0.95**: Mean Average Precision across IoU thresholds 0.5-0.95
- **Precision**: True positives / (True positives + False positives)
- **Recall**: True positives / (True positives + False negatives)
- **Inference Time**: Average time per image detection

## Usage Examples

### Single Image Detection
```python
from inference import PlantDiseaseDetector

detector = PlantDiseaseDetector('models/best.pt')
result = detector.detect_disease('leaf_image.jpg', save_result=True)

print(f"Disease detected: {result['overall_health']}")
for detection in result['detections']:
    print(f"- {detection['class_name']}: {detection['confidence']:.2f} confidence")
    print(f"  Severity: {detection['severity_level']} ({detection['severity_percentage']:.1f}%)")
```

### Batch Processing
```python
detector = PlantDiseaseDetector('models/best.pt')
results = detector.batch_detect('test_images/', output_dir='results/')

# Results are automatically saved with annotations
```

### Model Analysis
```python
from model_utils import ModelUtils

utils = ModelUtils('models/best.pt')
model_info = utils.get_model_info()
benchmark_results = utils.benchmark_model('test_images/')
```

## Integration with Backend

The trained model integrates with the Flask backend through the `yolo_inference.py` module:

```python
# In backend/yolo_inference.py
from CNN_YOLO_Model.inference import PlantDiseaseDetector

class YOLODetector:
    def __init__(self):
        self.detector = PlantDiseaseDetector('../CNN_YOLO_Model/models/best.pt')
    
    def detect(self, image_path):
        return self.detector.detect_disease(image_path)
```

## Notes

- Ensure sufficient GPU memory for training (recommended: 8GB+ VRAM)
- Training time varies based on dataset size and hardware (typically 2-8 hours)
- Model performance improves with larger, more diverse datasets
- Regular validation helps prevent overfitting
- Consider data augmentation for better generalization

## Troubleshooting

1. **CUDA out of memory**: Reduce batch size or use smaller model variant
2. **Low accuracy**: Increase training epochs, improve dataset quality, or use data augmentation
3. **Slow inference**: Use smaller model variant or optimize for deployment
4. **Missing dependencies**: Install all requirements from requirements.txt

For more detailed information, refer to the individual Python files and their docstrings.