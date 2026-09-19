"""
Pre-Arrival Hospital ER Handoff Router for AmbuRoute
"""
from fastapi import APIRouter
from typing import Dict, Any, List
from app.services.simulation_engine import simulation_engine
from app.services.hospital_service import hospital_service
from app.ml.triage_model import triage_engine

router = APIRouter(prefix="/api/handoff", tags=["Pre-Arrival Hospital Handoff"])


@router.get("/summary")
def get_handoff_summary() -> Dict[str, Any]:
    """Generates the hospital-side trauma bay receiver snapshot."""
    snapshot = simulation_engine.get_telemetry_snapshot()
    inc = snapshot["incident"]
    amb = snapshot["ambulance"]
    triage = snapshot["triage_assessment"]
    target_hosp_id = amb["target_hospital_id"] if amb else "hosp-apex-heart"
    hosp_info = hospital_service.get_hospital_by_id(target_hosp_id)

    # Dynamic pre-arrival prep checklist based on patient condition & category
    checklist = [
        {"id": "c1", "label": "Assign Primary Trauma / Resus Bay 1", "done": True, "required": True},
        {"id": "c2", "label": "Alert On-Call Attending Emergency Physician", "done": True, "required": True},
    ]

    category = triage.get("category", "")
    if "Cardiovascular" in category:
        checklist.extend([
            {"id": "c3", "label": "Activate Rapid STEMI Interventional Cath Lab Team", "done": True, "required": True},
            {"id": "c4", "label": "Prep Heparin / IIb/IIIa Antagonist Infusion", "done": False, "required": False},
            {"id": "c5", "label": "Transvenous Pacing Tray at Bedside", "done": False, "required": False}
        ])
    elif "Trauma" in category:
        checklist.extend([
            {"id": "c3", "label": "Activate Massive Transfusion Protocol (MTP - 4u PRBC, 4u FFP)", "done": True, "required": True},
            {"id": "c4", "label": "Reserve Emergency OR Suite 3 for Exploratory Laparotomy", "done": True, "required": True},
            {"id": "c5", "label": "Rapid Infuser (Belmont) Primed with Warm Saline", "done": False, "required": False}
        ])
    elif "Neurological" in category:
        checklist.extend([
            {"id": "c3", "label": "Clear CT Scanner for Immediate Non-Contrast Head CT / CTA", "done": True, "required": True},
            {"id": "c4", "label": "Neuro-Interventional Radiologist on Standby for Thrombectomy", "done": True, "required": True},
            {"id": "c5", "label": "Mix Tenecteplase / Alteplase Dosing by Weight", "done": False, "required": False}
        ])
    else:
        checklist.extend([
            {"id": "c3", "label": "Respiratory Therapist on Standby with Video Laryngoscope", "done": True, "required": True},
            {"id": "c4", "label": "Prepare Continuous Capnography & BiPAP Circuit", "done": False, "required": False}
        ])

    return {
        "status": "alert_active",
        "receiving_hospital": hosp_info,
        "assigned_ambulance": amb,
        "incident": inc,
        "triage_assessment": triage,
        "eta_minutes": round((amb["eta_seconds"] / 60.0), 1) if amb else 4.2,
        "eta_seconds": amb["eta_seconds"] if amb else 252,
        "distance_km": amb["distance_remaining_km"] if amb else 2.4,
        "current_speed_kmh": amb["speed_kmh"] if amb else 54.0,
        "prep_checklist": checklist,
        "telemetry_stream": {
            "cardiac_rhythm": "Sinus Tachycardia with ST Elevation" if "Cardiovascular" in category else "Sinus Rhythm",
            "arterial_line_ready": True,
            "iv_access": "Dual 18-gauge Left Antecubital",
            "airway_status": "NRB Mask 15 L/min (SpO2 88%)"
        }
    }
