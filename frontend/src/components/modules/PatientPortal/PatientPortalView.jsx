import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Heart, 
  PhoneCall, 
  Video, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  X,
  User,
  Star,
  Activity,
  Zap,
  PhoneForwarded,
  RotateCcw
} from 'lucide-react';
import { soundFx } from '@/services/sound';
import { callService, DOCTORS_DIRECTORY, AMBULANCES_DIRECTORY } from '@/services/callService';
import CallSelectorModal from '@/components/common/CallSelectorModal';

export default function PatientPortalView({ 
  telemetry, 
  hospitals = [],
  onNavigateTab 
}) {
  // Booking Form State
  const [pickupAddress, setPickupAddress] = useState('Golghar Commercial Hub, Gorakhpur, UP');
  const [selectedEmergency, setSelectedEmergency] = useState('heart_attack');
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('amb-medic-12');
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitals[0]?.id || 'hosp-gkp-aiims');
  
  // Active Ride Booking State (Rapido / Uber tracking)
  const [bookingState, setBookingState] = useState('booking'); // 'booking' | 'en_route' | 'arrived'
  const [etaSeconds, setEtaSeconds] = useState(180); // 3 minutes countdown
  const [showCallModal, setShowCallModal] = useState(false);

  const emergencyCategories = [
    { id: 'heart_attack', label: 'Chest Pain / Heart Attack', emoji: '🫀', color: 'red', desc: 'Critical ALS ICU needed' },
    { id: 'accident', label: 'Road Accident / Trauma', emoji: '💥', color: 'amber', desc: 'Severe bleeding & injury' },
    { id: 'breathing', label: 'Breathing Difficulty / Asthma', emoji: '🫁', color: 'blue', desc: 'Oxygen support needed' },
    { id: 'pregnancy', label: 'Pregnancy & Labor Rush', emoji: '🤰', color: 'purple', desc: 'Maternity assistance' },
    { id: 'general', label: 'Unconscious / Fainting', emoji: '🩺', color: 'emerald', desc: 'General emergency' },
  ];

  // Selected ambulance & hospital details
  const selectedAmb = AMBULANCES_DIRECTORY.find(a => a.id === selectedAmbulanceId) || AMBULANCES_DIRECTORY[0];
  const selectedHosp = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0] || {
    name: 'AIIMS Gorakhpur Super-Specialty ER',
    distance_km: 2.4,
    travel_time_min: 5,
    icu_beds_available: 14,
    emergency_rating: 4.9
  };

  // Live countdown timer when ride is active
  useEffect(() => {
    let timer = null;
    if (bookingState === 'en_route' && etaSeconds > 0) {
      timer = setInterval(() => {
        setEtaSeconds(prev => {
          if (prev <= 1) {
            setBookingState('arrived');
            try { soundFx?.playSuccess?.(); } catch (e) {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [bookingState, etaSeconds]);

  const formatEta = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleBookAmbulance = () => {
    try { 
      soundFx?.playAlert?.(); 
      soundFx?.playSiren?.();
    } catch (e) {}
    setBookingState('en_route');
    setEtaSeconds(180);
  };

  const handleCancelBooking = () => {
    try { soundFx?.playClick?.(); } catch (e) {}
    setBookingState('booking');
    setEtaSeconds(180);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">

      {/* TOP LOCATION BAR (ZOMATO STYLE) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-lg shrink-0">
            <MapPin className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Your Live Pickup Location (Auto-Detected GPS)</span>
            </div>
            <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="truncate">{pickupAddress}</span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold cursor-pointer underline">
                Change
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900 shrink-0 self-start sm:self-auto">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>3 Ambulances Online Nearby • Avg ETA: 3 min</span>
        </div>
      </div>

      {/* ==================== ACTIVE BOOKING TRACKING VIEW (RAPIDO / UBER STYLE) ==================== */}
      {bookingState === 'en_route' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Big Hero Banner with ETA Countdown */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ring-4 ring-red-500/20">
            <div className="space-y-1.5">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-mono font-black uppercase tracking-wider inline-block animate-pulse">
                🚨 AMBULANCE EN ROUTE TO YOU
              </span>
              <h2 className="text-2xl font-black tracking-tight">
                Ambulance {selectedAmb.callsign} is Rushing to Your Location!
              </h2>
              <p className="text-xs text-red-100 flex items-center gap-2">
                <span>Driver: <strong>{selectedAmb.crew}</strong></span>
                <span>•</span>
                <span>Vehicle: <strong>UP53-EMG-108 (ALS ICU Setup)</strong></span>
              </p>
            </div>

            {/* Countdown Clock */}
            <div className="bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 text-center shrink-0 self-start md:self-auto">
              <span className="text-[10px] uppercase font-bold text-red-200 tracking-wider block">
                Estimated Time of Arrival
              </span>
              <div className="text-4xl font-black font-mono text-white tracking-tight">
                {formatEta(etaSeconds)}
              </div>
              <span className="text-[11px] text-emerald-300 font-bold block mt-0.5">
                🟢 Traffic Green Wave Active
              </span>
            </div>
          </div>

          {/* Quick Action Buttons for Patient: Call Driver & Video Call Paramedic */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Voice Call Driver */}
            <button
              type="button"
              onClick={() => {
                try { soundFx?.playClick?.(); } catch (e) {}
                callService.makeCall({
                  targetRole: 'driver',
                  callType: 'voice',
                  callerName: 'Citizen Patient (Emergency SOS)',
                  targetName: selectedAmb.callsign,
                  department: selectedAmb.location
                });
              }}
              className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <PhoneCall className="w-5 h-5 animate-bounce" />
              <span>Call Ambulance Driver (Audio)</span>
            </button>

            {/* 2. Video Call Paramedic */}
            <button
              type="button"
              onClick={() => {
                try { soundFx?.playClick?.(); } catch (e) {}
                callService.makeCall({
                  targetRole: 'driver',
                  callType: 'video',
                  callerName: 'Citizen Patient (Emergency SOS)',
                  targetName: selectedAmb.callsign,
                  department: selectedAmb.location
                });
              }}
              className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer ring-2 ring-blue-400/40"
            >
              <Video className="w-5 h-5 animate-pulse" />
              <span>Video Call Paramedic (Live Feed)</span>
            </button>

            {/* 3. Call Destination Hospital ER Doctor */}
            <button
              type="button"
              onClick={() => setShowCallModal(true)}
              className="p-4 rounded-2xl bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
            >
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Call AIIMS ER Doctor 📞</span>
            </button>
          </div>

          {/* Live Progress Bar & Ride Details Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center justify-between">
              <span>Emergency Ride Status (Rapido Style)</span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full font-bold">
                ● Live GPS Tracking
              </span>
            </h3>

            {/* Ride Stages */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold pt-1">
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                <span>Request Confirmed</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                <span>Driver Dispatched</span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-900 animate-pulse font-black">
                <Navigation className="w-4 h-4 mx-auto mb-1 text-red-600" />
                <span>Approaching Pickup</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Building2 className="w-4 h-4 mx-auto mb-1" />
                <span>Hospital ER Handoff</span>
              </div>
            </div>

            {/* Destination Hospital Summary */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">🏥</div>
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400">Destination Emergency Room</div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">{selectedHosp.name}</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    🟢 Trauma Bay Reserved • Specialist Doctor Alerted
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelBooking}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-400 hover:text-red-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel Booking
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ==================== NORMAL BOOKING INTERFACE (ZOMATO / RAPIDO CAROUSEL) ==================== */}
      {bookingState === 'booking' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* STEP 1: EMERGENCY SYMPTOM SELECTOR (ZOMATO STYLE CHIPS) */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Step 1: What is the Medical Emergency? (Tap to Select)
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {emergencyCategories.map((cat) => {
                const isSelected = selectedEmergency === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      try { soundFx?.playClick?.(); } catch (e) {}
                      setSelectedEmergency(cat.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-red-50 dark:bg-red-950/50 border-red-500 dark:border-red-600 shadow-md ring-2 ring-red-400/30'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.emoji}</div>
                    <div>
                      <div className={`text-xs font-black ${isSelected ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {cat.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        {cat.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: AVAILABLE AMBULANCE FLEET (RAPIDO RIDE TYPE SELECTOR) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Step 2: Choose Available Ambulance Nearby (Rapido Style)
              </label>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ● 100% Free Govt 108 Service
              </span>
            </div>

            <div className="space-y-2.5">
              {AMBULANCES_DIRECTORY.map((amb) => {
                const isSelected = selectedAmbulanceId === amb.id;
                return (
                  <div
                    key={amb.id}
                    onClick={() => {
                      try { soundFx?.playClick?.(); } catch (e) {}
                      setSelectedAmbulanceId(amb.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-red-50/70 dark:bg-red-950/40 border-red-500 dark:border-red-600 shadow-md ring-2 ring-red-500/20'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="text-3xl shrink-0 mt-0.5 p-2 rounded-2xl bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-900">
                        {amb.avatar}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-900 dark:text-white text-base">
                            {amb.callsign}
                          </h4>
                          <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                            ⚡ {amb.eta} away
                          </span>
                          <span className="text-[10px] font-bold text-amber-500 flex items-center">
                            ★ {amb.rating}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                          Crew: {amb.crew} • 📍 {amb.location}
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {amb.features.map((f, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-400 font-mono">
                              ✓ {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-400 uppercase block">Emergency Fare</span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">FREE (Govt)</span>
                      </div>
                      
                      <div className={`mt-1.5 px-3 py-1 rounded-xl text-xs font-black ${
                        isSelected 
                          ? 'bg-red-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {isSelected ? '✓ SELECTED' : 'SELECT'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: SELECT DESTINATION HOSPITAL (ZOMATO RESTAURANT CARDS STYLE) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Step 3: Select Destination Hospital (Zomato Style)
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                Real-Time ICU Bed Sync
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {hospitals.slice(0, 3).map((hosp) => {
                const isSelected = selectedHospitalId === hosp.id;
                return (
                  <div
                    key={hosp.id}
                    onClick={() => {
                      try { soundFx?.playClick?.(); } catch (e) {}
                      setSelectedHospitalId(hosp.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          ⭐ {hosp.emergency_rating || 4.9} ER Rating
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          ~{Math.round(hosp.travel_time_min || 5)} min
                        </span>
                      </div>

                      <h4 className="font-black text-slate-900 dark:text-white text-sm">
                        {hosp.name}
                      </h4>

                      <p className="text-[11px] text-slate-500">
                        {hosp.distance_km || 2.4} km away • {hosp.trauma_level || 'Level 1 Trauma'}
                      </p>

                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        🛏️ {hosp.icu_beds_available || 14} ICU Beds Available Now
                      </div>
                    </div>

                    <div className={`mt-3 py-1.5 px-3 rounded-xl text-center text-xs font-black transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}>
                      {isSelected ? '✓ ROUTE TO THIS ER' : 'SELECT HOSPITAL'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* THE BIG RED 1-CLICK RAPIDO-STYLE BOOKING BUTTON */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleBookAmbulance}
              className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-lg shadow-2xl hover:shadow-red-500/30 transition-all flex items-center justify-center space-x-3 cursor-pointer ring-4 ring-red-500/30 scale-100 hover:scale-[1.01]"
            >
              <Sparkles className="w-6 h-6 animate-spin text-red-200" />
              <span>🚨 1-CLICK CONFIRM EMERGENCY AMBULANCE BOOKING</span>
              <span className="text-xs font-mono bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">
                RAPIDO STYLE
              </span>
            </button>

            <p className="text-xs text-center text-slate-400 mt-2 font-medium">
              Nearest active ambulance driver will be instantly dispatched to your GPS location with automated green wave clearance!
            </p>
          </div>

        </div>
      )}

      {/* Emergency Call Selector Modal */}
      <CallSelectorModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        callerRole="patient"
        callerName="Citizen Patient (Emergency SOS)"
      />

    </div>
  );
}
