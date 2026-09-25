import os
import subprocess
import traci

def is_sumo_installed():
    try:
        subprocess.run(["sumo", "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

class TraCIController:
    def __init__(self):
        self.connected = False

    def connect(self, config_file, gui=False):
        if not is_sumo_installed():
            print("SUMO is not installed.")
            return False

        binary = "sumo-gui" if gui else "sumo"
        cmd = [binary, "-c", config_file]
        
        try:
            traci.start(cmd)
            self.connected = True
            return True
        except Exception as e:
            print(f"Failed to start TraCI: {e}")
            self.connected = False
            return False

    def disconnect(self):
        if self.connected:
            try:
                traci.close()
            except Exception:
                pass
            self.connected = False

    def step(self):
        if self.connected:
            traci.simulationStep()

    def get_time(self):
        if self.connected:
            return traci.simulation.getTime()
        return 0

    def get_vehicle_ids(self):
        if self.connected:
            return traci.vehicle.getIDList()
        return []

    def get_vehicle_state(self, vid):
        if self.connected:
            try:
                return {
                    "id": vid,
                    "position": traci.vehicle.getPosition(vid),
                    "speed": traci.vehicle.getSpeed(vid),
                    "angle": traci.vehicle.getAngle(vid),
                    "road": traci.vehicle.getRoadID(vid),
                    "lane": traci.vehicle.getLaneID(vid),
                    "route": traci.vehicle.getRoute(vid)
                }
            except traci.exceptions.TraCIException:
                pass
        return None

    def get_traffic_light_ids(self):
        if self.connected:
            return traci.trafficlight.getIDList()
        return []

    def get_traffic_light_state(self, tl_id):
        if self.connected:
            try:
                return {
                    "id": tl_id,
                    "state": traci.trafficlight.getRedYellowGreenState(tl_id),
                    "phase": traci.trafficlight.getPhase(tl_id),
                    "program": traci.trafficlight.getProgram(tl_id)
                }
            except traci.exceptions.TraCIException:
                pass
        return None

    def set_traffic_light_phase(self, tl_id, phase_index):
        if self.connected:
            try:
                traci.trafficlight.setPhase(tl_id, phase_index)
                return True
            except traci.exceptions.TraCIException:
                pass
        return False
