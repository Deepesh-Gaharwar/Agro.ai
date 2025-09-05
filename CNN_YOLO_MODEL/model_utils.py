import torch
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import json
import cv2
from ultralytics import YOLO
import pandas as pd

class ModelUtils:
    def __init__(self, model_path='models/best.pt'):
        """
        Utility class for YOLO model analysis and visualization
        
        Args:
            model_path: Path to trained YOLO model
        """
        self.model_path = model_path
        self.model = None
        self.load_model()
    
    def load_model(self):
        """Load YOLO model"""
        try:
            if Path(self.model_path).exists():
                self.model = YOLO(self.model_path)
                print(f"Model loaded from: {self.model_path}")
            else:
                print(f"Model not found at: {self.model_path}")
                self.model = None
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
    
    def get_model_info(self):
        """Get detailed model information"""
        if self.model is None:
            return {"error": "Model not loaded"}
        
        try:
            # Get model summary
            model_info = {
                "model_path": self.model_path,
                "model_type": str(type(self.model)),
                "device": str(self.model.device) if hasattr(self.model, 'device') else 'unknown',
                "parameters": self.count_parameters(),
                "input_size": "640x640 (default YOLO)",
                "classes": self.get_class_names()
            }
            
            return model_info
            
        except Exception as e:
            return {"error": str(e)}
    
    def count_parameters(self):
        """Count total model parameters"""
        if self.model is None:
            return 0
        
        try:
            total_params = sum(p.numel() for p in self.model.model.parameters())
            trainable_params = sum(p.numel() for p in self.model.model.parameters() if p.requires_grad)
            
            return {
                "total": total_params,
                "trainable": trainable_params,
                "non_trainable": total_params - trainable_params
            }
        except:
            return {"error": "Could not count parameters"}
    
    def get_class_names(self):
        """Get model class names"""
        try:
            if hasattr(self.model, 'names'):
                return self.model.names
            else:
                # Default class names
                return {
                    0: 'healthy',
                    1: 'bacterial_spot',
                    2: 'early_blight',
                    3: 'late_blight',
                    4: 'leaf_mold',
                    5: 'septoria_leaf_spot',
                    6: 'spider_mites',
                    7: 'target_spot',
                    8: 'mosaic_virus',
                    9: 'yellow_leaf_curl_virus'
                }
        except:
            return {}
    
    def benchmark_model(self, test_images_dir, output_file='benchmark_results.json'):
        """Benchmark model performance on test images"""
        if self.model is None:
            print("Model not loaded")
            return None
        
        test_dir = Path(test_images_dir)
        if not test_dir.exists():
            print(f"Test directory not found: {test_images_dir}")
            return None
        
        # Get test images
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        test_images = []
        
        for ext in image_extensions:
            test_images.extend(test_dir.glob(f"*{ext}"))
        
        if not test_images:
            print("No test images found")
            return None
        
        # Benchmark metrics
        benchmark_results = {
            'total_images': len(test_images),
            'inference_times': [],
            'detection_counts': [],
            'confidence_scores': []
        }
        
        print(f"Benchmarking on {len(test_images)} images...")
        
        for i, image_path in enumerate(test_images):
            try:
                # Measure inference time
                import time
                start_time = time.time()
                
                results = self.model(str(image_path))
                
                inference_time = time.time() - start_time
                benchmark_results['inference_times'].append(inference_time)
                
                # Count detections
                if len(results) > 0 and len(results[0].boxes) > 0:
                    num_detections = len(results[0].boxes)
                    confidences = results[0].boxes.conf.cpu().numpy().tolist()
                    
                    benchmark_results['detection_counts'].append(num_detections)
                    benchmark_results['confidence_scores'].extend(confidences)
                else:
                    benchmark_results['detection_counts'].append(0)
                
                if (i + 1) % 10 == 0:
                    print(f"Processed {i + 1}/{len(test_images)} images")
                    
            except Exception as e:
                print(f"Error processing {image_path}: {e}")
        
        # Calculate statistics
        if benchmark_results['inference_times']:
            benchmark_results['avg_inference_time'] = np.mean(benchmark_results['inference_times'])
            benchmark_results['min_inference_time'] = np.min(benchmark_results['inference_times'])
            benchmark_results['max_inference_time'] = np.max(benchmark_results['inference_times'])
        
        if benchmark_results['confidence_scores']:
            benchmark_results['avg_confidence'] = np.mean(benchmark_results['confidence_scores'])
            benchmark_results['min_confidence'] = np.min(benchmark_results['confidence_scores'])
            benchmark_results['max_confidence'] = np.max(benchmark_results['confidence_scores'])
        
        # Save results
        with open(output_file, 'w') as f:
            json.dump(benchmark_results, f, indent=2)
        
        print(f"Benchmark results saved to: {output_file}")
        return benchmark_results

# Usage example
if __name__ == "__main__":
    utils = ModelUtils()
    model_info = utils.get_model_info()
    print(json.dumps(model_info, indent=2))