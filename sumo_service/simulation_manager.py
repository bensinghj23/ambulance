import os
from traci_controller import TraCIController

class SimulationManager:
    def __init__(self):
        self.traci = TraCIController()
        self.status = "STOPPED"
        self.config_file = os.path.join("scenarios", "emergency.sumocfg")

    def start(self, gui=False):
        if self.status == "RUNNING":
            return True
        
        # Verify scenario exists, fallback if not
        if not os.path.exists(self.config_file):
            print(f"Warning: config file {self.config_file} not found. TraCI will likely fail.")

        success = self.traci.connect(self.config_file, gui=gui)
        if success:
            self.status = "RUNNING"
        return success

    def stop(self):
        self.traci.disconnect()
        self.status = "STOPPED"

    def step(self):
        if self.status == "RUNNING":
            self.traci.step()

    def get_time(self):
        return self.traci.get_time()

    def get_full_state(self):
        if self.status != "RUNNING":
            return {"status": "NOT_RUNNING"}

        # Basic state gathering
        vehicles = []
        for vid in self.traci.get_vehicle_ids():
            vstate = self.traci.get_vehicle_state(vid)
            if vstate:
                vehicles.append(vstate)

        signals = []
        for tl_id in self.traci.get_traffic_light_ids():
            tlstate = self.traci.get_traffic_light_state(tl_id)
            if tlstate:
                signals.append(tlstate)

        return {
            "time": self.traci.get_time(),
            "status": self.status,
            "vehicles": vehicles,
            "signals": signals
        }
