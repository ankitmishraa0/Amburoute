import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Clock, 
  Activity,
  Wind,
  ShieldAlert
} from 'lucide-react';
import { soundFx } from '@/services/sound';

export default function SimulationBar({ 
  telemetry, 
  onControlSimulation 
}) {
  const isRunning = telemetry?.is_running ?? true;
  const simSpeed = telemetry?.sim_speed ?? 1.0;
  const progress = telemetry?.progress ?? 0.0;
  const trafficJam = telemetry?.traffic_jam_injected ?? false;
  const scenarioKey = telemetry?.scenario_key ?? 'scenario_stemi';
  const amb = telemetry?.ambulance;

  const scenarios = [
    { key: 'scenario_stemi', icon: Activity, title: 'Cardiac STEMI', code: 'Priority 1' },
    { key: 'scenario_trauma', icon: AlertTriangle, title: 'Multi-Trauma', code: 'Priority 1' },
    { key: 'scenario_pediatric', icon: Wind, title: 'Pediatric Respiratory', code: 'Priority 2' },
  ];

  const handlePlayPause = () => {
    onControlSimulation({ action: isRunning ? 'pause' : 'play', speed: simSpeed, scenarioKey });
  };

  const handleSpeedChange = (newSpeed) => {
    onControlSimulation({ action: 'set_speed', speed: newSpeed, scenarioKey });
  };

  const handleScenarioChange = (newKey) => {
    onControlSimulation({ action: 'set_scenario', speed: simSpeed, scenarioKey: newKey });
  };

  const handleToggleTraffic = () => {
    onControlSimulation({ action: 'toggle_traffic', speed: simSpeed, scenarioKey });
  };

  const handleReset = () => {
    onControlSimulation({ action: 'reset', speed: simSpeed, scenarioKey });
  };

  const formatEta = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2">
      <div className="max-w-[1780px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Scenario Switcher */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 scrollbar-none">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden xl:inline-block mr-1">
            Dispatch Case:
          </span>
          {scenarios.map((s) => {
            const isSelected = s.key === scenarioKey;
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => handleScenarioChange(s.key)}
                className={`flex items-center space-x-2 px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap border ${
                  isSelected
                    ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="leading-tight">{s.title}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${
                  isSelected 
                    ? 'bg-slate-800 dark:bg-slate-200 text-slate-200 dark:text-slate-800' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {s.code}
                </span>
              </button>
            );
          })}
        </div>

        {/* Center: Play/Pause, Reset, Speed & Detour */}
        <div className="flex items-center space-x-2">
          
          {/* Play / Pause Button */}
          <button
            onClick={handlePlayPause}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              isRunning
                ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                : 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            title="Reset Simulation"
            className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Simulation Speeds */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-800">
            {[1.0, 2.0, 4.0].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`px-2 py-0.5 text-xs font-mono transition-colors ${
                  simSpeed === spd
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Traffic Jam Detour Toggle */}
          <button
            onClick={handleToggleTraffic}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              trafficJam
                ? 'border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
            title="Simulate corridor congestion to evaluate automatic rerouting"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${trafficJam ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
            <span>{trafficJam ? 'Congestion Active (Detour)' : 'Simulate Congestion'}</span>
          </button>
        </div>

        {/* Right: Route Progress & ETA */}
        <div className="hidden lg:flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-md">
          <div className="flex flex-col">
            <div className="flex items-center justify-between space-x-3 text-[11px] font-mono">
              <span className="text-slate-500 dark:text-slate-400">Progress</span>
              <span className="font-semibold text-slate-900 dark:text-white">{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-0.5">
              <div 
                className="bg-red-600 dark:bg-red-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700"></div>

          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Target ETA</div>
              <div className="text-xs font-mono font-semibold text-slate-900 dark:text-white leading-tight">
                {formatEta(amb?.eta_seconds)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
