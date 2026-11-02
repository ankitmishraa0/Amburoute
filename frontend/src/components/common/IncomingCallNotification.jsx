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

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border-2 border-red-500 rounded-3xl p-6 shadow-2xl text-center space-y-5 ring-4 ring-red-500/30">
        
        {/* Pulsing Emergency Beacon Ring */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></span>
          <span className="absolute inset-2 rounded-full bg-red-500/40 animate-pulse"></span>
          <div className="relative w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
            {incomingCall.callType === 'video' ? (
              <Video className="w-8 h-8 animate-bounce" />
            ) : (
              <PhoneCall className="w-8 h-8 animate-bounce" />
            )}
          </div>
        </div>

        {/* Call Info */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-3 py-1 rounded-full border border-red-200 dark:border-red-900 inline-block animate-pulse">
              {isPatient 
                ? '🚨 CITIZEN PATIENT CALL' 
                : isAmbulance 
                  ? '🚑 AMBULANCE CREW CALL' 
                  : '🚨 INCOMING EMERGENCY CALL'}
            </span>
            <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase">
              {incomingCall.callType === 'video' ? '📹 HD Video Call' : '📞 Voice Intercom'}
            </span>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">
            {incomingCall.callerName || (isPatient ? 'Citizen Patient (SOS)' : isAmbulance ? 'Ambulance MEDIC-12' : isTraffic ? 'Traffic Control ITMS' : 'Doctor AIIMS')}
          </h3>

          {incomingCall.targetName && (
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-200 dark:border-blue-900/60 inline-block">
              🎯 Calling: <span className="underline">{incomingCall.targetName}</span>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isPatient
              ? 'Citizen Patient is calling on the direct emergency intercom line. Tap Accept to speak.'
              : isAmbulance 
                ? 'Ambulance Paramedic / Driver is calling with live response telemetry' 
                : isTraffic
                  ? 'Traffic Police Desk is calling with green wave corridor update'
                  : 'Hospital Trauma Desk is calling with pre-arrival medical orders'}
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
            <span>Accept Call 🟢</span>
          </button>
        </div>

      </div>
    </div>
  );
}
