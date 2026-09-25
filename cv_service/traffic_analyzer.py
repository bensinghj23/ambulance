# Traffic Density, Occupancy & Queue Length Estimator
class TrafficAnalyzer:
    def __init__(self, lane_capacities=None):
        self.lane_capacities = lane_capacities or {"N1": 15, "N2": 15, "S1": 15, "S2": 15}

    def analyze(self, lane_counts):
        queue_lengths = {}
        occupancy = {}
        density = {}

        for lane_id, count in lane_counts.items():
            capacity = self.lane_capacities.get(lane_id, 15)
            queue_lengths[lane_id] = count
            occupancy[lane_id] = min(1.0, count / capacity)
            density[lane_id] = occupancy[lane_id]

        return {
            "queue_lengths": queue_lengths,
            "occupancy": occupancy,
            "density": density
        }
