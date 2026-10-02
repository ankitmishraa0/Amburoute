import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Clock, 
  Building2, 
  CheckCircle2, 
  Heart, 
  Wind, 
  Brain, 
  CheckSquare, 
  Square, 
  Printer,
  Radio
} from 'lucide-react';
import { fetchHandoffSummary } from '@/services/api';

// Live simulated ECG trace on HTML5 Canvas
function ECGMonitor({ heartRate = 120, isCritical = true }) {
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

    // Background medical ECG grid
    const drawGrid = () => {
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
    };

    let step = 0;
    const render = () => {
      step++;
      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(0, 0, width, height);
      drawGrid();

      // Synthesize ECG QRS complex waveform
      const beatInterval = Math.max(20, Math.floor(1800 / heartRate));
      const phase = step % beatInterval;
      let y = height / 2;

      if (phase === 4) y -= 4;
      else if (phase === 5) y -= 8;
      else if (phase === 6) y -= 3;
      else if (phase === 8) y += 6;
      else if (phase === 10) y -= 42; // R spike
      else if (phase === 12) y += 18;
      else if (phase === 16) y -= isCritical ? 20 : 10;
      else if (phase === 18) y -= isCritical ? 14 : 6;

      points.push(y);
      if (points.length > maxPoints) points.shift();

      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;

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
    <div className="relative w-full rounded-md overflow-hidden border border-slate-700 bg-slate-950">
      <canvas ref={canvasRef} width={600} height={120} className="w-full h-[120px] block" />
      <div className="absolute top-2 left-3 flex items-center space-x-2 text-[10px] font-mono text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        <span>LEAD II TELEMETRY STREAM</span>
      </div>
      <div className="absolute top-2 right-3 text-xs font-mono font-semibold text-emerald-400 flex items-center space-x-1">
        <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
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
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const amb = telemetry?.ambulance;
  const inc = telemetry?.incident;
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
    <div className="space-y-4">
      
      {/* Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Hospital ER Trauma Bay Intake Terminal
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pre-arrival patient vitals and telemetry streamed from inbound ambulance to prepare resuscitation bay.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-medium transition-colors flex items-center space-x-1.5"
            title="Print Clinical Intake Record"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Clinical Record</span>
          </button>
          <div className="px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-mono text-red-700 dark:text-red-300 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            <span>Trauma Team Pre-Alerted</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left 8 Cols: Live Patient Telemetry */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Main Patient Header Card */}
          <div className="p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase text-red-600 dark:text-red-400 font-semibold">
                    Inbound: {amb?.callsign ?? 'MEDIC-12'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Destination: {hosp?.short_name ?? 'AIIMS Gorakhpur'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {inc?.title ?? 'Acute STEMI / Massive MI'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Patient Age: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{vitals.age}yo</strong> • Category: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{inc?.category ?? 'Cardiovascular'}</strong>
                </p>
              </div>

              {/* ETA Countdown */}
              <div className="text-right shrink-0 bg-slate-50 dark:bg-slate-850 px-3.5 py-2 rounded-md border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Time to Bay</span>
                <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 leading-tight">
                  {formatSecs(amb?.eta_seconds)}
                </div>
                <span className="text-[10px] font-mono text-slate-500 block">{amb?.distance_remaining_km ?? 2.4} km away</span>
              </div>
            </div>

            {/* Live ECG Waveform */}
            <div className="mt-3.5">
              <ECGMonitor heartRate={vitals.heart_rate} isCritical={isCritical} />
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center space-x-2.5">
                <Heart className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Heart Rate</span>
                  <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{vitals.heart_rate} bpm</span>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center space-x-2.5">
                <Activity className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Blood Pressure</span>
                  <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{vitals.systolic_bp}/{vitals.diastolic_bp}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center space-x-2.5">
                <Wind className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">SpO₂ Sat</span>
                  <span className={`text-sm font-mono font-semibold ${vitals.spo2 < 90 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                    {vitals.spo2}%
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center space-x-2.5">
                <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">GCS Score</span>
                  <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{vitals.gcs_score}/15</span>
                </div>
              </div>
            </div>

            {/* Paramedic Field Notes */}
            {vitals.notes && (
              <div className="mt-3.5 p-2.5 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                  Paramedic En-Route Notes:
                </span>
                "{vitals.notes}"
              </div>
            )}

          </div>

        </div>

        {/* Right 4 Cols: Trauma Bay Preparation Checklist */}
        <div className="lg:col-span-4 space-y-3">
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Pre-Arrival ER Checklist</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {checklist.filter(c => c.done).length}/{checklist.length} Ready
              </span>
            </div>

            <div className="space-y-1.5">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className={`w-full text-left p-2.5 rounded-md border transition-colors flex items-start space-x-2.5 ${
                    item.done
                      ? 'bg-slate-50 dark:bg-slate-850 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {item.done ? (
                      <CheckSquare className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className={`text-xs ${item.done ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item.label}
                    </div>
                    {item.required && (
                      <span className="text-[9px] font-mono uppercase text-red-600 dark:text-red-400">
                        Priority Protocol
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="text-[11px] font-mono text-slate-500">
                Attending Staff: <strong className="text-slate-700 dark:text-slate-300 font-semibold">ER Resuscitation Team</strong>
              </div>
            </div>
          </div>

          {/* Two-Way Radio Telemetry Channel */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs font-mono shadow-sm">
            <span className="text-slate-400 text-[10px] uppercase block">Direct CAD Radio Channel</span>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-900 dark:text-white font-semibold">MED-NET 404.25 MHz</span>
              <span className="text-emerald-600 dark:text-emerald-400">ENCRYPTED</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
