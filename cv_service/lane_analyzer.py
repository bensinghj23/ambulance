# Lane ROI Assignment Module
import cv2
import numpy as np
import config

class LaneAnalyzer:
    def __init__(self, rois=config.LANE_ROIS):
        self.rois = rois

    def assign_to_lanes(self, tracked_vehicles, frame_width, frame_height):
        lane_counts = {lane: 0 for lane in self.rois}
        assignments = []

        for veh in tracked_vehicles:
            cx, cy = veh["centroid"]
            # Convert normalized ROI to pixel coordinates
            assigned_lane = None

            for lane_id, polygon in self.rois.items():
                pts = np.array([
                    [int(p[0] * frame_width), int(p[1] * frame_height)]
                    for p in polygon
                ], np.int32)

                # Check if centroid is inside polygon
                res = cv2.pointPolygonTest(pts, (cx, cy), False)
                if res >= 0:
                    assigned_lane = lane_id
                    lane_counts[lane_id] += 1
                    break

            assignments.append({
                **veh,
                "assigned_lane": assigned_lane
            })

        return assignments, lane_counts
