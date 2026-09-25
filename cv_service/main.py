# Main Computer Vision Pipeline Entry Point
import cv2
import time
import numpy as np

import config
from detector import VehicleDetector
from tracker import VehicleTracker
from lane_analyzer import LaneAnalyzer
from traffic_analyzer import TrafficAnalyzer
from speed_estimator import SpeedEstimator
from intersection_checker import IntersectionChecker
from firebase_client import FirebasePublisher
from mqtt_client import MQTTBridge

def main():
    print("=========================================================")
    print("Emergency Corridor — Computer Vision Analysis Pipeline")
    print("YOLO + Object Tracking + Lane ROI + Safety Verification")
    print("=========================================================")

    detector = VehicleDetector()
    tracker = VehicleTracker()
    lane_analyzer = LaneAnalyzer()
    traffic_analyzer = TrafficAnalyzer()
    speed_estimator = SpeedEstimator()
    intersection_checker = IntersectionChecker()

    fb_publisher = FirebasePublisher()
    mqtt_bridge = MQTTBridge()
    mqtt_bridge.start()

    intersection_id = "INT_1"
    frame_width = 1280
    frame_height = 720

    print(f"[CV Service] Processing feed for intersection: {intersection_id}")

    # Main loop (simulated camera stream)
    try:
        frame_idx = 0
        while True:
            frame_idx += 1
            # Create synthetic frame for demonstration
            frame = np.zeros((frame_height, frame_width, 3), dtype=np.uint8)

            # 1. Detect vehicles
            detections = detector.detect(frame)

            # 2. Track vehicles across frames
            tracked_vehicles = tracker.update(detections)

            # 3. Assign to lane ROIs
            assignments, lane_counts = lane_analyzer.assign_to_lanes(
                tracked_vehicles, frame_width, frame_height
            )

            # 4. Traffic statistics
            traffic_stats = traffic_analyzer.analyze(lane_counts)

            # 5. Speed estimation
            speeds = speed_estimator.estimate_speed(tracked_vehicles)

            # 6. Intersection occupancy check
            is_clear, conflicting = intersection_checker.is_clear(
                tracked_vehicles, frame_width, frame_height
            )

            # Check for ambulance
            detected_ambulances = [v for v in tracked_vehicles if v.get("is_ambulance")]

            # 7. Package results
            cv_payload = {
                "intersectionId": intersection_id,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "detections": len(tracked_vehicles),
                "laneAssignments": lane_counts,
                "queueLengths": traffic_stats["queue_lengths"],
                "occupancy": traffic_stats["occupancy"],
                "density": traffic_stats["density"],
                "detectedAmbulances": len(detected_ambulances),
                "intersectionClear": is_clear,
            }

            if frame_idx % 30 == 0: # Log every 30 frames
                print(f"[CV Pipeline #{frame_idx}] Vehicles: {len(tracked_vehicles)}, Queue: {lane_counts}, Clear: {is_clear}")
                fb_publisher.publish_cv_analysis(intersection_id, cv_payload)
                mqtt_bridge.publish_cv_analysis(intersection_id, cv_payload)

            time.sleep(0.033) # ~30 FPS

    except KeyboardInterrupt:
        print("\n[CV Service] Stopped by user")

if __name__ == "__main__":
    main()
