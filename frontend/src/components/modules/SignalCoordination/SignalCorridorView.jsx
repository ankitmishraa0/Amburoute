import React, { useState } from 'react';
import { 
  Signal, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  Check,
  AlertCircle,
  Clock,
  Navigation,
  ArrowRight,
  PhoneCall,
  Radio,
  Video
} from 'lucide-react';
import { overrideSignal } from '@/services/api';
import { soundFx } from '@/services/sound';
import { callService } from '@/services/callService';
import CallSelectorModal from '@/components/common/CallSelectorModal';

export default function SignalCorridorView({ 
  signals = [], 
  ambulance, 
  setTelemetry, 
  onSignalUpdated,
  onNavigateTab 
}) {
  const [activeToast, setActiveToast] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);

  const triggerToast = (msg) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3500);
  };

  // Turn single junction Green or Red
  const handleSetSignalState = async (sigId, newState) => {
    try { 
      if (newState === 'green_wave') soundFx?.playOverride?.(); 
      else soundFx?.playClick?.();
    } catch (e) {}

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
      green_wave: '🟢 GREEN (Wave Open)',
      amber_prep: '🟡 AMBER (Clearing)',
      red: '🔴 RED (Cross Traffic Stopped)'
    };
    triggerToast(`Junction updated to: ${stateNames[newState] || newState}`);

    try {
      if (newState === 'green_wave') {
        await overrideSignal(sigId);
        if (onSignalUpdated) onSignalUpdated();
      }
    } catch (e) {}
  };

  // Turn ALL junctions green with 1 click
  const handleForceAllGreen = () => {
    try { 
      soundFx?.playOverride?.();
      soundFx?.playAlert?.();
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
    triggerToast('🎉 GREEN WAVE CLEARED! All 4 traffic signals locked GREEN for ambulance!');
  };

  // Reset to normal automatic cycle
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
    triggerToast('Restored to standard automatic city traffic cycles.');
  };

  const greenCount = signals.filter(s => s.state === 'green_wave').length;

  return (
    <div className="space-y-4">
      
      {/* Toast Alert */}
      {activeToast && (
        <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl text-sm font-bold shadow-lg flex items-center justify-between border border-slate-700 animate-bounce">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{activeToast}</span>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
            Traffic Control Active
          </span>
        </div>
      )}

      {/* Top Hero Banner with GIANT 1-CLICK BUTTON */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-2xl shrink-0">
              🚦
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Traffic Police Signal Control Deck
              </h2>
              <p className="text-xs text-slate-500">
                Ambulance <strong className="text-red-600 font-bold">{ambulance?.callsign || 'MEDIC-12'}</strong> is en route to AIIMS Gorakhpur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAutomated}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Normal Traffic</span>
            </button>
          </div>
        </div>

        {/* THE GIANT BUTTON ("bachha bhi click kare") */}
        <button
          type="button"
          onClick={handleForceAllGreen}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-black text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3 cursor-pointer group scale-100 hover:scale-[1.01]"
        >
          <Sparkles className="w-6 h-6 animate-spin text-emerald-200" />
          <span>PRESS TO TURN ALL LIGHTS GREEN FOR AMBULANCE (GREEN WAVE) 🟢</span>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
            1-Click Emergency
          </span>
        </button>

        {/* 3 Status Stats */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Green Wave Status</div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {greenCount} / {signals.length} Green Lights
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Ambulance Speed</div>
            <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {ambulance?.speed_kmh || 58} km/h
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Time to AIIMS</div>
            <div className="text-sm font-black text-red-600 dark:text-red-400 mt-0.5 font-mono">
              ~{Math.round((ambulance?.eta_seconds || 240) / 60)} minutes
            </div>
          </div>
        </div>

        {/* Live Intercom Dispatch Bar for Traffic Police */}
        <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 dark:text-white">
                Live Field Dispatch Intercom
              </div>
              <div className="text-[11px] text-slate-500">
                Direct WebRTC voice line to active units across devices
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                try { soundFx?.playClick?.(); } catch (e) {}
                setShowCallModal(true);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Select Unit & Call 📞</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4 Large Street Junction Cards with Traffic Light Graphics */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Route Traffic Junctions (Road Signals Ahead):
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {signals.map((sig, idx) => {
            const isGreen = sig.state === 'green_wave';
            const isAmber = sig.state === 'amber_prep';
            const isRed = sig.state === 'red' || (!isGreen && !isAmber);

            return (
              <div
                key={sig.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isGreen
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-400/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Left: Traffic Light Graphic + Junction Name */}
                  <div className="flex items-center space-x-3.5">
                    
                    {/* Visual 3-circle Traffic Light Housing */}
                    <div className="w-9 bg-slate-900 dark:bg-black p-1.5 rounded-xl flex flex-col items-center space-y-1.5 shadow-md">
                      {/* Red Light */}
                      <div className={`w-5 h-5 rounded-full transition-all ${
                        isRed ? 'bg-red-500 shadow-md shadow-red-500/80 animate-pulse' : 'bg-red-950/40'
                      }`} />
                      {/* Amber Light */}
                      <div className={`w-5 h-5 rounded-full transition-all ${
                        isAmber ? 'bg-amber-400 shadow-md shadow-amber-400/80 animate-pulse' : 'bg-amber-950/40'
                      }`} />
                      {/* Green Light */}
                      <div className={`w-5 h-5 rounded-full transition-all ${
                        isGreen ? 'bg-emerald-500 shadow-md shadow-emerald-500/80 animate-pulse' : 'bg-emerald-950/40'
                      }`} />
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Junction #{idx + 1}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {sig.name}
                      </h4>
                      <div className="text-xs font-semibold mt-0.5">
                        {isGreen && <span className="text-emerald-600 dark:text-emerald-400">🟢 GREEN (Corridor Cleared)</span>}
                        {isAmber && <span className="text-amber-600 dark:text-amber-400">🟡 AMBER (Clearing Now)</span>}
                        {isRed && <span className="text-red-600 dark:text-red-400">🔴 RED (Waiting for Clearance)</span>}
                      </div>
                    </div>

                  </div>

                  {/* Right: Quick Toggle Buttons */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSetSignalState(sig.id, 'green_wave')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isGreen
                          ? 'bg-emerald-600 text-white font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700'
                      }`}
                    >
                      Turn GREEN 🟢
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetSignalState(sig.id, 'red')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isRed
                          ? 'bg-red-600 text-white font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100 hover:text-red-700'
                      }`}
                    >
                      Turn RED 🔴
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-Time Call Selector Modal */}
      <CallSelectorModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        callerRole="traffic"
        callerName="Inspector R. Verma (Traffic ITMS)"
      />

    </div>
  );
}
