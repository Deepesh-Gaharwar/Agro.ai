# Project Summary
The **AI-Powered Crop Health Management System** is designed to assist farmers and agriculturalists in detecting plant diseases using advanced machine learning techniques. By leveraging a YOLO-based model, the system provides a user-friendly interface for uploading images, real-time disease detection, and detailed reporting on crop health. This solution aims to enhance agricultural productivity and ensure healthy crops through timely interventions.

# Project Module Description
- **Frontend**: A React.js application styled with Tailwind CSS, featuring user authentication, image uploads for disease detection, and a dashboard for statistics.
- **Backend**: A Python Flask API that handles user authentication, processes detection requests, and interacts with the YOLO model for disease analysis.
- **CNN YOLO Model**: Contains scripts for training and inference using the YOLO architecture, specifically tailored for plant disease detection.

# Directory Tree
```
/workspace/
├── frontend/          # React.js + JavaScript + Tailwind CSS
├── backend/           # Python Flask API + SQLAlchemy
├── CNN_YOLO_Model/    # YOLO training & inference
└── README.md          # Complete documentation
```

# File Description Inventory
- **frontend/**: Contains all frontend components, pages, and styling.
- **backend/**: Contains the Flask API code, models, and requirements.
- **CNN_YOLO_Model/**: Contains scripts for data preparation, training, and inference of the YOLO model.
- **README.md**: Documentation for the project setup and usage.

# Technology Stack
- **Frontend**: React.js, JavaScript, Tailwind CSS, Axios
- **Backend**: Python, Flask, SQLAlchemy
- **Machine Learning**: YOLOv8 for object detection

# Usage
1. **Install Dependencies**:
   ```bash
   cd backend && pip install -r requirements.txt
   cd frontend && npm install
   cd CNN_YOLO_Model && pip install -r requirements.txt
   ```
2. **Run the Backend**:
   ```bash
   cd backend && python app.py
   ```
3. **Run the Frontend**:
   ```bash
   cd frontend && npm start
   ```
4. **Train YOLO Model**:
   ```bash
   cd CNN_YOLO_Model && python train_yolo.py
   ```
