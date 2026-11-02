import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Shield, 
  MapPin, 
  Navigation, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Activity, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  BellRing,
  Truck
} from 'lucide-react';
import { rideService } from '@/services/rideService';
import { soundFx } from '@/services/sound';
import CallSelectorModal from '@/components/common/CallSelectorModal';

export default function DriverStandbyView({ 
  currentUser, 
  onSimulateIncomingRequest,
  onAcceptRide 
}) {
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pulseCount, setPulseCount] = useState(0);
  const [simulatedTriggered, setSimulatedTriggered] = useState(false);
  const [incomingRide, setIncomingRide] = useState(null);

  useEffect(() => {
    const unsub = rideService.on('rideRequest', (ride) => {
      console.log('DriverStandbyView 🚨 received rideRequest:', ride);
      setIncomingRide(ride);
      try {
        soundFx.startRinging();
        soundFx.playAlert();
      } catch (e) {}
    });

    return () => {
      unsub();
      try { soundFx.stopRinging(); } catch (e) {}
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseCount(p => (p + 1) % 100);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTestCall = () => {
    setSimulatedTriggered(true);
    try { soundFx?.playAlert?.(); } catch (e) {}

    // Dispatch a test request immediately
    rideService.requestRide({
      patientName: 'Pooja Verma (Emergency Patient)',
      pickupAddress: 'Golghar Fountain Chowk, Gorakhpur',
      pickupCoords: { lat: 26.7606, lng: 83.3732 },
      emergencyType: 'heart_attack',
      hospitalId: 'hosp-gkp-aiims',
      hospitalName: 'AIIMS Gorakhpur Super-Specialty ER',
      targetDriverId: currentUser?.id || 'driver108',
      ambulanceCallsign: 'Ambulance MEDIC-12 (ALS)'
    });

    if (onSimulateIncomingRequest) {
      onSimulateIncomingRequest();
    }

    setTimeout(() => setSimulatedTriggered(false), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/70 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-inner shrink-0 relative">
              🚑
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  🟢 DRIVER ON-DUTY • STANDBY
                </span>
                <span className="text-xs text-slate-400">Station: Golghar Central Hub</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Ambulance MEDIC-12 <span className="text-slate-400 text-base font-medium">({currentUser?.name || 'Driver Rajesh Sharma'})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Vehicle: ALS Super-Care ICU • Ready for Instant Emergency Dispatch
              </p>
            </div>
          </div>

          {/* Quick Sound / Comms Controls */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center space-x-2 ${
                soundEnabled 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? 'Siren Audio ON' : 'Audio Muted'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCallModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Patient / Doctor 📞</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-Priority Incoming Ride Request Card directly in Standby View */}
      {incomingRide && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-3xl p-5 sm:p-6 shadow-2xl border-4 border-red-300 ring-8 ring-red-500/30 animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-4 h-4 rounded-full bg-white animate-ping" />
              <span className="font-black text-sm uppercase tracking-wider">🚨 NEW EMERGENCY PATIENT CALL (Emergency Dispatch)</span>
            </div>
            <span className="text-xs font-mono font-black bg-white/25 px-3 py-1 rounded-full">PRIORITY CODE-1</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-black/25 p-3.5 rounded-2xl space-y-1">
              <span className="font-bold opacity-75 block text-[10px] uppercase">Patient Complaint</span>
              <span className="font-black text-sm text-white">{incomingRide.patientName}</span>
              <span className="block opacity-90 text-[11px]">Type: {incomingRide.emergencyType || 'Heart Attack / STEMI'}</span>
            </div>
            <div className="bg-black/25 p-3.5 rounded-2xl space-y-1">
              <span className="font-bold opacity-75 block text-[10px] uppercase">Pickup Point</span>
              <span className="font-black text-sm text-white">📍 {incomingRide.pickupAddress}</span>
              <span className="block opacity-90 text-[11px]">Hospital: {incomingRide.hospitalName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                try { soundFx.stopRinging(); soundFx.playSuccess(); } catch (e) {}
                const accepted = rideService.acceptRide(incomingRide);
                setIncomingRide(null);
                if (onAcceptRide) onAcceptRide(accepted);
              }}
              className="flex-1 py-4 px-6 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-800 font-black text-sm sm:text-base shadow-2xl flex items-center justify-center space-x-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>ACCEPT RIDE & START MISSION (GO) 🟢</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { soundFx.stopRinging(); } catch (e) {}
                rideService.rejectRide(incomingRide.rideId);
                setIncomingRide(null);
              }}
              className="px-6 py-4 rounded-2xl bg-black/40 hover:bg-black/60 text-white font-bold text-xs sm:text-sm cursor-pointer transition-all"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Main Radar Scanning Console */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden min-h-[460px] flex flex-col items-center justify-center text-center">
        
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at center, #10b981 1px, transparent 1px)`,
            backgroundSize: '36px 36px'
          }}
        />

        {/* Radar Center Animation */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 my-4 flex items-center justify-center">
          {/* Concentric Radar Rings */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-pulse" />
          <div className="absolute inset-8 rounded-full border border-emerald-500/25" />
          <div className="absolute inset-16 rounded-full border border-emerald-500/30" />
          <div className="absolute inset-24 rounded-full border border-emerald-500/35" />

          {/* Crosshairs */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-500/20" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-500/20" />

          {/* Rotating Radar Beam Sweep */}
          <div 
            className="absolute inset-0 rounded-full animate-spin pointer-events-none"
            style={{
              animationDuration: '4s',
              background: 'conic-gradient(from 0deg at 50% 50%, rgba(16, 185, 129, 0) 0deg, rgba(16, 185, 129, 0) 270deg, rgba(16, 185, 129, 0.4) 360deg)'
            }}
          />

          {/* Pulsing Sonar Waves */}
          <div className="absolute w-28 h-28 rounded-full bg-emerald-500/10 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />

          {/* Random Radar Blips (Simulating Gorakhpur Emergency Grid) */}
          <div className="absolute top-14 left-16 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" title="Golghar Tower" />
          <div className="absolute bottom-20 right-16 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-ping" style={{ animationDuration: '2.5s' }} title="Civil Lines" />
          <div className="absolute top-24 right-20 w-2.5 h-2.5 rounded-full bg-amber-400/80 shadow-[0_0_6px_#f59e0b]" title="Medical College Crossing" />

          {/* Center Ambulance Icon */}
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-white/40 shadow-xl flex items-center justify-center text-white ring-4 ring-emerald-500/30">
            <Radio className="w-8 h-8 animate-pulse text-white" />
          </div>
        </div>

        {/* Searching Status Text */}
        <div className="max-w-md space-y-2 relative z-10 mt-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-black tracking-wide shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>RADAR ACTIVE • SCANNING FOR PATIENTS</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            Searching for Patient Requests...
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Ambulance unit is on standby in <span className="text-white font-semibold">Gorakhpur</span>. As soon as a patient books an ambulance from their phone, this screen will sound a high-priority siren and display the emergency request!
          </p>
        </div>

        {/* Instant Simulation Action for Cross-Device or Single-Device Verification */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 w-full max-w-lg flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
          <button
            type="button"
            onClick={handleTestCall}
            disabled={simulatedTriggered}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs shadow-lg hover:shadow-red-500/25 transition-all cursor-pointer flex items-center justify-center space-x-2 ring-2 ring-red-500/40"
          >
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>{simulatedTriggered ? 'Dispatching Test Call...' : '⚡ Test Incoming Patient Request'}</span>
          </button>

          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Ready for real phone requests via Cloud SSE</span>
          </div>
        </div>

      </div>

      {/* Driver Telemetry Checklist & Readiness Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg shrink-0">
            📡
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">GPS & Cloud Relay</div>
            <div className="text-xs font-black text-emerald-400">Connected (ntfy.sh SSE)</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-lg shrink-0">
            🏥
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Destination Ready</div>
            <div className="text-xs font-black text-blue-400">AIIMS Gorakhpur ER Bay</div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-lg shrink-0">
            🚦
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">ITMS Traffic Link</div>
            <div className="text-xs font-black text-purple-400">Green Wave Corridor Armed</div>
          </div>
        </div>
      </div>

      <CallSelectorModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        callerRole="driver"
        callerName={`Ambulance MEDIC-12 (${currentUser?.name || 'Driver Rajesh'})`}
      />
    </div>
  );
}

