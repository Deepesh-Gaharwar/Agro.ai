from roboflow import Roboflow

# Use your valid Roboflow API key here
rf = Roboflow(api_key='fKgiU7jgyUaCaap4JJ2i')

# Access your workspace and project
project = rf.workspace("Deepesh").project("Agro.ai")

# Download version 1 of the dataset in YOLOv8 format
dataset = project.version(1).download("yolov8")

print("Dataset downloaded at:", dataset.location)
