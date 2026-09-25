# Vehicle Speed Estimator
class SpeedEstimator:
    def __init__(self, fps=30, meters_per_pixel=0.05):
        self.fps = fps
        self.mpp = meters_per_pixel
        self.positions = {}

    def estimate_speed(self, tracked_vehicles):
        speeds = {}
        for veh in tracked_vehicles:
            tid = veh["track_id"]
            centroid = veh["centroid"]

            if tid in self.positions:
                prev_cx, prev_cy = self.positions[tid]
                dist_px = ((centroid[0] - prev_cx)**2 + (centroid[1] - prev_cy)**2)**0.5
                dist_m = dist_px * self.mpp
                speed_mps = dist_m * self.fps
                speed_kmh = speed_mps * 3.6
                speeds[tid] = round(speed_kmh, 1)
            else:
                speeds[tid] = 0.0

            self.positions[tid] = centroid

        return speeds
