# Dynamic Lane Assignment for Emergency Vehicles — Smart City Dashboard

A simulation-first MVP that detects approaching emergency vehicles, understands traffic and exact lane/path conditions using OpenCV + YOLO, dynamically creates a safe emergency corridor by coordinating simulated traffic signals, and restores normal traffic after the ambulance passes.

---

## 🌟 Key Features

- **Smart City Command Center Dashboard**: Built with React + Vite, Leaflet OpenStreetMap, Chart.js, and dark-mode glassmorphism styling.
- **Simulation-First Architecture**: Runs 100% in the browser without requiring physical sensors, cameras, GPS hardware, or real traffic signals.
- **Deterministic Priority Engine**: Score-based priority evaluation considering ambulance distance, speed, priority level, traffic density, and turning movements.
- **Safe Signal State Machine**: Enforces safe intermediate signal transitions (`NORMAL` → `EMERGENCY_DETECTED` → `PRE_CLEARANCE` → `YELLOW` → `ALL_RED` → `EMERGENCY_GREEN` → `PASSAGE_MONITORING` → `RECOVERY`).
- **Rolling Green Corridor**: Coordinates 4 connected intersections as a topological graph to clear signalized paths ahead of the emergency vehicle.
- **Computer Vision Service**: Python + OpenCV + YOLO + Centroid Tracking pipeline for lane ROI vehicle counting, queue estimation, and intersection safety verification.
- **MQTT IoT Bridge**: Real-time IoT message schema over MQTT (`emergency/ambulance/{ambulanceId}`, `traffic/intersection/{intersectionId}/state`).
- **Firebase Backend**: Cloud Firestore real-time listeners with in-memory fallback store, Cloud Functions for backend logic, and role-based Firestore security rules.
- **Analytics & Evaluation**: Baseline vs Proposed metrics tracking travel time reduction (≈29.8%), waiting time, signal interruptions, and clearance success.

---

## 🏗️ Project Structure

```
ambulance/
├── frontend/
│   ├── src/
│   │   ├── components/       # TrafficMap, TrafficSignal, AmbulanceCard, LaneStatus, SimulationControls, EmergencyStatus
│   │   ├── context/          # SimulationContext (Engine & State bridge)
│   │   ├── pages/            # Dashboard, LiveTraffic, EmergencyControl, Simulation, Analytics, Settings
│   │   ├── services/         # Firebase & Firestore abstraction with in-memory fallback
│   │   ├── simulation/       # Intersection graph, Signal controller state machine, Priority engine, Simulation loop
│   │   ├── styles/           # Design system & dark-mode CSS tokens
│   │   ├── App.jsx           # Sidebar & Page routing
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── functions/                # Firebase Cloud Functions backend
│   ├── src/                  # Priority engine, Traffic controller, Route planner, Emergency events
│   └── package.json
├── cv_service/               # Python Computer Vision Pipeline
│   ├── main.py               # Main CV service entry point
│   ├── detector.py           # YOLO vehicle & ambulance detector
│   ├── tracker.py            # Vehicle tracker
│   ├── lane_analyzer.py      # Lane ROI polygon assignment
│   ├── traffic_analyzer.py   # Queue & occupancy estimation
│   ├── speed_estimator.py    # Speed calculation
│   ├── intersection_checker.py # Safety clearance checker
│   ├── firebase_client.py    # Firestore publisher
│   ├── mqtt_client.py        # MQTT bridge publisher
│   └── requirements.txt
├── firebase.json             # Firebase deployment configuration
├── firestore.rules           # Role-based security rules
├── firestore.indexes.json    # Firestore composite query indexes
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Frontend Web Dashboard

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The app runs immediately in **Simulation Mode** using an in-memory Firestore fallback store.

### 2. (Optional) Computer Vision Service

```bash
cd cv_service
pip install -r requirements.txt
python main.py
```

### 3. (Optional) Firebase Setup

1. Create a project at [Firebase Console](https://console.firebase.google.com).
2. Enable Cloud Firestore and Authentication.
3. Copy `.env.example` to `.env` in `frontend/`:
   ```bash
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   ```

---

## 🎮 Demo Walkthrough Procedure

1. **Start System**: Open the dashboard at `http://localhost:5173`. Notice all 4 intersections are operating under `NORMAL` automated signal cycles (`NS_GREEN`).
2. **Spawn Ambulance**: Go to **Simulation** page (or use the sidebar panel on Dashboard). Click **Spawn Ambulance** with origin `INT_1` and destination `INT_4`.
3. **Priority Activation**: As the ambulance approaches `INT_1`, the Priority Engine evaluates score > 70 and activates emergency planning mode.
4. **Safe Transition**: Watch the signal light switch to `ALL_YELLOW` → `ALL_RED` safety clearance before granting `EMERGENCY_GREEN`.
5. **Rolling Corridor**: As the ambulance passes `INT_1`, `INT_2` pre-clears its approach path.
6. **Recovery**: Once the ambulance passes, signals execute a safe recovery transition back to standard timing.
7. **View Analytics**: Open **Analytics** page to compare Baseline travel time (8.4 min) against Proposed green corridor time (5.9 min, ≈29.8% reduction).

---

## 🛡️ Safety & Architecture Principles

- **Simulation First**: All hardware, sensors, traffic lights, and MQTT messages have clean mock fallbacks.
- **Explainable Controller**: Priority decisions use deterministic score rules, avoiding opaque black-box decisions for critical traffic infrastructure.
- **Zero Secret Exposure**: Frontend code never includes Firebase Admin keys or MQTT secrets.
