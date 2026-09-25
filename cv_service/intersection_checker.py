# Intersection Occupancy Verification
class IntersectionChecker:
    def __init__(self, center_roi=((0.4, 0.4), (0.6, 0.6))):
        self.roi = center_roi

    def is_clear(self, tracked_vehicles, frame_width, frame_height):
        (x1_pct, y1_pct), (x2_pct, y2_pct) = self.roi
        box_x1 = x1_pct * frame_width
        box_y1 = y1_pct * frame_height
        box_x2 = x2_pct * frame_width
        box_y2 = y2_pct * frame_height

        conflicting_vehicles = []
        for veh in tracked_vehicles:
            cx, cy = veh["centroid"]
            if box_x1 <= cx <= box_x2 and box_y1 <= cy <= box_y2:
                conflicting_vehicles.append(veh)

        is_clear = len(conflicting_vehicles) == 0
        return is_clear, conflicting_vehicles
