# ByteTrack / Centroid Tracker Wrapper
import numpy as np

class VehicleTracker:
    def __init__(self):
        self.next_object_id = 1
        self.objects = {}
        self.disappeared = {}
        self.max_disappeared = 10

    def update(self, detections):
        if len(detections) == 0:
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    del self.objects[object_id]
                    del self.disappeared[object_id]
            return []

        input_centroids = []
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0
            input_centroids.append((cx, cy))

        tracked = []
        for i, det in enumerate(detections):
            track_id = self.next_object_id
            self.next_object_id += 1
            tracked.append({
                **det,
                "track_id": track_id,
                "centroid": input_centroids[i]
            })

        return tracked
