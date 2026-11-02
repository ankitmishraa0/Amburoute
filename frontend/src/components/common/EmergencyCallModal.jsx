import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Heart, 
  Activity, 
  Wind, 
  Maximize2, 
  Minimize2,
  Shield,
  PhoneCall,
  Volume2,
  Radio,
  User,
  Navigation
} from 'lucide-react';
import { callService, normalizeRole } from '@/services/callService';
import { soundFx } from '@/services/sound';

export default function EmergencyCallModal({ telemetry }) {
  const [callState, setCallState] = useState('idle'); // 'idle' | 'outgoing' | 'incoming' | 'connected'
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callTarget, setCallTarget] = useState('driver');
  const [callType, setCallType] = useState('voice');

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    const unsubState = callService.on('stateChange', (state) => {
      setCallState(state);
      setCallTarget(normalizeRole(callService.activeCallTarget || 'driver'));
      setCallType(callService.callType || 'voice');
      if (state === 'connected') {
        try { soundFx.playSuccess(); } catch (e) {}
      }
    });

    const unsubConnected = callService.on('connected', ({ remoteStream, localStream }) => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play?.().catch(() => {});
      }
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play?.().catch(() => {});
      }
    });

    const unsubEnded = callService.on('ended', () => {
      setCallState('idle');
      setDuration(0);
    });

    return () => {
      unsubState();
      unsubConnected();
      unsubEnded();
    };
  }, []);

  // Timer for connected call
  useEffect(() => {
    let timer = null;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // Bind streams whenever video elements mount or callState changes
  useEffect(() => {
    if (callService.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = callService.localStream;
      localVideoRef.current.play?.().catch(() => {});
    }
    if (callService.remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = callService.remoteStream;
      remoteVideoRef.current.play?.().catch(() => {});
    }
  }, [callState]);

  if (callState !== 'outgoing' && callState !== 'connected') {
    return null;
  }

  const handleEndCall = () => {
    try { soundFx.playClick(); } catch (e) {}
    callService.endCall();
  };

  const handleToggleMute = () => {
    const next = callService.toggleMute();
    setIsMuted(next);
  };

  const handleToggleVideo = () => {
    const next = callService.toggleVideo();
    setIsVideoOff(next);
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const vitals = telemetry?.incident?.patient_vitals || {
    heart_rate: 134,
    systolic_bp: 82,
    diastolic_bp: 54,
    spo2: 88
  };

  const normalizedTarget = normalizeRole(callTarget);
  const targetName = callService.activeCallTargetName || (
    normalizedTarget === 'hospital' 
      ? 'Dr. Rajesh Sharma (AIIMS ER Desk)' 
      : normalizedTarget === 'traffic' 
        ? 'ITMS Traffic Police Control' 
        : normalizedTarget === 'patient'
          ? 'Citizen Patient (Emergency SOS)'
          : 'Ambulance MEDIC-12 (Driver)'
  );

  const isVoiceOnly = callType === 'voice';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[560px] max-h-[92vh]">
        
        {/* Top Call Status Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-5 py-3 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center space-x-3">
            <span className={`w-3 h-3 rounded-full ${callState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'}`}></span>
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <span>{callState === 'connected' ? `🟢 Connected (${formatDuration(duration)})` : '📞 Connecting...'}</span>
                <span className="text-[10px] font-mono bg-blue-900/60 text-blue-300 px-1.5 py-0.2 rounded border border-blue-700">
                  {isVoiceOnly ? 'VOICE INTERCOM' : 'HD VIDEO'}
                </span>
              </div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>{targetName}</span>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-emerald-400 border border-slate-700">
                  {normalizedTarget === 'patient' ? 'Citizen Rider' : normalizedTarget === 'driver' ? 'Ambulance Crew' : 'Hospital Desk'}
                </span>
              </div>
            </div>
          </div>

          {/* Floating Vitals Pill */}
          <div className="hidden sm:flex items-center space-x-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <div className="flex items-center space-x-1 text-red-400 font-bold">
              <Heart className="w-3.5 h-3.5 fill-current animate-bounce" />
              <span>{vitals.heart_rate} bpm</span>
            </div>
            <div className="text-slate-500">|</div>
            <div className="text-amber-400 font-bold">
              BP: {vitals.systolic_bp}/{vitals.diastolic_bp}
            </div>
            <div className="text-slate-500">|</div>
            <div className="text-blue-400 font-bold">
              SpO2: {vitals.spo2}%
            </div>
          </div>
        </div>

        {/* Media Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          
          {/* Main Remote Video Stream (Hidden if voice-only unless video active) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${isVoiceOnly ? 'opacity-30 filter blur-xs' : ''}`}
          />

          {/* Voice Intercom HUD (shown prominently during voice call) */}
          {isVoiceOnly && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950/70 backdrop-blur-xs space-y-4">
              
              {/* Pulsing Intercom Center Circle */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <span className={`absolute inset-0 rounded-full ${callState === 'connected' ? 'bg-emerald-500/20 animate-ping' : 'bg-blue-500/20 animate-ping'}`}></span>
                <span className={`absolute inset-3 rounded-full ${callState === 'connected' ? 'bg-emerald-500/30 animate-pulse' : 'bg-blue-500/30 animate-pulse'}`}></span>
                <div className={`relative w-20 h-20 rounded-full text-white flex items-center justify-center shadow-2xl text-3xl ${callState === 'connected' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                  {normalizedTarget === 'patient' ? '🧑‍🤝‍🧑' : normalizedTarget === 'driver' ? '🚑' : '👨‍⚕️'}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">
                  {targetName}
                </h3>
                <div className="text-xs text-emerald-400 font-mono font-bold flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{callState === 'connected' ? 'TWO-WAY EMERGENCY VOICE INTERCOM ACTIVE' : 'CALLING DESTINATION...'}</span>
                </div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {normalizedTarget === 'patient' 
                    ? 'Patient and Ambulance Driver are directly connected on live audio line'
                    : 'Emergency communications channel active with real-time audio sync'}
                </p>
              </div>

              {/* Animated Audio Equalizer Bars */}
              {callState === 'connected' && (
                <div className="flex items-center justify-center space-x-1.5 h-8 pt-2">
                  {[40, 75, 55, 90, 65, 80, 45, 95, 60, 85, 50].map((h, i) => (
                    <span 
                      key={i} 
                      className="w-1.5 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full animate-pulse"
                      style={{ 
                        height: `${h}%`,
                        animationDelay: `${i * 90}ms`,
                        animationDuration: '600ms'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Outgoing Ringing Overlay if not yet connected */}
          {callState === 'outgoing' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-4 z-20">
              <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center animate-pulse">
                <PhoneCall className="w-10 h-10 text-blue-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Ringing {targetName}...
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Connecting live peer-to-peer audio & telemetry channel across devices / tabs...
                </p>
              </div>

              {/* Instant Answer Demo Simulation Button */}
              <button
                type="button"
                onClick={() => {
                  try { soundFx.playSuccess(); } catch (e) {}
                  callService.simulateConnected();
                }}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
                title="Immediately connect call if testing on single device/tab"
              >
                <span>⚡ Instant Connect / Simulate Answer 🟢</span>
              </button>
            </div>
          )}

          {/* Picture-in-Picture Local Video (Self View - shown in video mode) */}
          {!isVoiceOnly && (
            <div className="absolute bottom-4 right-4 w-36 h-28 sm:w-44 sm:h-32 bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl z-10">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 left-2 text-[10px] font-mono text-white/80 bg-black/50 px-1.5 py-0.5 rounded">
                Your Feed {isMuted ? '🔇' : ''}
              </div>
            </div>
          )}

          {/* On-Screen Patient Telemetry Watermark Overlay */}
          <div className="absolute top-4 left-4 bg-slate-950/70 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl text-xs space-y-1 z-10 hidden sm:block">
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-wide flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Live Patient Stream</span>
            </div>
            <div className="font-bold text-white text-xs">
              58y M • Acute STEMI (Heart Attack)
            </div>
          </div>

        </div>

        {/* Bottom Call Controls Toolbar */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-center space-x-4 shrink-0">
          
          {/* Mute Mic */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-3.5 rounded-2xl font-bold transition-all cursor-pointer ${
              isMuted
                ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Video Camera (only in video mode) */}
          {!isVoiceOnly && (
            <button
              type="button"
              onClick={handleToggleVideo}
              className={`p-3.5 rounded-2xl font-bold transition-all cursor-pointer ${
                isVideoOff
                  ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isVideoOff ? 'Turn Camera ON' : 'Turn Camera OFF'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* Big Red End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-sm shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 cursor-pointer ring-2 ring-red-400"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </button>

        </div>

      </div>
    </div>
  );
}
