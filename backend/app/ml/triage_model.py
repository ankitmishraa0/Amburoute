"""
Machine Learning Patient Triage & Risk Assessment Engine for AmbuRoute
Uses Scikit-Learn RandomForestClassifier trained on emergency clinical features.
"""
import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from app.models.schemas import PatientVitals, RiskAssessmentResponse, RiskFactorImpact
from app.ml.symptoms_db import CLINICAL_SYMPTOMS, AVAILABLE_SYMPTOM_LIST

MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, "triage_rf_model.pkl")

# Feature columns in exact order
FEATURE_COLS = [
    "heart_rate",
    "systolic_bp",
    "diastolic_bp",
    "spo2",
    "respiratory_rate",
    "temperature_c",
    "gcs_score",
    "age",
    "symptom_risk_score",
    "is_hypoxic",
    "is_tachycardic",
    "is_hypotensive",
    "is_altered_mental",
    "is_tachypneic"
]


class TriageMLEngine:
    def __init__(self):
        self.model: RandomForestClassifier = None
        self.scaler: StandardScaler = StandardScaler()
        self._initialize_or_load_model()

    def _generate_synthetic_training_data(self, n_samples: int = 2500) -> Tuple[np.ndarray, np.ndarray]:
        """Generates realistic clinical triage training records based on MEWS and AHA triage guidelines."""
        np.random.seed(42)

        # Baseline vitals distributions
        heart_rate = np.random.normal(82, 22, n_samples).clip(35, 210)
        systolic_bp = np.random.normal(122, 25, n_samples).clip(55, 230)
        diastolic_bp = np.random.normal(78, 16, n_samples).clip(35, 140)
        spo2 = np.random.beta(a=12, b=1.2, size=n_samples) * 30 + 70  # skew towards 95-100 with long low tail
        spo2 = spo2.clip(60, 100)
        respiratory_rate = np.random.normal(17, 6, n_samples).clip(6, 50)
        temperature_c = np.random.normal(37.0, 0.9, n_samples).clip(33.0, 42.0)
        gcs_score = np.random.choice([15, 14, 13, 12, 10, 8, 5, 3], p=[0.70, 0.12, 0.06, 0.04, 0.03, 0.02, 0.02, 0.01], size=n_samples)
        age = np.random.normal(52, 20, n_samples).clip(1, 98)

        # Synthetic symptom scores (0.0 to 3.0)
        symptom_risk_score = np.random.exponential(scale=0.45, size=n_samples).clip(0.0, 3.5)

        # Binary clinical flags
        is_hypoxic = (spo2 < 92).astype(float)
        is_tachycardic = (heart_rate > 115).astype(float)
        is_hypotensive = (systolic_bp < 90).astype(float)
        is_altered_mental = (gcs_score < 13).astype(float)
        is_tachypneic = (respiratory_rate > 24).astype(float)

        X = np.column_stack([
            heart_rate,
            systolic_bp,
            diastolic_bp,
            spo2,
            respiratory_rate,
            temperature_c,
            gcs_score,
            age,
            symptom_risk_score,
            is_hypoxic,
            is_tachycardic,
            is_hypotensive,
            is_altered_mental,
            is_tachypneic
        ])

        # Clinical Risk Scoring formulation (Modified Early Warning + Red Flags)
        risk_points = np.zeros(n_samples)

        # SpO2 severity points
        risk_points += np.where(spo2 < 85, 45, np.where(spo2 < 90, 32, np.where(spo2 < 94, 16, 0)))
        # Heart rate points
        risk_points += np.where((heart_rate > 130) | (heart_rate < 45), 28, np.where((heart_rate > 110) | (heart_rate < 55), 14, 0))
        # Blood pressure points
        risk_points += np.where(systolic_bp < 80, 35, np.where(systolic_bp < 90, 24, np.where(systolic_bp > 190, 20, 0)))
        # GCS points
        risk_points += np.where(gcs_score <= 8, 45, np.where(gcs_score <= 12, 28, np.where(gcs_score <= 14, 12, 0)))
        # Respiration points
        risk_points += np.where((respiratory_rate > 30) | (respiratory_rate < 9), 30, np.where(respiratory_rate > 24, 15, 0))
        # Symptom risk contribution
        risk_points += symptom_risk_score * 22
        # Age modifier
        risk_points += np.where(age > 70, 10, np.where(age > 60, 5, 0))

        # Class definition:
        # 0: LOW (< 25)
        # 1: MODERATE (25 - 49)
        # 2: HIGH (50 - 74)
        # 3: CRITICAL (>= 75)
        y = np.where(risk_points >= 75, 3, np.where(risk_points >= 50, 2, np.where(risk_points >= 25, 1, 0)))

        return X, y

    def _initialize_or_load_model(self):
        """Train or load the pre-fitted model."""
        try:
            if os.path.exists(MODEL_PATH):
                with open(MODEL_PATH, "rb") as f:
                    bundle = pickle.load(f)
                    self.model = bundle["model"]
                    self.scaler = bundle["scaler"]
                    return
        except Exception:
            pass

        # Train new model
        X, y = self._generate_synthetic_training_data(n_samples=3000)
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.model = RandomForestClassifier(
            n_estimators=120,
            max_depth=12,
            min_samples_split=4,
            random_state=42,
            class_weight="balanced"
        )
        self.model.fit(X_scaled, y)

        # Save bundle
        try:
            with open(MODEL_PATH, "wb") as f:
                pickle.dump({"model": self.model, "scaler": self.scaler}, f)
        except Exception:
            pass

    def _extract_symptom_metrics(self, symptoms: List[str]) -> Tuple[float, List[Dict[str, Any]]]:
        """Calculates total symptom risk score and identifies critical symptom flags."""
        total_risk = 0.0
        details = []
        for s in symptoms:
            info = CLINICAL_SYMPTOMS.get(s, None)
            if info:
                total_risk += info["risk_weight"]
                details.append({
                    "name": s,
                    "weight": info["risk_weight"],
                    "critical": info["critical_flag"],
                    "desc": info["description"]
                })
            else:
                total_risk += 0.2
        return total_risk, details

    def assess_patient(self, vitals: PatientVitals) -> RiskAssessmentResponse:
        """Runs the Scikit-Learn ML pipeline to evaluate patient clinical risk and generate explainable insights."""
        symptom_score, symptom_details = self._extract_symptom_metrics(vitals.symptoms)

        is_hypoxic = 1.0 if vitals.spo2 < 92 else 0.0
        is_tachycardic = 1.0 if vitals.heart_rate > 115 else 0.0
        is_hypotensive = 1.0 if vitals.systolic_bp < 90 else 0.0
        is_altered_mental = 1.0 if vitals.gcs_score < 13 else 0.0
        is_tachypneic = 1.0 if vitals.respiratory_rate > 24 else 0.0

        raw_features = np.array([[
            float(vitals.heart_rate),
            float(vitals.systolic_bp),
            float(vitals.diastolic_bp),
            float(vitals.spo2),
            float(vitals.respiratory_rate),
            float(vitals.temperature_c),
            float(vitals.gcs_score),
            float(vitals.age),
            float(symptom_score),
            is_hypoxic,
            is_tachycardic,
            is_hypotensive,
            is_altered_mental,
            is_tachypneic
        ]])

        X_scaled = self.scaler.transform(raw_features)
        probs = self.model.predict_proba(X_scaled)[0]
        # Classes: 0: Low, 1: Moderate, 2: High, 3: Critical
        predicted_class_idx = int(np.argmax(probs))
        confidence = float(probs[predicted_class_idx])

        # Continuous composite 0-100 risk score
        # Weighted expectation of class probabilities
        weights = np.array([12, 38, 68, 94])
        # Ensure probs has length 4
        if len(probs) < 4:
            padded_probs = np.zeros(4)
            for idx, c in enumerate(self.model.classes_):
                padded_probs[c] = probs[idx]
            base_score = float(np.dot(padded_probs, weights))
        else:
            base_score = float(np.dot(probs, weights))

        # Check for absolute critical triggers
        critical_symptom_count = sum(1 for s in symptom_details if s["critical"])
        if vitals.spo2 < 85 or vitals.gcs_score <= 8 or vitals.systolic_bp < 75 or critical_symptom_count >= 2:
            base_score = max(base_score, 88.0)
            predicted_class_idx = 3

        risk_score_int = int(np.clip(round(base_score), 5, 99))

        # Map risk level
        if risk_score_int >= 75 or predicted_class_idx == 3:
            risk_level = "CRITICAL"
            triage_color = "#FF2A54"
        elif risk_score_int >= 50 or predicted_class_idx == 2:
            risk_level = "HIGH"
            triage_color = "#FF8C00"
        elif risk_score_int >= 25 or predicted_class_idx == 1:
            risk_level = "MODERATE"
            triage_color = "#00E5FF"
        else:
            risk_level = "LOW"
            triage_color = "#10B981"

        # Determine clinical category
        category = self._determine_category(vitals, symptom_details)

        # Compute explainable feature impacts (SHAP-style)
        key_risk_factors = self._compute_feature_impacts(vitals, symptom_details)

        # Generate AI Clinical Rationale
        rationale = self._generate_clinical_rationale(vitals, risk_level, category, key_risk_factors)

        # Generate Protocol Directives
        protocols = self._generate_protocols(vitals, risk_level, category)

        return RiskAssessmentResponse(
            risk_level=risk_level,
            risk_score=risk_score_int,
            confidence=round(confidence, 2),
            category=category,
            key_risk_factors=key_risk_factors,
            ai_clinical_rationale=rationale,
            recommended_protocols=protocols,
            triage_color=triage_color
        )

    def _determine_category(self, vitals: PatientVitals, symptom_details: List[Dict[str, Any]]) -> str:
        symptom_names = [s["name"].lower() for s in symptom_details]
        if any("chest pain" in s or "arm / jaw" in s or "diaphoresis" in s for s in symptom_names):
            return "Acute Cardiovascular Emergency (ACS/STEMI)"
        if any("mva" in s or "hemorrhage" in s or "trauma" in s for s in symptom_names):
            return "Major Trauma & Hemorrhagic Shock"
        if any("droop" in s or "mental status" in s or vitals.gcs_score < 13 for s in symptom_names):
            return "Acute Neurological / Suspected Stroke (LVO)"
        if any("dyspnea" in s or "stridor" in s or vitals.spo2 < 90 for s in symptom_names):
            return "Severe Respiratory Insufficiency"
        if any("sepsis" in s or (vitals.temperature_c > 38.5 and vitals.systolic_bp < 95) for s in symptom_names):
            return "Systemic Inflammatory / Septic Shock"
        return "General Medical Emergency"

    def _compute_feature_impacts(self, vitals: PatientVitals, symptom_details: List[Dict[str, Any]]) -> List[RiskFactorImpact]:
        factors = []

        # Oxygen Saturation
        if vitals.spo2 < 90:
            factors.append(RiskFactorImpact(
                feature="Oxygen Saturation (SpO₂)",
                value=f"{vitals.spo2}%",
                impact_pct=34.0,
                description="Severe arterial hypoxemia; tissue hypoxia risk",
                severity="critical"
            ))
        elif vitals.spo2 < 95:
            factors.append(RiskFactorImpact(
                feature="Oxygen Saturation (SpO₂)",
                value=f"{vitals.spo2}%",
                impact_pct=16.0,
                description="Sub-optimal oxygenation; monitor closely",
                severity="warning"
            ))

        # Glasgow Coma Scale
        if vitals.gcs_score <= 8:
            factors.append(RiskFactorImpact(
                feature="GCS Consciousness Score",
                value=f"{vitals.gcs_score}/15 (Severe Coma)",
                impact_pct=32.0,
                description="Airway reflex compromised; intubation indicated",
                severity="critical"
            ))
        elif vitals.gcs_score <= 13:
            factors.append(RiskFactorImpact(
                feature="GCS Consciousness Score",
                value=f"{vitals.gcs_score}/15",
                impact_pct=22.0,
                description="Moderate neurological impairment / lethargy",
                severity="warning"
            ))

        # Blood Pressure
        if vitals.systolic_bp < 85:
            factors.append(RiskFactorImpact(
                feature="Systolic Blood Pressure",
                value=f"{vitals.systolic_bp} mmHg (Severe Hypotension)",
                impact_pct=28.0,
                description="End-organ hypoperfusion / cardiogenic or hypovolemic shock",
                severity="critical"
            ))
        elif vitals.systolic_bp > 190:
            factors.append(RiskFactorImpact(
                feature="Systolic Blood Pressure",
                value=f"{vitals.systolic_bp} mmHg (Hypertensive Crisis)",
                impact_pct=24.0,
                description="Risk of intracranial hemorrhage or acute aortic dissection",
                severity="warning"
            ))

        # Heart Rate
        if vitals.heart_rate > 135:
            factors.append(RiskFactorImpact(
                feature="Heart Rate",
                value=f"{vitals.heart_rate} bpm (Severe Tachycardia)",
                impact_pct=20.0,
                description="Compensatory tachycardia or pathological tachyarrhythmia",
                severity="critical"
            ))
        elif vitals.heart_rate < 45:
            factors.append(RiskFactorImpact(
                feature="Heart Rate",
                value=f"{vitals.heart_rate} bpm (Severe Bradycardia)",
                impact_pct=22.0,
                description="High risk of complete heart block or sinus arrest",
                severity="critical"
            ))

        # Symptoms
        for s in symptom_details:
            if s["critical"]:
                factors.append(RiskFactorImpact(
                    feature=s["name"],
                    value="Present",
                    impact_pct=round(s["weight"] * 25.0, 1),
                    description=s["desc"],
                    severity="critical"
                ))

        if not factors:
            factors.append(RiskFactorImpact(
                feature="Hemodynamic Stability",
                value="Within Normal Ranges",
                impact_pct=5.0,
                description="Vitals stable; continue routine monitoring",
                severity="normal"
            ))

        # Sort by impact percentage descending
        factors.sort(key=lambda x: x.impact_pct, reverse=True)
        return factors[:5]

    def _generate_clinical_rationale(
        self,
        vitals: PatientVitals,
        risk_level: str,
        category: str,
        factors: List[RiskFactorImpact]
    ) -> str:
        high_severity_count = sum(1 for f in factors if f.severity == "critical")
        top_factor_names = ", ".join([f.feature for f in factors[:2]])

        if risk_level == "CRITICAL":
            return (
                f"Patient presents with {category}. Primary physiological compromise driven by {top_factor_names}. "
                f"Severe hemodynamic and/or neurological instability ({high_severity_count} critical red-flag indicators). "
                f"Immediate code-1 priority transport with trauma/cath-lab advance activation required."
            )
        elif risk_level == "HIGH":
            return (
                f"Urgent {category} scenario. Significant vital sign deviation identified ({top_factor_names}). "
                f"High risk of rapid decompensation during transit. Continuous telemetry and pre-alerting destination ER recommended."
            )
        elif risk_level == "MODERATE":
            return (
                f"Moderate acuity {category}. Vitals show controlled borderline deviations ({top_factor_names}). "
                f"Patient requires supportive ALS/BLS management and regular reassessment."
            )
        else:
            return (
                f"Low acuity presentation. Vitals maintain normal baseline ranges. "
                f"Standard non-emergent transport protocol with routine surveillance."
            )

    def _generate_protocols(self, vitals: PatientVitals, risk_level: str, category: str) -> List[str]:
        protocols = []
        if "Cardiovascular" in category:
            protocols.extend([
                "Acquire 12-Lead ECG & transmit telemetry to destination ER Cath Lab",
                "Administer High-Flow O2 if SpO2 < 94%; establish Dual 18G IV access",
                "Administer Chewable Aspirin 324mg (if not contraindicated)",
                "Prepare Defibrillator / Pacing pads in standby mode"
            ])
        elif "Trauma" in category:
            protocols.extend([
                "Activate Level 1 Trauma Team pre-arrival notification",
                "Apply rapid pelvic binder / tourniquet if active hemorrhage present",
                "Maintain permissive hypotension target (MAP 65 mmHg) with warmed IV fluids",
                "Full spinal immobilization and GCS reassessment every 3 minutes"
            ])
        elif "Neurological" in category:
            protocols.extend([
                "Perform Rapid Stroke Assessment (LVO Scale / Cincinnati Prehospital)",
                "Record exact 'Last Known Well' timestamp for tPA/thrombectomy window",
                "Check capillary blood glucose to rule out severe hypoglycemia",
                "Alert Comprehensive Stroke Center neuro-interventional team"
            ])
        elif "Respiratory" in category:
            protocols.extend([
                "Continuous pulse oximetry and capnography (EtCO2) monitoring",
                "Initiate Non-Invasive Positive Pressure Ventilation (CPAP/BiPAP) if indicated",
                "Administer Nebulized Albuterol/Ipratropium for bronchospasm",
                "Prepare ALS suction and Video Laryngoscopy for difficult airway backup"
            ])
        else:
            protocols.extend([
                "Continuous cardiac rhythm & SpO2 monitoring",
                "Obtain baseline vitals every 5 minutes",
                "Establish peripheral IV lock for medication access",
                "Notify receiving ER triage desk with estimated arrival time"
            ])
        return protocols


# Global instance
triage_engine = TriageMLEngine()
