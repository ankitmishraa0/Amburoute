import React, { useState, useEffect } from 'react';
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
  Radio,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  Key,
  ShieldCheck,
  Search,
  Filter,
  X,
  Lock,
  Eye,
  EyeOff,
  Navigation,
  Shield
} from 'lucide-react';
import { soundFx } from '../services/sound';
import { userService } from '../services/userService';

export default function AdminControlPanel({ 
  telemetry, 
  setTelemetry, 
  hospitals, 
  setHospitals, 
  onSelectScenario 
}) {
  // Navigation sub-tab: 'telemetry' | 'users'
  const [activeSubTab, setActiveSubTab] = useState('telemetry');

  // Telemetry Controls State
  const [speed, setSpeed] = useState(telemetry?.ambulance?.speed_kmh || 58);
  const [siren, setSiren] = useState(telemetry?.ambulance?.siren_active ?? true);
  const [heartRate, setHeartRate] = useState(telemetry?.incident?.patient_vitals?.heart_rate || 134);
  const [systolic, setSystolic] = useState(telemetry?.incident?.patient_vitals?.systolic_bp || 82);
  const [diastolic, setDiastolic] = useState(telemetry?.incident?.patient_vitals?.diastolic_bp || 54);
  const [spo2, setSpo2] = useState(telemetry?.incident?.patient_vitals?.spo2 || 88);
  const [gcs, setGcs] = useState(telemetry?.incident?.patient_vitals?.gcs_score || 14);
  const [patientAge, setPatientAge] = useState(telemetry?.incident?.patient_vitals?.age || 58);
  const [toastMsg, setToastMsg] = useState(null);

  // User Management State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Create User Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'driver',
    badge: '',
    department: '',
    status: 'active'
  });
  const [formError, setFormError] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const list = userService.getUsers();
    setUsersList(list);
  };

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

  // --- USER MANAGEMENT HANDLERS ---
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'driver',
      badge: '',
      department: '',
      status: 'active'
    });
    setFormError(null);
    setIsCreateModalOpen(true);
    soundFx.playClick();
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      username: user.username || user.id || '',
      password: user.password || '',
      role: user.role || 'driver',
      badge: user.badge || '',
      department: user.department || '',
      status: user.status || 'active'
    });
    setFormError(null);
    setIsCreateModalOpen(true);
    soundFx.playClick();
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    setFormError(null);
    soundFx.playClick();

    try {
      if (editingUser) {
        // Update existing user
        userService.updateUser(editingUser.username || editingUser.id, {
          name: formData.name,
          role: formData.role,
          badge: formData.badge,
          department: formData.department,
          password: formData.password,
          status: formData.status
        });
        showToast(`User '${editingUser.username}' successfully updated.`);
      } else {
        // Create new user / driver ID
        const created = userService.createUser(formData);
        showToast(`New Operator ID '${created.username}' registered successfully!`);
      }
      loadUsers();
      setIsCreateModalOpen(false);
    } catch (err) {
      soundFx.playCriticalAlert();
      setFormError(err.message || 'Failed to save user account.');
    }
  };

  const handleToggleStatus = (username, currentStatus) => {
    soundFx.playClick();
    try {
      const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
      userService.updateUser(username, { status: nextStatus });
      loadUsers();
      showToast(`User '${username}' is now ${nextStatus.toUpperCase()}.`);
    } catch (err) {
      soundFx.playCriticalAlert();
      showToast(`Error: ${err.message}`);
    }
  };

  const handleDeleteUser = (username) => {
    if (!window.confirm(`Are you sure you want to delete user account '${username}'?`)) {
      return;
    }
    soundFx.playClick();
    try {
      userService.deleteUser(username);
      loadUsers();
      showToast(`User ID '${username}' deleted.`);
    } catch (err) {
      soundFx.playCriticalAlert();
      showToast(`Error: ${err.message}`);
    }
  };

  const handleResetToDefaults = () => {
    if (!window.confirm('Reset all user accounts to default factory settings? Custom accounts will be removed.')) {
      return;
    }
    soundFx.playClick();
    userService.resetToDefaults();
    loadUsers();
    showToast('User accounts reset to system defaults.');
  };

  const toggleShowPassword = (username) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  // Filtered users
  const filteredUsers = usersList.filter(u => {
    const query = userSearch.toLowerCase();
    const matchSearch = 
      (u.name || '').toLowerCase().includes(query) ||
      (u.username || u.id || '').toLowerCase().includes(query) ||
      (u.badge || '').toLowerCase().includes(query);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleTheme = (role) => {
    switch (role) {
      case 'driver':
        return { color: 'from-rose-600 to-red-600', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: Navigation };
      case 'hospital':
        return { color: 'from-blue-600 to-indigo-600', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Building2 };
      case 'traffic':
        return { color: 'from-emerald-600 to-teal-600', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Signal };
      case 'admin':
        return { color: 'from-amber-500 to-orange-600', text: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', icon: Crown };
      default:
        return { color: 'from-slate-600 to-slate-800', text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', icon: User };
    }
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
              Manage multi-driver accounts, create login IDs, manipulate speeds, inject patient vitals, and override city signals.
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

      {/* SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-2 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setActiveSubTab('telemetry');
              soundFx.playClick();
            }}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeSubTab === 'telemetry'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>🎛️ Real-Time Telemetry & City Grids</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('users');
              soundFx.playClick();
            }}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Operator & Driver ID Management</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubTab === 'users' ? 'bg-white text-amber-900' : 'bg-slate-100 text-slate-700'
            }`}>
              {usersList.length} Accounts
            </span>
          </button>
        </div>

        {activeSubTab === 'users' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Create User / Driver ID</span>
            </button>
            <button
              onClick={handleResetToDefaults}
              title="Reset user accounts to default factory presets"
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: USER & DRIVER MANAGEMENT DECK */}
      {activeSubTab === 'users' && (
        <div className="space-y-5">
          {/* Filter and Search Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name, ID or badge..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-black text-slate-500 mr-1 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Filter:</span>
              </span>
              {[
                { id: 'all', label: 'All Roles' },
                { id: 'driver', label: '🚑 Ambulance Drivers' },
                { id: 'hospital', label: '🏥 ER Doctors' },
                { id: 'traffic', label: '🚦 Traffic HQ' },
                { id: 'admin', label: '👑 Admins' }
              ].map(rf => (
                <button
                  key={rf.id}
                  onClick={() => {
                    setRoleFilter(rf.id);
                    soundFx.playClick();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    roleFilter === rf.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => {
              const roleMeta = getRoleTheme(u.role);
              const RoleIcon = roleMeta.icon;
              const isPasswordVisible = showPasswordMap[u.username || u.id];

              return (
                <div 
                  key={u.id || u.username}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header: Role badge & Status */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleMeta.color} text-white flex items-center justify-center shadow-xs`}>
                          <RoleIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            {u.role.toUpperCase()}
                          </div>
                          <div className="text-xs font-black text-slate-800 truncate max-w-[140px]">
                            {u.badge || u.department}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(u.username || u.id, u.status)}
                        title={`Click to ${u.status === 'active' ? 'suspend' : 'activate'} this user`}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase cursor-pointer border transition-colors ${
                          u.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        ● {u.status}
                      </button>
                    </div>

                    {/* User Details */}
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-400">Operator Name</div>
                        <div className="text-sm font-black text-slate-900">{u.name}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="text-[9px] font-mono font-bold uppercase text-slate-400">User / Login ID</div>
                          <div className="text-xs font-mono font-black text-rose-600 truncate mt-0.5">
                            {u.username || u.id}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 relative">
                          <div className="text-[9px] font-mono font-bold uppercase text-slate-400">Password / PIN</div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs font-mono font-black text-slate-800">
                              {isPasswordVisible ? u.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(u.username || u.id)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                              title="Show/Hide Password"
                            >
                              {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {u.department && (
                        <div className="text-[11px] text-slate-500 font-medium">
                          Dept: <strong className="text-slate-700">{u.department}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit ID</span>
                    </button>

                    {(u.username || u.id) !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u.username || u.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-black text-slate-700">No users found matching query</div>
              <p className="text-xs text-slate-500">Try adjusting your search terms or filter.</p>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black"
              >
                + Create User ID Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: TELEMETRY & SYSTEM GRIDS (EXISTING) */}
      {activeSubTab === 'telemetry' && (
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
                <div className="flex items-center space-x-2.5">
                  <Siren className={`w-5 h-5 ${siren ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-xs font-black text-slate-900">Acoustic Emergency Siren</div>
                    <div className="text-[10px] text-slate-500">Transmits V2I priority sound pulses</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSiren(!siren)}
                  className={`px-3 py-1 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                    siren ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {siren ? 'SIREN ON' : 'SIREN OFF'}
                </button>
              </div>

              {/* Patient Vitals Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Systolic BP
                  </label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Diastolic BP
                  </label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    GCS Score (3-15)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={gcs}
                    onChange={(e) => setGcs(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Patient Age
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Broadcast Real-Time Telemetry to System</span>
              </button>
            </form>
          </div>

          {/* RIGHT 6 COLS: V2I SIGNALS & HOSPITAL BEDS */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* V2I Signals Master Controls */}
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
                {(hospitals || []).slice(0, 4).map((hosp) => (
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
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-amber-500 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {editingUser ? 'Edit Operator Account' : 'Create New User / Driver ID'}
                  </h3>
                  <p className="text-xs text-amber-100">
                    {editingUser ? `Modifying ${editingUser.username}` : 'Register a new authorized operator into AmbuRoute RBAC'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4" autoComplete="off">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Department / Role Selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Department / Operational Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'driver', label: 'Ambulance Driver', icon: Navigation, desc: 'GPS & Telemetry' },
                    { id: 'hospital', label: 'Hospital ER Doctor', icon: Building2, desc: 'Trauma Bay Desk' },
                    { id: 'traffic', label: 'Traffic Police ITMS', icon: Signal, desc: 'Signal Preemption' },
                    { id: 'admin', label: 'System Admin', icon: Crown, desc: 'Full Root Mode' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ 
                          ...prev, 
                          role: r.id,
                          department: r.label,
                          badge: prev.badge || (r.id === 'driver' ? 'UNIT MEDIC-14 (ALS)' : r.id === 'hospital' ? 'GORAKHPUR CIVIL ER' : 'TRAFFIC POST 01')
                        }));
                        soundFx.playClick();
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 cursor-pointer transition-all ${
                        formData.role === r.id
                          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <span className="p-1.5 rounded-lg bg-slate-900 text-white">
                        <r.icon className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <div className="text-xs font-black text-slate-900">{r.label}</div>
                        <div className="text-[10px] text-slate-400">{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Operator Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar (Driver) & Paramedic Amit"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Login Badge / User ID
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    placeholder="e.g. driver109"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().trim() }))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 disabled:bg-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">Used to login on Portal</span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Security Password / PIN
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">Min 4 characters</span>
                </div>
              </div>

              {/* Unit Badge / Hospital Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Vehicle / Unit Badge
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UNIT MEDIC-14 (ALS)"
                    value={formData.badge}
                    onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="active">Active (Permitted)</option>
                    <option value="suspended">Suspended (Blocked)</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingUser ? 'Save Account Changes' : 'Create & Register ID'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
