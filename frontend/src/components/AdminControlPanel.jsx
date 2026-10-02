import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  HeartPulse, 
  Signal, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Save, 
  Siren,
  User,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  Search,
  Filter,
  X,
  Eye,
  EyeOff,
  Navigation,
  Shield,
  Bell,
  Check
} from 'lucide-react';
import { userService } from '../services/userService';

export default function AdminControlPanel({ 
  telemetry, 
  setTelemetry, 
  hospitals, 
  setHospitals, 
  onSelectScenario 
}) {
  // Navigation sub-tab: 'telemetry' | 'users' | 'requests'
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

  // Password Reset & Access Requests State
  const [requestsList, setRequestsList] = useState([]);
  const [requestFilter, setRequestFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [approvingRequest, setApprovingRequest] = useState(null);
  const [approvedPassInput, setApprovedPassInput] = useState('');

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

  const loadData = () => {
    const list = userService.getUsers();
    setUsersList(list);
    const reqs = userService.getResetRequests();
    setRequestsList(reqs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const pendingRequestsCount = requestsList.filter(r => r.status === 'pending').length;

  // Apply Ambulance & Patient Changes in Real-Time
  const handleApplyVitals = (e) => {
    e?.preventDefault();

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

    showToast('Telemetry parameters updated and broadcast to inbound unit and receiving bay.');
  };

  // Force Green Wave on all Signals
  const handleForceAllGreen = () => {
    setTelemetry(prev => ({
      ...prev,
      signals: (prev.signals || []).map(s => ({
        ...s,
        state: 'green_wave',
        countdown_sec: 45
      }))
    }));
    showToast('Corridor Preemption: All intersections forced to green wave.');
  };

  // Reset All Signals to Standard Traffic Cycle
  const handleResetSignals = () => {
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

  // Update Hospital ICU Beds
  const handleUpdateHospitalBeds = (hospitalId, delta) => {
    setHospitals(prev => prev.map(h => {
      if (h.id === hospitalId) {
        const newBeds = Math.max(0, (h.icu_beds_free || 0) + delta);
        return { ...h, icu_beds_free: newBeds };
      }
      return h;
    }));
    showToast('Hospital ICU capacity updated.');
  };

  // Inject / Clear Traffic Jam
  const handleToggleTrafficJam = () => {
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
    showToast(willJam ? 'Corridor congestion injected. Detour active.' : 'Corridor congestion cleared.');
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
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingUser) {
        userService.updateUser(editingUser.username || editingUser.id, {
          name: formData.name,
          role: formData.role,
          badge: formData.badge,
          department: formData.department,
          password: formData.password,
          status: formData.status
        });
        showToast(`Operator "${formData.username}" updated.`);
      } else {
        userService.createUser(formData);
        showToast(`New operator "${formData.username}" created.`);
      }

      setIsCreateModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Operation failed.');
    }
  };

  const handleDeleteUser = (username) => {
    if (username === 'admin') {
      alert('The root admin account cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        userService.deleteUser(username);
        showToast(`User "${username}" deleted.`);
        loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleToggleStatus = (username, currentStatus) => {
    if (username === 'admin') return;
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    userService.toggleUserStatus(username, newStatus);
    showToast(`Account status updated to ${newStatus}.`);
    loadData();
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset operator directory to factory default credentials?')) {
      userService.resetToDefaults();
      showToast('Operator directory restored to factory defaults.');
      loadData();
    }
  };

  const toggleShowPassword = (username) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [username]: !prev[username]
    }));
  };

  // --- PASSWORD RESET REQUEST HANDLERS ---
  const handleOpenApproveModal = (req) => {
    setApprovingRequest(req);
    setApprovedPassInput(req.requestedPassword || '');
  };

  const handleConfirmApproval = (e) => {
    e.preventDefault();
    if (!approvedPassInput || approvedPassInput.trim().length < 4) {
      alert('Authorized password must be at least 4 characters.');
      return;
    }

    try {
      userService.approveResetRequest(approvingRequest.id, approvedPassInput.trim(), 'Authorized by CAD Supervisor');
      showToast(`Request #${approvingRequest.id} approved. New password active.`);
      setApprovingRequest(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to approve request.');
    }
  };

  const handleRejectRequest = (req) => {
    const reason = prompt('Enter rejection rationale:', 'Identity verification incomplete');
    if (reason !== null) {
      try {
        userService.rejectResetRequest(req.id, reason);
        showToast(`Request #${req.id} rejected.`);
        loadData();
      } catch (err) {
        alert(err.message || 'Failed to reject request.');
      }
    }
  };

  // Filtered users
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.username || u.id || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.badge || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered requests
  const filteredRequests = requestsList.filter(r => {
    if (requestFilter === 'all') return true;
    return r.status === requestFilter;
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'driver': return Navigation;
      case 'hospital': return Building2;
      case 'traffic': return Signal;
      case 'admin': return Shield;
      default: return User;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Dispatch System Administration
              </h2>
              <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono uppercase">
                CAD Supervisor
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
              Manage operator accounts, review password reset requests, and configure live corridor telemetry parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleToggleTrafficJam}
            className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              telemetry?.traffic_jam_injected
                ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
            }`}
          >
            {telemetry?.traffic_jam_injected ? 'Clear Detour' : 'Simulate Detour'}
          </button>
          <button
            onClick={handleForceAllGreen}
            className="px-3 py-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-medium text-xs transition-colors flex items-center space-x-1.5"
          >
            <Signal className="w-3.5 h-3.5" />
            <span>Preempt Corridor Signals</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="p-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-md text-xs font-mono shadow-md flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('telemetry')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'telemetry'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Telemetry Parameters</span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'users'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Operator Directory</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              activeSubTab === 'users' ? 'bg-slate-800 text-slate-200 dark:bg-slate-200 dark:text-slate-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('requests')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeSubTab === 'requests'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Password Requests</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[10px] font-mono">
                {pendingRequestsCount} Pending
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'users' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenCreateModal}
              className="px-2.5 py-1 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-medium transition-colors flex items-center space-x-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Operator</span>
            </button>
            <button
              onClick={handleResetToDefaults}
              title="Restore default accounts"
              className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Defaults</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: OPERATOR DIRECTORY */}
      {activeSubTab === 'users' && (
        <div className="space-y-3">
          {/* Search and Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search operators..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <span className="text-xs text-slate-500 mr-1 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Role:</span>
              </span>
              {[
                { id: 'all', label: 'All' },
                { id: 'driver', label: 'Ambulance' },
                { id: 'hospital', label: 'Hospital' },
                { id: 'traffic', label: 'Traffic' },
                { id: 'admin', label: 'Admin' }
              ].map(rf => (
                <button
                  key={rf.id}
                  onClick={() => setRoleFilter(rf.id)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    roleFilter === rf.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUsers.map((u) => {
              const RoleIcon = getRoleIcon(u.role);
              const isPasswordVisible = showPasswordMap[u.username || u.id];

              return (
                <div 
                  key={u.id || u.username}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                          <RoleIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase">
                            {u.role}
                          </div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                            {u.badge || u.department}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleStatus(u.username || u.id, u.status)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                          u.status === 'active'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900'
                        }`}
                      >
                        {u.status}
                      </button>
                    </div>

                    <div className="mt-2.5 space-y-1.5">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Operator</div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">{u.name}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">Username</div>
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {u.username || u.id}
                          </div>
                        </div>

                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                          <div className="text-[9px] text-slate-400 uppercase">Password</div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {isPasswordVisible ? u.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleShowPassword(u.username || u.id)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium flex items-center space-x-1 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {(u.username || u.id) !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u.username || u.id)}
                        className="px-2 py-1 rounded bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 text-[11px] font-medium flex items-center space-x-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">No operator accounts match the query</div>
              <button
                onClick={handleOpenCreateModal}
                className="px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded text-xs font-medium"
              >
                Add Operator
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PASSWORD REQUESTS */}
      {activeSubTab === 'requests' && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-xs">Operator Password Reset Requests</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Review identity and authorize requested credentials.
              </p>
            </div>

            <div className="flex items-center space-x-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending' },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setRequestFilter(f.id)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    requestFilter === f.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRequests.map((req) => (
              <div 
                key={req.id} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-mono text-xs text-slate-900 dark:text-white">
                    Request #{req.id} • <span className="font-semibold">{req.username}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${
                    req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800' :
                    req.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:border-red-900' :
                    'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
                  }`}>
                    {req.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Name:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{req.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{req.department || req.role}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reason:</span>
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{req.reason || req.contact}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono">
                    <span className="text-slate-400 text-[10px]">Requested Password:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{req.requestedPassword}</span>
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleRejectRequest(req)}
                      className="px-2.5 py-1 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 text-xs font-medium hover:bg-red-100"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleOpenApproveModal(req)}
                      className="px-3 py-1 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:bg-slate-800"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">No pending password reset requests</div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: TELEMETRY PARAMETERS */}
      {activeSubTab === 'telemetry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left: Vitals & Vehicle Parameters */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase font-mono tracking-wider">
                  Vehicle & Patient Telemetry Broadcast
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                Live Broadcast
              </span>
            </div>

            <form onSubmit={handleApplyVitals} className="space-y-3.5">
              
              {/* Speed Slider */}
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-700 dark:text-slate-300 mb-1">
                  <span>Vehicle Ground Velocity</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{speed} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded appearance-none cursor-pointer accent-slate-900 dark:accent-white"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                  <span>0 km/h</span>
                  <span>60 km/h (ALS City)</span>
                  <span>120 km/h (Expressway)</span>
                </div>
              </div>

              {/* Siren Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Siren className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-xs font-medium text-slate-900 dark:text-white">Emergency Siren Audio Stream</div>
                    <div className="text-[10px] text-slate-400">Transmits V2I audible beacon telemetry</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSiren(!siren)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    siren ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {siren ? 'Active' : 'Muted'}
                </button>
              </div>

              {/* Patient Vitals Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Heart Rate (BPM)
                  </label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Systolic BP
                  </label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Diastolic BP
                  </label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    GCS Score (3-15)
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="15"
                    value={gcs}
                    onChange={(e) => setGcs(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    Patient Age
                  </label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full p-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md font-medium text-xs hover:bg-slate-800 transition-colors flex items-center justify-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Broadcast Telemetry Update</span>
              </button>
            </form>
          </div>

          {/* Right: Signal Overrides & Bed Capacities */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* V2I Signal Master Controls */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Signal className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase font-mono tracking-wider">
                  Corridor Signals Override
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleForceAllGreen}
                  className="p-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-left transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Corridor Green Wave</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Preempt 5 intersections</div>
                </button>

                <button
                  onClick={handleResetSignals}
                  className="p-2.5 bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-left transition-colors"
                >
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">Adaptive Normal</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">Reset timing cycles</div>
                </button>
              </div>
            </div>

            {/* Hospital Bed Capacity Master Override */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Building2 className="w-4 h-4 text-slate-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-xs uppercase font-mono tracking-wider">
                  Hospital Bed Capacity Allocation
                </h3>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {(hospitals || []).slice(0, 4).map((hosp) => (
                  <div key={hosp.id} className="p-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">{hosp.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Available ICU Beds: <strong className="text-slate-800 dark:text-slate-200">{hosp.icu_beds_free}</strong>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 font-mono">
                      <button
                        onClick={() => handleUpdateHospitalBeds(hosp.id, -1)}
                        className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-xs text-slate-900 dark:text-white">
                        {hosp.icu_beds_free}
                      </span>
                      <button
                        onClick={() => handleUpdateHospitalBeds(hosp.id, 1)}
                        className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 flex items-center justify-center"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden my-auto">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {editingUser ? 'Edit Operator Account' : 'Provision New Operator Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-3.5" autoComplete="off">
              {formError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-700 dark:text-red-300 text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Department Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'driver', label: 'Ambulance Crew', desc: 'EMS Telemetry' },
                    { id: 'hospital', label: 'Emergency Room', desc: 'Trauma Bay' },
                    { id: 'traffic', label: 'Traffic Control', desc: 'ITMS Signals' },
                    { id: 'admin', label: 'CAD Supervisor', desc: 'System Admin' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        const depts = {
                          driver: 'Emergency Medical Services (EMS)',
                          hospital: 'Hospital Emergency Room',
                          traffic: 'Traffic Police ITMS',
                          admin: 'CAD System Administration'
                        };
                        setFormData(prev => ({ ...prev, role: r.id, department: depts[r.id] }));
                      }}
                      className={`p-2 rounded-md border text-left transition-colors ${
                        formData.role === r.id
                          ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">{r.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Operator Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Username / Badge ID
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    placeholder="e.g. driver109"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().trim() }))}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-100 dark:disabled:bg-slate-850"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Password / PIN
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Min 4 characters"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Call-sign / Badge Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UNIT MEDIC-14 (ALS)"
                    value={formData.badge}
                    onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs hover:bg-slate-800 transition-colors flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingUser ? 'Save Changes' : 'Provision Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVE PASSWORD RESET MODAL */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden my-auto">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Approve Password Reset</h3>
              </div>
              <button
                onClick={() => setApprovingRequest(null)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} className="p-5 space-y-3.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-md border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                <div>Operator: <strong className="text-slate-900 dark:text-white">{approvingRequest.name}</strong></div>
                <div>Badge ID: <code className="font-mono text-slate-900 dark:text-white font-semibold">{approvingRequest.username}</code></div>
                <div>Department: <strong className="text-slate-900 dark:text-white">{approvingRequest.department}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Authorized New Password / PIN
                </label>
                <input
                  type="text"
                  required
                  value={approvedPassInput}
                  onChange={(e) => setApprovedPassInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setApprovingRequest(null)}
                  className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Authorize Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
