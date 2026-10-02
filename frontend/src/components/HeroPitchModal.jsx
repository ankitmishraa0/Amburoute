import React from 'react';
import { 
  X, 
  Layers, 
  Radio, 
  Building2, 
  Stethoscope, 
  Activity, 
  Check, 
  Cpu, 
  ShieldCheck,
  Server,
  Zap
} from 'lucide-react';

export default function HeroPitchModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const specifications = [
    { label: 'CAD Telemetry Protocol', value: 'WebSocket / REST', subtext: 'Bidirectional low-latency telemetry' },
    { label: 'Signal Preemption Radius', value: '500m Corridor', subtext: 'Automated V2I corridor lock' },
    { label: 'Hospital Allocation', value: 'MCDM Engine', subtext: 'Multi-criteria capability & bed scoring' },
    { label: 'Clinical Triage Model', value: 'ESI Protocol', subtext: 'AHA / MEWS physiological classification' }
  ];

  const modules = [
    {
      title: '1. Dynamic GIS Routing & Telemetry',
      icon: Layers,
      desc: 'Real-time vehicle positioning and dynamic rerouting around recorded arterial traffic congestion.'
    },
    {
      title: '2. V2I Traffic Signal Preemption',
      icon: Radio,
      desc: 'Corridor preemption clearing downstream signal intersections to establish green wave emergency lanes.'
    },
    {
      title: '3. Multi-Criteria Hospital Matrix',
      icon: Building2,
      desc: 'MCDM matching engine balancing travel transit time, ICU bed vacancy, cath lab readiness, and trauma level.'
    },
    {
      title: '4. Clinical Decision Support & Triage',
      icon: Stethoscope,
      desc: 'Rule-based and ML triage pipeline predicting physiological risk, care pathway, and intervention urgency.'
    },
    {
      title: '5. Pre-Arrival ER Trauma Intake',
      icon: Activity,
      desc: 'Real-time pre-arrival telemetry delivering vitals trends and synthesized Lead-II ECG to destination ER staff.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden my-auto">
        
        {/* Header Ribbon */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              System Architecture & Dispatch Specifications
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          
          {/* Overview */}
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              AmbuRoute Dispatch Architecture
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              AmbuRoute integrates vehicle computer-aided dispatch, municipal traffic signal preemption (V2I), 
              and hospital intake telemetry into an automated operational workflow for emergency response teams.
            </p>
          </div>

          {/* Architectural Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {specifications.map((item, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white">{item.value}</div>
                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-0.5">{item.label}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.subtext}</div>
              </div>
            ))}
          </div>

          {/* Core Modules Breakdown */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
              Operational Subsystems
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {modules.map((mod, idx) => {
                const Icon = mod.icon;
                return (
                  <div key={idx} className="p-3 rounded-md border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800/40 flex items-start space-x-3">
                    <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-0.5">{mod.title}</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">{mod.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer info & Dismiss */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center space-x-1.5 font-mono text-[11px]">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span>FastAPI Backend • React 19 Frontend</span>
            </div>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
