import React, { useState } from 'react';
import { 
  Gauge, 
  Navigation, 
  Clock, 
  ShieldCheck, 
  Siren, 
  PhoneCall, 
  Building2, 
  CheckCircle2, 
  Sparkles,
  Volume2,
  X,
  Video,
  Radio,
  Mic
} from 'lucide-react';
import { soundFx } from '@/services/sound';
import { callService } from '@/services/callService';
import CallSelectorModal from '@/components/common/CallSelectorModal';

export default function TelemetryHUD({ 
  ambulance, 
  nextSignal, 
  signals = [], 
  setTelemetry,
  hospitals = [],
  onSelectHospital,
  onNavigateTab 
}) {
  const [sirenOn, setSirenOn] = useState(ambulance?.siren_active ?? true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [greenWaveSuccess, setGreenWaveSuccess] = useState(false);

  const speed = ambulance?.speed_kmh ?? 58;
  const dist = ambulance?.distance_remaining_km ?? 3.2;
  const etaSec = ambulance?.eta_seconds ?? 240;
  const etaMin = Math.round(etaSec / 60);

  // Big Action 1: Force all signals to GREEN (Green Wave)
  const handleTurnAllSignalsGreen = () => {
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

    setGreenWaveSuccess(true);
    setTimeout(() => setGreenWaveSuccess(false), 4000);
  };

  // Big Action 2: Toggle Emergency Siren
  const handleToggleSiren = () => {
    const nextState = !sirenOn;
    setSirenOn(nextState);
    try {
      if (nextState) soundFx?.playSiren?.();
      else soundFx?.playClick?.();
    } catch (e) {}

    if (setTelemetry) {
      setTelemetry(prev => ({
        ...prev,
        ambulance: {
          ...prev.ambulance,
          siren_active: nextState
        }
      }));
    }
  };

  return (
    <div className="space-y-3">
      
      {/* Active Patient Pickup Dispatch Banner (Emergency Dispatch) */}
      {ambulance?.active_patient_ride && (
        <div className="p-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in border-2 border-red-400/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg shrink-0 animate-bounce">
              📍
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-red-200 tracking-wider">
                🚨 Active Patient Pickup Assigned (Emergency Mission)
              </div>
              <div className="text-sm font-black text-white">
                {ambulance.active_patient_ride.pickupAddress}
              </div>
              <div className="text-xs text-red-100">
                Patient: <strong>{ambulance.active_patient_ride.patientName}</strong> • Emergency: <strong>{ambulance.active_patient_ride.emergencyType}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                try { soundFx?.playClick?.(); } catch (e) {}
                callService.makeCall({
                  targetRole: 'patient',
                  callerRole: 'driver',
                  callType: 'voice',
                  callerName: 'Ambulance MEDIC-12 (Driver Rajesh)',
                  targetName: 'Citizen Patient',
                  department: 'Emergency Pickup Line'
                });
              }}
              className="px-4 py-2 bg-white text-red-600 hover:bg-red-50 text-xs font-black rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer ring-2 ring-white/40"
            >
              <PhoneCall className="w-3.5 h-3.5 fill-current" />
              <span>Call Patient (Voice)</span>
            </button>
          </div>
        </div>
      )}

      {/* Green Wave Celebration Banner */}
      {greenWaveSuccess && (
        <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="font-bold text-sm">
              🛣️ ALL TRAFFIC LIGHTS TURNED GREEN! Clear road ahead for Ambulance!
            </span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
            Green Wave Active
          </span>
        </div>
      )}

      {/* 4 Big Action Buttons for Ambulance Driver */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        
        {/* 1. Clear Signals Button */}
        <button
          type="button"
          onClick={handleTurnAllSignalsGreen}
          className="p-3.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer group"
        >
          <Sparkles className="w-5 h-5 animate-spin" />
          <div className="text-left leading-tight">
            <div className="text-xs uppercase tracking-wide opacity-90">One-Tap Action</div>
            <div className="text-sm font-black">Turn Signals GREEN 🟢</div>
          </div>
        </button>

        {/* 2. Siren Toggle Button */}
        <button
          type="button"
          onClick={handleToggleSiren}
          className={`p-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer ${
            sirenOn
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white ring-2 ring-red-400 animate-pulse'
              : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
          }`}
        >
          <Siren className="w-5 h-5" />
          <div className="text-left leading-tight">
            <div className="text-xs uppercase tracking-wide opacity-90">Emergency Sound</div>
            <div className="text-sm font-black">{sirenOn ? '🚨 Siren: ACTIVE' : 'Siren: OFF'}</div>
          </div>
        </button>

        {/* 3. Choose Hospital Button */}
        <button
          type="button"
          onClick={() => setShowHospitalModal(true)}
          className="p-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-400 text-slate-800 dark:text-slate-100 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="text-left leading-tight">
            <div className="text-xs uppercase tracking-wide text-slate-400">Destination</div>
            <div className="text-sm font-black">Change Hospital 🏥</div>
          </div>
        </button>

        {/* 4. Direct 1-Tap Call to AIIMS ER Doctor */}
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => {
              try { soundFx?.playClick?.(); } catch (e) {}
              callService.makeCall({
                targetRole: 'hospital',
                callerRole: 'driver',
                callType: 'voice',
                callerName: 'Ambulance MEDIC-12 (Paramedic Rajesh)',
                targetName: 'Dr. Rajesh Sharma (AIIMS ER Lead)',
                department: 'Emergency Transit Telemetry'
              });
            }}
            className="flex-1 p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer ring-2 ring-blue-400/40"
          >
            <PhoneCall className="w-5 h-5 animate-pulse" />
            <div className="text-left leading-tight">
              <div className="text-[10px] uppercase tracking-wide opacity-90 font-mono">1-Tap Direct Call</div>
              <div className="text-sm font-black">Call ER Doctor 📞</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setShowCallModal(true)}
            className="p-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-bold transition-all flex items-center justify-center cursor-pointer shadow-sm"
            title="Open Directory to Choose Other Specialists or Patient"
          >
            <Radio className="w-4 h-4 text-blue-500" />
          </button>
        </div>

      </div>

      {/* 4 Clean Driver Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* Speed Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Current Speed
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {Math.round(speed)}
              </span>
              <span className="text-xs font-bold text-slate-400">km/h</span>
            </div>
          </div>
        </div>

        {/* Distance Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Distance Left
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {dist.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400">km</span>
            </div>
          </div>
        </div>

        {/* Arrival Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Time to Reach
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-red-600 dark:text-red-400 font-mono">
                {etaMin > 0 ? etaMin : '< 1'}
              </span>
              <span className="text-xs font-bold text-slate-400">minutes</span>
            </div>
          </div>
        </div>

        {/* Traffic Signals Ahead */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-center space-x-3.5 shadow-xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Traffic Signals
            </div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
              {nextSignal?.state === 'green_wave' ? '🟢 Green Wave Active' : '🟢 Road Signals Synced'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {nextSignal ? nextSignal.name : 'All 4 Junctions Cleared'}
            </div>
          </div>
        </div>

      </div>

      {/* Hospital Selection Modal */}
      {showHospitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Select Destination Hospital
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHospitalModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select the nearest hospital. The navigation route and traffic green wave will automatically update!
            </p>

            <div className="space-y-2.5">
              {hospitals.slice(0, 4).map((hosp) => {
                const isCurrent = hosp.id === ambulance?.target_hospital_id;
                return (
                  <button
                    key={hosp.id}
                    type="button"
                    onClick={() => {
                      if (onSelectHospital) onSelectHospital(hosp.id);
                      setShowHospitalModal(false);
                    }}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-red-600 bg-red-50 dark:bg-red-950/40 ring-2 ring-red-400'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {hosp.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Distance: <strong>{hosp.travel_distance_km || 3.2} km</strong> • ICU Beds Free: <strong>{hosp.icu_beds_available || 8}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isCurrent
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}>
                        {isCurrent ? 'Current Route' : 'Route Here'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Emergency Audio & Video Communication Modal */}
      <CallSelectorModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        callerRole="driver"
        initialTab="doctors"
        callerName="Ambulance MEDIC-12 (Paramedic Rajesh)"
      />

    </div>
  );
}

