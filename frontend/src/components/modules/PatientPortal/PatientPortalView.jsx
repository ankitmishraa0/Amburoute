import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Heart, 
  PhoneCall, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  X,
  User,
  Star,
  Activity,
  Zap,
  RotateCcw,
  Radio
} from 'lucide-react';
import { soundFx } from '@/services/sound';
import { callService, DOCTORS_DIRECTORY } from '@/services/callService';
import { rideService } from '@/services/rideService';
import CallSelectorModal from '@/components/common/CallSelectorModal';
import { generateRouteAndSignals, GORAKHPUR_HOSPITALS } from '@/services/locationHospitals';

export default function PatientPortalView({ 
  telemetry, 
  hospitals = [],
  onNavigateTab 
}) {
  // Booking Form State
  const [pickupAddress, setPickupAddress] = useState('Golghar Commercial Hub, Gorakhpur, UP');
  const [pickupCoords, setPickupCoords] = useState({ lat: 26.7606, lng: 83.3732 });
  const [selectedEmergency, setSelectedEmergency] = useState('heart_attack');
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitals[0]?.id || 'hosp-gkp-aiims');
  
  // Real-time Online Drivers (Currently logged-in drivers only)
  const [onlineDrivers, setOnlineDrivers] = useState(() => rideService.getOnlineDrivers());
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  // Active Ride Booking State (Rapido / Uber tracking)
  // 'idle' | 'requesting' | 'en_route' | 'arrived'
  const [rideState, setRideState] = useState('idle');
  const [activeRide, setActiveRide] = useState(null);
  const [etaSeconds, setEtaSeconds] = useState(180);
  const [ambulancePos, setAmbulancePos] = useState({ lat: 26.7540, lng: 83.3850 });
  const [showCallModal, setShowCallModal] = useState(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const ambulanceMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);

  const emergencyCategories = [
    { id: 'heart_attack', label: 'Chest Pain / Heart Attack', emoji: '🫀', desc: 'Critical ALS ICU needed' },
    { id: 'accident', label: 'Road Accident / Trauma', emoji: '💥', desc: 'Severe injury & bleeding' },
    { id: 'breathing', label: 'Breathing Difficulty', emoji: '🫁', desc: 'High-flow oxygen needed' },
    { id: 'pregnancy', label: 'Pregnancy & Labor Rush', emoji: '🤰', desc: 'Maternity assistance' },
    { id: 'general', label: 'Unconscious / Fainting', emoji: '🩺', desc: 'General emergency' },
  ];

  // Subscribe to real-time online drivers presence
  useEffect(() => {
    const unsubDrivers = rideService.on('driversChanged', (drivers) => {
      setOnlineDrivers(drivers);
      if (drivers.length > 0 && !selectedDriverId) {
        setSelectedDriverId(drivers[0].id);
      }
    });

    // Check on mount
    const current = rideService.getOnlineDrivers();
    setOnlineDrivers(current);
    if (current.length > 0) {
      setSelectedDriverId(current[0].id);
    }

    return () => unsubDrivers();
  }, [selectedDriverId]);

  // Subscribe to ride acceptance from driver
  useEffect(() => {
    const unsubAccept = rideService.on('rideAccepted', (acceptedRide) => {
      setActiveRide(acceptedRide);
      setRideState('en_route');
      setEtaSeconds(180);
      try { soundFx?.playSuccess?.(); } catch (e) {}
    });

    const unsubReject = rideService.on('rideRejected', () => {
      setRideState('idle');
      setActiveRide(null);
      alert('Ambulance driver is currently responding to another critical case. Please try again or select another driver.');
    });

    const unsubMove = rideService.on('ambulanceMoved', (loc) => {
      if (loc && loc.coords) {
        setAmbulancePos(loc.coords);
      }
    });

    return () => {
      unsubAccept();
      unsubReject();
      unsubMove();
    };
  }, []);

  // Moving Ambulance Simulation along road coordinates towards patient pickup
  useEffect(() => {
    let animTimer = null;
    if (rideState === 'en_route') {
      const start = { lat: 26.7500, lng: 83.3900 };
      const target = pickupCoords;
      let step = 0;
      const totalSteps = 60; // 60 updates

      animTimer = setInterval(() => {
        step++;
        const progress = Math.min(step / totalSteps, 1.0);
        const curLat = start.lat + (target.lat - start.lat) * progress;
        const curLng = start.lng + (target.lng - start.lng) * progress;
        const currentPos = { lat: curLat, lng: curLng };
        setAmbulancePos(currentPos);

        // Update Leaflet marker on map
        if (ambulanceMarkerRef.current) {
          ambulanceMarkerRef.current.setLatLng([curLat, curLng]);
        }

        // Countdown timer
        setEtaSeconds(prev => {
          if (prev <= 1) {
            setRideState('arrived');
            try { soundFx?.playSuccess?.(); } catch (e) {}
            return 0;
          }
          return prev - 1;
        });

        if (progress >= 1.0) {
          clearInterval(animTimer);
        }
      }, 1000);
    }
    return () => clearInterval(animTimer);
  }, [rideState, pickupCoords]);

  // Initialize interactive Leaflet map when ride is en route
  useEffect(() => {
    if (rideState === 'en_route' && mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [pickupCoords.lat, pickupCoords.lng],
        zoom: 14,
        zoomControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Patient Pickup Marker
      const patientIcon = L.divIcon({
        className: 'custom-patient-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; background: rgba(220, 38, 38, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 26px; height: 26px; background: #DC2626; border: 2.5px solid #FFFFFF; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); color: white; font-weight: bold; font-size: 13px;">
              📍
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      L.marker([pickupCoords.lat, pickupCoords.lng], { icon: patientIcon })
        .addTo(map)
        .bindPopup(`<b>Your Pickup Point</b><br/>${pickupAddress}`)
        .openPopup();

      // Moving Ambulance Marker (Rapido car icon)
      const ambulanceIcon = L.divIcon({
        className: 'custom-moving-ambulance-marker',
        html: `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
            <div style="width: 32px; height: 32px; background: #1E293B; border: 2.5px solid #EF4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5); font-size: 16px;">
              🚑
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const ambMarker = L.marker([26.7500, 83.3900], { icon: ambulanceIcon }).addTo(map);
      ambulanceMarkerRef.current = ambMarker;

      // Polyline route from ambulance to patient
      const polyline = L.polyline([
        [26.7500, 83.3900],
        [26.7550, 83.3820],
        [pickupCoords.lat, pickupCoords.lng]
      ], {
        color: '#EF4444',
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.8
      }).addTo(map);
      routePolylineRef.current = polyline;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current && rideState !== 'en_route') {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [rideState, pickupCoords]);

  const selectedHosp = hospitals.find(h => h.id === selectedHospitalId) || hospitals[0] || {
    name: 'AIIMS Gorakhpur Super-Specialty ER',
    distance_km: 2.4,
    travel_time_min: 5,
    icu_beds_available: 14
  };

  const formatEta = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  // 1-Click Book Action on an ambulance card
  const handleRequestRide = (driver) => {
    try { soundFx?.playClick?.(); } catch (e) {}

    const ride = rideService.requestRide({
      patientName: 'Citizen Patient (Self)',
      pickupAddress: pickupAddress,
      pickupCoords: pickupCoords,
      emergencyType: selectedEmergency,
      hospitalId: selectedHosp.id,
      hospitalName: selectedHosp.name,
      targetDriverId: driver.id,
      ambulanceCallsign: driver.callsign || 'Ambulance MEDIC-12'
    });

    setActiveRide(ride);
    setRideState('requesting');
  };

  const handleCancelRequest = () => {
    try { soundFx?.playClick?.(); } catch (e) {}
    if (activeRide) {
      rideService.rejectRide(activeRide.rideId);
    }
    setRideState('idle');
    setActiveRide(null);
  };

  // Helper to simulate a logged-in driver if testing on a single tab
  const handleSimulateDriverLogin = () => {
    rideService.startDriverPresence({
      id: 'driver108',
      name: 'Paramedic Rajesh Sharma',
      badge: 'UNIT MEDIC-12 (ALS)',
      callsign: 'Ambulance MEDIC-12 (ALS)'
    });
    const current = rideService.getOnlineDrivers();
    setOnlineDrivers(current);
    setSelectedDriverId('driver108');
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12 text-slate-900 dark:text-white">

      {/* TOP LOCATION BAR */}
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
            <div className="text-sm font-black flex items-center gap-2">
              <span className="truncate">{pickupAddress}</span>
            </div>
          </div>
        </div>

        {/* Real-Time Online Driver Badge */}
        <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border shrink-0 self-start sm:self-auto bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>
            {onlineDrivers.length > 0 
              ? `${onlineDrivers.length} Ambulance Driver Online Now` 
              : '0 Drivers Online Currently'}
          </span>
        </div>
      </div>

      {/* ==================== STATE 1: WAITING FOR DRIVER TO ACCEPT (RAPIDO RADAR) ==================== */}
      {rideState === 'requesting' && (
        <div className="p-8 bg-white dark:bg-slate-900 border-2 border-red-500 rounded-3xl shadow-xl text-center space-y-4 animate-fade-in">
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></span>
            <span className="absolute inset-3 rounded-full bg-red-500/30 animate-pulse"></span>
            <div className="relative w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl shadow-lg">
              🚑
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-3 py-1 rounded-full inline-block animate-pulse">
              🚨 CONNECTING TO AMBULANCE DRIVER
            </span>
            <h3 className="text-xl font-black pt-1">
              Sending Ride Request to Ambulance Driver...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Request sent with your live GPS location. Driver's mobile is ringing. Please wait while driver accepts...
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCancelRequest}
              className="py-2.5 px-6 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-600 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel Request
            </button>
          </div>
        </div>
      )}

      {/* ==================== STATE 2: LIVE MOVING MAP TRACKING (RAPIDO STYLE) ==================== */}
      {rideState === 'en_route' && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Top Banner with ETA */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-5 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ring-4 ring-red-500/20">
            <div className="space-y-1">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-mono font-black uppercase tracking-wider inline-block animate-pulse">
                🟢 DRIVER ACCEPTED • AMBULANCE IS RUSHING TO YOU
              </span>
              <h2 className="text-xl font-black">
                {activeRide?.ambulanceCallsign || 'Ambulance MEDIC-12'} is En Route!
              </h2>
              <p className="text-xs text-red-100 flex items-center gap-2">
                <span>Driver: <strong>{activeRide?.driverName || 'Rajesh Sharma'}</strong></span>
                <span>•</span>
                <span>Vehicle: <strong>UP53-EMG-108 (ALS Super-Care)</strong></span>
              </p>
            </div>

            {/* Live Countdown */}
            <div className="bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0">
              <span className="text-[10px] uppercase font-bold text-red-200 tracking-wider block">
                Time to Reach You
              </span>
              <div className="text-3xl font-black font-mono text-white tracking-tight">
                {formatEta(etaSeconds)}
              </div>
              <span className="text-[11px] text-emerald-300 font-bold block mt-0.5">
                🟢 Traffic Green Wave Active
              </span>
            </div>
          </div>

          {/* INTERACTIVE RAPIDO-STYLE MOVING MAP */}
          <div className="relative w-full h-[360px] rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-md">
            <div ref={mapContainerRef} className="w-full h-full z-10" />

            {/* Floating Live Tracking Card on Map */}
            <div className="absolute top-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl border border-slate-700 text-xs shadow-xl space-y-1 max-w-xs">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>RAPIDO LIVE VEHICLE GPS</span>
              </div>
              <div className="font-bold text-white text-xs">
                Ambulance is moving towards your pickup point
              </div>
            </div>

            {/* Voice Call Driver Button floating right */}
            <div className="absolute bottom-4 right-4 z-20">
              <button
                type="button"
                onClick={() => {
                  try { soundFx?.playClick?.(); } catch (e) {}
                  callService.makeCall({
                    targetRole: 'driver',
                    callType: 'voice',
                    callerName: 'Citizen Patient (Self)',
                    targetName: activeRide?.driverName || 'Driver Rajesh Sharma',
                    department: 'Ambulance Cab Intercom'
                  });
                }}
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs shadow-2xl flex items-center space-x-2 cursor-pointer ring-2 ring-red-400 animate-pulse"
              >
                <PhoneCall className="w-4 h-4 fill-current" />
                <span>Call Driver (Voice Only) 📞</span>
              </button>
            </div>
          </div>

          {/* Driver & Hospital Details Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                👨‍✈️
              </div>
              <div>
                <div className="font-black text-sm">{activeRide?.driverName || 'Driver Rajesh Sharma'}</div>
                <div className="text-xs text-slate-500">Phone: {activeRide?.driverPhone || '+91 98765-43210'} • ⭐ 4.9 (420+ Rescues)</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  Destination: {selectedHosp.name} (Trauma Bay Alerted)
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelRequest}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-400 hover:text-red-600 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel Ride
            </button>
          </div>

        </div>
      )}

      {/* ==================== STATE 3: NORMAL BOOKING LIST (ZOMATO / RAPIDO STYLE) ==================== */}
      {rideState === 'idle' && (
        <div className="space-y-5 animate-fade-in">
          
          {/* STEP 1: EMERGENCY SYMPTOM SELECTOR (ZOMATO CHIPS) */}
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

          {/* STEP 2: AVAILABLE AMBULANCE DRIVERS (ONLY CURRENTLY LOGGED-IN DRIVERS!) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Step 2: Currently Logged-in Ambulances ({onlineDrivers.length} Online)
              </label>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ● Live Real-Time Driver Presence
              </span>
            </div>

            {/* If NO driver is currently logged in */}
            {onlineDrivers.length === 0 ? (
              <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center space-y-3">
                <div className="text-3xl">⚠️</div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300">
                    No Ambulance Drivers Currently Logged-In
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 max-w-md mx-auto">
                    When an ambulance driver logs into the system on Device 2 (or in another tab), they will automatically appear here live!
                  </p>
                </div>

                {/* Helpful Instant Standby Option for Testing */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRequestRide({
                      id: 'driver108',
                      name: 'Ambulance MEDIC-12 (ALS Super-Care)',
                      callsign: 'Ambulance MEDIC-12 (ALS)',
                      badge: 'UNIT #108'
                    })}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white font-black text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2 ring-2 ring-red-400/40"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Dispatch 108 Emergency Ambulance (MEDIC-12) ➔</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateDriverLogin}
                    className="px-3.5 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sync Driver Presence</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {onlineDrivers.map((driver) => {
                  return (
                    <div
                      key={driver.id}
                      className="p-4 rounded-2xl border bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start space-x-3.5">
                        <div className="text-3xl shrink-0 mt-0.5 p-2 rounded-2xl bg-red-100 dark:bg-red-950/70 border border-red-200 dark:border-red-900">
                          🚑
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-base">
                              {driver.callsign || 'Ambulance MEDIC-12'}
                            </h4>
                            <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              🟢 Currently Logged-in & Online
                            </span>
                            <span className="text-[10px] font-bold text-amber-500 flex items-center">
                              ★ {driver.rating || 4.9}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                            Driver: {driver.name} • 📍 {driver.location || 'Golghar Area'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Type: {driver.type || 'ALS Super-Care (ICU on Wheels)'}
                          </p>
                        </div>
                      </div>

                      {/* Direct Book Button on each currently online ambulance card */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 gap-2">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Emergency Fare</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">FREE (Govt 108)</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRequestRide(driver)}
                          className="px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 ring-2 ring-red-400/30"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Book & Dispatch Ambulance ➔</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 3: DESTINATION HOSPITAL SELECTION (ZOMATO RESTAURANT CARDS) */}
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
                      {isSelected ? '✓ SELECTED HOSPITAL' : 'SELECT'}
                    </div>
                  </div>
                );
              })}
            </div>
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
