# YOLO Object Detector Wrapper
import cv2
import numpy as np
from ultralytics import YOLO
import config

class VehicleDetector:
    def __init__(self, model_path=config.YOLO_MODEL_PATH):
        try:
            self.model = YOLO(model_path)
            print(f"[Detector] Loaded YOLO model from {model_path}")
        except Exception as e:
            print(f"[Detector] Model load warning: {e}. Running with mock detector.")
            self.model = None

    def detect(self, frame):
        if self.model is None:
            # Mock detection output for testing without model weights
            return []

        results = self.model(frame, conf=config.CONFIDENCE_THRESHOLD, iou=config.IOU_THRESHOLD)[0]
        detections = []

        for box in results.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].cpu().numpy().tolist()

            label = config.CLASSES.get(cls_id, "unknown")
            is_ambulance = (cls_id == config.AMBULANCE_CLASS_ID)

            detections.append({
                "bbox": xyxy,
                "confidence": conf,
                "class_id": cls_id,
                "label": label if not is_ambulance else "ambulance",
                "is_ambulance": is_ambulance
            })

        return detections
