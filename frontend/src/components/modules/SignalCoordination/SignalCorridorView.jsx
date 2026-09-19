import React, { useState } from 'react';
import { 
  Radio, 
  Wifi, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Sliders,
  AlertTriangle,
  Siren,
  Compass,
  RefreshCw,
  Eye,
  Activity,
  Layers,
  Check,
  ChevronRight
} from 'lucide-react';
import { soundFx } from '@/services/sound';
import { overrideSignal } from '@/services/api';

export default function SignalCorridorView({ 
  signals = [], 
  ambulance, 
  setTelemetry,
  onSignalUpdated 
}) {
  const [activeToast, setActiveToast] = useState(null);

  const triggerToast = (msg) => {
    setActiveToast(msg);
    try { soundFx?.playSuccess?.(); } catch (e) {}
    setTimeout(() => setActiveToast(null), 3000);
  };

  // Change individual signal state
  const handleSetSignalState = async (sigId, newState) => {
    try { soundFx?.playClick?.(); } catch (e) {}

    if (setTelemetry) {
      setTelemetry(prev => ({
        ...prev,
        signals: (prev.signals || []).map(s => {
          if (s.id === sigId) {
            return {
              ...s,
              state: newState,
              prep_countdown_sec: newState === 'green_wave' ? 45 : newState === 'amber_prep' ? 12 : 60
            };
          }
          return s;
        })
      }));
    }

    const stateNames = {
      green_wave: 'GREEN WAVE (Corridor Open)',
      amber_prep: 'AMBER PREP (Cross Clearance)',
      red: 'HOLD RED (Cross Traffic Stopped)'
    };
    triggerToast(`Intersection updated to ${stateNames[newState] || newState}`);

    try {
      if (newState === 'green_wave') {
        await overrideSignal(sigId);
        if (onSignalUpdated) onSignalUpdated();
      }
    } catch (e) {}
  };

  // Force all intersections Green Wave
  const handleForceAllGreen = () => {
    try {
      soundFx?.playClick?.();
      soundFx?.playGreenWavePing?.();
    } catch (e) {}

    if (setTelemetry) {
      setTelemetry(prev => ({
        ...prev,
        signals: (prev.signals || []).map(s => ({
          ...s,
          state: 'green_wave',
          prep_countdown_sec: 45
        }))
      }));
    }
    triggerToast('⚡ MASTER OVERRIDE: All 5 corridor intersections forced to 100% GREEN WAVE!');
  };

  // Reset to automated timing
  const handleResetAutomated = () => {
    try { soundFx?.playClick?.(); } catch (e) {}

    if (setTelemetry) {
      setTelemetry(prev => ({
        ...prev,
        signals: (prev.signals || []).map((s, idx) => ({
          ...s,
          state: idx === 0 ? 'green_wave' : idx === 1 ? 'amber_prep' : 'red',
          prep_countdown_sec: idx === 0 ? 30 : idx === 1 ? 15 : 60
        }))
      }));
    }
    triggerToast('Corridor restored to automated adaptive V2I signal timing.');
  };

  const getSignalMeta = (state) => {
    switch (state) {
      case 'green_wave':
        return {
          title: 'GREEN WAVE ACTIVE',
          badgeStyle: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dotColor: 'bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse',
          desc: 'Intersection locked for Ambulance. Cross traffic stopped.',
          isGreen: true,
          isAmber: false,
          isRed: false
        };
      case 'amber_prep':
        return {
          title: 'AMBER CLEARANCE',
          badgeStyle: 'bg-amber-100 text-amber-800 border-amber-300',
          dotColor: 'bg-amber-500 shadow-md shadow-amber-500/50 animate-ping',
          desc: 'Yellow phase active. Cross-traffic junction clearing out.',
          isGreen: false,
          isAmber: true,
          isRed: false
        };
      default:
        return {
          title: 'STANDARD RED',
          badgeStyle: 'bg-rose-100 text-rose-800 border-rose-300',
          dotColor: 'bg-rose-600',
          desc: 'Awaiting 500m optical / DSRC vehicle proximity trigger.',
          isGreen: false,
          isAmber: false,
          isRed: true
        };
    }
  };

  const greenCount = signals.filter(s => s.state === 'green_wave').length;
  const amberCount = signals.filter(s => s.state === 'amber_prep').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast alert */}
      {activeToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-xl flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{activeToast}</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-700 px-2 py-0.5 rounded-md">V2I IoT Broadcasted</span>
        </div>
      )}

      {/* TOP HEADER: POLICE CONSOLE & QUICK ACTION COMMAND DECK */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Title Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-600/25 shrink-0">
              🚦
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Smart City Traffic Police (ITMS) • Green Wave Console
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-black uppercase">
                  5G C-V2X Active
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Automated optical & radio preemption clearing intersections 45–60 seconds ahead of ambulance arrival.
              </p>
            </div>
          </div>

          {/* Quick Master Override Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleForceAllGreen}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>⚡ Master Green Wave (All 5 Signals)</span>
            </button>

            <button
              onClick={handleResetAutomated}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-black text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Auto Adaptive Cycle</span>
            </button>
          </div>
        </div>

        {/* Real-Time Corridor Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Corridor Status</div>
            <div className="text-lg font-black text-emerald-700 mt-1 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>{greenCount} Green Wave Active</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{amberCount} in amber prep phase</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inbound Ambulance</div>
            <div className="text-lg font-black text-slate-900 mt-1">
              {ambulance?.speed_kmh ?? 58} <span className="text-xs text-slate-500 font-normal">KM/H</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Callsign: {ambulance?.callsign ?? 'MEDIC-12'}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Distance to Hospital</div>
            <div className="text-lg font-black text-rose-600 mt-1">
              {ambulance?.distance_remaining_km ?? 3.2} <span className="text-xs text-slate-500 font-normal">KM</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">ETA: ~{Math.round((ambulance?.eta_seconds ?? 240) / 60)} minutes</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time Saved by IoT</div>
            <div className="text-lg font-black text-emerald-600 mt-1">
              -195s <span className="text-xs text-slate-500 font-normal">(-3.2 mins)</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Zero red-light halts</div>
          </div>
        </div>

        {/* Visual Linear Corridor Progression Track */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-600 mb-2">
            <span>🚨 EMERGENCY CORRIDOR PROGRESS TRACK</span>
            <span className="text-emerald-700">All Traffic Signals Synchronized via C-V2X</span>
          </div>

          <div className="relative flex items-center justify-between bg-slate-100 p-3 rounded-2xl border border-slate-200">
            <div className="absolute left-6 right-6 top-1/2 h-1.5 bg-slate-300 -translate-y-1/2 rounded-full z-0"></div>
            
            {signals.map((s, idx) => {
              const isGreen = s.state === 'green_wave';
              const isAmber = s.state === 'amber_prep';

              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-md ${
                    isGreen 
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-200 scale-110' 
                      : isAmber 
                      ? 'bg-amber-400 text-white ring-4 ring-amber-200' 
                      : 'bg-rose-500 text-white'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="text-[10px] font-bold text-slate-700 mt-1.5 max-w-[80px] text-center truncate">
                    {s.name.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* DETAILED INTERSECTION CARDS WITH REALISTIC TRAFFIC LIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {signals.map((sig, index) => {
          const meta = getSignalMeta(sig.state);
          const isGreen = sig.state === 'green_wave';
          const isAmber = sig.state === 'amber_prep';
          const isRed = !isGreen && !isAmber;

          return (
            <div
              key={sig.id}
              className={`rounded-3xl border-2 p-5 transition-all flex flex-col justify-between bg-white shadow-sm hover:shadow-md ${
                isGreen
                  ? 'border-emerald-400 ring-2 ring-emerald-400/20'
                  : isAmber
                  ? 'border-amber-400 ring-2 ring-amber-400/20'
                  : 'border-slate-200'
              }`}
            >
              <div>
                
                {/* Intersection Header & Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      JUNCTION-{index + 1}
                    </span>
                  </div>

                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border flex items-center space-x-1.5 ${meta.badgeStyle}`}>
                    <span className={`w-2 h-2 rounded-full ${meta.dotColor}`}></span>
                    <span>{meta.title}</span>
                  </div>
                </div>

                {/* Main Middle: Realistic Traffic Light + Info */}
                <div className="flex items-center space-x-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
                  
                  {/* REALISTIC 3-ASPECT TRAFFIC LIGHT HOUSING */}
                  <div className="w-10 bg-slate-900 rounded-2xl p-2 flex flex-col items-center space-y-1.5 shadow-lg shrink-0 border border-slate-700">
                    {/* RED LIGHT */}
                    <div 
                      onClick={() => handleSetSignalState(sig.id, 'red')}
                      title="Click to turn RED"
                      className={`w-6 h-6 rounded-full cursor-pointer transition-all duration-300 border ${
                        isRed 
                          ? 'bg-rose-600 shadow-lg shadow-rose-600/80 border-rose-400 scale-105' 
                          : 'bg-rose-950/40 border-rose-900/30 opacity-40 hover:opacity-80'
                      }`}
                    />
                    
                    {/* YELLOW / AMBER LIGHT */}
                    <div 
                      onClick={() => handleSetSignalState(sig.id, 'amber_prep')}
                      title="Click to turn AMBER"
                      className={`w-6 h-6 rounded-full cursor-pointer transition-all duration-300 border ${
                        isAmber 
                          ? 'bg-amber-400 shadow-lg shadow-amber-400/80 border-amber-300 scale-105' 
                          : 'bg-amber-950/40 border-amber-900/30 opacity-40 hover:opacity-80'
                      }`}
                    />
                    
                    {/* GREEN LIGHT */}
                    <div 
                      onClick={() => handleSetSignalState(sig.id, 'green_wave')}
                      title="Click to turn GREEN"
                      className={`w-6 h-6 rounded-full cursor-pointer transition-all duration-300 border ${
                        isGreen 
                          ? 'bg-emerald-500 shadow-lg shadow-emerald-500/80 border-emerald-300 scale-105 animate-pulse' 
                          : 'bg-emerald-950/40 border-emerald-900/30 opacity-40 hover:opacity-80'
                      }`}
                    />
                  </div>

                  {/* Junction Name & Status */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-slate-900 truncate">
                      {sig.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {meta.desc}
                    </p>
                    <div className="text-[10px] font-mono text-slate-400 mt-2 flex items-center space-x-2">
                      <span>Proximity: <strong className="text-slate-700">{sig.distance_to_ambulance_m || (index + 1) * 350}m</strong></span>
                      <span>•</span>
                      <span>ETA: <strong className="text-slate-700">{sig.prep_countdown_sec || 30}s</strong></span>
                    </div>
                  </div>

                </div>

                {/* Telemetry Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Cross Traffic</span>
                    <span className={`font-black text-xs ${isGreen ? 'text-emerald-700' : isAmber ? 'text-amber-700' : 'text-slate-800'}`}>
                      {isGreen ? '🛑 Halted (Cleared)' : isAmber ? '⚠️ Slowing (Yellow)' : '🟢 Normal Cycle'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Preemption Timer</span>
                    <span className="font-black text-xs text-slate-800">
                      {sig.prep_countdown_sec || 45}s Active Lock
                    </span>
                  </div>
                </div>

              </div>

              {/* EASY 3-BUTTON MANUAL CONTROLS */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Manual Signal Override:</span>
                  <span className="text-slate-500">1-Click Action</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetSignalState(sig.id, 'green_wave')}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                      isGreen 
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30' 
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    <span>🟢 Green</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetSignalState(sig.id, 'amber_prep')}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                      isAmber 
                        ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30' 
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    <span>🟡 Amber</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetSignalState(sig.id, 'red')}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                      isRed 
                        ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30' 
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    <span>🔴 Red</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
