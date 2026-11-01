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
  PhoneCall
} from 'lucide-react';
import { callService } from '@/services/callService';
import { soundFx } from '@/services/sound';

export default function EmergencyCallModal({ telemetry }) {
  const [callState, setCallState] = useState('idle'); // 'idle' | 'outgoing' | 'incoming' | 'connected'
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callTarget, setCallTarget] = useState('');

  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    const unsubState = callService.on('stateChange', (state) => {
      setCallState(state);
      setCallTarget(callService.activeCallTarget || 'hospital');
      if (state === 'connected') {
        try { soundFx.playSuccess(); } catch (e) {}
      }
    });

    const unsubConnected = callService.on('connected', ({ remoteStream, localStream }) => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
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

  // Bind streams whenever video elements mount
  useEffect(() => {
    if (callService.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = callService.localStream;
    }
    if (callService.remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = callService.remoteStream;
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

  const targetName = callService.activeCallTargetName || (
    callTarget === 'hospital' 
      ? 'Dr. Rajesh Sharma (AIIMS ER Desk)' 
      : callTarget === 'traffic' 
        ? 'ITMS Traffic Police Control' 
        : callTarget === 'patient'
          ? 'Citizen Patient (Emergency SOS)'
          : 'Ambulance MEDIC-12'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px] max-h-[92vh]">
        
        {/* Top Call Status Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 px-5 py-3 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center space-x-3">
            <span className={`w-3 h-3 rounded-full ${callState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'}`}></span>
            <div>
              <div className="text-xs uppercase font-bold text-slate-400">
                {callState === 'connected' ? `🟢 Connected (${formatDuration(duration)})` : '📞 Calling Destination...'}
              </div>
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                <span>{targetName}</span>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  Secure Audio & Video
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

        {/* Video Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          
          {/* Main Remote Video Stream */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Outgoing Ringing Overlay if not yet connected */}
          {callState === 'outgoing' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center animate-pulse">
                <PhoneCall className="w-10 h-10 text-blue-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Ringing {targetName}...
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Connecting live peer-to-peer WebRTC video and audio channel. Waiting for response...
                </p>
              </div>
            </div>
          )}

          {/* Picture-in-Picture Local Video (Self View) */}
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

          {/* Toggle Video Camera */}
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
