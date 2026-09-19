"""
Unit tests for AmbuRoute Scikit-Learn Triage ML Model
"""
import pytest
from app.models.schemas import PatientVitals
from app.ml.triage_model import triage_engine


def test_triage_critical_cardiac_case():
    vitals = PatientVitals(
        heart_rate=138,
        systolic_bp=80,
        diastolic_bp=50,
        spo2=86,
        respiratory_rate=28,
        temperature_c=36.7,
        gcs_score=14,
        age=62,
        symptoms=["Chest Pain (Crushing/Pressure)", "Radiating Left Arm / Jaw Pain", "Profuse Diaphoresis (Cold Sweats)"]
    )
    result = triage_engine.assess_patient(vitals)
    assert result.risk_level in ["CRITICAL", "HIGH"]
    assert result.risk_score >= 60
    assert len(result.key_risk_factors) > 0
    assert result.triage_color in ["#FF2A54", "#FF8C00"]
    assert "Cardiovascular" in result.category or "ACS" in result.ai_clinical_rationale


def test_triage_stable_case():
    vitals = PatientVitals(
        heart_rate=72,
        systolic_bp=120,
        diastolic_bp=80,
        spo2=99,
        respiratory_rate=15,
        temperature_c=37.0,
        gcs_score=15,
        age=30,
        symptoms=["Minor Cutaneous Laceration"]
    )
    result = triage_engine.assess_patient(vitals)
    assert result.risk_level in ["LOW", "MODERATE"]
    assert result.risk_score < 45
