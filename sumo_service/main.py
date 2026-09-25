import os
import asyncio
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simulation_manager import SimulationManager
from traci_controller import is_sumo_installed

app = FastAPI(title="SUMO + TraCI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sim_manager = SimulationManager()

@app.on_event("startup")
async def startup_event():
    pass

@app.on_event("shutdown")
async def shutdown_event():
    sim_manager.stop()

@app.get("/health")
def health_check():
    return {"status": "ok", "sumo_installed": is_sumo_installed()}

@app.get("/status")
def status():
    if not is_sumo_installed():
        return {"status": "SUMO_UNAVAILABLE", "backend": "NONE"}
    return {
        "status": sim_manager.status,
        "backend": "SUMO",
        "time": sim_manager.get_time() if sim_manager.status == "RUNNING" else 0
    }

class StartRequest(BaseModel):
    gui: bool = False

@app.post("/start")
def start_simulation(req: StartRequest):
    if not is_sumo_installed():
        return {"status": "SUMO_UNAVAILABLE"}
    
    success = sim_manager.start(gui=req.gui)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to start SUMO")
    
    return {"status": "STARTED"}

@app.post("/stop")
def stop_simulation():
    sim_manager.stop()
    return {"status": "STOPPED"}

@app.post("/step")
def step_simulation():
    if sim_manager.status != "RUNNING":
        raise HTTPException(status_code=400, detail="Simulation not running")
    sim_manager.step()
    return {"status": "STEPPED", "time": sim_manager.get_time()}

@app.get("/state")
def get_state():
    if sim_manager.status != "RUNNING":
        return {"status": "NOT_RUNNING"}
    return sim_manager.get_full_state()

@app.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            if sim_manager.status == "RUNNING":
                state = sim_manager.get_full_state()
                await websocket.send_json(state)
            else:
                await websocket.send_json({"status": "NOT_RUNNING"})
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        pass
