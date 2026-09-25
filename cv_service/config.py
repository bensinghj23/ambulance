# Computer Vision Pipeline Configuration
import os

YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
CONFIDENCE_THRESHOLD = 0.4
IOU_THRESHOLD = 0.45

# Class mappings in standard YOLO COCO model
CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
    0: "person",
}

AMBULANCE_CLASS_ID = 5 # Mapping bus/custom class to ambulance for demo

# Default Lane ROIs (Polygons in normalized coordinates)
LANE_ROIS = {
    "N1": [(0.4, 0.0), (0.5, 0.0), (0.5, 0.4), (0.4, 0.4)],
    "N2": [(0.3, 0.0), (0.4, 0.0), (0.4, 0.4), (0.3, 0.4)],
    "S1": [(0.5, 0.6), (0.6, 0.6), (0.6, 1.0), (0.5, 1.0)],
    "S2": [(0.6, 0.6), (0.7, 0.6), (0.7, 1.0), (0.6, 1.0)],
}
