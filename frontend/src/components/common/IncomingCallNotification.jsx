import React, { useState, useEffect } from 'react';
import { PhoneCall, PhoneOff, Video, Mic, Volume2 } from 'lucide-react';
import { callService, normalizeRole } from '@/services/callService';
import { soundFx } from '@/services/sound';

export default function IncomingCallNotification() {
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    const unsub = callService.on('incoming', (callData) => {
      setIncomingCall(callData);
      try {
        soundFx.startRinging();
      } catch (e) {}
    });

    const unsubEnd = callService.on('ended', () => {
      setIncomingCall(null);
      try {
        soundFx.stopRinging();
      } catch (e) {}
    });

    return () => {
      unsub();
      unsubEnd();
      try {
        soundFx.stopRinging();
      } catch (e) {}
    };
  }, []);

  if (!incomingCall) return null;

  const handleAccept = async () => {
    try {
      soundFx.stopRinging();
      soundFx.playClick();
    } catch (e) {}
    await callService.acceptCall();
    setIncomingCall(null);
  };

  const handleDecline = () => {
    try {
      soundFx.stopRinging();
      soundFx.playClick();
    } catch (e) {}
    callService.rejectCall();
    setIncomingCall(null);
  };

  const callerRole = normalizeRole(incomingCall.callerRole);
  const isAmbulance = callerRole === 'driver';
  const isTraffic = callerRole === 'traffic';
  const isPatient = callerRole === 'patient';
  const isHospital = callerRole === 'hospital';

  const ringColor = isHospital ? 'blue' : isPatient ? 'emerald' : 'red';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className={`relative w-full max-w-md bg-white dark:bg-slate-900 border-2 ${
        isHospital ? 'border-blue-500 ring-blue-500/30' : isPatient ? 'border-emerald-500 ring-emerald-500/30' : 'border-red-500 ring-red-500/30'
      } rounded-3xl p-6 shadow-2xl text-center space-y-5 ring-4`}>
        
        {/* Pulsing Emergency Beacon Ring */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <span className={`absolute inset-0 rounded-full ${
            isHospital ? 'bg-blue-500/20' : isPatient ? 'bg-emerald-500/20' : 'bg-red-500/20'
          } animate-ping`}></span>
          <span className={`absolute inset-2 rounded-full ${
            isHospital ? 'bg-blue-500/40' : isPatient ? 'bg-emerald-500/40' : 'bg-red-500/40'
          } animate-pulse`}></span>
          <div className={`relative w-16 h-16 rounded-full ${
            isHospital ? 'bg-blue-600' : isPatient ? 'bg-emerald-600' : 'bg-red-600'
          } text-white flex items-center justify-center shadow-lg text-2xl`}>
            {isHospital ? '👨‍⚕️' : isAmbulance ? '🚑' : isPatient ? '🧑‍🤝‍🧑' : (
              incomingCall.callType === 'video' ? (
                <Video className="w-8 h-8 animate-bounce" />
              ) : (
                <PhoneCall className="w-8 h-8 animate-bounce" />
              )
            )}
          </div>
        </div>

        {/* Call Info */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className={`text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border inline-block animate-pulse ${
              isHospital
                ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900'
                : isPatient 
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900'
                  : isAmbulance 
                    ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 border-red-200 dark:border-red-900'
                    : 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900'
            }`}>
              {isHospital
                ? '👨‍⚕️ AIIMS ER DOCTOR CALL'
                : isPatient 
                  ? '🚨 CITIZEN PATIENT CALL' 
                  : isAmbulance 
                    ? '🚑 AMBULANCE CREW CALL' 
                    : '🚦 TRAFFIC POLICE DESK CALL'}
            </span>
            <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase">
              {incomingCall.callType === 'video' ? '📹 HD Video Call' : '📞 Voice Intercom'}
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">
            {incomingCall.callerName || (isHospital ? 'Dr. Rajesh Sharma (AIIMS ER Lead)' : isPatient ? 'Citizen Patient (SOS)' : isAmbulance ? 'Ambulance MEDIC-12' : 'Traffic Control ITMS')}
          </h3>

          {incomingCall.department && (
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {incomingCall.department}
            </div>
          )}

          {incomingCall.targetName && (
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-200 dark:border-blue-900/60 inline-block">
              🎯 Calling: <span className="underline">{incomingCall.targetName}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isHospital
              ? 'AIIMS ER Doctor is calling Ambulance MEDIC-12 with pre-arrival Cath Lab prep and clinical instructions.'
              : isPatient
                ? 'Citizen Patient is calling on the direct emergency intercom line. Tap Accept to speak.'
                : isAmbulance 
                  ? 'Ambulance Paramedic / Driver is calling with live response telemetry' 
                  : 'Traffic Police Desk is calling with green wave corridor update'}
          </p>
        </div>

        {/* Big Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Decline */}
          <button
            type="button"
            onClick={handleDecline}
            className="py-3 px-4 bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <PhoneOff className="w-5 h-5" />
            <span>Decline</span>
          </button>

          {/* Accept */}
          <button
            type="button"
            onClick={handleAccept}
            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ring-2 ring-emerald-400 animate-pulse"
          >
            <PhoneCall className="w-5 h-5 fill-current" />
            <span>{isHospital ? 'Accept Doctor Call 🟢' : 'Accept Call 🟢'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
