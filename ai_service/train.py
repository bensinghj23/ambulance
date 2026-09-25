import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np
import pickle
from dataset import generate_synthetic_dataset

def train_model():
    print("Generating synthetic dataset...")
    df = generate_synthetic_dataset(10000)
    
    # Features and Target
    X = df.drop(columns=['clearanceTime'])
    y = df['clearanceTime']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    
    print(f"\nModel Evaluation (Test Set):")
    print(f"MAE:  {mae:.2f} seconds")
    print(f"RMSE: {rmse:.2f} seconds")
    
    # Save model
    with open('rf_model.pkl', 'wb') as f:
        pickle.dump(model, f)
        
    print("\nModel saved to rf_model.pkl")
    
    # Save metrics
    with open('metrics.json', 'w') as f:
        import json
        json.dump({
            "model": "Random Forest Regressor",
            "training_data": "Synthetic Traffic Simulation",
            "mae_seconds": round(mae, 2),
            "rmse_seconds": round(rmse, 2)
        }, f)

if __name__ == '__main__':
    train_model()
