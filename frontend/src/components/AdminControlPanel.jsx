import React, { useState } from 'react';
import { 
  Crown, 
  Sliders, 
  HeartPulse, 
  Signal, 
  Building2, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Save, 
  Zap, 
  Siren,
  ShieldAlert,
  User,
  Activity,
  Bed,
  Radio
} from 'lucide-react';
import { soundFx } from '../services/sound';

export default function AdminControlPanel({ 
  telemetry, 
  setTelemetry, 
  hospitals, 
  setHospitals, 
  onSelectScenario 
}) {
  const [speed, setSpeed] = useState(telemetry?.ambulance?.speed_kmh || 58);
  const [siren, setSiren] = useState(telemetry?.ambulance?.siren_active ?? true);
  const [heartRate, setHeartRate] = useState(telemetry?.incident?.patient_vitals?.heart_rate || 134);
  const [systolic, setSystolic] = useState(telemetry?.incident?.patient_vitals?.systolic_bp || 82);
  const [diastolic, setDiastolic] = useState(telemetry?.incident?.patient_vitals?.diastolic_bp || 54);
  const [spo2, setSpo2] = useState(telemetry?.incident?.patient_vitals?.spo2 || 88);
  const [gcs, setGcs] = useState(telemetry?.incident?.patient_vitals?.gcs_score || 14);
  const [patientAge, setPatientAge] = useState(telemetry?.incident?.patient_vitals?.age || 58);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    soundFx.playSuccess();
    setTimeout(() => setToastMsg(null), 3500);
  };

  // 1. Apply Ambulance & Patient Changes in Real-Time
  const handleApplyVitals = (e) => {
    e?.preventDefault();
    soundFx.playClick();

    setTelemetry(prev => ({
      ...prev,
      ambulance: {
        ...prev.ambulance,
        speed_kmh: Number(speed),
        siren_active: siren
      },
      incident: {
        ...prev.incident,
        patient_vitals: {
          ...prev.incident?.patient_vitals,
          heart_rate: Number(heartRate),
          systolic_bp: Number(systolic),
          diastolic_bp: Number(diastolic),
          spo2: Number(spo2),
          gcs_score: Number(gcs),
          age: Number(patientAge)
        }
      }
    }));

    showToast('Administrator Update Applied: Real-time telemetry broadcasted to Ambulance & Hospital ER!');
  };

  // 2. Force Green Wave on all Signals
  const handleForceAllGreen = () => {
    soundFx.playClick();
    setTelemetry(prev => ({
      ...prev,
      signals: (prev.signals || []).map(s => ({
        ...s,
        state: 'green_wave',
        countdown_sec: 45
      }))
    }));
    showToast('V2I Override Executed: All city intersections forced to GREEN WAVE!');
  };

  // 3. Reset All Signals to Standard Traffic Cycle
  const handleResetSignals = () => {
    soundFx.playClick();
    setTelemetry(prev => ({
      ...prev,
      signals: (prev.signals || []).map((s, idx) => ({
        ...s,
        state: idx === 0 ? 'green_wave' : 'amber_prep',
        countdown_sec: idx === 0 ? 30 : 15
      }))
    }));
    showToast('Signals restored to standard automated cycle.');
  };

  // 4. Update Hospital ICU Beds
  const handleUpdateHospitalBeds = (hospitalId, delta) => {
    soundFx.playClick();
    setHospitals(prev => prev.map(h => {
      if (h.id === hospitalId) {
        const newBeds = Math.max(0, (h.icu_beds_free || 0) + delta);
        return { ...h, icu_beds_free: newBeds };
      }
      return h;
    }));
    showToast(`Hospital ICU capacity modified by Administrator.`);
  };

  // 5. Inject / Clear Traffic Jam
  const handleToggleTrafficJam = () => {
    soundFx.playClick();
    const willJam = !telemetry?.traffic_jam_injected;
    setTelemetry(prev => ({
      ...prev,
      traffic_jam_injected: willJam,
      ambulance: {
        ...prev.ambulance,
        speed_kmh: willJam ? 18 : 65
      }
    }));
    setSpeed(willJam ? 18 : 65);
    showToast(willJam ? '⚠️ Traffic Gridlock Injected on Corridor! Speed dropped to 18 km/h.' : '✅ Corridor Cleared! Speed restored.');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 text-white shadow-xl shadow-amber-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner">
            👑
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-black tracking-tight">Super Administrator Control Deck</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-white text-amber-900 text-[10px] font-black uppercase tracking-wider">
                Full Root Access
              </span>
            </div>
            <p className="text-amber-100 text-xs sm:text-sm mt-0.5 max-w-xl">
              As the System Administrator, you have complete authority to manipulate vehicle speeds, inject patient vitals, override traffic lights, and modify hospital capacities in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleToggleTrafficJam}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-black text-xs transition-all flex items-center space-x-2 cursor-pointer border border-white/20"
          >
            <span>{telemetry?.traffic_jam_injected ? '🟢 Clear Traffic Jam' : '🔴 Inject Traffic Jam'}</span>
          </button>
          <button
            onClick={handleForceAllGreen}
            className="px-4 py-2.5 rounded-xl bg-white text-amber-900 hover:bg-amber-50 font-black text-xs transition-all shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Force All Signals GREEN</span>
          </button>
        </div>
      </div>

      {/* Floating Success Toast */}
      {toastMsg && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs shadow-lg flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 6 COLS: LIVE PATIENT & AMBULANCE VITALS INJECTOR */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">Patient Vitals & Ambulance Telemetry</h3>
                <p className="text-[11px] text-slate-500 font-medium">Changes here update the Ambulance HUD & Hospital ER in real time</p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              Live Link
            </span>
          </div>

          <form onSubmit={handleApplyVitals} className="space-y-4">
            
            {/* Speed Slider */}
            <div>
              <div className="flex justify-between text-xs font-black uppercase text-slate-700 mb-1">
                <span>Ambulance Speed</span>
                <span className="font-mono text-rose-600">{speed} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0 km/h (Stopped)</span>
                <span>60 km/h (City ALS)</span>
                <span>120 km/h (Expressway)</span>
              </div>
            </div>

            {/* Siren Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center space-x-2">
                <Siren className={`w-4 h-4 ${siren ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
                <span className="text-xs font-black text-slate-800">Emergency Siren Audio & Lights</span>
              </div>
              <button
                type="button"
                onClick={() => setSiren(!siren)}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  siren ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {siren ? 'ACTIVE' : 'MUTED'}
              </button>
            </div>

            {/* Vitals Inputs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Heart Rate (BPM)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Blood Pressure (Systolic)</label>
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Blood Pressure (Diastolic)</label>
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">SpO2 Oxygen (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">GCS Neurological Score</label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={gcs}
                  onChange={(e) => setGcs(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-rose-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Patient Age (Years)</label>
                <input
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-rose-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-rose-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Apply Changes to System</span>
            </button>
          </form>
        </div>

        {/* RIGHT 6 COLS: TRAFFIC PREEMPTION & HOSPITAL MATRIX OVERRIDE */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Traffic Signals Control Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Signal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">V2I Traffic Signal Grid Master Control</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Force green waves or test corridor traffic congestion</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleForceAllGreen}
                className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-emerald-800 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-black">⚡ All Signals GREEN</div>
                <div className="text-[10px] text-emerald-600 mt-0.5">Preempt all 5 intersections</div>
              </button>

              <button
                onClick={handleResetSignals}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-slate-800 text-left transition-all cursor-pointer"
              >
                <div className="text-xs font-black">🔄 Restore Normal Cycle</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Reset adaptive timer</div>
              </button>
            </div>
          </div>

          {/* Hospital Bed Capacity Master Override */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Hospital Bed Availability Override</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Increment or decrement ICU beds in real-time</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {hospitals.slice(0, 4).map((hosp) => (
                <div key={hosp.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-slate-900">{hosp.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      ICU Beds Available: <strong className="text-blue-700">{hosp.icu_beds_free}</strong>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleUpdateHospitalBeds(hosp.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 font-black text-xs hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-mono font-black text-xs text-slate-800">
                      {hosp.icu_beds_free}
                    </span>
                    <button
                      onClick={() => handleUpdateHospitalBeds(hosp.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 font-black text-xs hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
