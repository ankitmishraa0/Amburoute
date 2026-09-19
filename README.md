# AmbuRoute — AI-Powered Smart Ambulance Routing & Emergency Response Platform

AmbuRoute is a mission-critical, next-generation emergency medical logistics and AI-driven clinical dispatch platform designed for high-stakes urban emergency response. It combines live GPS routing with traffic heatmaps, an automated IoT traffic-signal preemption engine ("Green Wave"), a multi-criteria hospital recommendation engine, a Scikit-Learn clinical patient-risk indicator, and a pre-arrival hospital ER handoff portal.

---

## 🚀 Key Modules & Architecture

### 1. Live Command Dashboard & GIS Map
- **Full-Screen Dark Mission-Control GIS Map**: Dark matter vector map with animated ambulance markers featuring dynamic heading rotation, siren pulse waves, and live velocity readout.
- **Dynamic Traffic Detour**: Real-time traffic congestion simulation with one-click traffic jam injection and dynamic arterial rerouting.
- **Incident Dispatch Stepper**: Real-time dispatch lifecycle tracker (`DISPATCHED` $\to$ `EN ROUTE` $\to$ `ON SCENE` $\to$ `TRANSPORTING` $\to$ `ARRIVED`).
- **Telemetry HUD**: High-precision gauges for Speed, Distance Remaining, Dynamic ETA countdown, and active V2I corridor state.

### 2. Traffic-Signal Pre-Coordination ("Green Wave Engine")
- **Corridor Schematic**: Sequential intersection visualizer (5th Ave & Pine, 7th & Bush, Market & 4th, Mission & 6th, etc.).
- **Automated V2I Preemption**: Intersections transition through `Standby Red` $\to$ `Amber Prep` (45s window) $\to$ `Green Wave Priority Corridor` (20s clear window) $\to$ `Cleared`.
- **Manual Green Wave Override**: Paramedics or central dispatch can force manual priority clearance for any intersection node.

### 3. Hospital Recommendation Engine (MCDM AI Ranking)
- **Multi-Criteria Decision Matrix (MCDM)**: Ranks destination hospitals based on real-time transit time, specialized trauma level (Level 1/2), ICU bed vacancy, and specialized facilities (24/7 Cath Lab, Comprehensive Stroke Center, Burn Unit, Pediatric ER).
- **Radar Comparison Visualizer**: SVG multi-metric polygon comparison across transit speed, trauma readiness, ICU beds, specialist coverage, and intake queue efficiency.
- **One-Click "Route to Hospital"**: Instantly locks the new destination, updates the ambulance navigation trajectory, and primes the receiving ER.

### 4. AI Patient Risk Indicator (Scikit-Learn ML Triage)
- **ML Triage Classifier**: Pre-trained `RandomForestClassifier` scoring clinical acuity from 0 to 100 with AHA/MEWS clinical feature attribution.
- **Interactive Vitals & Symptoms**: Real-time form for Heart Rate, Blood Pressure (Sys/Dia), SpO₂ %, Respiration Rate, Temperature °C, GCS Coma score, Age, and multi-tag symptoms.
- **Explainable Risk Attribution**: SHAP-style breakdown of physiological drivers (e.g. *SpO₂ < 90% contributes +34% to risk*).
- **Persistent Disclaimer**: *"Preliminary decision support only — not a diagnosis. AmbuRoute CDS Protocol."*

### 5. Pre-Arrival Hospital ER Handoff Terminal
- **Trauma Bay Receiver View**: Dedicated hospital-side view for receiving emergency departments.
- **Live Canvas ECG Waveform**: Animated continuous Lead II rhythm strip reflecting patient heart rate and ischemic ST elevation.
- **Trauma Bay Preparation Checklist**: Interactive pre-arrival protocol checklist (e.g. STEMI Cath Lab activated, Massive Transfusion Protocol primed, CT clear).

---

## 🛠 Tech Stack

- **Backend**: Python 3.14 + FastAPI + WebSockets + Pydantic v2 + Scikit-Learn + NumPy + Pandas
- **Frontend**: React 19 + Vite + Tailwind CSS + Lucide Icons + Leaflet / React-Leaflet + HTML5 Canvas
- **Telemetry Protocol**: Bidirectional WebSockets (`/ws/telemetry`) + REST API (`/api/*`)
- **Sound FX**: Web Audio API real-time synthesizers (zero external audio file dependencies)

---

## 🏃 Running the Application

### 1. Start the Backend API Server
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
*Backend API will run at `http://127.0.0.1:8000` (API docs at `http://127.0.0.1:8000/docs`).*

### 2. Start the Frontend Dev Server
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run at `http://localhost:5173`.*

### 3. Run Backend Automated Tests
```bash
cd backend
python -m pytest tests/
```
