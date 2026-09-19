"""
Integration tests for AmbuRoute REST API
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["platform"] == "AmbuRoute AI Emergency Mission Control"

    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"


def test_hospitals_and_recommendation():
    hosp_res = client.get("/api/hospitals")
    assert hosp_res.status_code == 200
    hospitals = hosp_res.json()
    assert len(hospitals) >= 3

    rec_payload = {
        "patient_coords": {"lat": 37.7925, "lng": -122.3980},
        "vitals": {
            "heart_rate": 130,
            "systolic_bp": 85,
            "diastolic_bp": 55,
            "spo2": 89,
            "respiratory_rate": 26,
            "temperature_c": 37.0,
            "gcs_score": 15,
            "age": 60,
            "symptoms": ["Chest Pain (Crushing/Pressure)"]
        },
        "severity": "critical"
    }
    rec_res = client.post("/api/hospitals/recommend", json=rec_payload)
    assert rec_res.status_code == 200
    ranked = rec_res.json()
    assert len(ranked) > 0
    assert "composite_score" in ranked[0]
    assert "radar_metrics" in ranked[0]


def test_signals_corridor():
    sig_res = client.get("/api/signals/corridor")
    assert sig_res.status_code == 200
    signals = sig_res.json()
    assert len(signals) >= 3


def test_handoff_summary():
    handoff_res = client.get("/api/handoff/summary")
    assert handoff_res.status_code == 200
    data = handoff_res.json()
    assert "receiving_hospital" in data
    assert "prep_checklist" in data
