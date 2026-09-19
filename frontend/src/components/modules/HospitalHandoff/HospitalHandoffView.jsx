import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Clock, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Heart, 
  Wind, 
  Thermometer, 
  Brain, 
  Navigation, 
  Sparkles, 
  Bell, 
  CheckSquare, 
  Square, 
  ShieldAlert 
} from 'lucide-react';
import { soundFx } from '@/services/sound';
import { fetchHandoffSummary } from '@/services/api';

// Live simulated ECG trace on HTML5 Canvas styled for Red & White Theme
function ECGMonitor({ heartRate = 120, isCritical = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let x = 0;
    const height = canvas.height;
    const width = canvas.width;
    const points = [];
    const maxPoints = width;

    // Background medical ECG grid
    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(225, 29, 72, 0.08)';
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
    };

    let step = 0;
    const render = () => {
      step++;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(0, 0, width, height);
      drawGrid();

      // Synthesize ECG QRS complex waveform
      const beatInterval = Math.max(20, Math.floor(1800 / heartRate));
      const phase = step % beatInterval;
      let y = height / 2;

      if (phase === 4) y -= 6;
      else if (phase === 5) y -= 10;
      else if (phase === 6) y -= 4;
      else if (phase === 8) y += 8;
      else if (phase === 10) y -= 48; // R spike
      else if (phase === 12) y += 22;
      else if (phase === 16) y -= isCritical ? 24 : 12;
      else if (phase === 18) y -= isCritical ? 18 : 8;

      points.push(y);
      if (points.length > maxPoints) points.shift();

      ctx.beginPath();
      ctx.strokeStyle = '#E11D48';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(225, 29, 72, 0.5)';

      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(i, points[i]);
        else ctx.lineTo(i, points[i]);
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [heartRate, isCritical]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-rose-200 bg-rose-50/20">
      <canvas ref={canvasRef} width={600} height={130} className="w-full h-[130px] block" />
      <div className="absolute top-2 left-3 flex items-center space-x-2 text-[10px] font-mono text-rose-700 font-bold">
        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
        <span>LEAD II TELEMETRY STREAM (LIVE)</span>
      </div>
      <div className="absolute top-2 right-3 text-xs font-mono font-bold text-rose-700 flex items-center space-x-1">
        <Heart className="w-3.5 h-3.5 text-rose-600 fill-current animate-pulse" />
        <span>{heartRate} BPM</span>
      </div>
    </div>
  );
}

export default function HospitalHandoffView({ 
  telemetry, 
  handoffData 
}) {
  const [data, setData] = useState(handoffData);
  const [checklist, setChecklist] = useState([]);

  useEffect(() => {
    fetchHandoffSummary()
      .then(res => {
        setData(res);
        setChecklist(res.prep_checklist || []);
      })
      .catch(console.error);
  }, [telemetry?.scenario_key]);

  const toggleChecklistItem = (id) => {
    soundFx.playClick();
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const amb = telemetry?.ambulance;
  const inc = telemetry?.incident;
  const triage = telemetry?.triage_assessment;
  const hosp = data?.receiving_hospital;
  const vitals = inc?.patient_vitals || {
    heart_rate: 134,
    systolic_bp: 82,
    diastolic_bp: 54,
    spo2: 88,
    respiratory_rate: 28,
    temperature_c: 36.8,
    gcs_score: 14,
    age: 58,
    symptoms: []
  };

  const isCritical = true;

  const formatSecs = (sec) => {
    if (!sec && sec !== 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-black tracking-wide text-slate-900">
              Hospital ER Trauma Bay Reception Terminal
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulated receiving hospital portal. Telemetry is beamed directly from the incoming ambulance to prepare resuscitation bays before arrival.
          </p>
        </div>

        <div className="flex items-center space-x-3">

          <button
            onClick={() => {
              soundFx.playClick();
              window.print();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
            title="Print / Save Clinical ER Intake Slip as PDF"
          >
            <span>🖨️</span>
            <span>Print Clinical Handover Slip</span>
          </button>
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-700 font-bold flex items-center space-x-2">
            <Bell className="w-4 h-4 text-rose-600 animate-bounce" />
            <span>TRAUMA TEAM ALERTED</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 8 Cols: Live Incoming Patient Telemetry Card */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Patient Header Card */}
          <div className="p-6 rounded-2xl border bg-white border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-rose-600 font-bold">
                    INCOMING UNIT: {amb?.callsign ?? 'MEDIC-12'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    DESTINATION: {hosp?.short_name ?? 'AIIMS Gorakhpur Trauma'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {inc?.title ?? 'Acute STEMI / Massive MI'}
                </h3>
                <p className="text-xs text-slate-600 font-mono">
                  Patient Age: <strong className="text-slate-900">{vitals.age}yo</strong> • Primary Category: <strong className="text-rose-600">{inc?.category ?? 'Cardiovascular'}</strong>
                </p>
              </div>

              {/* Big ETA Countdown */}
              <div className="text-right shrink-0 bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Time to ER Bay</span>
                <div className="text-3xl font-black font-mono text-rose-700">
                  {formatSecs(amb?.eta_seconds)}
                </div>
                <span className="text-[10px] font-mono text-slate-600 block">{amb?.distance_remaining_km ?? 2.4} km away</span>
              </div>
            </div>

            {/* Live ECG Waveform */}
            <div className="mt-4">
              <ECGMonitor heartRate={vitals.heart_rate} isCritical={isCritical} />
            </div>

            {/* Live Vitals Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              
              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center space-x-3">
                <Heart className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Heart Rate</span>
                  <span className="text-base font-mono font-bold text-rose-700">{vitals.heart_rate} bpm</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-3">
                <Activity className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">Blood Pressure</span>
                  <span className="text-base font-mono font-bold text-slate-900">{vitals.systolic_bp}/{vitals.diastolic_bp}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center space-x-3">
                <Wind className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">SpO₂ Sat</span>
                  <span className={`text-base font-mono font-bold ${vitals.spo2 < 90 ? 'text-rose-600' : 'text-blue-700'}`}>
                    {vitals.spo2}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center space-x-3">
                <Brain className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase block">GCS Score</span>
                  <span className="text-base font-mono font-bold text-slate-900">{vitals.gcs_score}/15</span>
                </div>
              </div>

            </div>

            {/* Field Notes from Paramedics */}
            {vitals.notes && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <strong className="text-slate-500 font-mono uppercase text-[10px] block mb-1">
                  Paramedic En-Route Notes:
                </strong>
                "{vitals.notes}"
              </div>
            )}

          </div>

        </div>

        {/* Right 4 Cols: Trauma Bay Preparation Checklist */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-rose-600" />
                <span>Pre-Arrival ER Readiness</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 font-bold">
                {checklist.filter(c => c.done).length}/{checklist.length} READY
              </span>
            </div>

            <div className="space-y-2.5">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                    item.done
                      ? 'bg-rose-50/60 border-rose-300 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.done ? (
                      <CheckSquare className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className={`text-xs font-semibold ${item.done ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                      {item.label}
                    </div>
                    {item.required && (
                      <span className="text-[9px] font-mono uppercase text-rose-600 font-bold">
                        Mandatory Code-1 Protocol
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <div className="text-[11px] font-mono text-slate-500">
                Receiving Physician: <strong className="text-slate-900">Dr. C. Sterling (Attending ER)</strong>
              </div>
            </div>
          </div>

          {/* Quick Dial Audio Dispatch */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-mono shadow-xs">
            <span className="text-slate-500 text-[10px] uppercase block">Two-Way Radio Telemetry Channel</span>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-rose-700 font-bold">MED-NET 404.25 MHz</span>
              <span className="text-emerald-700 font-bold">ENCRYPTED DUPLEX</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
