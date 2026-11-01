import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Clock, 
  Activity,
  Wind,
  Navigation,
  CheckCircle2,
  FastForward
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
    { key: 'scenario_stemi', icon: Activity, title: '❤️ Heart Attack Emergency', label: 'Heart Attack' },
    { key: 'scenario_trauma', icon: AlertTriangle, title: '💥 Road Accident Trauma', label: 'Road Accident' },
    { key: 'scenario_pediatric', icon: Wind, title: '👶 Child Emergency Care', label: 'Child Emergency' },
  ];

  const handlePlayPause = () => {
    try { soundFx?.playClick?.(); } catch (e) {}
    onControlSimulation({ action: isRunning ? 'pause' : 'play', speed: simSpeed, scenarioKey });
  };

  const handleSpeedChange = (newSpeed) => {
    try { soundFx?.playClick?.(); } catch (e) {}
    onControlSimulation({ action: 'set_speed', speed: newSpeed, scenarioKey });
  };

  const handleScenarioChange = (newKey) => {
    try { soundFx?.playClick?.(); } catch (e) {}
    onControlSimulation({ action: 'set_scenario', speed: simSpeed, scenarioKey: newKey });
  };

  const handleToggleTraffic = () => {
    try { soundFx?.playClick?.(); } catch (e) {}
    onControlSimulation({ action: 'toggle_traffic', speed: simSpeed, scenarioKey });
  };

  const handleReset = () => {
    try { soundFx?.playClick?.(); } catch (e) {}
    onControlSimulation({ action: 'reset', speed: simSpeed, scenarioKey });
  };

  const formatEta = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2 transition-colors">
      <div className="max-w-[1780px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: 3 Big Emergency Scenario Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 scrollbar-none">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden xl:inline-block mr-1">
            🚨 Emergency Case:
          </span>
          {scenarios.map((s) => {
            const isSelected = s.key === scenarioKey;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => handleScenarioChange(s.key)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
                  isSelected
                    ? 'border-red-600 bg-red-600 text-white shadow-sm ring-2 ring-red-400 dark:ring-red-500/50'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <span>{s.title}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 inline ml-0.5" />}
              </button>
            );
          })}
        </div>

        {/* Center: Live Travel Summary */}
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-lg text-xs">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Clock className="w-4 h-4 text-red-600 dark:text-red-400 animate-pulse" />
            <span>ETA: <strong className="text-red-600 dark:text-red-400 text-sm font-black">{formatEta(amb?.eta_seconds)}</strong></span>
          </div>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600"></div>

          <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-300">
            <span>Distance:</span>
            <strong className="text-slate-900 dark:text-white font-mono">{amb?.distance_remaining_km ?? 3.2} km</strong>
          </div>

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600 hidden sm:block"></div>

          {/* Traffic Jam Injector / Detour Test */}
          <button
            type="button"
            onClick={handleToggleTraffic}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
              trafficJam
                ? 'border-red-400 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 animate-pulse'
                : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
            }`}
            title="Simulate road traffic jam to test green wave or reroute"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${trafficJam ? 'text-red-600' : 'text-amber-500'}`} />
            <span>{trafficJam ? 'Traffic Jam Active (Detour)' : 'Test Traffic Jam'}</span>
          </button>
        </div>

        {/* Right: Simulation Controls (Play, Reset, Speed) */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Play / Pause Button */}
          <button
            type="button"
            onClick={handlePlayPause}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              isRunning
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                : 'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            title="Reset to Start"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Buttons */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
            {[1.0, 2.0].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => handleSpeedChange(spd)}
                className={`px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  simSpeed === spd
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
