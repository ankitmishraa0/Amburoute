import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Clock, 
  Building2, 
  CheckCircle2, 
  Heart, 
  Wind, 
  PhoneCall, 
  CheckSquare, 
  Square, 
  Printer,
  Sparkles,
  User,
  X,
  Video,
  Radio
} from 'lucide-react';
import { fetchHandoffSummary } from '@/services/api';
import { soundFx } from '@/services/sound';
import { callService } from '@/services/callService';
import CallSelectorModal from '@/components/common/CallSelectorModal';

// Clean simulated ECG trace
function ECGMonitor({ heartRate = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const height = canvas.height;
    const width = canvas.width;
    const points = [];
    const maxPoints = width;

    let step = 0;
    const render = () => {
      step++;
      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(0, 0, width, height);

      // Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // ECG wave
      const beatInterval = Math.max(20, Math.floor(1800 / heartRate));
      const phase = step % beatInterval;
      let y = height / 2;

      if (phase === 4) y -= 4;
      else if (phase === 5) y -= 8;
      else if (phase === 8) y += 6;
      else if (phase === 10) y -= 42; // R spike
      else if (phase === 12) y += 18;
      else if (phase === 16) y -= 16;

      points.push(y);
      if (points.length > maxPoints) points.shift();

      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;

      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(i, points[i]);
        else ctx.lineTo(i, points[i]);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [heartRate]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
      <canvas ref={canvasRef} width={600} height={120} className="w-full h-[120px] block" />
      <div className="absolute top-2 left-3 flex items-center space-x-2 text-xs font-mono text-emerald-400 font-bold">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span>LIVE ECG HEART MONITOR</span>
      </div>
      <div className="absolute top-2 right-3 text-sm font-mono font-black text-emerald-400 flex items-center space-x-1.5">
        <Heart className="w-4 h-4 text-red-500 fill-current animate-bounce" />
        <span>{heartRate} BPM</span>
      </div>
    </div>
  );
}

export default function HospitalHandoffView({ 
  telemetry, 
  handoffData,
  onNavigateTab 
}) {
  const [data, setData] = useState(handoffData);
  const [isBedReserved, setIsBedReserved] = useState(false);
  const [isTeamAlerted, setIsTeamAlerted] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [medsList, setMedsList] = useState([
    { id: 1, name: 'Aspirin 325mg (Chewed)', done: true },
    { id: 2, name: 'High Flow Oxygen (15L Non-Rebreather)', done: true },
    { id: 3, name: 'IV Line 18G Access Established', done: true },
    { id: 4, name: 'Nitroglycerin 0.4mg Sublingual', done: false },
    { id: 5, name: 'Cath Lab Stent Angioplasty Prep', done: false },
  ]);

  useEffect(() => {
    fetchHandoffSummary()
      .then(res => setData(res))
      .catch(console.error);
  }, [telemetry?.scenario_key]);

  const toggleMed = (id) => {
    try { soundFx?.playClick?.(); } catch (e) {}
    setMedsList(prev => prev.map(m => m.id === id ? { ...m, done: !m.done } : m));
  };

  const handleReserveBed = () => {
    try { soundFx?.playClick?.(); } catch (e) {}
    setIsBedReserved(!isBedReserved);
  };

  const handleAlertTeam = () => {
    try { soundFx?.playAlert?.(); } catch (e) {}
    setIsTeamAlerted(!isTeamAlerted);
  };

  const amb = telemetry?.ambulance;
  const inc = telemetry?.incident;
  const vitals = inc?.patient_vitals || {
    heart_rate: 134,
    systolic_bp: 82,
    diastolic_bp: 54,
    spo2: 88,
    age: 58
  };

  const formatSecs = (sec) => {
    if (!sec && sec !== 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner: Incoming Ambulance Countdown */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-5 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-red-200">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>Emergency Department • AIIMS Gorakhpur ER</span>
          </div>
          <h2 className="text-xl font-black tracking-tight">
            🚑 Ambulance MEDIC-12 is Rushing to Your Trauma Bay!
          </h2>
          <p className="text-xs text-red-100">
            Patient: <strong>58 Year Old Male • Severe Heart Attack (STEMI)</strong>
          </p>
        </div>

        {/* Big Countdown Timer */}
        <div className="bg-black/30 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0">
          <span className="text-[10px] uppercase font-bold text-red-200 tracking-wider block">
            Time Until Arrival
          </span>
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            {formatSecs(amb?.eta_seconds || 240)}
          </div>
          <span className="text-[11px] text-red-100 font-bold block">
            {amb?.distance_remaining_km ?? 3.2} km away
          </span>
        </div>
      </div>

      {/* 3 BIG 1-CLICK DOCTOR ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* 1. Reserve Bed */}
        <button
          type="button"
          onClick={handleReserveBed}
          className={`p-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center space-x-2.5 cursor-pointer ${
            isBedReserved
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
              : 'bg-white dark:bg-slate-800 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50'
          }`}
        >
          <Building2 className="w-6 h-6" />
          <div className="text-left leading-tight">
            <div className="text-xs uppercase opacity-80">ER Resuscitation</div>
            <div className="text-sm font-black">
              {isBedReserved ? '✅ Bed #3 Reserved & Ready' : '🛏️ Reserve ER Bed #3'}
            </div>
          </div>
        </button>

        {/* 2. Alert Team */}
        <button
          type="button"
          onClick={handleAlertTeam}
          className={`p-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center space-x-2.5 cursor-pointer ${
            isTeamAlerted
              ? 'bg-red-600 text-white ring-2 ring-red-400'
              : 'bg-white dark:bg-slate-800 border-2 border-red-500 text-red-700 dark:text-red-400 hover:bg-red-50'
          }`}
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          <div className="text-left leading-tight">
            <div className="text-xs uppercase opacity-80">Specialist On-Call</div>
            <div className="text-sm font-black">
              {isTeamAlerted ? '✅ Cardiology Team Alerted' : '🩺 Alert Cardiology Team'}
            </div>
          </div>
        </button>

        {/* 3. Call Paramedic */}
        <button
          type="button"
          onClick={() => setShowCallModal(true)}
          className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
        >
          <PhoneCall className="w-6 h-6 animate-pulse" />
          <div className="text-left leading-tight">
            <div className="text-xs uppercase text-blue-200">Direct Audio</div>
            <div className="text-sm font-black">Call Ambulance Driver 📞</div>
          </div>
        </button>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left 8 Cols: Patient Vitals & Live ECG */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Live Patient Health Signals (Vitals)
                </h3>
                <p className="text-xs text-slate-500">
                  Transmitted directly from vehicle sensors in real time
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                🔴 Code-1 STEMI
              </span>
            </div>

            {/* Live ECG Waveform */}
            <ECGMonitor heartRate={vitals.heart_rate} />

            {/* 3 Big Vital Cards with Easy Color Indicators */}
            <div className="grid grid-cols-3 gap-3">
              
              {/* Heart Rate */}
              <div className="bg-red-50 dark:bg-red-950/30 p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 text-center">
                <Heart className="w-5 h-5 text-red-600 mx-auto mb-1 animate-bounce" />
                <div className="text-xs text-red-700 dark:text-red-400 font-bold uppercase">Heart Rate</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {vitals.heart_rate} <span className="text-xs font-normal text-slate-400">bpm</span>
                </div>
                <span className="text-xs font-bold text-red-600">⚠️ Dangerously High</span>
              </div>

              {/* Blood Pressure */}
              <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/60 text-center">
                <Activity className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <div className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase">Blood Pressure</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {vitals.systolic_bp}/{vitals.diastolic_bp}
                </div>
                <span className="text-xs font-bold text-amber-600">⚠️ Low Pressure</span>
              </div>

              {/* Oxygen Level */}
              <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 text-center">
                <Wind className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <div className="text-xs text-blue-700 dark:text-blue-400 font-bold uppercase">Oxygen (SpO2)</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {vitals.spo2}%
                </div>
                <span className="text-xs font-bold text-blue-600">⚠️ Give Oxygen Mask</span>
              </div>

            </div>

          </div>

        </div>

        {/* Right 4 Cols: Emergency Medication Checklist */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Prepared Medications & Treatments:
            </h3>
            <p className="text-xs text-slate-500">
              Click to check off items ready in trauma bay:
            </p>

            <div className="space-y-2">
              {medsList.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => toggleMed(med.id)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center space-x-2.5 cursor-pointer ${
                    med.done
                      ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {med.done ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>{med.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Medical Admission Slip</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Real-time Emergency Audio & Video Communication Modal */}
      <CallSelectorModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        callerRole="hospital"
        initialTab="ambulances"
        callerName="Dr. Rajesh Sharma (AIIMS ER Desk)"
      />

    </div>
  );
}
