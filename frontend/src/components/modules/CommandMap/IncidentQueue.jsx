import React from 'react';
import { 
  AlertCircle, 
  MapPin, 
  Clock, 
  User, 
  Heart, 
  Activity, 
  ArrowRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { soundFx } from '@/services/sound';

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
    { key: 'transporting', label: 'Transporting' },
    { key: 'arrived', label: 'Arrived' },
  ];

  const currentStatus = activeIncident?.status || 'en_route';
  const currentIndex = lifecycleSteps.findIndex(s => s.key === currentStatus);
  const activeIdx = currentIndex !== -1 ? currentIndex : 1;

  const scenarios = [
    { key: 'scenario_stemi', title: 'Cardiac STEMI', priority: 'Critical', color: 'text-rose-600' },
    { key: 'scenario_trauma', title: 'Highway Poly-Trauma', priority: 'Critical', color: 'text-amber-600' },
    { key: 'scenario_pediatric', title: 'Pediatric Respiratory', priority: 'High', color: 'text-blue-600' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-full shadow-xs space-y-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-wide text-slate-900 uppercase">
              Emergency Dispatch Feed
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Real-Time CAD Incident Stream
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600">
          Live
        </span>
      </div>

      {/* Active Incident Summary Card */}
      {activeIncident && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
          
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                Case ID: {activeIncident.id}
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                {activeIncident.title}
              </h4>
            </div>
            <span className="shrink-0 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
              Critical
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">{activeIncident.address}</span>
          </div>

          {/* Clean Step Progress Bar */}
          <div className="pt-2 border-t border-slate-200">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-2 font-bold">
              Dispatch Status Progression:
            </div>
            
            <div className="grid grid-cols-5 gap-1 text-center">
              {lifecycleSteps.map((step, idx) => {
                const isPassed = idx < activeIdx;
                const isCurrent = idx === activeIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div 
                      className={`w-full h-1.5 rounded-full mb-1 transition-all ${
                        isCurrent 
                          ? 'bg-rose-600 shadow-sm shadow-rose-600/30' 
                          : isPassed 
                            ? 'bg-emerald-500' 
                            : 'bg-slate-200'
                      }`}
                    />
                    <span className={`text-[9px] font-mono truncate w-full ${
                      isCurrent 
                        ? 'text-rose-700 font-bold' 
                        : isPassed 
                          ? 'text-slate-600' 
                          : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Patient Quick Vitals if available */}
          {activeIncident.patient_vitals && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
              <div className="bg-white p-1.5 rounded-lg text-center border border-slate-100 shadow-xs">
                <div className="text-[9px] text-slate-500 font-mono">Heart Rate</div>
                <div className="text-xs font-mono font-bold text-rose-600">
                  {activeIncident.patient_vitals.heart_rate} BPM
                </div>
              </div>
              <div className="bg-white p-1.5 rounded-lg text-center border border-slate-100 shadow-xs">
                <div className="text-[9px] text-slate-500 font-mono">Blood Press.</div>
                <div className="text-xs font-mono font-bold text-amber-600">
                  {activeIncident.patient_vitals.systolic_bp}/{activeIncident.patient_vitals.diastolic_bp}
                </div>
              </div>
              <div className="bg-white p-1.5 rounded-lg text-center border border-slate-100 shadow-xs">
                <div className="text-[9px] text-slate-500 font-mono">SpO2</div>
                <div className="text-xs font-mono font-bold text-blue-600">
                  {activeIncident.patient_vitals.spo2}%
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Switch Emergency Scenario Selector */}
      <div className="space-y-2 flex-1 flex flex-col justify-end">
        <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-bold">
          Switch Simulated Emergency:
        </div>

        <div className="space-y-1.5">
          {scenarios.map((sc) => {
            const isSelected = sc.key === currentScenarioKey;
            return (
              <button
                key={sc.key}
                onClick={() => {
                  soundFx.playClick();
                  onSelectScenario(sc.key);
                }}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-rose-50 text-rose-700 border border-rose-300 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">{sc.title}</div>
                  <div className={`text-[10px] font-mono ${sc.color}`}>{sc.priority} Priority</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
