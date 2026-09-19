"""
Live Simulation and Telemetry Engine for AmbuRoute
Handles vehicle physics, waypoints interpolation, V2I traffic signals, dynamic rerouting, and WebSocket distribution.
"""
import asyncio
import time
import math
from typing import Dict, List, Any, Optional, Set
from fastapi import WebSocket
from app.models.schemas import Coordinates, Ambulance, Incident, IntersectionSignal, PatientVitals
from app.services.hospital_service import calculate_haversine_distance, hospital_service
from app.ml.triage_model import triage_engine

# High-resolution downtown route waypoints
BASE_SCENARIOS = {
    "scenario_stemi": {
        "id": "inc-stemi-901",
        "title": "Code-1 Acute STEMI / Massive Anterolateral MI",
        "category": "Cardiovascular Emergency",
        "severity": "critical",
        "coordinates": {"lat": 37.7925, "lng": -122.3980},
        "address": "555 California St, Financial Plaza",
        "vitals": {
            "heart_rate": 134,
            "systolic_bp": 82,
            "diastolic_bp": 54,
            "spo2": 88,
            "respiratory_rate": 28,
            "temperature_c": 36.8,
            "gcs_score": 14,
            "age": 58,
            "symptoms": [
                "Chest Pain (Crushing/Pressure)",
                "Radiating Left Arm / Jaw Pain",
                "Profuse Diaphoresis (Cold Sweats)",
                "Severe Dyspnea (Shortness of Breath)"
            ],
            "notes": "Patient collapsed in boardroom. 12-Lead shows ST-elevation in V1-V4. Pale, clammy, hypotensive."
        },
        "ambulance": {
            "id": "amb-medic-12",
            "callsign": "MEDIC-12 (ALS)",
            "type": "ALS",
            "crew": ["Capt. J. Miller (Paramedic)", "R. Vance (EMT-P)"]
        },
        "target_hospital_id": "hosp-apex-heart",
        # Route points from dispatch origin to patient, then to hospital
        "waypoints": [
            {"lat": 37.7970, "lng": -122.4040},
            {"lat": 37.7950, "lng": -122.4010},
            {"lat": 37.7925, "lng": -122.3980},  # Patient location
            {"lat": 37.7910, "lng": -122.4005},
            {"lat": 37.7885, "lng": -122.4040},
            {"lat": 37.7850, "lng": -122.4085},
            {"lat": 37.7820, "lng": -122.4130},
            {"lat": 37.7798, "lng": -122.4184}   # Hospital
        ],
        "signals": [
            {"id": "sig-1", "name": "Montgomery & Pine St", "lat": 37.7915, "lng": -122.4000, "seq": 1},
            {"id": "sig-2", "name": "Kearny & Bush St", "lat": 37.7895, "lng": -122.4030, "seq": 2},
            {"id": "sig-3", "name": "Market & 4th St Junction", "lat": 37.7865, "lng": -122.4065, "seq": 3},
            {"id": "sig-4", "name": "Mission & 6th Corridor", "lat": 37.7835, "lng": -122.4110, "seq": 4},
            {"id": "sig-5", "name": "Howard & 8th St", "lat": 37.7810, "lng": -122.4155, "seq": 5},
            {"id": "sig-6", "name": "Apex Trauma Gate / ER Bay", "lat": 37.7800, "lng": -122.4178, "seq": 6}
        ]
    },
    "scenario_trauma": {
        "id": "inc-trauma-404",
        "title": "High-Speed Multi-Vehicle Collision / Poly-Trauma",
        "category": "Major Trauma",
        "severity": "critical",
        "coordinates": {"lat": 37.7840, "lng": -122.3950},
        "address": "I-80 Westbound On-ramp at 4th St",
        "vitals": {
            "heart_rate": 142,
            "systolic_bp": 76,
            "diastolic_bp": 48,
            "spo2": 91,
            "respiratory_rate": 32,
            "temperature_c": 36.2,
            "gcs_score": 7,
            "age": 34,
            "symptoms": [
                "Severe Arterial Hemorrhage",
                "High-Speed MVA / Blunt Poly-Trauma",
                "Altered Mental Status / GCS < 13",
                "Cyanosis / Gray Extremities"
            ],
            "notes": "Driver extricated after rollover. Severe thoracic blunt trauma, unstable pelvis, arterial bleed controlled with CAT tourniquet."
        },
        "ambulance": {
            "id": "amb-rescue-04",
            "callsign": "RESCUE-04 (MICU)",
            "type": "MICU",
            "crew": ["Lt. D. Ross (Flight Paramedic)", "K. Chen (Critical Care Nurse)"]
        },
        "target_hospital_id": "hosp-metro-trauma",
        "waypoints": [
            {"lat": 37.7890, "lng": -122.3900},
            {"lat": 37.7865, "lng": -122.3925},
            {"lat": 37.7840, "lng": -122.3950},  # Scene
            {"lat": 37.7855, "lng": -122.3990},
            {"lat": 37.7870, "lng": -122.4030},
            {"lat": 37.7885, "lng": -122.4072}   # Metro Trauma
        ],
        "signals": [
            {"id": "sig-t1", "name": "3rd & Harrison St", "lat": 37.7850, "lng": -122.3975, "seq": 1},
            {"id": "sig-t2", "name": "4th & Folsom St", "lat": 37.7862, "lng": -122.4010, "seq": 2},
            {"id": "sig-t3", "name": "5th & Howard Expressway", "lat": 37.7878, "lng": -122.4050, "seq": 3},
            {"id": "sig-t4", "name": "Metro Bay Emergency Gate", "lat": 37.7884, "lng": -122.4068, "seq": 4}
        ]
    },
    "scenario_pediatric": {
        "id": "inc-ped-202",
        "title": "Pediatric Acute Status Asthmaticus / Hypoxemia",
        "category": "Pediatric Emergency",
        "severity": "critical",
        "coordinates": {"lat": 37.7720, "lng": -122.4110},
        "address": "240 Mission Playground Park",
        "vitals": {
            "heart_rate": 168,
            "systolic_bp": 94,
            "diastolic_bp": 58,
            "spo2": 84,
            "respiratory_rate": 46,
            "temperature_c": 38.4,
            "gcs_score": 12,
            "age": 7,
            "symptoms": [
                "Severe Dyspnea (Shortness of Breath)",
                "Stridor / Airway Obstruction",
                "Cyanosis / Gray Extremities",
                "Altered Mental Status / GCS < 13"
            ],
            "notes": "7yo severe asthma exacerbation unresponsive to albuterol inhaler. Marked intercostal retractions, silent chest."
        },
        "ambulance": {
            "id": "amb-peds-09",
            "callsign": "PEDS-09 (ALS)",
            "type": "ALS",
            "crew": ["Sgt. E. Gomez (Peds Paramedic)", "A. Martinez (EMT-P)"]
        },
        "target_hospital_id": "hosp-childrens-pacific",
        "waypoints": [
            {"lat": 37.7780, "lng": -122.4150},
            {"lat": 37.7750, "lng": -122.4130},
            {"lat": 37.7720, "lng": -122.4110},  # Scene
            {"lat": 37.7690, "lng": -122.4150},
            {"lat": 37.7660, "lng": -122.4200},
            {"lat": 37.7635, "lng": -122.4240}   # Children's Hospital
        ],
        "signals": [
            {"id": "sig-p1", "name": "16th & Valencia St", "lat": 37.7705, "lng": -122.4130, "seq": 1},
            {"id": "sig-p2", "name": "18th & Guerrero Blvd", "lat": 37.7675, "lng": -122.4175, "seq": 2},
            {"id": "sig-p3", "name": "20th & Dolores Gate", "lat": 37.7645, "lng": -122.4220, "seq": 3}
        ]
    }
}


class SimulationEngine:
    def __init__(self):
        self.active_scenario_key = "scenario_stemi"
        self.is_running = True
        self.sim_speed = 1.0  # 1x, 2x, 5x
        self.progress = 0.0  # 0.0 to 1.0 along the route
        self.traffic_jam_injected = False
        self.active_incident: Optional[Incident] = None
        self.active_ambulance: Optional[Ambulance] = None
        self.active_signals: List[IntersectionSignal] = []
        self.active_route: List[Coordinates] = []
        self.connected_websockets: Set[WebSocket] = set()
        self._background_task: Optional[asyncio.Task] = None

        self._load_scenario(self.active_scenario_key)

    def _load_scenario(self, key: str):
        if key not in BASE_SCENARIOS:
            key = "scenario_stemi"
        self.active_scenario_key = key
        data = BASE_SCENARIOS[key]

        vitals = PatientVitals(**data["vitals"])
        self.active_route = [Coordinates(**pt) for pt in data["waypoints"]]

        self.active_signals = [
            IntersectionSignal(
                id=s["id"],
                name=s["name"],
                coordinates=Coordinates(lat=s["lat"], lng=s["lng"]),
                sequence_order=s["seq"],
                state="red",
                prep_countdown_sec=45,
                distance_to_ambulance_m=1200.0,
                preemption_active=False
            )
            for s in data["signals"]
        ]

        amb_data = data["ambulance"]
        self.active_ambulance = Ambulance(
            id=amb_data["id"],
            callsign=amb_data["callsign"],
            type=amb_data["type"],
            status="en_route",
            coordinates=self.active_route[0],
            heading=215.0,
            speed_kmh=52.0,
            target_hospital_id=data["target_hospital_id"],
            active_incident_id=data["id"],
            crew=amb_data["crew"],
            eta_seconds=240,
            distance_remaining_km=2.8,
            siren_active=True
        )

        self.active_incident = Incident(
            id=data["id"],
            title=data["title"],
            category=data["category"],
            severity=data["severity"],
            coordinates=Coordinates(**data["coordinates"]),
            address=data["address"],
            timestamp="Live Response (T+00:02:14)",
            patient_vitals=vitals,
            assigned_ambulance_id=amb_data["id"],
            target_hospital_id=data["target_hospital_id"],
            status="en_route",
            route_coords=self.active_route,
            signals=self.active_signals,
            traffic_jam_injected=False
        )
        self.progress = 0.0
        self.traffic_jam_injected = False

    def set_scenario(self, key: str):
        self._load_scenario(key)

    def set_simulation_state(self, running: bool, speed: float = 1.0):
        self.is_running = running
        self.sim_speed = max(0.2, min(10.0, speed))

    def reset_simulation(self):
        self.progress = 0.0
        self.traffic_jam_injected = False
        self._load_scenario(self.active_scenario_key)

    def toggle_traffic_jam(self) -> bool:
        """Injects or clears dynamic traffic blockage along the main corridor."""
        self.traffic_jam_injected = not self.traffic_jam_injected
        data = BASE_SCENARIOS[self.active_scenario_key]
        if self.traffic_jam_injected:
            # Generate alternate arterial bypass route
            orig_pts = data["waypoints"]
            # Create dynamic bypass detour around congested segment
            detour_pts = []
            for i, p in enumerate(orig_pts):
                if 2 <= i <= 5:
                    # Offset latitude / longitude slightly for detour
                    detour_pts.append({"lat": p["lat"] + 0.0035, "lng": p["lng"] - 0.0028})
                else:
                    detour_pts.append(p)
            self.active_route = [Coordinates(**pt) for pt in detour_pts]
            if self.active_incident:
                self.active_incident.traffic_jam_injected = True
        else:
            self.active_route = [Coordinates(**pt) for pt in data["waypoints"]]
            if self.active_incident:
                self.active_incident.traffic_jam_injected = False
        return self.traffic_jam_injected

    def set_target_hospital(self, hospital_id: str):
        """Allows one-click dynamic rerouting to a newly chosen hospital."""
        hosp = hospital_service.get_hospital_by_id(hospital_id)
        if not hosp:
            return
        if self.active_ambulance:
            self.active_ambulance.target_hospital_id = hospital_id
        if self.active_incident:
            self.active_incident.target_hospital_id = hospital_id

        # Update end coordinate of route
        if len(self.active_route) > 0:
            new_end = Coordinates(lat=hosp["coordinates"]["lat"], lng=hosp["coordinates"]["lng"])
            self.active_route[-1] = new_end

    async def register_websocket(self, websocket: WebSocket):
        await websocket.accept()
        self.connected_websockets.add(websocket)
        # Send initial state immediately
        snapshot = self.get_telemetry_snapshot()
        await websocket.send_json(snapshot)

    def unregister_websocket(self, websocket: WebSocket):
        self.connected_websockets.discard(websocket)

    def _interpolate_position(self, progress: float) -> TupleCoordinatesHeading:
        """Interpolates ambulance position and heading along the route waypoints."""
        if len(self.active_route) < 2:
            return self.active_route[0], 0.0

        n_segments = len(self.active_route) - 1
        scaled_p = progress * n_segments
        seg_idx = min(int(scaled_p), n_segments - 1)
        seg_t = scaled_p - seg_idx

        p1 = self.active_route[seg_idx]
        p2 = self.active_route[seg_idx + 1]

        cur_lat = p1.lat + (p2.lat - p1.lat) * seg_t
        cur_lng = p1.lng + (p2.lng - p1.lng) * seg_t

        # Calculate heading angle
        dlat = p2.lat - p1.lat
        dlng = p2.lng - p1.lng
        heading_rad = math.atan2(dlng, dlat)
        heading_deg = (math.degrees(heading_rad) + 360.0) % 360.0

        return Coordinates(lat=cur_lat, lng=cur_lng), heading_deg

    def _calculate_total_remaining_distance(self, cur_coord: Coordinates, seg_idx: int) -> float:
        """Calculates distance from current point along remaining waypoints."""
        total_km = 0.0
        if len(self.active_route) < 2:
            return 0.1

        n_segments = len(self.active_route) - 1
        seg_idx = min(seg_idx, n_segments - 1)

        # Distance to end of current segment
        total_km += calculate_haversine_distance(cur_coord, self.active_route[seg_idx + 1])
        # Remaining whole segments
        for i in range(seg_idx + 1, n_segments):
            total_km += calculate_haversine_distance(self.active_route[i], self.active_route[i + 1])

        return round(total_km * 1.35, 2)  # Circuity adjusted

    def update_physics_step(self, dt: float):
        """Advances physics by dt seconds according to simulation speed."""
        if not self.is_running or len(self.active_route) < 2:
            return

        # Advance route progress
        # Assume full route is ~3.2km, speed ~48km/h => takes ~240s normal
        base_rate = (1.0 / 180.0) * self.sim_speed
        if self.traffic_jam_injected:
            # Slower in congested traffic unless green wave clears
            base_rate *= 0.85

        self.progress += base_rate * dt
        if self.progress >= 1.0:
            self.progress = 1.0
            if self.active_ambulance:
                self.active_ambulance.status = "arrived"
            if self.active_incident:
                self.active_incident.status = "arrived"
        else:
            if self.progress < 0.3:
                status = "en_route"
            elif self.progress < 0.5:
                status = "on_scene"
            else:
                status = "transporting"
            if self.active_ambulance:
                self.active_ambulance.status = status
            if self.active_incident:
                self.active_incident.status = status

        cur_coord, heading = self._interpolate_position(self.progress)
        n_segments = len(self.active_route) - 1
        seg_idx = min(int(self.progress * n_segments), n_segments - 1)
        dist_rem_km = self._calculate_total_remaining_distance(cur_coord, seg_idx)

        # Speed calculation (dynamic fluctuations)
        cur_speed = 54.0 + math.sin(time.time() * 2.5) * 6.0
        if self.traffic_jam_injected and 0.3 < self.progress < 0.7:
            cur_speed = max(24.0, cur_speed - 18.0)
        if self.progress >= 1.0:
            cur_speed = 0.0

        eta_sec = int((dist_rem_km / max(10.0, cur_speed)) * 3600)

        if self.active_ambulance:
            self.active_ambulance.coordinates = cur_coord
            self.active_ambulance.heading = round(heading, 1)
            self.active_ambulance.speed_kmh = round(cur_speed, 1)
            self.active_ambulance.distance_remaining_km = dist_rem_km
            self.active_ambulance.eta_seconds = eta_sec

        # Update V2I Traffic Signals
        self._update_signals(cur_coord, cur_speed)

    def _update_signals(self, amb_coord: Coordinates, speed_kmh: float):
        """Updates intersection preemption states and countdown timers."""
        for sig in self.active_signals:
            dist_km = calculate_haversine_distance(amb_coord, sig.coordinates)
            dist_m = dist_km * 1000.0
            sig.distance_to_ambulance_m = round(dist_m, 1)

            # ETA to intersection
            speed_mps = max(5.0, (speed_kmh * 1000.0) / 3600.0)
            time_to_reach_sec = int(dist_m / speed_mps)
            sig.prep_countdown_sec = max(0, time_to_reach_sec)

            # State transitions:
            # > 700m: normal red / cyclical
            # 250m - 700m: amber_prep (IoT preemption handshake)
            # 15m - 250m: green_wave (priority clear corridor)
            # < 15m or passed: cleared
            if dist_m > 750:
                sig.state = "red"
                sig.preemption_active = False
            elif dist_m > 260:
                sig.state = "amber_prep"
                sig.preemption_active = True
            elif dist_m > 20:
                sig.state = "green_wave"
                sig.preemption_active = True
            else:
                sig.state = "cleared"
                sig.preemption_active = False

    def get_telemetry_snapshot(self) -> Dict[str, Any]:
        """Returns unified state payload for UI consumption."""
        vitals = self.active_incident.patient_vitals if self.active_incident else PatientVitals()
        triage_assessment = triage_engine.assess_patient(vitals)

        ranked_hospitals = hospital_service.rank_hospitals_for_patient(
            patient_coords=self.active_ambulance.coordinates if self.active_ambulance else Coordinates(lat=37.78, lng=-122.41),
            vitals=vitals,
            severity=self.active_incident.severity if self.active_incident else "critical"
        )

        return {
            "timestamp": time.time(),
            "scenario_key": self.active_scenario_key,
            "is_running": self.is_running,
            "sim_speed": self.sim_speed,
            "progress": round(self.progress, 4),
            "traffic_jam_injected": self.traffic_jam_injected,
            "ambulance": self.active_ambulance.model_dump() if self.active_ambulance else None,
            "incident": self.active_incident.model_dump() if self.active_incident else None,
            "signals": [s.model_dump() for s in self.active_signals],
            "route_coords": [c.model_dump() for c in self.active_route],
            "triage_assessment": triage_assessment.model_dump(),
            "ranked_hospitals": [h.model_dump() for h in ranked_hospitals]
        }

    async def run_simulation_loop(self):
        """Continuous async loop broadcasting live ticks to WebSockets."""
        last_time = time.time()
        while True:
            now = time.time()
            dt = min(1.0, now - last_time)
            last_time = now

            self.update_physics_step(dt)

            if self.connected_websockets:
                snapshot = self.get_telemetry_snapshot()
                disconnected = set()
                for ws in self.connected_websockets:
                    try:
                        await ws.send_json(snapshot)
                    except Exception:
                        disconnected.add(ws)
                for ws in disconnected:
                    self.connected_websockets.discard(ws)

            await asyncio.sleep(0.4)


TupleCoordinatesHeading = Any  # helper type alias
simulation_engine = SimulationEngine()
