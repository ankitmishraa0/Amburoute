import React from 'react';
import { Gauge, Navigation, Clock, ShieldCheck } from 'lucide-react';

export default function TelemetryHUD({ ambulance, nextSignal }) {
  const speed = ambulance?.speed_kmh ?? 0;
  const dist = ambulance?.distance_remaining_km ?? 0;
  const etaSec = ambulance?.eta_seconds ?? 0;
  const etaMin = Math.round(etaSec / 60);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {/* 1. Velocity */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center space-x-3 transition-colors">
        <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
          <Gauge className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
            Ground Speed
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {Math.round(speed)}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">km/h</span>
          </div>
        </div>
      </div>

      {/* 2. Distance Remaining */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center space-x-3 transition-colors">
        <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
          <Navigation className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
            Destination Distance
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {dist.toFixed(1)}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">km</span>
          </div>
        </div>
      </div>

      {/* 3. Estimated Arrival */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center space-x-3 transition-colors">
        <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
            Estimated Arrival
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {etaMin > 0 ? etaMin : '< 1'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">min</span>
          </div>
        </div>
      </div>

      {/* 4. Traffic Signal Preemption */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center space-x-3 transition-colors">
        <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
            Corridor Preemption
          </div>
          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
            {nextSignal?.state === 'green_wave' ? 'Green Wave Clear' : 'Next Cycle Preempted'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {nextSignal ? nextSignal.name : 'All Intersections Synced'}
          </div>
        </div>
      </div>
    </div>
  );
}
