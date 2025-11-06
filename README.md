# Project Summary
The **AI-Powered Crop Health Management System** assists farmers and agricultural experts in detecting plant diseases using advanced AI and deep learning methods.  
By integrating **YOLOv8** for image-based disease detection and **Google’s Gemini API** for detailed disease analysis, the system delivers **real-time, accurate, and interpretable crop health diagnostics**.

Farmers can upload plant images through a simple **React.js frontend**, where the **Flask backend** processes them using the trained YOLOv8 model. The **Gemini API** enhances diagnosis by providing detailed insights such as symptoms, causes, and recommended treatments — empowering sustainable agriculture.

---

# Project Module Description
- **Frontend (React + Tailwind CSS)**: Handles user interaction, image uploads, and displays detection results and statistics. Integrates Axios for API communication.
- **Backend (Flask + MongoDB)**: Manages user authentication, YOLO inference, Gemini API calls, and CRUD operations. Provides RESTful routes for frontend interaction.
- **YOLOv8 Model (CNN-based Detection)**: Trained on a curated dataset of crop diseases. Performs real-time detection and returns disease labels.
- **Gemini API Integration**: Enhances YOLO results with in-depth agricultural context such as causes, symptoms, and preventive suggestions.

---

# Directory Tree
```
/workspace/
├── frontend/          # React.js + Tailwind CSS + Axios
├── backend/           # Flask API + MongoDB + Gemini Integration
├── CNN_YOLO_Model/    # YOLOv8 Training & Inference Scripts
└── README.md          # Project Documentation
```

# File Description Inventory
- **frontend/**: Contains all React components, pages, and Tailwind styles.  
- **backend/**: Contains Flask routes, models, Gemini integration, and MongoDB connection.  
- **CNN_YOLO_Model/**: Contains YOLOv8 training, dataset preparation, and inference scripts.  
- **README.md**: Documentation for project setup, workflow, and architecture.

---

# Technology Stack
- **Frontend**: React.js, Tailwind CSS, Axios  
- **Backend**: Python, Flask, MongoDB  
- **Machine Learning**: YOLOv8 (Ultralytics)  
- **AI Integration**: Google Gemini API  
- **Testing**: Postman for API validation  

---

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
   cd frontend && npm run dev
   ```
4. **Train YOLO Model**:
   ```bash
   cd CNN_YOLO_Model && python train_yolo.py
   ```
