import React, { useState, useEffect, useRef } from 'react';
import { Shield, Building2, Signal, Navigation, PhoneCall, CheckCircle } from 'lucide-react';
import Header from './components/Header';
import SimulationBar from './components/SimulationBar';
import HeroPitchModal from './components/HeroPitchModal';
import RolePortalModal, { PORTAL_ROLES } from './components/RolePortalModal';
import LoginPage, { USER_ROLES } from './components/LoginPage';
import AdminControlPanel from './components/AdminControlPanel';
import TaskProgressBar from './components/TaskProgressBar';

// Modules
import LiveMap from './components/modules/CommandMap/LiveMap';
import IncidentQueue from './components/modules/CommandMap/IncidentQueue';
import TelemetryHUD from './components/modules/CommandMap/TelemetryHUD';
import DriverStandbyView from './components/modules/CommandMap/DriverStandbyView';
import SignalCorridorView from './components/modules/SignalCoordination/SignalCorridorView';
import HospitalMatrixView from './components/modules/HospitalMatrix/HospitalMatrixView';
import AIRiskView from './components/modules/AIRiskAssessment/AIRiskView';
import HospitalHandoffView from './components/modules/HospitalHandoff/HospitalHandoffView';
import PatientPortalView from './components/modules/PatientPortal/PatientPortalView';

// Services
import { TelemetryWebSocket } from './services/websocket';
import { 
  fetchTelemetrySnapshot, 
  fetchIncidents, 
  fetchHospitals, 
  controlSimulation 
} from './services/api';
import { soundFx } from './services/sound';
import { GORAKHPUR_HOSPITALS, generateRouteAndSignals, SCENARIOS_DATA } from './services/locationHospitals';
import { callService } from './services/callService';
import { rideService } from './services/rideService';

// Real-Time Cross-Device Calling & Ride Dispatch UI
import IncomingCallNotification from './components/common/IncomingCallNotification';
import EmergencyCallModal from './components/common/EmergencyCallModal';
import IncomingRideRequestModal from './components/common/IncomingRideRequestModal';

// Initial Gorakhpur Route & Telemetry Preset
const { waypoints: GKP_WAYPOINTS, signals: GKP_SIGNALS } = generateRouteAndSignals(
  26.7606, 
  83.3732, 
  GORAKHPUR_HOSPITALS[0]
);

const DEFAULT_INITIAL_TELEMETRY = {
  scenario_key: 'scenario_stemi',
  is_running: true,
  sim_speed: 1.0,
  progress: 0.15,
  traffic_jam_injected: false,
  ambulance: {
    id: 'amb-medic-12',
    callsign: 'MEDIC-12 (ALS)',
    type: 'ALS',
    status: 'en_route',
    coordinates: GKP_WAYPOINTS[0],
    heading: 95.0,
    speed_kmh: 58.0,
    target_hospital_id: 'hosp-gkp-aiims',
    active_incident_id: 'inc-stemi-901',
    eta_seconds: 240,
    distance_remaining_km: 3.2,
    siren_active: true
  },
  incident: {
    id: 'inc-stemi-901',
    title: 'Code-1 Acute STEMI / Massive Anterolateral MI',
    category: 'Cardiovascular Emergency',
    severity: 'critical',
    coordinates: { lat: 26.7606, lng: 83.3732 },
    address: 'Golghar Commercial Hub, Gorakhpur, UP',
    status: 'en_route',
    patient_vitals: {
      heart_rate: 134,
      systolic_bp: 82,
      diastolic_bp: 54,
      spo2: 88,
      respiratory_rate: 28,
      temperature_c: 36.8,
      gcs_score: 14,
      age: 58,
      symptoms: [
        'Chest Pain (Crushing/Pressure)',
        'Radiating Left Arm / Jaw Pain',
        'Profuse Diaphoresis (Cold Sweats)',
        'Severe Dyspnea (Shortness of Breath)'
      ],
      notes: 'Patient collapsed near Golghar. 12-Lead ECG shows ST-elevation in V1-V4.'
    }
  },
  signals: GKP_SIGNALS,
  route_coords: GKP_WAYPOINTS,
  ranked_hospitals: GORAKHPUR_HOSPITALS
};

export default function App() {
  const [activeTab, setActiveTab] = useState('command_map');
  const [telemetry, setTelemetry] = useState(DEFAULT_INITIAL_TELEMETRY);
  const [incidents, setIncidents] = useState([
    {
      scenario_key: 'scenario_stemi',
      id: 'inc-stemi-901',
      title: 'Code-1 Acute STEMI / Massive Anterolateral MI',
      category: 'Cardiovascular Emergency',
      severity: 'critical',
      address: 'Golghar Commercial Hub, Gorakhpur, UP',
      coordinates: { lat: 26.7606, lng: 83.3732 },
      is_active: true,
      status: 'en_route',
      assigned_ambulance: 'MEDIC-12 (ALS)'
    }
  ]);
  const [hospitals, setHospitals] = useState(GORAKHPUR_HOSPITALS);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [isPitchOpen, setIsPitchOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(PORTAL_ROLES[0]);
  const [currentUser, setCurrentUser] = useState(null); // Full security: Login required
  const [driverActiveMission, setDriverActiveMission] = useState(null); // Standby vs Active Mission

  // Clean Normalized Role Helpers
  const userRoleKey = (currentUser?.role || currentUser?.id || 'driver').toLowerCase();
  const isDriver = userRoleKey.includes('driver');
  const isPatient = userRoleKey.includes('patient');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('amburoute_theme');
    if (saved) return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  const hasUserRelocatedRef = useRef(true); // Default to Gorakhpur preset

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('amburoute_theme', theme);
  }, [theme]);

  // Listen to OS system color scheme preference changes if user hasn't explicitly set a custom theme
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      const saved = localStorage.getItem('amburoute_theme');
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('amburoute_theme', nextTheme);
      return nextTheme;
    });
    try { soundFx?.playClick?.(); } catch (e) {}
  };

  // Strict Role-Based View Enforcer (RBAC Isolation)
  useEffect(() => {
    if (!currentUser) return;
    const roleKey = currentUser?.role || currentUser?.id || 'driver';

    const allowedTabsByRole = {
      driver: ['command_map', 'hospitals'],
      traffic: ['signals'],
      hospital: ['handoff', 'triage', 'hospitals'],
      patient: ['patient_portal', 'hospitals'],
      admin: ['command_map', 'signals', 'hospitals', 'triage', 'handoff', 'admin_panel']
    };

    const defaultTabByRole = {
      driver: 'command_map',
      traffic: 'signals',
      hospital: 'handoff',
      patient: 'patient_portal',
      admin: 'admin_panel'
    };

    const allowed = allowedTabsByRole[roleKey] || allowedTabsByRole.driver;
    if (!allowed.includes(activeTab)) {
      setActiveTab(defaultTabByRole[roleKey] || 'command_map');
    }
  }, [currentUser, activeTab]);

  // Initialize Cross-Device WebRTC / Signal Call Service dynamically based on active tab and login
  useEffect(() => {
    const tabToRole = {
      command_map: 'driver',
      handoff: 'hospital',
      signals: 'traffic',
      patient_portal: 'patient',
      hospitals: 'driver',
      risk: 'hospital'
    };

    let effectiveRole = 'driver';
    if (activeTab === 'patient_portal') {
      effectiveRole = 'patient';
    } else if (activeTab === 'handoff') {
      effectiveRole = 'hospital';
    } else if (activeTab === 'signals') {
      effectiveRole = 'traffic';
    } else if (currentUser?.role) {
      effectiveRole = currentUser.role;
    } else if (currentUser?.id) {
      effectiveRole = currentUser.id;
    } else {
      effectiveRole = tabToRole[activeTab] || 'driver';
    }

    callService.init(effectiveRole);
  }, [currentUser, activeTab]);

  // Manage Driver Online Presence for Real-Time Fleet Visibility
  useEffect(() => {
    if (isDriver && currentUser) {
      rideService.startDriverPresence(currentUser);
    } else {
      rideService.stopDriverPresence();
    }

    return () => {
      rideService.stopDriverPresence();
    };
  }, [currentUser, isDriver]);

  // When driver accepts an incoming patient ride request
  const handleRideAcceptedByDriver = (acceptedRide) => {
    if (!acceptedRide) return;
    try { soundFx?.playSuccess?.(); } catch (e) {}

    setDriverActiveMission(acceptedRide);

    const pickupCoords = acceptedRide.pickupCoords || { lat: 26.7606, lng: 83.3732 };

    setTelemetry(prev => ({
      ...prev,
      incident: {
        ...prev.incident,
        title: `Patient Emergency: ${acceptedRide.patientName || 'Citizen Patient'} (${acceptedRide.emergencyType || 'Medical Emergency'})`,
        address: acceptedRide.pickupAddress,
        coordinates: pickupCoords
      },
      ambulance: {
        ...prev.ambulance,
        status: 'en_route_to_patient',
        active_patient_ride: acceptedRide
      }
    }));
  };

  const handleCompleteDriverMission = () => {
    if (driverActiveMission) {
      rideService.completeRide(driverActiveMission.rideId);
    }
    setDriverActiveMission(null);
    try { soundFx?.playSuccess?.(); } catch (e) {}
  };

  const handleSelectRole = (role) => {
    setCurrentRole(role);
    const mappedUser = Object.values(USER_ROLES).find(u => u.id === role.id || u.id === role.role) || USER_ROLES.driver;
    setCurrentUser({ ...mappedUser, ...role });
    if (role.assignedTab) {
      setActiveTab(role.assignedTab);
    }
  };

  const handleLogin = (userRole) => {
    setCurrentUser(userRole);
    const roleKey = userRole.role || userRole.id || 'driver';
    const matchedRole = PORTAL_ROLES.find(r => r.id === roleKey) || PORTAL_ROLES[0];
    setCurrentRole({ ...matchedRole, ...userRole });

    const defaultTabByRole = {
      driver: 'command_map',
      traffic: 'signals',
      hospital: 'handoff',
      patient: 'patient_portal',
      admin: 'admin_panel'
    };

    const targetTab = userRole.assignedTab || userRole.defaultTab || defaultTabByRole[roleKey] || 'command_map';
    setActiveTab(targetTab);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setDriverActiveMission(null);
  };

  // Handle dynamic location relocation (My GPS, Gorakhpur, or search)
  const handleLocationRelocated = ({ center, cityName, hospitals: localHosp, waypoints, signals: localSig, targetHospitalId }) => {
    hasUserRelocatedRef.current = true;
    setHospitals(localHosp);
    
    setTelemetry(prev => ({
      ...prev,
      ambulance: {
        ...prev.ambulance,
        coordinates: waypoints[0],
        target_hospital_id: targetHospitalId || localHosp[0]?.id,
        distance_remaining_km: localHosp[0]?.travel_distance_km || 2.8,
        eta_seconds: Math.round((localHosp[0]?.travel_time_min || 5.0) * 60)
      },
      incident: {
        ...prev.incident,
        coordinates: center,
        address: `${cityName} Emergency Scene`
      },
      signals: localSig,
      route_coords: waypoints,
      ranked_hospitals: localHosp
    }));

    setIncidents(prev => prev.map(inc => ({
      ...inc,
      coordinates: center,
      address: `${cityName} Emergency Scene`
    })));
  };

  // Live WebSocket Subscription
  useEffect(() => {
    const ws = new TelemetryWebSocket(
      (data) => {
        if (data && !hasUserRelocatedRef.current) {
          setTelemetry(data);
          if (data.ranked_hospitals && data.ranked_hospitals.length) {
            setHospitals(data.ranked_hospitals);
          }
        } else if (data && hasUserRelocatedRef.current) {
          // If relocated, preserve local coordinates & hospitals, but update progress/speed
          setTelemetry(prev => ({
            ...prev,
            is_running: data.is_running,
            sim_speed: data.sim_speed,
            progress: data.progress,
            traffic_jam_injected: data.traffic_jam_injected,
            ambulance: {
              ...prev.ambulance,
              speed_kmh: data.ambulance?.speed_kmh || prev.ambulance.speed_kmh,
              eta_seconds: Math.max(30, Math.round(prev.ambulance.eta_seconds * (1 - (data.progress * 0.1))))
            }
          }));
        }
      },
      (status) => {
        setWsStatus(status);
      }
    );

    ws.connect();
    return () => ws.close();
  }, []);

  const handleControlSimulation = async (params) => {
    try {
      if (params.action === 'set_scenario' && params.scenarioKey) {
        const scConfig = SCENARIOS_DATA[params.scenarioKey];
        if (scConfig) {
          // Immediately update telemetry with the new scenario
          setTelemetry(prev => {
            const matchedHosp = hospitals.find(h => h.id === scConfig.preferred_hosp_id) || hospitals[0];
            return {
              ...prev,
              scenario_key: params.scenarioKey,
              incident: {
                ...prev.incident,
                id: scConfig.id,
                title: scConfig.title,
                category: scConfig.category,
                severity: scConfig.severity,
                patient_vitals: scConfig.vitals
              },
              ambulance: {
                ...prev.ambulance,
                callsign: scConfig.assigned_ambulance,
                type: scConfig.ambulance_type,
                target_hospital_id: matchedHosp?.id || prev.ambulance.target_hospital_id
              }
            };
          });

          // Update incidents queue
          setIncidents(prev => prev.map(inc => ({
            ...inc,
            id: scConfig.id,
            scenario_key: scConfig.key,
            title: scConfig.title,
            category: scConfig.category,
            severity: scConfig.severity,
            assigned_ambulance: scConfig.assigned_ambulance
          })));

          // Sort/prioritize hospitals based on emergency type
          setHospitals(prev => {
            const sorted = [...prev];
            if (params.scenarioKey === 'scenario_trauma') {
              sorted.sort((a, b) => (b.burn_unit || b.trauma_level.includes('Level 1') ? 1 : 0) - (a.burn_unit || a.trauma_level.includes('Level 1') ? 1 : 0));
            } else if (params.scenarioKey === 'scenario_pediatric') {
              sorted.sort((a, b) => (b.pediatric_er ? 1 : 0) - (a.pediatric_er ? 1 : 0));
            } else {
              sorted.sort((a, b) => (b.cath_lab_ready ? 1 : 0) - (a.cath_lab_ready ? 1 : 0));
            }
            return sorted;
          });
        }
      }

      // Sync with backend simulation engine
      const res = await controlSimulation(params);
      if (res && !hasUserRelocatedRef.current) {
        setTelemetry(res);
      } else if (res) {
        setTelemetry(prev => ({
          ...prev,
          is_running: res.is_running,
          sim_speed: res.sim_speed,
          traffic_jam_injected: res.traffic_jam_injected
        }));
      }
    } catch (e) {
      console.error('Simulation control error:', e);
    }
  };

  const handleSelectScenario = (key) => {
    handleControlSimulation({
      action: 'set_scenario',
      speed: telemetry?.sim_speed || 1.0,
      scenarioKey: key
    });
  };

  const handleSelectHospital = (hId) => {
    const chosen = hospitals.find(h => h.id === hId);
    if (!chosen) return;

    soundFx.playReroute();

    const ambCoords = telemetry?.ambulance?.coordinates || { lat: 26.7606, lng: 83.3732 };
    const { waypoints, signals: newSignals } = generateRouteAndSignals(
      ambCoords.lat,
      ambCoords.lng,
      chosen
    );

    setTelemetry(prev => ({
      ...prev,
      ambulance: {
        ...prev.ambulance,
        target_hospital_id: hId,
        distance_remaining_km: chosen.travel_distance_km || 2.4,
        eta_seconds: Math.round((chosen.travel_time_min || 5.0) * 60)
      },
      route_coords: waypoints,
      signals: newSignals
    }));
  };

  const nextSignal = (telemetry?.signals || []).find(
    s => s.state === 'green_wave' || s.state === 'amber_prep'
  ) || telemetry?.signals?.[0];

  const handleSwitchRoleById = (roleId) => {
    const matchedRole = PORTAL_ROLES.find(r => r.id === roleId) || PORTAL_ROLES[0];
    handleSelectRole(matchedRole);
  };

  // If not logged in, render the dedicated Full-Screen Login Page!
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Header - 4 Primary Role Tabs, Theme, Audio, Profile */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wsStatus={wsStatus}
        onOpenPitch={() => setIsPitchOpen(true)}
        activeScenarioKey={telemetry?.scenario_key}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onSwitchRole={handleSwitchRoleById}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Global Mission Control Simulation Bar */}
      <SimulationBar
        telemetry={telemetry}
        onControlSimulation={handleControlSimulation}
      />

      {/* Main Module Content Area */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto p-3 sm:p-5 space-y-4">

        {/* TAB 1: COMMAND & GIS MAP (DRIVER VIEW) */}
        {activeTab === 'command_map' && (
          isDriver && !driverActiveMission ? (
            <DriverStandbyView
              currentUser={currentUser}
              onSimulateIncomingRequest={() => {}}
              onAcceptRide={handleRideAcceptedByDriver}
            />
          ) : (
            <div className="space-y-4">
              {/* Active Emergency Mission Banner (when Driver accepted ride) */}
              {isDriver && driverActiveMission && (
                <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-2 border-red-500 rounded-3xl p-4 sm:p-5 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in text-white ring-4 ring-red-500/20">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center text-2xl shrink-0 animate-pulse">
                      🚨
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500 text-white shadow-sm">
                          LIVE PATIENT MISSION IN PROGRESS
                        </span>
                        <span className="text-xs text-red-300 font-bold">
                          Patient: {driverActiveMission.patientName || 'Citizen Patient'}
                        </span>
                      </div>
                      <div className="text-base sm:text-lg font-black mt-0.5">
                        📍 Pickup: {driverActiveMission.pickupAddress}
                      </div>
                      <div className="text-xs text-slate-300">
                        🏥 Hospital: <span className="text-emerald-400 font-bold">{driverActiveMission.hospitalName || 'AIIMS Gorakhpur Super-Specialty ER'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0">
                    {/* Voice Call Patient Button */}
                    <button
                      type="button"
                      onClick={() => {
                        try { soundFx?.playClick?.(); } catch (e) {}
                        callService.makeCall({
                          targetRole: 'patient',
                          callType: 'voice',
                          callerName: `Ambulance MEDIC-12 (${currentUser?.name || 'Driver'})`,
                          targetName: driverActiveMission.patientName || 'Citizen Patient',
                          department: 'Patient Intercom'
                        });
                      }}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black text-xs shadow-lg flex items-center space-x-1.5 cursor-pointer ring-2 ring-emerald-400/40"
                    >
                      <PhoneCall className="w-4 h-4 fill-current" />
                      <span>Call Patient (Voice) 📞</span>
                    </button>

                    {/* Complete Mission Button */}
                    <button
                      type="button"
                      onClick={handleCompleteDriverMission}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs border border-slate-700 shadow-md flex items-center space-x-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Finish & Standby 🏁</span>
                    </button>
                  </div>
                </div>
              )}

              <TelemetryHUD
                ambulance={telemetry?.ambulance}
                nextSignal={nextSignal}
                signals={telemetry?.signals}
                setTelemetry={setTelemetry}
                hospitals={hospitals}
                onSelectHospital={handleSelectHospital}
                onNavigateTab={setActiveTab}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px] lg:h-[620px]">
                {/* Map Left 8-9 Cols */}
                <div className="lg:col-span-8 xl:col-span-9 h-[540px] lg:h-full">
                  <LiveMap
                    telemetry={telemetry}
                    hospitals={hospitals}
                    onLocationRelocated={handleLocationRelocated}
                    onSelectHospital={handleSelectHospital}
                  />
                </div>

                {/* Incidents Feed Right 3-4 Cols */}
                <div className="lg:col-span-4 xl:col-span-3 h-full">
                  <IncidentQueue
                    incidents={incidents}
                    activeIncident={telemetry?.incident}
                    onSelectScenario={handleSelectScenario}
                    currentScenarioKey={telemetry?.scenario_key}
                    onNavigateTab={setActiveTab}
                  />
                </div>
              </div>
            </div>
          )
        )}

        {/* TAB 2: TRAFFIC-SIGNAL PRE-COORDINATION */}
        {activeTab === 'signals' && (
          <SignalCorridorView
            signals={telemetry?.signals || []}
            ambulance={telemetry?.ambulance}
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            onNavigateTab={setActiveTab}
            onSignalUpdated={() => {
              fetchTelemetrySnapshot().then(data => {
                if (data && !hasUserRelocatedRef.current) setTelemetry(data);
              });
            }}
          />
        )}

        {/* TAB 3: HOSPITAL RECOMMENDATION MATRIX */}
        {activeTab === 'hospitals' && (
          <HospitalMatrixView
            hospitals={hospitals}
            currentHospitalId={telemetry?.ambulance?.target_hospital_id}
            onHospitalSelected={handleSelectHospital}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* TAB 4: AI CLINICAL RISK INDICATOR */}
        {activeTab === 'triage' && (
          <AIRiskView
            initialVitals={telemetry?.incident?.patient_vitals}
            onAssessmentUpdated={(_res) => {
              // Updated triage
            }}
          />
        )}

        {/* TAB 5: PRE-ARRIVAL ER HANDOFF TERMINAL */}
        {activeTab === 'handoff' && (
          <HospitalHandoffView
            telemetry={telemetry}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* TAB 6: SUPER ADMINISTRATOR MASTER CONTROL DECK */}
        {activeTab === 'admin_panel' && (
          <AdminControlPanel
            telemetry={telemetry}
            setTelemetry={setTelemetry}
            hospitals={hospitals}
            setHospitals={setHospitals}
            onSelectScenario={handleSelectScenario}
          />
        )}

        {/* TAB 7: CITIZEN / PATIENT EMERGENCY PORTAL (Emergency Dispatch) */}
        {activeTab === 'patient_portal' && (
          <PatientPortalView
            telemetry={telemetry}
            hospitals={hospitals}
            onNavigateTab={setActiveTab}
          />
        )}

      </main>

      {/* Capstone Pitch / Tech Presentation Modal */}
      <HeroPitchModal
        isOpen={isPitchOpen}
        onClose={() => setIsPitchOpen(false)}
        onSelectScenario={handleSelectScenario}
      />

      {/* Role Portal / Login Modal (Ambulance, Hospital ER, Traffic, CAD Dispatch) */}
      <RolePortalModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
      />

      {/* Real-Time Telemedicine Video & Voice Calling across devices */}
      <IncomingCallNotification />
      <EmergencyCallModal telemetry={telemetry} />

      {/* Real-Time Incoming Patient Ride Request Modal (for Driver) */}
      <IncomingRideRequestModal onRideAccepted={handleRideAcceptedByDriver} />

    </div>
  );
}

