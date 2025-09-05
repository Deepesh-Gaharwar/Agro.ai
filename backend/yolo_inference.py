import os
import cv2
import numpy as np
from ultralytics import YOLO
from PIL import Image
import torch

class YOLODetector:
    def __init__(self, model_path=None):
        """Initialize YOLO detector with pre-trained or custom model"""
        self.model_path = model_path or '../CNN_YOLO_Model/models/best.pt'
        self.confidence_threshold = 0.5
        
        # Disease information mapping
        self.disease_info = {
            'healthy': {
                'treatment': 'No treatment needed. Continue regular plant care.',
                'severity': 'None'
            },
            'early_blight': {
                'treatment': 'Apply fungicide containing chlorothalonil or copper. Remove affected leaves.',
                'severity': 'Medium'
            },
            'late_blight': {
                'treatment': 'Apply fungicide immediately. Remove and destroy affected plants.',
                'severity': 'High'
            },
            'leaf_mold': {
                'treatment': 'Improve air circulation. Apply fungicide if severe.',
                'severity': 'Low'
            },
            'septoria_leaf_spot': {
                'treatment': 'Remove affected leaves. Apply fungicide preventively.',
                'severity': 'Medium'
            },
            'bacterial_spot': {
                'treatment': 'Apply copper-based bactericide. Avoid overhead watering.',
                'severity': 'Medium'
            },
            'target_spot': {
                'treatment': 'Apply fungicide and improve plant spacing for air circulation.',
                'severity': 'Medium'
            },
            'mosaic_virus': {
                'treatment': 'No cure available. Remove infected plants to prevent spread.',
                'severity': 'High'
            },
            'yellow_leaf_curl_virus': {
                'treatment': 'Control whitefly vectors. Remove infected plants.',
                'severity': 'High'
            }
        }
        
        self.load_model()
    
    def load_model(self):
        """Load YOLO model"""
        try:
            # Try to load custom trained model first
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                print(f"Loaded custom model from {self.model_path}")
            else:
                # Fallback to YOLOv8 pre-trained model for demonstration
                self.model = YOLO('yolov8n.pt')
                print("Loaded YOLOv8 pre-trained model (fallback)")
                
        except Exception as e:
            print(f"Error loading model: {e}")
            # Use YOLOv8 as fallback
            self.model = YOLO('yolov8n.pt')
    
    def preprocess_image(self, image_path):
        """Preprocess image for YOLO detection"""
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not read image from {image_path}")
            
            # Convert BGR to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            return image_rgb
            
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None
    
    def detect(self, image_path):
        """
        Perform disease detection on the input image
        Returns detection results with confidence scores
        """
        try:
            # Preprocess image
            image = self.preprocess_image(image_path)
            if image is None:
                return self._create_error_result("Failed to preprocess image")
            
            # Run YOLO inference
            results = self.model(image_path, conf=self.confidence_threshold)
            
            # Process results
            if len(results) > 0 and len(results[0].boxes) > 0:
                # Get the detection with highest confidence
                boxes = results[0].boxes
                confidences = boxes.conf.cpu().numpy()
                classes = boxes.cls.cpu().numpy()
                
                # Get highest confidence detection
                max_conf_idx = np.argmax(confidences)
                max_confidence = float(confidences[max_conf_idx])
                detected_class = int(classes[max_conf_idx])
                
                # Map class to disease name (this would be based on your trained model)
                disease_name = self._map_class_to_disease(detected_class)
                
                # Determine if disease is detected
                is_diseased = disease_name.lower() != 'healthy'
                
                # Get treatment recommendation
                disease_info = self.disease_info.get(disease_name.lower(), {})
                treatment = disease_info.get('treatment', 'Consult agricultural expert for treatment advice.')
                severity = disease_info.get('severity', 'Unknown')
                
                return {
                    'disease_detected': is_diseased,
                    'confidence': max_confidence,
                    'disease_type': disease_name if is_diseased else None,
                    'severity_level': severity if is_diseased else None,
                    'treatment_recommendation': treatment if is_diseased else 'Plant appears healthy. Continue regular care.'
                }
            
            else:
                # No detection found - assume healthy
                return {
                    'disease_detected': False,
                    'confidence': 0.95,  # High confidence for healthy classification
                    'disease_type': None,
                    'severity_level': None,
                    'treatment_recommendation': 'Plant appears healthy. Continue regular care.'
                }
                
        except Exception as e:
            print(f"Error during detection: {e}")
            return self._create_error_result(str(e))
    
    def _map_class_to_disease(self, class_id):
        """Map YOLO class ID to disease name"""
        # This mapping should match your trained model's classes
        class_mapping = {
            0: 'healthy',
            1: 'early_blight',
            2: 'late_blight',
            3: 'leaf_mold',
            4: 'septoria_leaf_spot',
            5: 'bacterial_spot',
            6: 'target_spot',
            7: 'mosaic_virus',
            8: 'yellow_leaf_curl_virus'
        }
        
        return class_mapping.get(class_id, 'unknown_disease')
    
    def _create_error_result(self, error_message):
        """Create error result structure"""
        return {
            'disease_detected': False,
            'confidence': 0.0,
            'disease_type': None,
            'severity_level': None,
            'treatment_recommendation': f'Detection failed: {error_message}',
            'error': error_message
        }
    
    def batch_detect(self, image_paths):
        """Perform batch detection on multiple images"""
        results = []
        for image_path in image_paths:
            result = self.detect(image_path)
            result['image_path'] = image_path
            results.append(result)
        
        return results
    
    def get_model_info(self):
        """Get information about the loaded model"""
        try:
            return {
                'model_path': self.model_path,
                'model_type': str(type(self.model)),
                'confidence_threshold': self.confidence_threshold,
                'device': str(self.model.device) if hasattr(self.model, 'device') else 'unknown'
            }
        except Exception as e:
            return {'error': str(e)}