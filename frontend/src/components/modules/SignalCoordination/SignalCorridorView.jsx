import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Signal, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles,
  AlertCircle,
  Clock,
  Navigation,
  ArrowRight,
  PhoneCall,
  Radio,
  Video,
  MapPin,
  ShieldAlert,
  Activity,
  HeartPulse
} from 'lucide-react';
import { overrideSignal } from '@/services/api';
import { soundFx } from '@/services/sound';
import { callService } from '@/services/callService';
import { rideService } from '@/services/rideService';
import CallSelectorModal from '@/components/common/CallSelectorModal';

// Custom Map Marker Icons for Leaflet
const createAmbulanceIcon = (heading = 0, siren = true, speed = 58) => {
  return L.divIcon({
    className: 'custom-traffic-amb-marker',
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        ${siren ? '<div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
        <div style="position: relative; width: 34px; height: 34px; background: #DC2626; border: 2.5px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); z-index: 10;">
          <span style="font-size: 18px; line-height: 1;">🚑</span>
        </div>
        <div style="position: absolute; -top: 14px; background: #0F172A; color: #FFFFFF; font-size: 9px; font-weight: 800; font-family: monospace; padding: 1px 4px; border-radius: 4px; border: 1px solid #DC2626; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 12;">
          ${speed} km/h
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

const createSignalMarkerIcon = (state, seq, name) => {
  const isGreen = state === 'green_wave';
  const isAmber = state === 'amber_prep';
  const color = isGreen ? '#10B981' : isAmber ? '#F59E0B' : '#EF4444';
  const label = isGreen ? '🟢 GREEN' : isAmber ? '🟡 AMBER' : '🔴 RED';

  return L.divIcon({
    className: 'custom-traffic-signal-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="position: relative; width: 32px; height: 32px; background: #0F172A; border: 2.5px solid ${color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.5);">
          <div style="width: 14px; height: 14px; border-radius: 50%; background: ${color}; ${isGreen ? 'box-shadow: 0 0 10px #10B981;' : ''}"></div>
          <span style="position: absolute; font-size: 10px; font-weight: 900; color: #FFFFFF; font-family: monospace;">${seq}</span>
        </div>
        <div style="margin-top: 2px; background: rgba(15, 23, 42, 0.9); color: #F8FAFC; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; border: 1px solid ${color}; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.4);">
          ${name} (${label})
        </div>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 20]
  });
};

export default function SignalCorridorView({ 
  signals = [], 
  ambulance, 
  telemetry,
  setTelemetry, 
  onSignalUpdated,
  onNavigateTab 
}) {
  const [activeToast, setActiveToast] = useState(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [initialCallTab, setInitialCallTab] = useState('ambulances');
  const [activePatientMission, setActivePatientMission] = useState(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const ambMarkerRef = useRef(null);
  const signalMarkersRef = useRef([]);
  const routePolylineRef = useRef(null);

  // Trigger Toast Notification
  const triggerToast = (msg) => {
    setActiveToast(msg);
    setTimeout(() => setActiveToast(null), 3500);
  };

  // Sync Active Patient Ride (From RideService / LocalStorage / Telemetry)
  useEffect(() => {
    const checkActiveRide = () => {
      const liveRide = rideService.getActiveRide() || telemetry?.ambulance?.active_patient_ride;
      if (liveRide) {
        setActivePatientMission(liveRide);
      } else {
        // Fallback default mission from telemetry incident if available
        setActivePatientMission({
          patientName: telemetry?.incident?.patient_name || 'Ramesh Gupta (58M)',
          emergencyType: telemetry?.incident?.title || 'Severe Chest Pain (Cardiac STEMI)',
          pickupAddress: telemetry?.incident?.address || 'Golghar Commercial Hub, Gorakhpur',
          hospitalName: 'AIIMS Gorakhpur Emergency (Cath Lab Bay 1)',
          ambulanceCallsign: ambulance?.callsign || 'Ambulance MEDIC-12 (ALS Super-Care)',
          driverName: 'Paramedic Rajesh Sharma',
          driverPhone: '+91 98765-43210',
          vitals: telemetry?.incident?.patient_vitals || { heart_rate: 134, systolic_bp: 82, diastolic_bp: 54, spo2: 88 }
        });
      }
    };

    checkActiveRide();

    const unsubAccept = rideService.on('rideAccepted', (ride) => {
      setActivePatientMission(ride);
      triggerToast(`🚨 NEW PATIENT MISSION: ${ride.patientName} booked Ambulance!`);
    });

    const unsubComplete = rideService.on('rideCompleted', () => {
      checkActiveRide();
    });

    return () => {
      unsubAccept();
      unsubComplete();
    };
  }, [telemetry]);

  // Turn single junction Green or Red
  const handleSetSignalState = async (sigId, newState) => {
    try { 
      if (newState === 'green_wave') soundFx?.playOverride?.(); 
      else soundFx?.playClick?.();
    } catch (e) {}

    if (setTelemetry) {
      setTelemetry(prev => ({
        ...prev,
        signals: (prev.signals || []).map(s => {
          if (s.id === sigId) {
            return {
              ...s,
              state: newState,
              prep_countdown_sec: newState === 'green_wave' ? 45 : newState === 'amber_prep' ? 12 : 60
            };
          }
          return s;
        })
      }));
    }

    const stateNames = {
      green_wave: '🟢 GREEN (Wave Open)',
      amber_prep: '🟡 AMBER (Clearing)',
      red: '🔴 RED (Cross Traffic Stopped)'
    };
    triggerToast(`Junction updated to: ${stateNames[newState] || newState}`);

    try {
      if (newState === 'green_wave') {
        await overrideSignal(sigId);
        if (onSignalUpdated) onSignalUpdated();
      }
    } catch (e) {}
  };

  // Turn ALL junctions green with 1 click
  const handleForceAllGreen = () => {
    try { 
      soundFx?.playOverride?.();
      soundFx?.playAlert?.();
    } catch (e) {}

    if (setTelemetry) {
      setTelemetry(prev => ({
        ...prev,
        signals: (prev.signals || []).map(s => ({
          ...s,
          state: 'green_wave',
          prep_countdown_sec: 45
        }))
      }));
    }
    triggerToast('🎉 GREEN WAVE CLEARED! All 4 traffic signals locked GREEN for ambulance!');
  };

  // Reset to normal automatic cycle
  const handleResetAutomated = () => {
    try { soundFx?.playClick?.(); } catch (e) {}
    if (setTelemetry) {
      setTelemetry(prev => ({
        ...prev,
        signals: (prev.signals || []).map((s, idx) => ({
          ...s,
          state: idx === 0 ? 'green_wave' : idx === 1 ? 'amber_prep' : 'red',
          prep_countdown_sec: idx === 0 ? 30 : idx === 1 ? 15 : 60
        }))
      }));
    }
    triggerToast('Restored to standard automatic city traffic cycles.');
  };

  const greenCount = signals.filter(s => s.state === 'green_wave').length;
  const ambCoords = ambulance?.coordinates || { lat: 26.7606, lng: 83.3732 };

  // 1. Initialize Interactive Leaflet Map for Traffic Police
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [ambCoords.lat, ambCoords.lng],
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Draw route corridor polyline if available
    const routePts = (telemetry?.route_coords || []).map(pt => [pt.lat, pt.lng]);
    if (routePts.length > 0) {
      routePolylineRef.current = L.polyline(routePts, {
        color: '#10B981',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(map);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Update Ambulance Vehicle Marker in Real-Time
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentCoords = [ambCoords.lat, ambCoords.lng];
    const icon = createAmbulanceIcon(ambulance?.heading || 0, ambulance?.siren_active !== false, ambulance?.speed_kmh || 58);

    if (!ambMarkerRef.current) {
      ambMarkerRef.current = L.marker(currentCoords, { icon }).addTo(map);
      ambMarkerRef.current.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong style="color: #DC2626;">${ambulance?.callsign || 'MEDIC-12'}</strong><br/>
          <span>Status: <strong>${ambulance?.status || 'Active Transport'}</strong></span><br/>
          <span>Velocity: <strong>${ambulance?.speed_kmh || 58} km/h</strong></span><br/>
          <span>ETA to AIIMS: <strong>~${Math.round((ambulance?.eta_seconds || 240) / 60)} mins</strong></span>
        </div>
      `);
    } else {
      ambMarkerRef.current.setLatLng(currentCoords);
      ambMarkerRef.current.setIcon(icon);
    }
  }, [ambCoords.lat, ambCoords.lng, ambulance?.speed_kmh, ambulance?.siren_active]);

  // 3. Update Signal Markers along the Corridor
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing signal markers
    signalMarkersRef.current.forEach(m => m.remove());
    signalMarkersRef.current = [];

    signals.forEach((sig, idx) => {
      if (sig.coordinates && sig.coordinates.lat && sig.coordinates.lng) {
        const icon = createSignalMarkerIcon(sig.state, idx + 1, sig.name);
        const marker = L.marker([sig.coordinates.lat, sig.coordinates.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
              <strong>Junction #${idx + 1}: ${sig.name}</strong><br/>
              <span>Signal Status: <strong>${sig.state}</strong></span><br/>
              <span>Distance: <strong>${sig.distance_meters || 450}m</strong></span>
            </div>
          `);
        
        signalMarkersRef.current.push(marker);
      }
    });
  }, [signals]);

  return (
    <div className="space-y-4">
      
      {/* Toast Alert */}
      {activeToast && (
        <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl text-sm font-bold shadow-lg flex items-center justify-between border border-slate-700 animate-bounce">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{activeToast}</span>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
            Traffic Control Active
          </span>
        </div>
      )}

      {/* ================= HIGH-PRIORITY ACTIVE PATIENT MISSION BANNER ================= */}
      {activePatientMission && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 sm:p-5 rounded-3xl shadow-xl border-2 border-red-400/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🚨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/25 text-white font-mono font-black text-[10px] uppercase tracking-wider animate-pulse">
                    ACTIVE PATIENT EMERGENCY MISSION
                  </span>
                  <span className="text-[10px] font-bold text-red-100 bg-black/25 px-2 py-0.5 rounded-md">
                    CODE-1 AMBULANCE PRIORITY
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black mt-1">
                  Patient: {activePatientMission.patientName || 'Citizen Emergency Patient'}
                </h2>
                <p className="text-xs text-red-100 font-medium">
                  Complaint: <strong className="text-white underline">{activePatientMission.emergencyType || 'Cardiac STEMI / Chest Pain'}</strong>
                </p>
              </div>
            </div>

            {/* Direct Calling Actions for Traffic Police */}
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => {
                  try { soundFx?.playClick?.(); } catch (e) {}
                  setInitialCallTab('ambulances');
                  setShowCallModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-white text-red-600 hover:bg-red-50 text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105"
              >
                <PhoneCall className="w-3.5 h-3.5 fill-current" />
                <span>Call Ambulance Driver 📞</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try { soundFx?.playClick?.(); } catch (e) {}
                  setInitialCallTab('doctors');
                  setShowCallModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-black/30 hover:bg-black/50 text-white text-xs font-bold border border-white/30 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call ER Doctor 📞</span>
              </button>
            </div>
          </div>

          {/* Mission Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-white/20 text-xs">
            <div className="bg-black/20 p-2 rounded-xl">
              <span className="text-[10px] text-red-200 uppercase font-bold block">Assigned Ambulance</span>
              <span className="font-mono font-black text-white">{activePatientMission.ambulanceCallsign || 'MEDIC-12 (ALS)'}</span>
            </div>
            <div className="bg-black/20 p-2 rounded-xl">
              <span className="text-[10px] text-red-200 uppercase font-bold block">Pickup Location</span>
              <span className="font-bold text-white truncate block">{activePatientMission.pickupAddress || 'Golghar, Gorakhpur'}</span>
            </div>
            <div className="bg-black/20 p-2 rounded-xl">
              <span className="text-[10px] text-red-200 uppercase font-bold block">Target Hospital</span>
              <span className="font-bold text-white truncate block">{activePatientMission.hospitalName || 'AIIMS Gorakhpur'}</span>
            </div>
            <div className="bg-black/20 p-2 rounded-xl">
              <span className="text-[10px] text-red-200 uppercase font-bold block">Current Velocity / ETA</span>
              <span className="font-mono font-black text-emerald-300">{ambulance?.speed_kmh || 58} km/h • ~{Math.round((ambulance?.eta_seconds || 240) / 60)}m</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOP HERO BANNER WITH GIANT 1-CLICK BUTTON ================= */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-2xl shrink-0">
              🚦
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Traffic Police Signal Control Deck</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-300 dark:border-emerald-800">
                  ITMS Online
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Ambulance <strong className="text-red-600 font-bold">{ambulance?.callsign || 'MEDIC-12'}</strong> is en route with patient to AIIMS Gorakhpur
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAutomated}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Normal Traffic</span>
            </button>
          </div>
        </div>

        {/* THE GIANT 1-CLICK BUTTON ("PRESS TO TURN ALL LIGHTS GREEN FOR AMBULANCE") */}
        <button
          type="button"
          onClick={handleForceAllGreen}
          className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-green-600 to-teal-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-2xl font-black text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3 cursor-pointer group scale-100 hover:scale-[1.01]"
        >
          <Sparkles className="w-6 h-6 animate-spin text-emerald-200" />
          <span>PRESS TO TURN ALL LIGHTS GREEN FOR AMBULANCE (GREEN WAVE) 🟢</span>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
            1-Click Emergency
          </span>
        </button>

        {/* 3 Status Stats */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Green Wave Status</div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {greenCount} / {signals.length} Green Lights
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Ambulance Speed</div>
            <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {ambulance?.speed_kmh || 58} km/h
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="text-[10px] font-bold uppercase text-slate-400">Time to AIIMS</div>
            <div className="text-sm font-black text-red-600 dark:text-red-400 mt-0.5 font-mono">
              ~{Math.round((ambulance?.eta_seconds || 240) / 60)} minutes
            </div>
          </div>
        </div>

      </div>

      {/* ================= INTERACTIVE LIVE GPS CORRIDOR MAP ================= */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Live Ambulance GPS Corridor & Signal Preemption Map
            </h3>
          </div>
          <div className="text-[11px] font-mono font-bold text-slate-500">
            GPS: <span className="text-emerald-600 dark:text-emerald-400">{ambCoords.lat.toFixed(4)}°N, {ambCoords.lng.toFixed(4)}°E</span>
          </div>
        </div>

        {/* Leaflet Map Container */}
        <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Floating Live Telemetry Badge on Map */}
          <div className="absolute top-3 left-3 z-20 bg-slate-900/90 backdrop-blur-md text-white p-2.5 rounded-xl border border-slate-700 text-xs shadow-xl space-y-1 max-w-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE ITMS TRAFFIC TRACKING RADAR</span>
            </div>
            <div className="font-bold text-white text-xs">
              Corridor: Golghar ➔ Mohaddipur ➔ AIIMS
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              Velocity: {ambulance?.speed_kmh || 58} km/h • Siren: {ambulance?.siren_active !== false ? 'ACTIVE 🚨' : 'STANDBY'}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4 LARGE STREET JUNCTION CARDS ================= */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Route Traffic Junctions (Road Signals Ahead):
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {signals.map((sig, idx) => {
            const isGreen = sig.state === 'green_wave';
            const isAmber = sig.state === 'amber_prep';
            const isRed = sig.state === 'red' || (!isGreen && !isAmber);

            return (
              <div
                key={sig.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isGreen
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-400/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Left: Traffic Light Graphic + Junction Name */}
                  <div className="flex items-center space-x-3.5">
                    
                    {/* Visual 3-circle Traffic Light Housing */}
                    <div className="w-9 bg-slate-900 dark:bg-black p-1.5 rounded-xl flex flex-col items-center space-y-1.5 shadow-md">
                      {/* Red Light */}
                      <div className={`w-5 h-5 rounded-full transition-all ${
                        isRed ? 'bg-red-500 shadow-md shadow-red-500/80 animate-pulse' : 'bg-red-950/40'
                      }`} />
                      {/* Amber Light */}
                      <div className={`w-5 h-5 rounded-full transition-all ${
                        isAmber ? 'bg-amber-400 shadow-md shadow-amber-400/80 animate-pulse' : 'bg-amber-950/40'
                      }`} />
                      {/* Green Light */}
                      <div className={`w-5 h-5 rounded-full transition-all ${
                        isGreen ? 'bg-emerald-500 shadow-md shadow-emerald-500/80 animate-pulse' : 'bg-emerald-950/40'
                      }`} />
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Junction #{idx + 1}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {sig.name}
                      </h4>
                      <div className="text-xs font-semibold mt-0.5">
                        {isGreen && <span className="text-emerald-600 dark:text-emerald-400">🟢 GREEN (Corridor Cleared)</span>}
                        {isAmber && <span className="text-amber-600 dark:text-amber-400">🟡 AMBER (Clearing Now)</span>}
                        {isRed && <span className="text-red-600 dark:text-red-400">🔴 RED (Waiting for Clearance)</span>}
                      </div>
                    </div>

                  </div>

                  {/* Right: Quick Toggle Buttons */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSetSignalState(sig.id, 'green_wave')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isGreen
                          ? 'bg-emerald-600 text-white font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700'
                      }`}
                    >
                      Turn GREEN 🟢
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetSignalState(sig.id, 'red')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isRed
                          ? 'bg-red-600 text-white font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-100 hover:text-red-700'
                      }`}
                    >
                      Turn RED 🔴
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-Time Call Selector Modal */}
      <CallSelectorModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        callerRole="traffic"
        callerName="Inspector R. Verma (Traffic ITMS)"
        initialTab={initialCallTab}
      />

    </div>
  );
}
