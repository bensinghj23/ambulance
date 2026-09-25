import pandas as pd
import numpy as np

def generate_synthetic_dataset(num_samples=10000):
    """
    Generates synthetic traffic data for intersection clearance time prediction.
    Features:
    - vehicleCount: 0-100
    - queueLength: 0-600 meters
    - averageSpeed: 0-50 km/h
    - trafficDensity: 0.0-1.0
    - laneOccupancy: 0.0-1.0
    - isGreenPhase: 0 or 1
    - remainingGreen: 0-60 seconds
    - intersectionOccupancy: 0 or 1 (is the box blocked?)
    - ambulanceETA: 5-180 seconds
    
    Target:
    - clearanceTime: seconds required to clear the path for the ambulance
    """
    np.random.seed(42)
    
    # Generate random features
    vehicleCount = np.random.randint(0, 100, num_samples)
    trafficDensity = vehicleCount / 100.0 + np.random.normal(0, 0.05, num_samples)
    trafficDensity = np.clip(trafficDensity, 0.0, 1.0)
    
    queueLength = vehicleCount * np.random.uniform(5, 7, num_samples)  # ~6m per vehicle
    averageSpeed = 50 * (1 - trafficDensity) + np.random.normal(0, 2, num_samples)
    averageSpeed = np.clip(averageSpeed, 0, 60)
    
    laneOccupancy = trafficDensity * np.random.uniform(0.8, 1.1, num_samples)
    laneOccupancy = np.clip(laneOccupancy, 0.0, 1.0)
    
    isGreenPhase = np.random.randint(0, 2, num_samples)
    remainingGreen = isGreenPhase * np.random.randint(0, 60, num_samples)
    
    # High density increases chance of intersection being blocked
    intersectionOccupancy = (np.random.rand(num_samples) < (trafficDensity ** 2)).astype(int)
    
    ambulanceETA = np.random.randint(5, 180, num_samples)
    
    # Generate Target: Clearance Time
    # Base clearance time is ~2 seconds per queued vehicle
    base_clearance = vehicleCount * 1.8 
    
    # Density multiplier: higher density means slower acceleration/clearance
    density_multiplier = 1.0 + (trafficDensity * 1.5)
    
    # Phase bonus/penalty:
    # If already green, we can start clearing immediately. If red, add 5s reaction delay
    phase_delay = np.where(isGreenPhase == 1, -remainingGreen * 0.1, 5)
    
    # Intersection occupancy penalty: if box is blocked, add 8-15 seconds
    occupancy_penalty = intersectionOccupancy * np.random.uniform(8, 15, num_samples)
    
    clearanceTime = (base_clearance * density_multiplier) + phase_delay + occupancy_penalty
    
    # Add some random noise
    clearanceTime += np.random.normal(0, 3, num_samples)
    
    # Ensure minimum clearance time
    clearanceTime = np.clip(clearanceTime, 2, 120)
    
    df = pd.DataFrame({
        'vehicleCount': vehicleCount,
        'queueLength': queueLength,
        'averageSpeed': averageSpeed,
        'trafficDensity': trafficDensity,
        'laneOccupancy': laneOccupancy,
        'isGreenPhase': isGreenPhase,
        'remainingGreen': remainingGreen,
        'intersectionOccupancy': intersectionOccupancy,
        'ambulanceETA': ambulanceETA,
        'clearanceTime': clearanceTime
    })
    
    return df

if __name__ == '__main__':
    df = generate_synthetic_dataset()
    df.to_csv('synthetic_traffic_data.csv', index=False)
    print("Generated synthetic dataset: synthetic_traffic_data.csv")
