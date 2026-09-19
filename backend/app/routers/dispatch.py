"""
Dispatch and Fleet Telemetry Router for AmbuRoute
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
from app.services.simulation_engine import simulation_engine, BASE_SCENARIOS
from app.models.schemas import Incident, Ambulance, PatientVitals

router = APIRouter(prefix="/api", tags=["Dispatch & Telemetry"])


class SimControlRequest(BaseModel):
    action: str  # 'play', 'pause', 'set_speed', 'set_scenario', 'toggle_traffic', 'reset'
    speed: float = 1.0
    scenario_key: str = "scenario_stemi"


@router.get("/telemetry/snapshot")
def get_telemetry_snapshot() -> Dict[str, Any]:
    return simulation_engine.get_telemetry_snapshot()


@router.get("/incidents")
def list_incidents() -> List[Dict[str, Any]]:
    snapshot = simulation_engine.get_telemetry_snapshot()
    # Return available scenarios as active incident cards
    incidents = []
    for key, data in BASE_SCENARIOS.items():
        is_active = (key == simulation_engine.active_scenario_key)
        incidents.append({
            "scenario_key": key,
            "id": data["id"],
            "title": data["title"],
            "category": data["category"],
            "severity": data["severity"],
            "address": data["address"],
            "coordinates": data["coordinates"],
            "is_active": is_active,
            "status": snapshot["incident"]["status"] if is_active else "standby",
            "assigned_ambulance": data["ambulance"]["callsign"]
        })
    return incidents


@router.get("/ambulances")
def list_ambulances() -> List[Dict[str, Any]]:
    snapshot = simulation_engine.get_telemetry_snapshot()
    amb = snapshot["ambulance"]
    fleet = [
        amb,
        {
            "id": "amb-reserve-01",
            "callsign": "RESCUE-01 (ALS)",
            "type": "ALS",
            "status": "available",
            "coordinates": {"lat": 37.7800, "lng": -122.4200},
            "heading": 90.0,
            "speed_kmh": 0.0,
            "target_hospital_id": None,
            "active_incident_id": None,
            "crew": ["Paramedic T. Stark", "EMT P. Parker"],
            "eta_seconds": 0,
            "distance_remaining_km": 0.0,
            "siren_active": False
        },
        {
            "id": "amb-medic-08",
            "callsign": "MEDIC-08 (BLS)",
            "type": "BLS",
            "status": "available",
            "coordinates": {"lat": 37.7950, "lng": -122.4100},
            "heading": 180.0,
            "speed_kmh": 0.0,
            "target_hospital_id": None,
            "active_incident_id": None,
            "crew": ["EMT S. Rogers", "EMT B. Barnes"],
            "eta_seconds": 0,
            "distance_remaining_km": 0.0,
            "siren_active": False
        }
    ]
    return fleet


@router.post("/simulation/control")
def control_simulation(payload: SimControlRequest):
    action = payload.action.lower()
    if action == "play":
        simulation_engine.set_simulation_state(True, payload.speed)
    elif action == "pause":
        simulation_engine.set_simulation_state(False, payload.speed)
    elif action == "set_speed":
        simulation_engine.set_simulation_state(simulation_engine.is_running, payload.speed)
    elif action == "set_scenario":
        simulation_engine.set_scenario(payload.scenario_key)
    elif action == "toggle_traffic":
        simulation_engine.toggle_traffic_jam()
    elif action == "reset":
        simulation_engine.reset_simulation()
    else:
        raise HTTPException(status_code=400, detail=f"Unknown action '{action}'")

    return simulation_engine.get_telemetry_snapshot()


@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await simulation_engine.register_websocket(websocket)
    try:
        while True:
            # Handle incoming client messages (e.g. ping, speed adjustment)
            data = await websocket.receive_json()
            if "action" in data:
                action = data["action"]
                if action == "set_scenario" and "scenario_key" in data:
                    simulation_engine.set_scenario(data["scenario_key"])
                elif action == "toggle_traffic":
                    simulation_engine.toggle_traffic_jam()
                elif action == "set_speed" and "speed" in data:
                    simulation_engine.set_simulation_state(simulation_engine.is_running, float(data["speed"]))
                elif action == "play":
                    simulation_engine.set_simulation_state(True)
                elif action == "pause":
                    simulation_engine.set_simulation_state(False)
    except WebSocketDisconnect:
        simulation_engine.unregister_websocket(websocket)
    except Exception:
        simulation_engine.unregister_websocket(websocket)
