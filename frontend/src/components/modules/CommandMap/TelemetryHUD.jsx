import React from 'react';
import { Gauge, Navigation, Clock, ShieldCheck, Zap, Radio } from 'lucide-react';

export default function TelemetryHUD({ ambulance, nextSignal }) {
  const speed = ambulance?.speed_kmh ?? 0;
  const dist = ambulance?.distance_remaining_km ?? 0;
  const etaSec = ambulance?.eta_seconds ?? 0;
  const etaMin = Math.round(etaSec / 60);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Velocity */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center space-x-3 shadow-xs hover:border-rose-300 hover:shadow-md transition-all">
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
          <Gauge className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">
            Vehicle Speed
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
              {Math.round(speed)}
            </span>
            <span className="text-xs text-slate-500 font-mono">KM/H</span>
          </div>
        </div>
      </div>

      {/* 2. Distance Remaining */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center space-x-3 shadow-xs hover:border-blue-300 hover:shadow-md transition-all">
        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
          <Navigation className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">
            Distance to Target
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-900">
              {dist.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-mono">KM</span>
          </div>
        </div>
      </div>

      {/* 3. Estimated Arrival */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center space-x-3 shadow-xs hover:border-amber-300 hover:shadow-md transition-all">
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">
            Estimated Arrival
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-700">
              {etaMin > 0 ? etaMin : '< 1'}
            </span>
            <span className="text-xs text-slate-500 font-mono">MIN</span>
          </div>
        </div>
      </div>

      {/* 4. Traffic Signal Preemption */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center space-x-3 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all">
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono font-bold">
            Signal Preemption
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-sm sm:text-base font-bold text-emerald-700">
              {nextSignal?.state === 'green_wave' ? 'Green Wave Clear' : 'Preempting Next'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
            {nextSignal ? nextSignal.name : 'All Signals Coordinated'}
          </div>
        </div>
      </div>
    </div>
  );
}
