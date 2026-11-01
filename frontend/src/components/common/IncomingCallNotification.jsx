import React, { useState, useEffect } from 'react';
import { PhoneCall, PhoneOff, Video, Mic, Volume2 } from 'lucide-react';
import { callService } from '@/services/callService';
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

  const isAmbulance = incomingCall.callerRole === 'driver';
  const isTraffic = incomingCall.callerRole === 'traffic';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
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
        <div className="space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-3 py-1 rounded-full border border-red-200 dark:border-red-900 inline-block animate-pulse">
            🚨 INCOMING EMERGENCY CALL
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white pt-1">
            {incomingCall.callerName || (isAmbulance ? 'Ambulance MEDIC-12' : isTraffic ? 'Traffic Control ITMS' : 'Doctor AIIMS')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAmbulance ? 'Ambulance Paramedic is calling with live patient telemedicine feed' : 'Priority Emergency Intercom Request'}
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
