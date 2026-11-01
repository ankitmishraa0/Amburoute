import React from 'react';
import { 
  MapPin, 
  ChevronRight,
  Heart,
  Activity,
  AlertTriangle,
  Wind,
  CheckCircle2,
  Navigation
} from 'lucide-react';

export default function IncidentQueue({ 
  incidents, 
  activeIncident, 
  onSelectScenario,
  currentScenarioKey,
  onNavigateTab 
}) {
  const currentStatus = activeIncident?.status || 'en_route';
  const vitals = activeIncident?.patient_vitals || {
    heart_rate: 134,
    systolic_bp: 82,
    diastolic_bp: 54,
    spo2: 88,
    age: 58
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col h-full space-y-4 shadow-sm">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Patient Live Status
            </h3>
            <p className="text-[11px] text-slate-400">
              Live Medical Telemetry
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 animate-pulse">
          Critical Case
        </span>
      </div>

      {/* Patient Emergency Card */}
      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
        
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Emergency Condition
          </span>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
            {activeIncident?.title || 'Acute Heart Attack (STEMI)'}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Patient: <strong>{vitals.age || 58} Year Male</strong>
          </p>
        </div>

        {/* Location */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <MapPin className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium truncate">{activeIncident?.address || 'Golghar, Gorakhpur'}</span>
        </div>

        {/* 3 Big Vital Cards with Easy Color Indicators */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Patient Vitals (Jeewan Sanket)
          </div>

          <div className="grid grid-cols-3 gap-2">
            
            {/* Heart Rate */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl text-center border border-red-200 dark:border-red-900/60">
              <div className="text-[10px] text-red-600 font-bold">Heart Rate</div>
              <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {vitals.heart_rate} <span className="text-[9px] font-normal text-slate-400">bpm</span>
              </div>
              <span className="text-[9px] font-bold text-red-500">⚠️ High</span>
            </div>

            {/* Blood Pressure */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl text-center border border-amber-200 dark:border-amber-900/60">
              <div className="text-[10px] text-amber-600 font-bold">BP Level</div>
              <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {vitals.systolic_bp}/{vitals.diastolic_bp}
              </div>
              <span className="text-[9px] font-bold text-amber-500">⚠️ Low</span>
            </div>

            {/* Oxygen Level */}
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl text-center border border-blue-200 dark:border-blue-900/60">
              <div className="text-[10px] text-blue-600 font-bold">Oxygen</div>
              <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {vitals.spo2}%
              </div>
              <span className="text-[9px] font-bold text-blue-500">⚠️ Needs O2</span>
            </div>

          </div>
        </div>

        {/* Live Route Status */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span className="font-bold">Ambulance Moving to AIIMS</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        </div>

      </div>

      {/* 2 Big Action Navigation Buttons */}
      <div className="space-y-2 mt-auto pt-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
          Quick Navigation
        </div>

        {onNavigateTab && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onNavigateTab('signals')}
              className="w-full py-2.5 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-between shadow-xs cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>🚦</span> View Traffic Signals Deck
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('handoff')}
              className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-between shadow-xs cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>🩺</span> View Hospital ER Intake
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
