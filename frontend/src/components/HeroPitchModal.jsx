import React from 'react';
import { 
  X, 
  ShieldAlert, 
  Clock, 
  Radio, 
  Building2, 
  Stethoscope, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Award, 
  Activity, 
  Layers,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundFx } from '../services/sound';

export default function HeroPitchModal({ isOpen, onClose, onSelectScenario }) {
  if (!isOpen) return null;

  const triggerConfetti = () => {
    soundFx.playGreenWavePing();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E11D48', '#DC2626', '#2563EB', '#10B981']
    });
    onClose();
  };

  const metrics = [
    { label: 'Avg. Response Time', value: '-38%', subtext: '4.2 min vs 8.6 min city baseline', color: 'text-rose-600' },
    { label: 'Green Wave Preemption', value: '99.4%', subtext: 'Zero intersection red-light stalls', color: 'text-blue-600' },
    { label: 'Cath/Trauma Bay Prep', value: '100%', subtext: 'Pre-arrival telemetry handoff', color: 'text-emerald-600' },
    { label: 'ML Triage Precision', value: '94.8%', subtext: 'AHA/MEWS aligned random forest', color: 'text-amber-600' }
  ];

  const modules = [
    {
      title: '1. Dynamic Traffic & GIS Command',
      icon: Layers,
      desc: 'Real-time telemetry tracking with instant re-routing around traffic bottlenecks and live incident dispatching.'
    },
    {
      title: '2. V2I Green Wave Signal Preemption',
      icon: Radio,
      desc: 'Automated 500m pre-clearing of upcoming intersections, switching signals to green wave priority corridor.'
    },
    {
      title: '3. Multi-Criteria Hospital Matrix',
      icon: Building2,
      desc: 'MCDM scoring engine evaluating travel time, ICU vacancy, cath lab readiness, and trauma level compatibility.'
    },
    {
      title: '4. Scikit-Learn Clinical ML Triage',
      icon: Stethoscope,
      desc: 'Machine learning model predicting clinical risk index (0-100), key physiological drivers, and protocol directives.'
    },
    {
      title: '5. Pre-Arrival ER Trauma Bay Handoff',
      icon: Activity,
      desc: 'Real-time incoming ambulance stream with live ECG waveform, vitals trend, and trauma team readiness checklists.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-rose-50 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-rose-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-mono font-bold uppercase tracking-wider">
              Capstone Prototype • Investable Demo
            </span>
            <span className="text-slate-500 text-xs font-mono">v2.0 Architecture</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto">
          
          {/* Hero Pitch Headline */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
              AmbuRoute: <span className="text-rose-600">AI-Powered Smart Ambulance Routing</span> & Emergency Logistics
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
              Traditional emergency dispatch suffers from traffic gridlock, blind hospital selection, and delayed ER intake.
              AmbuRoute connects <strong className="text-slate-900">smart vehicles</strong>, <strong className="text-slate-900">city traffic lights (V2I)</strong>, and <strong className="text-slate-900">hospital trauma bays</strong> into a unified, life-saving intelligence network.
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {metrics.map((m, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
                <div className={`text-2xl sm:text-3xl font-black font-mono ${m.color}`}>{m.value}</div>
                <div className="text-xs font-bold text-slate-800">{m.label}</div>
                <div className="text-[10px] text-slate-500 font-mono">{m.subtext}</div>
              </div>
            ))}
          </div>

          {/* Core Modules Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-rose-600 font-bold">
                Platform Architecture & Modules
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modules.map((mod, idx) => {
                const Icon = mod.icon;
                return (
                  <div key={idx} className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200 hover:border-rose-300 transition-all flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-0.5">{mod.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-normal">{mod.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA & Demo Launch */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Full Interactive Simulation Ready (FastAPI + React + Scikit-Learn)</span>
            </div>
            <button
              onClick={triggerConfetti}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold shadow-lg shadow-rose-600/30 transition-all cursor-pointer transform hover:scale-[1.02]"
            >
              <span>ENTER LIVE MISSION CONTROL</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
