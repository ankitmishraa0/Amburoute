import React from 'react';
import { 
  MapPin, 
  ChevronRight,
  Radio
} from 'lucide-react';

export default function IncidentQueue({ 
  incidents, 
  activeIncident, 
  onSelectScenario,
  currentScenarioKey 
}) {
  const lifecycleSteps = [
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'en_route', label: 'En Route' },
    { key: 'on_scene', label: 'On Scene' },
    { key: 'transporting', label: 'Transport' },
    { key: 'arrived', label: 'Arrived' },
  ];

  const currentStatus = activeIncident?.status || 'en_route';
  const currentIndex = lifecycleSteps.findIndex(s => s.key === currentStatus);
  const activeIdx = currentIndex !== -1 ? currentIndex : 1;

  const scenarios = [
    { key: 'scenario_stemi', title: 'Cardiac STEMI', priority: 'Priority 1', code: 'ALS' },
    { key: 'scenario_trauma', title: 'Highway Multi-Trauma', priority: 'Priority 1', code: 'ALS' },
    { key: 'scenario_pediatric', title: 'Pediatric Respiratory', priority: 'Priority 2', code: 'BLS' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col h-full space-y-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Radio className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              Active Incident Feed
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">
              CAD Stream
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          Live Call
        </span>
      </div>

      {/* Active Incident Summary Card */}
      {activeIncident && (
        <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-md p-3 space-y-2.5">
          
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                CAD #{activeIncident.id}
              </div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white leading-snug mt-0.5">
                {activeIncident.title}
              </h4>
            </div>
            <span className="shrink-0 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
              Critical
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-600 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
            <span className="truncate text-[11px]">{activeIncident.address}</span>
          </div>

          {/* Clean Step Progress Bar */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
              Lifecycle Status
            </div>
            
            <div className="grid grid-cols-5 gap-1 text-center">
              {lifecycleSteps.map((step, idx) => {
                const isPassed = idx < activeIdx;
                const isCurrent = idx === activeIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div 
                      className={`w-full h-1 rounded-full mb-1 transition-all ${
                        isCurrent 
                          ? 'bg-slate-900 dark:bg-white' 
                          : isPassed 
                            ? 'bg-emerald-600 dark:bg-emerald-500' 
                            : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                    <span className={`text-[9px] font-mono truncate w-full ${
                      isCurrent 
                        ? 'text-slate-900 dark:text-white font-semibold' 
                        : isPassed 
                          ? 'text-slate-600 dark:text-slate-400' 
                          : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Patient Quick Vitals */}
          {activeIncident.patient_vitals && (
            <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded text-center border border-slate-200 dark:border-slate-800">
                <div className="text-[9px] text-slate-400 font-mono">Heart Rate</div>
                <div className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                  {activeIncident.patient_vitals.heart_rate} <span className="text-[9px] text-slate-400 font-normal">bpm</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded text-center border border-slate-200 dark:border-slate-800">
                <div className="text-[9px] text-slate-400 font-mono">BP (Sys/Dia)</div>
                <div className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                  {activeIncident.patient_vitals.systolic_bp}/{activeIncident.patient_vitals.diastolic_bp}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded text-center border border-slate-200 dark:border-slate-800">
                <div className="text-[9px] text-slate-400 font-mono">SpO2</div>
                <div className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                  {activeIncident.patient_vitals.spo2}%
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Switch Emergency Scenario Selector */}
      <div className="space-y-2 flex-1 flex flex-col justify-end">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          Active Scenario Simulation
        </div>

        <div className="space-y-1.5">
          {scenarios.map((sc) => {
            const isSelected = sc.key === currentScenarioKey;
            return (
              <button
                key={sc.key}
                onClick={() => onSelectScenario(sc.key)}
                className={`w-full text-left p-2 rounded-md text-xs transition-colors flex items-center justify-between border ${
                  isSelected
                    ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-medium text-slate-900 dark:text-white text-xs">{sc.title}</div>
                  <div className="text-[10px] font-mono text-slate-500">{sc.priority} • {sc.code}</div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
