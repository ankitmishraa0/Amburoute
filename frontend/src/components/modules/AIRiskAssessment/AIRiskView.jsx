import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Check, 
  Activity,
  Heart,
  Wind
} from 'lucide-react';
import { calculateRiskAssessment } from '@/services/api';

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
    const updated = {
      ...vitals,
      [key]: Math.max(1, (vitals[key] || 0) + delta)
    };
    setVitals(updated);
    runAssessment(updated);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Clinical Triage & Decision Support (CDS)</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                ESI Level {assessment.esi_level}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Protocol-based physiological scoring and pre-arrival acuity stratification.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Triage Engine Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Form: Symptoms & Vitals (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
          
          {/* Section 1: Presenting Symptoms */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                Presenting Symptoms:
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                {vitals.symptoms.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-0.5 scrollbar-none">
              {CLINICAL_SYMPTOMS.map((sym) => {
                const isSelected = vitals.symptoms.includes(sym.name);
                return (
                  <button
                    type="button"
                    key={sym.name}
                    onClick={() => toggleSymptom(sym.name)}
                    className={`p-2.5 rounded-md text-left transition-colors flex items-center justify-between border ${
                      isSelected
                        ? sym.critical
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-900 text-red-900 dark:text-red-200'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-medium leading-snug">{sym.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sym.category}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Physiological Vitals Stepper */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
              Physiological Vital Signs:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              
              {/* Heart Rate */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-3 rounded-md space-y-1 text-center">
                <div className="text-[11px] font-mono text-slate-500">Heart Rate (HR)</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {vitals.heart_rate} <span className="text-[11px] text-slate-400 font-normal">bpm</span>
                </div>
                <div className="flex items-center justify-center space-x-1.5 pt-1">
                  <button onClick={() => adjustVital('heart_rate', -5)} className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold hover:bg-slate-100">-</button>
                  <button onClick={() => adjustVital('heart_rate', 5)} className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold hover:bg-slate-100">+</button>
                </div>
              </div>

              {/* Blood Pressure */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-3 rounded-md space-y-1 text-center">
                <div className="text-[11px] font-mono text-slate-500">Blood Pressure (BP)</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {vitals.systolic_bp}/{vitals.diastolic_bp}
                </div>
                <div className="flex items-center justify-center space-x-1.5 pt-1">
                  <button onClick={() => adjustVital('systolic_bp', -10)} className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold hover:bg-slate-100">-</button>
                  <button onClick={() => adjustVital('systolic_bp', 10)} className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold hover:bg-slate-100">+</button>
                </div>
              </div>

              {/* Oxygen SpO2 */}
              <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-3 rounded-md space-y-1 text-center col-span-2 sm:col-span-1">
                <div className="text-[11px] font-mono text-slate-500">Oxygen (SpO₂)</div>
                <div className={`text-xl font-bold font-mono ${vitals.spo2 < 90 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                  {vitals.spo2}%
                </div>
                <div className="flex items-center justify-center space-x-1.5 pt-1">
                  <button onClick={() => adjustVital('spo2', -2)} className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold hover:bg-slate-100">-</button>
                  <button onClick={() => adjustVital('spo2', 2)} className="w-7 h-7 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold hover:bg-slate-100">+</button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Output: Risk Assessment Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                Clinical Stratification
              </h3>
              <span className="text-[11px] font-mono font-semibold text-red-600 dark:text-red-400 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                {assessment.urgency_class}
              </span>
            </div>

            {/* Risk Gauge */}
            <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5 text-center">
              <div className="text-[11px] text-slate-500 font-mono uppercase">
                Decompensation Risk Score
              </div>
              <div className="text-3xl font-bold font-mono text-red-600 dark:text-red-400">
                {assessment.risk_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Primary Indication: <strong className="text-slate-900 dark:text-white font-semibold">{assessment.primary_condition}</strong>
              </div>
            </div>

            {/* Recommended Care Path */}
            <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] font-mono uppercase text-slate-500">
                Recommended Care Pathway
              </div>
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {assessment.recommended_care_path}
              </div>
            </div>

            {/* Rationale Bullet Points */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-slate-500">
                Clinical Rationale
              </div>
              <ul className="space-y-1">
                {(assessment.triage_rationale || []).map((r, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start space-x-2">
                    <span className="text-slate-400">•</span>
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
