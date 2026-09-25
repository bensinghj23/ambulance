from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pickle
import pandas as pd
import os

app = FastAPI(title="Ambulance AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model on startup
model = None
try:
    if os.path.exists('rf_model.pkl'):
        with open('rf_model.pkl', 'rb') as f:
            model = pickle.load(f)
        print("Model loaded successfully.")
    else:
        print("Warning: rf_model.pkl not found. Please run train.py.")
except Exception as e:
    print(f"Error loading model: {e}")

class PredictionInput(BaseModel):
    vehicleCount: int
    queueLength: float
    averageSpeed: float
    trafficDensity: float
    laneOccupancy: float
    currentSignalPhase: str
    remainingGreen: float
    intersectionOccupancy: int
    ambulanceETA: float

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict-clearance")
def predict_clearance(data: PredictionInput):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
        
    # Convert input to DataFrame matching training features
    isGreenPhase = 1 if 'GREEN' in data.currentSignalPhase else 0
    
    df = pd.DataFrame([{
        'vehicleCount': data.vehicleCount,
        'queueLength': data.queueLength,
        'averageSpeed': data.averageSpeed,
        'trafficDensity': data.trafficDensity,
        'laneOccupancy': data.laneOccupancy,
        'isGreenPhase': isGreenPhase,
        'remainingGreen': data.remainingGreen if isGreenPhase else 0,
        'intersectionOccupancy': data.intersectionOccupancy,
        'ambulanceETA': data.ambulanceETA
    }])
    
    # Predict
    try:
        prediction = model.predict(df)[0]
        
        # Ensure it's not negative and makes sense
        clearance_time = max(2.0, float(prediction))
        
        return {
            "predictedClearanceTime": round(clearance_time, 1),
            "model": "Random Forest Regressor (Synthetic)",
            "modelVersion": "1.0"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
