"""
AI Clinical Risk Assessment Router for AmbuRoute (Scikit-Learn ML Powered)
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from app.models.schemas import PatientVitals, RiskAssessmentResponse
from app.ml.triage_model import triage_engine
from app.ml.symptoms_db import AVAILABLE_SYMPTOM_LIST, CLINICAL_SYMPTOMS

router = APIRouter(prefix="/api/ml", tags=["AI Triage & Risk Assessment"])


@router.get("/symptoms")
def get_symptoms_list() -> List[Dict[str, Any]]:
    """Returns available structured symptom list with clinical descriptions."""
    return [
        {
            "name": name,
            "category": data["category"],
            "critical_flag": data["critical_flag"],
            "description": data["description"]
        }
        for name, data in CLINICAL_SYMPTOMS.items()
    ]


@router.post("/risk-assessment", response_model=RiskAssessmentResponse)
def assess_patient_risk(vitals: PatientVitals) -> RiskAssessmentResponse:
    """
    Evaluates patient vital signs and symptoms using the Scikit-Learn Triage Model.
    Returns composite risk index (0-100), classification, explainable feature importance, and rationale.
    """
    return triage_engine.assess_patient(vitals)
