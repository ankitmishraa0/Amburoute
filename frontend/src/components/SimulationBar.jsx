import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Clock, 
  Navigation, 
  Sparkles,
  Zap,
  Gauge
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
    { key: 'scenario_stemi', icon: '❤️', title: 'Cardiac STEMI', sub: 'Code-1 Heart Attack' },
    { key: 'scenario_trauma', icon: '🚨', title: 'Highway Poly-Trauma', sub: 'Multi-Vehicle Collision' },
    { key: 'scenario_pediatric', icon: '🫁', title: 'Pediatric Respiratory', sub: 'Severe Status Asthmaticus' },
  ];

  const handlePlayPause = () => {
    soundFx.playClick();
    onControlSimulation({ action: isRunning ? 'pause' : 'play', speed: simSpeed, scenarioKey });
  };

  const handleSpeedChange = (newSpeed) => {
    soundFx.playClick();
    onControlSimulation({ action: 'set_speed', speed: newSpeed, scenarioKey });
  };

  const handleScenarioChange = (newKey) => {
    soundFx.playChime?.() || soundFx.playClick();
    onControlSimulation({ action: 'set_scenario', speed: simSpeed, scenarioKey: newKey });
  };

  const handleToggleTraffic = () => {
    soundFx.playReroute();
    onControlSimulation({ action: 'toggle_traffic', speed: simSpeed, scenarioKey });
  };

  const handleReset = () => {
    soundFx.playClick();
    onControlSimulation({ action: 'reset', speed: simSpeed, scenarioKey });
  };

  const formatEta = (seconds) => {
    if (!seconds && seconds !== 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-xs">
      <div className="max-w-[1780px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Scenario Switcher */}
        <div className="flex items-center space-x-2 overflow-x-auto py-0.5 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden xl:inline-block mr-1">
            Emergency Scenario:
          </span>
          {scenarios.map((s) => {
            const isSelected = s.key === scenarioKey;
            return (
              <button
                key={s.key}
                onClick={() => handleScenarioChange(s.key)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-sm border border-rose-600'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span className="text-base">{s.icon}</span>
                <div className="text-left">
                  <div className="font-bold leading-tight">{s.title}</div>
                  <div className={`text-[9px] font-mono font-normal ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>{s.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Center: Play/Pause, Reset, Speed & Detour */}
        <div className="flex items-center space-x-2">
          
          {/* Play / Pause Button */}
          <button
            onClick={handlePlayPause}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              isRunning
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isRunning ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            title="Reset Simulation"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Simulation Speeds */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
            {[1.0, 2.0, 4.0].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  simSpeed === spd
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Traffic Jam Detour Toggle */}
          <button
            onClick={handleToggleTraffic}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              trafficJam
                ? 'bg-rose-600 text-white border border-rose-700 animate-pulse'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
            title="Simulate sudden traffic congestion to test AI dynamic arterial rerouting"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>{trafficJam ? 'Detour Active' : 'Inject Traffic Jam'}</span>
          </button>
        </div>

        {/* Right: Live Mission Progress Meter */}
        <div className="hidden lg:flex items-center space-x-4 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
          <div className="flex flex-col">
            <div className="flex items-center justify-between space-x-3 text-[11px] font-mono">
              <span className="text-slate-500 font-medium">Route Progress</span>
              <span className="text-rose-600 font-bold">{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-gradient-to-r from-rose-500 to-red-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-200"></div>

          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">ETA</div>
              <div className="text-xs font-mono font-bold text-slate-900 leading-tight">
                {formatEta(amb?.eta_seconds)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
