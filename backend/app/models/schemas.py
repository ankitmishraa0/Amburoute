"""
Pydantic Schemas for AmbuRoute Emergency Response Platform
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Coordinates(BaseModel):
    lat: float
    lng: float


class PatientVitals(BaseModel):
    heart_rate: int = Field(default=88, ge=20, le=260, description="Heart rate in bpm")
    systolic_bp: int = Field(default=120, ge=40, le=260, description="Systolic blood pressure mmHg")
    diastolic_bp: int = Field(default=80, ge=20, le=160, description="Diastolic blood pressure mmHg")
    spo2: int = Field(default=98, ge=40, le=100, description="SpO2 oxygen saturation percentage")
    respiratory_rate: int = Field(default=16, ge=4, le=60, description="Breaths per minute")
    temperature_c: float = Field(default=37.0, ge=30.0, le=44.0, description="Core body temperature in Celsius")
    gcs_score: int = Field(default=15, ge=3, le=15, description="Glasgow Coma Scale (3-15)")
    age: int = Field(default=45, ge=0, le=120, description="Patient age in years")
    symptoms: List[str] = Field(default_factory=list, description="Clinical symptoms present")
    notes: Optional[str] = Field(default="", description="Paramedic field notes")


class RiskFactorImpact(BaseModel):
    feature: str
    value: str
    impact_pct: float
    description: str
    severity: str  # 'critical', 'warning', 'normal'


class RiskAssessmentResponse(BaseModel):
    risk_level: str  # 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'
    risk_score: int  # 0 to 100
    confidence: float  # e.g. 0.94
    category: str  # e.g. 'Cardiovascular Emergency', 'Trauma', 'Respiratory', 'General'
    key_risk_factors: List[RiskFactorImpact]
    ai_clinical_rationale: str
    recommended_protocols: List[str]
    triage_color: str  # '#FF2A54', '#FFAA00', '#00E5FF', '#10B981'
    disclaimer: str = "Preliminary decision support only — not a diagnosis. AmbuRoute CDS Protocol."


class IntersectionSignal(BaseModel):
    id: str
    name: str
    coordinates: Coordinates
    sequence_order: int
    state: str  # 'red', 'amber_prep', 'green_wave', 'cleared'
    prep_countdown_sec: int
    distance_to_ambulance_m: float
    preemption_active: bool
    iot_health: str = "connected"
    latency_ms: int = 14


class HospitalRadarMetrics(BaseModel):
    travel_time_score: float  # 0-100 (higher is better / faster)
    trauma_readiness: float   # 0-100
    bed_availability: float   # 0-100
    specialist_coverage: float # 0-100
    queue_efficiency: float   # 0-100


class Hospital(BaseModel):
    id: str
    name: str
    short_name: str
    coordinates: Coordinates
    address: str
    trauma_level: str  # 'Level 1 Trauma', 'Level 2 Trauma', 'Community ER'
    icu_beds_total: int
    icu_beds_available: int
    cath_lab_ready: bool
    stroke_center: bool
    burn_unit: bool
    pediatric_er: bool
    avg_er_wait_min: int
    travel_distance_km: float
    travel_time_min: float
    composite_score: int  # 0-100 match score
    match_reasons: List[str]
    radar_metrics: HospitalRadarMetrics
    contact_phone: str


class HospitalRecommendationRequest(BaseModel):
    patient_coords: Coordinates
    vitals: PatientVitals
    severity: str = "critical"
    primary_condition: Optional[str] = None


class Ambulance(BaseModel):
    id: str
    callsign: str
    type: str  # 'ALS' (Advanced Life Support) / 'BLS' / 'MICU'
    status: str  # 'available', 'dispatched', 'en_route_scene', 'on_scene', 'transporting', 'arrived'
    coordinates: Coordinates
    heading: float
    speed_kmh: float
    target_hospital_id: Optional[str] = None
    active_incident_id: Optional[str] = None
    crew: List[str] = []
    eta_seconds: int = 0
    distance_remaining_km: float = 0.0
    siren_active: bool = True


class Incident(BaseModel):
    id: str
    title: str
    category: str
    severity: str  # 'critical', 'high', 'moderate', 'low'
    coordinates: Coordinates
    address: str
    timestamp: str
    patient_vitals: PatientVitals
    assigned_ambulance_id: Optional[str]
    target_hospital_id: Optional[str]
    status: str  # 'dispatched', 'en_route', 'on_scene', 'transporting', 'arrived'
    route_coords: List[Coordinates] = []
    signals: List[IntersectionSignal] = []
    traffic_jam_injected: bool = False


class ERHandoffNotification(BaseModel):
    incident_id: str
    ambulance_id: str
    hospital_id: str
    eta_min: float
    risk_assessment: RiskAssessmentResponse
    vitals: PatientVitals
    pre_arrival_actions: List[str]
    status: str = "alerted"
