from mongoengine import (
    Document, StringField, EmailField, BooleanField,
    FloatField, DateTimeField, ReferenceField, ListField, CASCADE
)
from datetime import datetime

# --------------------
# User Model
# --------------------
class User(Document):
    meta = {'collection': 'users'}
    
    username = StringField(required=True, unique=True, max_length=80)
    email = EmailField(required=True, unique=True, max_length=120)
    password_hash = StringField(required=True, max_length=255)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    def __repr__(self):
        return f"<User {self.username}>"

# --------------------
# Plant Model
# --------------------
class Plant(Document):
    meta = {'collection': 'plants'}
    
    name = StringField(required=True, max_length=100)
    scientific_name = StringField(max_length=150)
    common_diseases = ListField(StringField())  # store as list instead of comma-separated
    description = StringField()
    created_at = DateTimeField(default=datetime.utcnow)

    def __repr__(self):
        return f"<Plant {self.name}>"

# --------------------
# Detection Model
# --------------------
class Detection(Document):
    meta = {'collection': 'detections'}
    
    user = ReferenceField(User, reverse_delete_rule=CASCADE, required=True)
    image_path = StringField(required=True, max_length=255)
    disease_detected = BooleanField(default=False)
    confidence_score = FloatField(default=0.0)
    disease_type = StringField(max_length=100)
    severity_level = StringField(max_length=50)  # Low, Medium, High
    treatment_recommendation = StringField()
    created_at = DateTimeField(default=datetime.utcnow)

    def __repr__(self):
        return f"<Detection {self.id} - Disease: {self.disease_detected}>"

# --------------------
# DiseaseInfo Model
# --------------------
class DiseaseInfo(Document):
    meta = {'collection': 'disease_info'}
    
    name = StringField(required=True, unique=True, max_length=100)
    description = StringField()
    symptoms = StringField()
    treatment = StringField()
    prevention = StringField()
    affected_plants = ListField(StringField())  # store as list of plant names
    created_at = DateTimeField(default=datetime.utcnow)

    def __repr__(self):
        return f"<DiseaseInfo {self.name}>"
