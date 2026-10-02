import React, { useState } from 'react';
import { 
  Signal, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck,
  Check,
  ArrowRight
} from 'lucide-react';
import { overrideSignal } from '@/services/api';

export default function SignalCorridorView({ 
  signals = [], 
  ambulance, 
  setTelemetry, 
  onSignalUpdated,
  onNavigateTab 
}) {
  const [activeToast, setActiveToast] = useState(null);
  const [showManualOverrides, setShowManualOverrides] = useState(false);

  const triggerToast = (msg) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3000);
  };

  const handleSetSignalState = async (sigId, newState) => {
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
      green_wave: 'Green Wave (Corridor Open)',
      amber_prep: 'Amber Preparation (Clearing Junction)',
      red: 'Hold Red (Cross Traffic Stopped)'
    };
    triggerToast(`Intersection state updated to: ${stateNames[newState] || newState}`);

    try {
      if (newState === 'green_wave') {
        await overrideSignal(sigId);
        if (onSignalUpdated) onSignalUpdated();
      }
    } catch (e) {}
  };

  const handleForceAllGreen = () => {
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
    triggerToast('Corridor Preemption: All intersections locked green for priority transit.');
  };

  const handleResetAutomated = () => {
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
    triggerToast('Corridor restored to automated adaptive V2I timing.');
  };

  const getSignalMeta = (state) => {
    switch (state) {
      case 'green_wave':
        return {
          title: 'Green Wave Clear',
          badgeStyle: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          dotColor: 'bg-emerald-500',
          desc: 'Corridor green locked. Cross traffic halted.',
          isGreen: true,
          isAmber: false,
          isRed: false
        };
      case 'amber_prep':
        return {
          title: 'Amber Clearance',
          badgeStyle: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dotColor: 'bg-amber-500',
          desc: 'Yellow clearance phase active. Cross junction clearing.',
          isGreen: false,
          isAmber: true,
          isRed: false
        };
      default:
        return {
          title: 'Hold Red',
          badgeStyle: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900',
          dotColor: 'bg-red-500',
          desc: 'Standard cycle. Awaiting optical / V2I proximity trigger.',
          isGreen: false,
          isAmber: false,
          isRed: true
        };
    }
  };

  const greenCount = signals.filter(s => s.state === 'green_wave').length;
  const amberCount = signals.filter(s => s.state === 'amber_prep').length;

  return (
    <div className="space-y-4">
      
      {/* Toast Alert */}
      {activeToast && (
        <div className="p-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-md text-xs font-mono shadow-md flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{activeToast}</span>
          </div>
          <span className="text-[10px] text-slate-400">V2I Protocol Broadcasted</span>
        </div>
      )}

      {/* Top Header & Summary Deck */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        
        {/* Title Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold shrink-0">
              <Signal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Traffic Signal Preemption Console
                </h2>
                <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono uppercase">
                  V2I Corridor Link
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated optical & DSRC preemption clearing downstream signals 45–60s ahead of vehicle arrival.
              </p>
            </div>
          </div>

          {/* Quick Override Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleForceAllGreen}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Lock All Green (Green Wave)</span>
            </button>

            <button
              type="button"
              onClick={handleResetAutomated}
              className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restore Adaptive</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualOverrides(!showManualOverrides)}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 text-xs font-mono transition-colors"
            >
              {showManualOverrides ? 'Hide Overrides' : 'Manual Overrides'}
            </button>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('hospitals')}
                className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium text-xs transition-colors flex items-center space-x-1.5"
              >
                <span>Step 3: Select Hospital</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Real-Time Corridor Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500">Corridor Status</div>
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{greenCount} Green Wave Locked</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{amberCount} in amber clearance</div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500">Inbound Unit Velocity</div>
            <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white mt-0.5">
              {ambulance?.speed_kmh ?? 58} <span className="text-[11px] text-slate-400 font-normal">km/h</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Call-sign: {ambulance?.callsign ?? 'MEDIC-12'}</div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500">Corridor Length</div>
            <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white mt-0.5">
              {ambulance?.distance_remaining_km ?? 3.2} <span className="text-[11px] text-slate-400 font-normal">km</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">ETA: ~{Math.round((ambulance?.eta_seconds ?? 240) / 60)} min</div>
          </div>

          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500">Preemption Delta</div>
            <div className="text-sm font-semibold font-mono text-slate-900 dark:text-white mt-0.5">
              -195s <span className="text-[11px] text-slate-400 font-normal">(-3.2 min)</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Zero intersection dwell stalls</div>
          </div>
        </div>

        {/* Visual Corridor Progression Track */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
            <span>Corridor Progression Track</span>
            <span className="text-emerald-600 dark:text-emerald-400">All 5 Signal Intersections Synced</span>
          </div>

          <div className="relative flex items-center justify-between bg-slate-100 dark:bg-slate-850 p-2.5 rounded-md border border-slate-200 dark:border-slate-800">
            <div className="absolute left-6 right-6 top-1/2 h-1 bg-slate-300 dark:bg-slate-700 -translate-y-1/2 rounded-full z-0"></div>
            
            {signals.map((s, idx) => {
              const isGreen = s.state === 'green_wave';
              const isAmber = s.state === 'amber_prep';

              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-colors border-2 ${
                    isGreen 
                      ? 'bg-emerald-600 border-white text-white' 
                      : isAmber 
                      ? 'bg-amber-500 border-white text-white' 
                      : 'bg-red-600 border-white text-white'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 mt-1 max-w-[80px] text-center truncate">
                    {s.name.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Intersection Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {signals.map((sig, index) => {
          const meta = getSignalMeta(sig.state);
          const isGreen = sig.state === 'green_wave';
          const isAmber = sig.state === 'amber_prep';
          const isRed = !isGreen && !isAmber;

          return (
            <div
              key={sig.id}
              className={`rounded-lg border p-4 transition-colors flex flex-col justify-between bg-white dark:bg-slate-900 ${
                isGreen
                  ? 'border-emerald-300 dark:border-emerald-800'
                  : isAmber
                  ? 'border-amber-300 dark:border-amber-800'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Intersection Header & Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-slate-900 dark:bg-slate-800 text-white font-mono font-semibold text-[10px] flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Junction {index + 1}
                    </span>
                  </div>

                  <div className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center space-x-1.5 ${meta.badgeStyle}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`}></span>
                    <span>{meta.title}</span>
                  </div>
                </div>

                {/* Middle: Traffic Light Housing & Details */}
                <div className="flex items-center space-x-3 p-3 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 mb-3">
                  
                  {/* Aspect Housing */}
                  <div className="w-8 bg-slate-900 rounded p-1.5 flex flex-col items-center space-y-1.5 shrink-0 border border-slate-700">
                    <div 
                      onClick={() => handleSetSignalState(sig.id, 'red')}
                      title="Set RED"
                      className={`w-4 h-4 rounded-full cursor-pointer transition-colors border ${
                        isRed 
                          ? 'bg-red-600 border-red-400' 
                          : 'bg-red-950/40 border-red-900/30 opacity-40 hover:opacity-80'
                      }`}
                    />
                    <div 
                      onClick={() => handleSetSignalState(sig.id, 'amber_prep')}
                      title="Set AMBER"
                      className={`w-4 h-4 rounded-full cursor-pointer transition-colors border ${
                        isAmber 
                          ? 'bg-amber-400 border-amber-300' 
                          : 'bg-amber-950/40 border-amber-900/30 opacity-40 hover:opacity-80'
                      }`}
                    />
                    <div 
                      onClick={() => handleSetSignalState(sig.id, 'green_wave')}
                      title="Set GREEN"
                      className={`w-4 h-4 rounded-full cursor-pointer transition-colors border ${
                        isGreen 
                          ? 'bg-emerald-500 border-emerald-300' 
                          : 'bg-emerald-950/40 border-emerald-900/30 opacity-40 hover:opacity-80'
                      }`}
                    />
                  </div>

                  {/* Junction Name & Status */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {sig.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      {meta.desc}
                    </p>
                    <div className="text-[10px] font-mono text-slate-400 mt-1.5 flex items-center space-x-2">
                      <span>Proximity: <strong className="text-slate-700 dark:text-slate-300">{sig.distance_to_ambulance_m || (index + 1) * 350}m</strong></span>
                      <span>•</span>
                      <span>ETA: <strong className="text-slate-700 dark:text-slate-300">{sig.prep_countdown_sec || 30}s</strong></span>
                    </div>
                  </div>

                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Cross Traffic</span>
                    <span className={`font-semibold text-[11px] ${isGreen ? 'text-emerald-600' : isAmber ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {isGreen ? 'Halted (Preempted)' : isAmber ? 'Clearing Junction' : 'Standard Traffic Flow'}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Phase Window</span>
                    <span className="font-semibold text-[11px] text-slate-800 dark:text-slate-200">
                      {sig.prep_countdown_sec || 45}s Active Lock
                    </span>
                  </div>
                </div>

              </div>

              {/* Optional Manual Phase Overrides */}
              {showManualOverrides && (
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-mono text-slate-400 mb-1.5">
                    Manual Phase Override
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetSignalState(sig.id, 'green_wave')}
                      className={`py-1.5 px-1 rounded text-xs font-medium transition-colors flex items-center justify-center ${
                        isGreen 
                          ? 'bg-emerald-600 text-white font-semibold' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Green
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetSignalState(sig.id, 'amber_prep')}
                      className={`py-1.5 px-1 rounded text-xs font-medium transition-colors flex items-center justify-center ${
                        isAmber 
                          ? 'bg-amber-500 text-white font-semibold' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Amber
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetSignalState(sig.id, 'red')}
                      className={`py-1.5 px-1 rounded text-xs font-medium transition-colors flex items-center justify-center ${
                        isRed 
                          ? 'bg-red-600 text-white font-semibold' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      Red
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}
