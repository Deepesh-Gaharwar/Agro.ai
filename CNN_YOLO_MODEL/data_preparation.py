import os
import shutil
import requests
import zipfile
from pathlib import Path
import json
import cv2
import numpy as np
from PIL import Image
import yaml

class PlantVillageDataset:
    def __init__(self, data_dir='data'):
        """
        Initialize PlantVillage dataset preparation
        
        Args:
            data_dir: Directory to store dataset
        """
        self.data_dir = Path(data_dir)
        self.raw_data_dir = self.data_dir / 'raw'
        self.processed_data_dir = self.data_dir / 'processed'
        
        # Create directories
        self.data_dir.mkdir(exist_ok=True)
        self.raw_data_dir.mkdir(exist_ok=True)
        self.processed_data_dir.mkdir(exist_ok=True)
        
        # Dataset URL (PlantVillage dataset)
        self.dataset_url = "https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset"
        
        # Class mapping for diseases
        self.class_mapping = {
            'healthy': 0,
            'bacterial_spot': 1,
            'early_blight': 2,
            'late_blight': 3,
            'leaf_mold': 4,
            'septoria_leaf_spot': 5,
            'spider_mites': 6,
            'target_spot': 7,
            'mosaic_virus': 8,
            'yellow_leaf_curl_virus': 9
        }
    
    def download_dataset(self):
        """Download PlantVillage dataset"""
        print("Setting up sample dataset structure...")
        
        # Create sample dataset structure for demonstration
        # In real implementation, you would download from Kaggle API
        self.create_sample_dataset()
        
        print("Sample dataset structure created!")
    
    def create_sample_dataset(self):
        """Create sample dataset structure for demonstration"""
        
        # Create class directories
        classes = list(self.class_mapping.keys())
        
        for split in ['train', 'val', 'test']:
            split_dir = self.raw_data_dir / split
            split_dir.mkdir(exist_ok=True)
            
            for class_name in classes:
                class_dir = split_dir / class_name
                class_dir.mkdir(exist_ok=True)
                
                # Create placeholder files
                placeholder_file = class_dir / f"{class_name}_sample.txt"
                with open(placeholder_file, 'w') as f:
                    f.write(f"Placeholder for {class_name} images in {split} set\n")
                    f.write("In real implementation, this would contain actual plant images\n")
                    f.write(f"Expected format: {class_name}_001.jpg, {class_name}_002.jpg, etc.\n")
        
        print("Sample dataset structure created at:", self.raw_data_dir)
    
    def convert_to_yolo_format(self):
        """Convert dataset to YOLO format with labels"""
        
        print("Converting dataset to YOLO format...")
        
        # Create YOLO directory structure
        yolo_dir = self.data_dir
        
        for split in ['train', 'val', 'test']:
            # Create images and labels directories
            images_dir = yolo_dir / split / 'images'
            labels_dir = yolo_dir / split / 'labels'
            
            images_dir.mkdir(parents=True, exist_ok=True)
            labels_dir.mkdir(parents=True, exist_ok=True)
            
            # Process each class
            for class_name, class_id in self.class_mapping.items():
                source_dir = self.raw_data_dir / split / class_name
                
                if source_dir.exists():
                    # Create sample annotations for demonstration
                    self.create_sample_annotations(images_dir, labels_dir, class_name, class_id)
        
        print("Dataset converted to YOLO format!")
    
    def create_sample_annotations(self, images_dir, labels_dir, class_name, class_id):
        """Create sample YOLO annotations"""
        
        # Create sample image and annotation files
        for i in range(3):  # Create 3 sample files per class
            # Sample image filename
            image_filename = f"{class_name}_{i:03d}.jpg"
            label_filename = f"{class_name}_{i:03d}.txt"
            
            image_path = images_dir / image_filename
            label_path = labels_dir / label_filename
            
            # Create placeholder image file
            with open(image_path, 'w') as f:
                f.write(f"# Placeholder for {image_filename}\n")
                f.write("# In real implementation, this would be an actual plant image\n")
            
            # Create YOLO annotation
            if class_name != 'healthy':
                # For diseased plants, create bounding box annotation
                # Format: class_id center_x center_y width height (normalized 0-1)
                bbox_annotation = f"{class_id} 0.5 0.5 0.3 0.4\n"
            else:
                # For healthy plants, no bounding box needed
                bbox_annotation = ""
            
            with open(label_path, 'w') as f:
                f.write(bbox_annotation)
    
    def augment_dataset(self, augmentation_factor=3):
        """Apply data augmentation to increase dataset size"""
        
        print(f"Applying data augmentation (factor: {augmentation_factor})...")
        
        # Augmentation techniques
        augmentations = [
            'rotation',
            'brightness',
            'contrast',
            'horizontal_flip',
            'gaussian_noise'
        ]
        
        for split in ['train']:  # Usually only augment training data
            images_dir = self.data_dir / split / 'images'
            labels_dir = self.data_dir / split / 'labels'
            
            if images_dir.exists():
                # Create augmented versions
                for aug_type in augmentations[:augmentation_factor]:
                    aug_images_dir = images_dir.parent / f'images_{aug_type}'
                    aug_labels_dir = labels_dir.parent / f'labels_{aug_type}'
                    
                    aug_images_dir.mkdir(exist_ok=True)
                    aug_labels_dir.mkdir(exist_ok=True)
                    
                    # Create placeholder augmented files
                    for class_name in self.class_mapping.keys():
                        for i in range(2):  # 2 augmented versions per original
                            aug_image_file = aug_images_dir / f"{class_name}_{aug_type}_{i:03d}.jpg"
                            aug_label_file = aug_labels_dir / f"{class_name}_{aug_type}_{i:03d}.txt"
                            
                            with open(aug_image_file, 'w') as f:
                                f.write(f"# Augmented image: {aug_type}\n")
                            
                            # Copy corresponding label
                            original_label = labels_dir / f"{class_name}_{i:03d}.txt"
                            if original_label.exists():
                                shutil.copy(original_label, aug_label_file)
        
        print("Data augmentation completed!")
    
    def validate_dataset(self):
        """Validate dataset structure and annotations"""
        
        print("Validating dataset...")
        
        validation_report = {
            'total_images': 0,
            'total_labels': 0,
            'class_distribution': {},
            'missing_labels': [],
            'errors': []
        }
        
        for split in ['train', 'val', 'test']:
            images_dir = self.data_dir / split / 'images'
            labels_dir = self.data_dir / split / 'labels'
            
            if images_dir.exists():
                image_files = list(images_dir.glob('*'))
                label_files = list(labels_dir.glob('*')) if labels_dir.exists() else []
                
                validation_report['total_images'] += len(image_files)
                validation_report['total_labels'] += len(label_files)
                
                # Check for missing labels
                for image_file in image_files:
                    label_file = labels_dir / f"{image_file.stem}.txt"
                    if not label_file.exists():
                        validation_report['missing_labels'].append(str(image_file))
        
        # Count class distribution
        for class_name, class_id in self.class_mapping.items():
            validation_report['class_distribution'][class_name] = 0
            
            for split in ['train', 'val', 'test']:
                class_files = list((self.data_dir / split / 'images').glob(f"{class_name}_*"))
                validation_report['class_distribution'][class_name] += len(class_files)
        
        # Save validation report
        report_path = self.data_dir / 'validation_report.json'
        with open(report_path, 'w') as f:
            json.dump(validation_report, f, indent=2)
        
        print(f"Dataset validation completed! Report saved to: {report_path}")
        print(f"Total images: {validation_report['total_images']}")
        print(f"Total labels: {validation_report['total_labels']}")
        
        return validation_report
    
    def create_dataset_yaml(self):
        """Create dataset configuration YAML file for YOLO"""
        
        dataset_config = {
            'path': str(self.data_dir.absolute()),
            'train': 'train/images',
            'val': 'val/images',
            'test': 'test/images',
            'nc': len(self.class_mapping),
            'names': list(self.class_mapping.keys())
        }
        
        yaml_path = self.data_dir / 'dataset.yaml'
        with open(yaml_path, 'w') as f:
            yaml.dump(dataset_config, f, default_flow_style=False)
        
        print(f"Dataset YAML created: {yaml_path}")
        return yaml_path

# Usage example
if __name__ == "__main__":
    # Initialize dataset preparation
    dataset = PlantVillageDataset('data')
    
    # Download and prepare dataset
    dataset.download_dataset()
    dataset.convert_to_yolo_format()
    dataset.augment_dataset(augmentation_factor=2)
    dataset.validate_dataset()
    dataset.create_dataset_yaml()
    
    print("Dataset preparation completed!")