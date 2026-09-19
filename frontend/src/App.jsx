import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import SimulationBar from './components/SimulationBar';
import HeroPitchModal from './components/HeroPitchModal';
import RolePortalModal, { PORTAL_ROLES } from './components/RolePortalModal';
import LoginPage, { USER_ROLES } from './components/LoginPage';
import AdminControlPanel from './components/AdminControlPanel';

// Modules
import LiveMap from './components/modules/CommandMap/LiveMap';
import IncidentQueue from './components/modules/CommandMap/IncidentQueue';
import TelemetryHUD from './components/modules/CommandMap/TelemetryHUD';
import SignalCorridorView from './components/modules/SignalCoordination/SignalCorridorView';
import HospitalMatrixView from './components/modules/HospitalMatrix/HospitalMatrixView';
import AIRiskView from './components/modules/AIRiskAssessment/AIRiskView';
import HospitalHandoffView from './components/modules/HospitalHandoff/HospitalHandoffView';

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
  const [currentUser, setCurrentUser] = useState(null); // When null, displays dedicated LoginPage!
  const [currentRole, setCurrentRole] = useState(PORTAL_ROLES[0]); // Default to Ambulance Paramedic
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('amburoute_theme') || 'light';
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

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    try { soundFx?.playClick?.(); } catch (e) {}
  };

  const handleSelectRole = (role) => {
    setCurrentRole(role);
    // Sync with currentUser
    const mappedUser = Object.values(USER_ROLES).find(u => u.id === role.id) || USER_ROLES.driver;
    setCurrentUser(mappedUser);
    if (role.assignedTab) {
      setActiveTab(role.assignedTab);
    }
  };

  const handleLogin = (userRole) => {
    setCurrentUser(userRole);
    const matchedRole = PORTAL_ROLES.find(r => r.id === userRole.id) || PORTAL_ROLES[0];
    setCurrentRole(matchedRole);
    if (userRole.defaultTab) {
      setActiveTab(userRole.defaultTab);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
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

  // If not logged in, render the dedicated Full-Screen Login Page!
  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      
      {/* Header - Operator Profile, Logout, Clean Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wsStatus={wsStatus}
        onOpenPitch={() => setIsPitchOpen(true)}
        activeScenarioKey={telemetry?.scenario_key}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Global Mission Control Simulation Bar */}
      <SimulationBar
        telemetry={telemetry}
        onControlSimulation={handleControlSimulation}
      />

      {/* Main Module Content Area */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Active Operational Portal Notification / Quick Switch Bar */}
        <div className={`px-4 py-2.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all ${
          currentRole?.id === 'hospital' 
            ? 'bg-blue-50/80 border-blue-200 text-blue-950' 
            : currentRole?.id === 'traffic'
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl text-white shrink-0 text-base shadow-xs ${
              currentRole?.id === 'hospital' ? 'bg-blue-600' :
              currentRole?.id === 'traffic' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}>
              {currentRole?.id === 'hospital' ? '🏥' : currentRole?.id === 'traffic' ? '🚦' : '🚑'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider">
                  {currentRole?.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-current/20 font-bold">
                  {currentRole?.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Active Operator: <strong className="text-slate-900">{currentRole?.userTitle}</strong> • {currentRole?.desc}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-black transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <span>🔑 Switch Role / Login</span>
            </button>
          </div>
        </div>

        {/* TAB 1: COMMAND & GIS MAP */}
        {activeTab === 'command_map' && (
          <div className="space-y-4">
            <TelemetryHUD
              ambulance={telemetry?.ambulance}
              nextSignal={nextSignal}
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
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRAFFIC-SIGNAL PRE-COORDINATION */}
        {activeTab === 'signals' && (
          <SignalCorridorView
            signals={telemetry?.signals || []}
            ambulance={telemetry?.ambulance}
            setTelemetry={setTelemetry}
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
          />
        )}

        {/* TAB 4: AI CLINICAL RISK INDICATOR */}
        {activeTab === 'triage' && (
          <AIRiskView
            initialVitals={telemetry?.incident?.patient_vitals}
            onAssessmentUpdated={(res) => {
              // Updated triage
            }}
          />
        )}

        {/* TAB 5: PRE-ARRIVAL ER HANDOFF TERMINAL */}
        {activeTab === 'handoff' && (
          <HospitalHandoffView
            telemetry={telemetry}
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

    </div>
  );
}
