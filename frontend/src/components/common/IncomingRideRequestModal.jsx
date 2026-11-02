import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  MapPin, 
  Navigation, 
  Clock, 
  Heart, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Building2,
  Sparkles
} from 'lucide-react';
import { rideService } from '@/services/rideService';
import { soundFx } from '@/services/sound';

export default function IncomingRideRequestModal({ onRideAccepted }) {
  const [incomingRide, setIncomingRide] = useState(null);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const unsub = rideService.on('rideRequest', (ride) => {
      setIncomingRide(ride);
      setCountdown(30);
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

  // 30s auto-decline countdown
  useEffect(() => {
    let timer = null;
    if (incomingRide && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            handleDecline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [incomingRide, countdown]);

  if (!incomingRide) return null;

  const handleAccept = () => {
    try {
      soundFx.stopRinging();
      soundFx.playSuccess();
    } catch (e) {}
    
    const acceptedRide = rideService.acceptRide(incomingRide);
    setIncomingRide(null);
    if (onRideAccepted) {
      onRideAccepted(acceptedRide);
    }
  };

  const handleDecline = () => {
    try {
      soundFx.stopRinging();
      soundFx.playClick();
    } catch (e) {}

    rideService.rejectRide(incomingRide.rideId);
    setIncomingRide(null);
  };

  const emergencyTitles = {
    heart_attack: '🫀 Acute Chest Pain / Suspected STEMI',
    accident: '💥 Severe Trauma / Road Accident',
    breathing: '🫁 Acute Respiratory Distress',
    pregnancy: '🤰 Maternity / Labor Emergency',
    general: '🩺 Unconscious Patient / General Emergency'
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-red-500 rounded-3xl p-6 shadow-2xl space-y-5 ring-4 ring-red-500/30 text-slate-900 dark:text-white">
        
        {/* Pulsing Emergency Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">
              🚨 NEW PATIENT RIDE REQUEST (Emergency Dispatch)
            </span>
          </div>

          <div className="text-xs font-mono font-black text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
            ⏳ {countdown}s Left
          </div>
        </div>

        {/* Patient Emergency Details */}
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 space-y-1">
            <div className="text-[10px] uppercase font-bold text-red-500 tracking-wider">
              Emergency Complaint
            </div>
            <div className="text-base font-black text-slate-900 dark:text-white">
              {emergencyTitles[incomingRide.emergencyType] || 'Medical Emergency'}
            </div>
            <div className="text-xs text-slate-500">
              Patient: <strong>{incomingRide.patientName}</strong> • High-Priority Ambulance Dispatch
            </div>
          </div>

          {/* Pickup Point & Destination */}
          <div className="space-y-2 text-xs">
            {/* Pickup */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Pickup Location (GPS)</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">{incomingRide.pickupAddress}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                  ~0.8 km from your current ambulance position
                </span>
              </div>
            </div>

            {/* Destination */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Destination Hospital</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs">{incomingRide.hospitalName}</span>
                <span className="text-[10px] text-slate-500 block">
                  ER Trauma Bay & Cath Lab on standby
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Big Action Buttons: Accept / Decline */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Decline Button */}
          <button
            type="button"
            onClick={handleDecline}
            className="py-4 px-4 bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
            <span>Decline</span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={handleAccept}
            className="py-4 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-2xl font-black text-sm shadow-xl hover:shadow-2xl transition-all flex items-center justify-center space-x-2 cursor-pointer ring-2 ring-emerald-400 animate-pulse"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>ACCEPT RIDE (GO) 🟢</span>
          </button>
        </div>

      </div>
    </div>
  );
}

