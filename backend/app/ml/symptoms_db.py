"""
Symptom Taxonomy and Clinical Emergency Criteria for AmbuRoute ML Triage
"""
from typing import Dict, List, Any

CLINICAL_SYMPTOMS: Dict[str, Dict[str, Any]] = {
    "Chest Pain (Crushing/Pressure)": {
        "category": "cardiac",
        "risk_weight": 0.85,
        "critical_flag": True,
        "description": "Substernal pressure suggestive of Acute Coronary Syndrome (ACS) or STEMI."
    },
    "Radiating Left Arm / Jaw Pain": {
        "category": "cardiac",
        "risk_weight": 0.80,
        "critical_flag": True,
        "description": "Classic radiating pain pattern indicative of acute myocardial ischemia."
    },
    "Profuse Diaphoresis (Cold Sweats)": {
        "category": "cardiac_general",
        "risk_weight": 0.70,
        "critical_flag": False,
        "description": "Autonomic response indicating severe physiological stress or cardiogenic shock."
    },
    "Severe Dyspnea (Shortness of Breath)": {
        "category": "respiratory",
        "risk_weight": 0.80,
        "critical_flag": True,
        "description": "Acute respiratory insufficiency, potential pulmonary edema or severe bronchospasm."
    },
    "Cyanosis / Gray Extremities": {
        "category": "respiratory",
        "risk_weight": 0.90,
        "critical_flag": True,
        "description": "Peripheral or central hypoxemia indicating imminent respiratory failure."
    },
    "Stridor / Airway Obstruction": {
        "category": "airway",
        "risk_weight": 0.95,
        "critical_flag": True,
        "description": "Upper airway obstruction requiring immediate ALS airway intervention."
    },
    "Altered Mental Status / GCS < 13": {
        "category": "neurological",
        "risk_weight": 0.85,
        "critical_flag": True,
        "description": "Impaired cerebral perfusion, intoxication, stroke, or severe head trauma."
    },
    "Sudden Facial Droop / Hemiparesis": {
        "category": "neurological",
        "risk_weight": 0.90,
        "critical_flag": True,
        "description": "F.A.S.T. criteria positive — suspected Large Vessel Occlusion (LVO) / Acute Ischemic Stroke."
    },
    "Unresponsive / Syncope": {
        "category": "general",
        "risk_weight": 0.92,
        "critical_flag": True,
        "description": "Transient or persistent loss of consciousness; high risk of ventricular arrhythmia."
    },
    "Severe Arterial Hemorrhage": {
        "category": "trauma",
        "risk_weight": 0.95,
        "critical_flag": True,
        "description": "Exsanguinating hemorrhage requiring immediate tourniquet / hemostatic control."
    },
    "High-Speed MVA / Blunt Poly-Trauma": {
        "category": "trauma",
        "risk_weight": 0.88,
        "critical_flag": True,
        "description": "High kinetic energy mechanism of injury; high suspicion for internal hemorrhage."
    },
    "Hypotension with Rigors (Sepsis Suspicion)": {
        "category": "sepsis",
        "risk_weight": 0.78,
        "critical_flag": True,
        "description": "Systemic inflammatory response with septic shock risk; requires rapid crystalloids."
    },
    "Palpitations / Tachyarrhythmia": {
        "category": "cardiac",
        "risk_weight": 0.65,
        "critical_flag": False,
        "description": "Symptomatic tachycardia (SVT / VT / Atrial Fibrillation with RVR)."
    },
    "Dizziness / Presyncope": {
        "category": "general",
        "risk_weight": 0.45,
        "critical_flag": False,
        "description": "Orthostatic intolerance, dehydration, or bradycardia."
    },
    "Nausea & Severe Emesis": {
        "category": "gi",
        "risk_weight": 0.40,
        "critical_flag": False,
        "description": "Gastrointestinal distress or secondary vagal stimulation."
    },
    "Localized Moderate Pain / Contusion": {
        "category": "trauma_minor",
        "risk_weight": 0.25,
        "critical_flag": False,
        "description": "Isolated blunt trauma without neurological or vascular deficit."
    },
    "Minor Cutaneous Laceration": {
        "category": "trauma_minor",
        "risk_weight": 0.15,
        "critical_flag": False,
        "description": "Superficial soft tissue injury with controlled hemostasis."
    }
}

AVAILABLE_SYMPTOM_LIST = list(CLINICAL_SYMPTOMS.keys())
