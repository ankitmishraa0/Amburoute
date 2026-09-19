"""
Hospital Recommendation and Selection Router for AmbuRoute
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.schemas import (
    Hospital,
    HospitalRecommendationRequest,
    Coordinates,
    PatientVitals
)
from app.services.hospital_service import hospital_service
from app.services.simulation_engine import simulation_engine

router = APIRouter(prefix="/api/hospitals", tags=["Hospital Recommendation Engine"])


@router.get("", response_model=List[Dict[str, Any]])
def list_hospitals():
    """Returns static directory of participating regional hospitals."""
    return hospital_service.get_all_hospitals()


@router.post("/recommend", response_model=List[Hospital])
def recommend_hospitals(req: HospitalRecommendationRequest):
    """
    Ranks nearby hospitals using the Multi-Criteria Decision Matrix (MCDM)
    based on transit time, trauma/specialty capabilities, ICU bed vacancy, and ER wait time.
    """
    return hospital_service.rank_hospitals_for_patient(
        patient_coords=req.patient_coords,
        vitals=req.vitals,
        severity=req.severity,
        primary_condition=req.primary_condition
    )


@router.post("/route-to/{hospital_id}")
def set_active_hospital_destination(hospital_id: str):
    """Dynamically locks and reroutes the active ambulance to the selected hospital."""
    hosp = hospital_service.get_hospital_by_id(hospital_id)
    if not hosp:
        raise HTTPException(status_code=404, detail=f"Hospital '{hospital_id}' not found")

    simulation_engine.set_target_hospital(hospital_id)
    return {
        "status": "success",
        "message": f"Route locked to {hosp['name']}",
        "target_hospital": hosp,
        "telemetry": simulation_engine.get_telemetry_snapshot()
    }
