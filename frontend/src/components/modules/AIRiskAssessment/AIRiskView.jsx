import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Activity, 
  Heart, 
  Zap, 
  ShieldAlert, 
  Thermometer, 
  Wind, 
  Sparkles,
  CheckCircle,
  Stethoscope,
  Info,
  Check
} from 'lucide-react';
import { soundFx } from '@/services/sound';
import { calculateRiskAssessment, fetchSymptoms } from '@/services/api';

// Professional Clinical Symptoms List
const CLINICAL_SYMPTOMS = [
  { name: 'Chest Pain (Crushing/Pressure)', category: 'Cardiac', critical: true },
  { name: 'Radiating Left Arm / Jaw Pain', category: 'Cardiac', critical: true },
  { name: 'Severe Dyspnea (Shortness of Breath)', category: 'Respiratory', critical: true },
  { name: 'Severe Arterial Hemorrhage', category: 'Trauma', critical: true },
  { name: 'Unresponsive / Syncope', category: 'Neurological', critical: true },
  { name: 'Altered Mental Status / GCS < 13', category: 'Neurological', critical: true },
  { name: 'Profuse Diaphoresis (Cold Sweats)', category: 'Autonomic', critical: false },
  { name: 'Palpitations / Tachyarrhythmia', category: 'Cardiac', critical: false },
  { name: 'Hypotension with Rigors (Sepsis)', category: 'Systemic', critical: true },
  { name: 'Nausea & Severe Emesis', category: 'GI', critical: false },
  { name: 'Localized Moderate Pain / Contusion', category: 'Trauma', critical: false }
];

export default function AIRiskView({ initialVitals, onAssessmentUpdated }) {
  const [vitals, setVitals] = useState(initialVitals || {
    heart_rate: 134,
    systolic_bp: 82,
    diastolic_bp: 54,
    spo2: 88,
    respiratory_rate: 28,
    temperature_c: 36.8,
    gcs_score: 14,
    age: 58,
    symptoms: [
      'Chest Pain (Crushing/Pressure)',
      'Radiating Left Arm / Jaw Pain',
      'Profuse Diaphoresis (Cold Sweats)'
    ]
  });

  const [assessment, setAssessment] = useState({
    esi_level: 1,
    esi_category: 'Resuscitation (Immediate Life Threat)',
    urgency_class: 'Tier 1 Critical',
    risk_score: 94,
    primary_condition: 'Acute Coronary Syndrome / Acute STEMI',
    decompensation_probability: 0.88,
    recommended_care_path: 'Immediate Cath Lab Activation (Door-to-Balloon < 45 min)',
    triage_rationale: [
      'Refractory cardiogenic shock profile (HR: 134, Systolic BP: 82 mmHg)',
      'Critical hypoxemia (SpO2: 88%) requiring high-flow supplemental O2',
      'High-risk ischemic symptoms matching acute myocardial infarction'
    ],
    recommended_specialties: ['Interventional Cardiology', 'Cardiothoracic Surgery', 'Critical Care Medicine']
  });

  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (initialVitals) {
      setVitals(initialVitals);
      runAssessment(initialVitals);
    }
  }, [initialVitals]);

  const runAssessment = async (v) => {
    setIsCalculating(true);
    soundFx.playClick();
    try {
      const res = await calculateRiskAssessment({
        heart_rate: v.heart_rate,
        systolic_bp: v.systolic_bp,
        diastolic_bp: v.diastolic_bp,
        spo2: v.spo2,
        respiratory_rate: v.respiratory_rate,
        temperature_c: v.temperature_c,
        gcs_score: v.gcs_score,
        age: v.age,
        symptoms: v.symptoms
      });
      if (res) {
        setAssessment(res);
        if (onAssessmentUpdated) onAssessmentUpdated(res);
      }
    } catch (e) {
      console.error('Triage assessment calculation error:', e);
    } finally {
      setIsCalculating(false);
    }
  };

  const toggleSymptom = (symptomName) => {
    soundFx.playClick();
    const current = vitals.symptoms || [];
    let updated;
    if (current.includes(symptomName)) {
      updated = current.filter(s => s !== symptomName);
    } else {
      updated = [...current, symptomName];
    }
    const newV = { ...vitals, symptoms: updated };
    setVitals(newV);
    runAssessment(newV);
  };

  const adjustVital = (key, delta) => {
    soundFx.playClick();
    const updated = {
      ...vitals,
      [key]: Math.max(1, (vitals[key] || 0) + delta)
    };
    setVitals(updated);
    runAssessment(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-2xl shadow-xs">
            🩺
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <span>Clinical Triage & Patient Risk Assessment</span>
              <span className="text-xs bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                ESI LEVEL {assessment.esi_level}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Machine Learning Clinical Decision Support (CDS) for pre-arrival emergency stratifications.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-black text-rose-700">
          <Sparkles className="w-4 h-4 text-rose-600" />
          <span>Real-Time CDS Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Symptoms & Vitals (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 space-y-6 shadow-xs">
          
          {/* Section 1: Presenting Symptoms */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <span>Presenting Patient Symptoms:</span>
              </label>
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                {vitals.symptoms.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto p-1 scrollbar-none">
              {CLINICAL_SYMPTOMS.map((sym) => {
                const isSelected = vitals.symptoms.includes(sym.name);
                return (
                  <button
                    type="button"
                    key={sym.name}
                    onClick={() => toggleSymptom(sym.name)}
                    className={`p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? sym.critical
                          ? 'bg-rose-50 border-rose-600 text-rose-900 shadow-xs'
                          : 'bg-rose-50/60 border-rose-400 text-slate-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold leading-snug">{sym.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sym.category}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-rose-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Physiological Vitals Stepper */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-sm font-black text-slate-900 flex items-center space-x-2">
              <span>Physiological Vital Signs:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              
              {/* Heart Rate */}
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl space-y-1.5 text-center">
                <div className="text-[11px] font-bold text-rose-700">Heart Rate (HR)</div>
                <div className="text-2xl font-black text-slate-900">{vitals.heart_rate} <span className="text-xs font-normal text-slate-500">BPM</span></div>
                <div className="flex items-center justify-center space-x-2 pt-1">
                  <button onClick={() => adjustVital('heart_rate', -5)} className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black flex items-center justify-center text-sm border border-rose-200 cursor-pointer">-</button>
                  <button onClick={() => adjustVital('heart_rate', 5)} className="w-8 h-8 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black flex items-center justify-center text-sm cursor-pointer">+</button>
                </div>
              </div>

              {/* Blood Pressure */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-1.5 text-center">
                <div className="text-[11px] font-bold text-slate-700">Blood Pressure (BP)</div>
                <div className="text-2xl font-black text-slate-900">{vitals.systolic_bp}/{vitals.diastolic_bp}</div>
                <div className="flex items-center justify-center space-x-2 pt-1">
                  <button onClick={() => adjustVital('systolic_bp', -10)} className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black flex items-center justify-center text-sm border border-slate-200 cursor-pointer">-</button>
                  <button onClick={() => adjustVital('systolic_bp', 10)} className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black flex items-center justify-center text-sm cursor-pointer">+</button>
                </div>
              </div>

              {/* Oxygen SpO2 */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl space-y-1.5 text-center col-span-2 sm:col-span-1">
                <div className="text-[11px] font-bold text-blue-700">Oxygen (SpO₂)</div>
                <div className={`text-2xl font-black ${vitals.spo2 < 90 ? 'text-rose-600' : 'text-blue-700'}`}>
                  {vitals.spo2}%
                </div>
                <div className="flex items-center justify-center space-x-2 pt-1">
                  <button onClick={() => adjustVital('spo2', -2)} className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-black flex items-center justify-center text-sm border border-blue-200 cursor-pointer">-</button>
                  <button onClick={() => adjustVital('spo2', 2)} className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center justify-center text-sm cursor-pointer">+</button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Output: Risk Assessment Card (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <span>AI Clinical Stratification</span>
              </h3>
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                {assessment.urgency_class}
              </span>
            </div>

            {/* Risk Gauge */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2 text-center">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                Decompensation Risk Score
              </div>
              <div className="text-4xl font-black text-rose-600 font-mono">
                {assessment.risk_score} / 100
              </div>
              <div className="text-xs text-slate-700 font-medium">
                Primary Indication: <strong className="text-slate-900">{assessment.primary_condition}</strong>
              </div>
            </div>

            {/* Recommended Care Path */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Protocol Recommendation:
              </div>
              <div className="text-xs font-semibold text-slate-700">
                {assessment.recommended_care_path}
              </div>
            </div>

            {/* Rationale Bullet Points */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Clinical Rationale:
              </div>
              <ul className="space-y-1.5">
                {(assessment.triage_rationale || []).map((r, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start space-x-2">
                    <span className="text-rose-600 font-bold mt-0.5">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
