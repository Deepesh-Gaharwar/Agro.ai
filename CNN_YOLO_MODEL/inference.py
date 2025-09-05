import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image
import torch
import os
from pathlib import Path

class PlantDiseaseDetector:
    def __init__(self, model_path='models/best.pt', confidence_threshold=0.5):
        """
        Initialize plant disease detector
        
        Args:
            model_path: Path to trained YOLO model
            confidence_threshold: Minimum confidence for detections
        """
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.class_names = [
            'healthy', 'bacterial_spot', 'early_blight', 'late_blight',
            'leaf_mold', 'septoria_leaf_spot', 'spider_mites', 'target_spot',
            'mosaic_virus', 'yellow_leaf_curl_virus'
        ]
        
        self.load_model()
    
    def load_model(self):
        """Load YOLO model"""
        try:
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                print(f"Loaded custom model from {self.model_path}")
            else:
                # Fallback to pre-trained YOLOv8
                self.model = YOLO('yolov8n.pt')
                print("Using pre-trained YOLOv8 model (custom model not found)")
                
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = YOLO('yolov8n.pt')
    
    def preprocess_image(self, image_path):
        """Preprocess image for detection"""
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image: {image_path}")
            
            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            return image_rgb, image
            
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None, None
    
    def detect_disease(self, image_path, save_result=False, output_dir='results'):
        """
        Detect plant diseases in image
        
        Args:
            image_path: Path to input image
            save_result: Whether to save annotated result
            output_dir: Directory to save results
            
        Returns:
            Dictionary with detection results
        """
        try:
            # Preprocess image
            image_rgb, image_bgr = self.preprocess_image(image_path)
            if image_rgb is None:
                return self._create_error_result("Failed to load image")
            
            # Run inference
            results = self.model(image_path, conf=self.confidence_threshold)
            
            # Process results
            detections = []
            annotated_image = image_bgr.copy()
            
            if len(results) > 0 and len(results[0].boxes) > 0:
                boxes = results[0].boxes
                
                for i in range(len(boxes)):
                    # Get detection data
                    box = boxes.xyxy[i].cpu().numpy()  # x1, y1, x2, y2
                    confidence = float(boxes.conf[i].cpu().numpy())
                    class_id = int(boxes.cls[i].cpu().numpy())
                    
                    # Get class name
                    if class_id < len(self.class_names):
                        class_name = self.class_names[class_id]
                    else:
                        class_name = f"class_{class_id}"
                    
                    # Calculate bounding box area and severity
                    bbox_area = (box[2] - box[0]) * (box[3] - box[1])
                    image_area = image_rgb.shape[0] * image_rgb.shape[1]
                    severity_percentage = (bbox_area / image_area) * 100
                    
                    # Determine severity level
                    if severity_percentage < 10:
                        severity_level = "Low"
                    elif severity_percentage < 25:
                        severity_level = "Medium"
                    else:
                        severity_level = "High"
                    
                    detection = {
                        'class_name': class_name,
                        'confidence': confidence,
                        'bbox': box.tolist(),
                        'severity_percentage': severity_percentage,
                        'severity_level': severity_level,
                        'is_diseased': class_name != 'healthy'
                    }
                    
                    detections.append(detection)
                    
                    # Draw bounding box on image
                    if save_result:
                        x1, y1, x2, y2 = map(int, box)
                        
                        # Choose color based on severity
                        if class_name == 'healthy':
                            color = (0, 255, 0)  # Green
                        elif severity_level == "Low":
                            color = (0, 255, 255)  # Yellow
                        elif severity_level == "Medium":
                            color = (0, 165, 255)  # Orange
                        else:
                            color = (0, 0, 255)  # Red
                        
                        # Draw rectangle
                        cv2.rectangle(annotated_image, (x1, y1), (x2, y2), color, 2)
                        
                        # Add label
                        label = f"{class_name}: {confidence:.2f} ({severity_level})"
                        label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
                        cv2.rectangle(annotated_image, (x1, y1 - label_size[1] - 10), 
                                    (x1 + label_size[0], y1), color, -1)
                        cv2.putText(annotated_image, label, (x1, y1 - 5), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
            
            # Save annotated result if requested
            if save_result:
                os.makedirs(output_dir, exist_ok=True)
                output_path = os.path.join(output_dir, f"detected_{os.path.basename(image_path)}")
                cv2.imwrite(output_path, annotated_image)
                print(f"Annotated result saved to: {output_path}")
            
            # Prepare final result
            result = {
                'image_path': image_path,
                'detections': detections,
                'total_detections': len(detections),
                'diseased_detections': sum(1 for d in detections if d['is_diseased']),
                'overall_health': 'Healthy' if not any(d['is_diseased'] for d in detections) else 'Diseased'
            }
            
            return result
            
        except Exception as e:
            print(f"Error during detection: {e}")
            return self._create_error_result(str(e))
    
    def batch_detect(self, image_directory, output_dir='batch_results'):
        """
        Perform batch detection on multiple images
        
        Args:
            image_directory: Directory containing images
            output_dir: Directory to save results
            
        Returns:
            List of detection results
        """
        image_dir = Path(image_directory)
        if not image_dir.exists():
            print(f"Directory not found: {image_directory}")
            return []
        
        # Get all image files
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
        image_files = []
        
        for ext in image_extensions:
            image_files.extend(image_dir.glob(f"*{ext}"))
            image_files.extend(image_dir.glob(f"*{ext.upper()}"))
        
        print(f"Found {len(image_files)} images for batch processing")
        
        # Process each image
        results = []
        for i, image_path in enumerate(image_files):
            print(f"Processing {i+1}/{len(image_files)}: {image_path.name}")
            
            result = self.detect_disease(str(image_path), save_result=True, output_dir=output_dir)
            results.append(result)
        
        # Save batch results summary
        self.save_batch_summary(results, output_dir)
        
        return results
    
    def save_batch_summary(self, results, output_dir):
        """Save batch processing summary"""
        import json
        
        summary = {
            'total_images': len(results),
            'healthy_images': sum(1 for r in results if r.get('overall_health') == 'Healthy'),
            'diseased_images': sum(1 for r in results if r.get('overall_health') == 'Diseased'),
            'total_detections': sum(r.get('total_detections', 0) for r in results),
            'disease_breakdown': {}
        }
        
        # Count disease types
        for result in results:
            for detection in result.get('detections', []):
                disease = detection.get('class_name', 'unknown')
                if disease not in summary['disease_breakdown']:
                    summary['disease_breakdown'][disease] = 0
                summary['disease_breakdown'][disease] += 1
        
        # Save summary
        summary_path = os.path.join(output_dir, 'batch_summary.json')
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"Batch summary saved to: {summary_path}")
        print(f"Processed {summary['total_images']} images")
        print(f"Healthy: {summary['healthy_images']}, Diseased: {summary['diseased_images']}")
    
    def _create_error_result(self, error_message):
        """Create error result structure"""
        return {
            'error': error_message,
            'detections': [],
            'total_detections': 0,
            'diseased_detections': 0,
            'overall_health': 'Error'
        }

# Usage example
if __name__ == "__main__":
    # Initialize detector
    detector = PlantDiseaseDetector()
    
    # Example single image detection
    # result = detector.detect_disease('path/to/image.jpg', save_result=True)
    # print(json.dumps(result, indent=2))
    
    # Example batch detection
    # results = detector.batch_detect('path/to/image/directory')
    
    print("Plant Disease Detector initialized successfully!")
    print("Use detect_disease() for single image or batch_detect() for multiple images")