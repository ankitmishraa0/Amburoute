import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Navigation, 
  Building2, 
  Signal, 
  Crown, 
  Lock, 
  ArrowRight, 
  User, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  HeartPulse, 
  Flame, 
  Radio, 
  KeyRound, 
  Sun, 
  Moon, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Fingerprint,
  Shield,
  Clock,
  UserPlus,
  HelpCircle,
  X,
  Check,
  Send,
  Search
} from 'lucide-react';
import { soundFx } from '../services/sound';
import { userService } from '../services/userService';

export const USER_ROLES = {
  driver: {
    id: 'driver',
    name: 'Ambulance Driver / Paramedic',
    roleTag: 'AMBULANCE CREW',
    badge: 'UNIT MEDIC-12 (ALS)',
    icon: Navigation,
    color: 'from-rose-600 to-red-600',
    borderColor: 'border-rose-300',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-700',
    defaultTab: 'command_map',
    userName: 'Paramedic J. Miller & Driver Rajesh',
    description: 'Turn-by-turn emergency GPS navigation, patient vitals transmission, and nearest hospital routing.'
  },
  hospital: {
    id: 'hospital',
    name: 'Hospital ER Doctor / Staff',
    roleTag: 'EMERGENCY ROOM',
    badge: 'AIIMS GORAKHPUR ER',
    icon: Building2,
    color: 'from-blue-600 to-indigo-600',
    borderColor: 'border-blue-300',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
    defaultTab: 'handoff',
    userName: 'Dr. C. Sterling (Attending Physician)',
    description: 'Pre-arrival patient telemetry, live ECG waveform, ICU/Trauma bed booking, and ER triage prep.'
  },
  traffic: {
    id: 'traffic',
    name: 'Traffic Police Controller',
    roleTag: 'ITMS TRAFFIC HQ',
    badge: 'GORAKHPUR TRAFFIC POLICE',
    icon: Signal,
    color: 'from-emerald-600 to-teal-600',
    borderColor: 'border-emerald-300',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    defaultTab: 'signals',
    userName: 'Officer R. Verma (Traffic ITMS)',
    description: 'Real-time V2I intersection preemption, green wave corridor, and emergency signal overrides.'
  },
  admin: {
    id: 'admin',
    name: 'Master Administrator (Super Admin)',
    roleTag: 'FULL SYSTEM ROOT',
    badge: 'ALL POWERS ENABLED',
    icon: Crown,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-300',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-800',
    defaultTab: 'admin_panel',
    userName: 'System Administrator (God Mode)',
    description: 'Ultimate power: Manage operator IDs, change speed, edit patient vitals, override all signals, and edit hospital beds.'
  }
};

export default function LoginPage({ onLogin, theme = 'light', toggleTheme }) {
  const [selectedRoleKey, setSelectedRoleKey] = useState('driver');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  // Self-Registration Form State
  const [regForm, setRegForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'driver',
    badge: '',
    department: 'Ambulance Crew (ALS/BLS)'
  });
  const [regError, setRegError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Forgot Password Form State
  const [forgotTab, setForgotTab] = useState('submit'); // 'submit' | 'status'
  const [forgotForm, setForgotForm] = useState({
    username: '',
    name: '',
    role: 'driver',
    contact: '',
    requestedPassword: '',
    reason: ''
  });
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [statusSearch, setStatusSearch] = useState('');
  const [foundStatus, setFoundStatus] = useState(null);

  // Role Selection
  const handleRoleCardSelect = (key) => {
    setSelectedRoleKey(key);
    setErrorMessage(null);
    try { soundFx?.playClick?.(); } catch (e) {}
  };

  // Strict Authentication Handler
  const handleSecureLogin = (e) => {
    e.preventDefault();
    if (lockoutTime > 0) return;

    setErrorMessage(null);
    setSuccessBanner(null);
    setIsVerifying(true);
    try { soundFx?.playClick?.(); } catch (err) {}

    const targetRole = USER_ROLES[selectedRoleKey];

    setTimeout(() => {
      setIsVerifying(false);

      const authResult = userService.authenticateUser(username, password, selectedRoleKey);

      if (!authResult.success) {
        try { soundFx?.playCriticalAlert?.(); } catch (e) {}
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 4) {
          setLockoutTime(20);
          setErrorMessage('Security Warning: Multiple failed authentication attempts detected. Temporary safety cooldown initiated.');
          const interval = setInterval(() => {
            setLockoutTime(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setErrorMessage(authResult.message);
        }
        return;
      }

      // AUTHENTICATION PASSED
      try { soundFx?.playSuccess?.(); } catch (err) {}
      setFailedAttempts(0);

      const authenticatedUser = {
        ...targetRole,
        ...authResult.user,
        name: authResult.user.name || targetRole.name,
        roleTag: targetRole.roleTag,
        badge: authResult.user.badge || targetRole.badge,
        color: targetRole.color,
        icon: targetRole.icon,
        defaultTab: authResult.user.assignedTab || targetRole.defaultTab
      };

      onLogin(authenticatedUser);
    }, 450);
  };

  // Self-Registration Handler
  const handleSelfRegister = (e) => {
    e.preventDefault();
    setRegError(null);
    setIsRegistering(true);
    soundFx.playClick();

    try {
      const newUser = userService.registerUser(regForm);
      setIsRegistering(false);
      soundFx.playSuccess();
      setIsRegisterOpen(false);

      // Auto-populate into login form
      setSelectedRoleKey(newUser.role);
      setUsername(newUser.username);
      setPassword(newUser.password);
      setSuccessBanner(`Account registered successfully for ${newUser.name}! Click Authenticate to enter.`);
    } catch (err) {
      setIsRegistering(false);
      soundFx.playCriticalAlert();
      setRegError(err.message || 'Registration failed.');
    }
  };

  // Submit Forgot Password Request
  const handleSubmitResetRequest = (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    soundFx.playClick();

    try {
      const req = userService.createResetRequest(forgotForm);
      soundFx.playSuccess();
      setForgotSuccess({
        id: req.id,
        message: `Password reset request #${req.id} sent to System Administrator! Once approved in the Super Admin Deck, you can log in with your new password.`
      });
      setForgotForm({
        username: '',
        name: '',
        role: 'driver',
        contact: '',
        requestedPassword: '',
        reason: ''
      });
    } catch (err) {
      soundFx.playCriticalAlert();
      setForgotError(err.message || 'Failed to submit reset request.');
    }
  };

  // Check Request Status
  const handleCheckStatus = (e) => {
    e.preventDefault();
    soundFx.playClick();
    const res = userService.checkRequestStatus(statusSearch);
    if (!res) {
      setFoundStatus({ notFound: true, query: statusSearch });
    } else {
      setFoundStatus(res);
    }
  };

  const selectedRole = USER_ROLES[selectedRoleKey];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-rose-50/40 to-slate-200 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-rose-600 selection:text-white transition-colors duration-200">
      
      {/* Top Navbar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-600 flex items-center justify-center text-xl text-white shadow-md shadow-rose-600/30">
            🚑
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black tracking-wider text-slate-900">
              AMBU<span className="text-rose-600">ROUTE</span>
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
              Unified Emergency Mission OS
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-mono font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Network Online (Gorakhpur Hub)</span>
          </span>

          {toggleTheme && (
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer hover:bg-slate-50"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>Dark</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Login Card Container */}
      <div className="max-w-5xl w-full mx-auto my-auto py-6">
        
        {/* Title Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-black uppercase tracking-wider mb-2.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span>Strict Role-Based Access Control (RBAC)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Authorized Personnel Portal
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mt-2">
            Select your department role below and enter valid badge credentials to authenticate.
          </p>
        </div>

        {/* 4 Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {Object.entries(USER_ROLES).map(([key, role]) => {
            const isSelected = selectedRoleKey === key;
            const Icon = role.icon;

            return (
              <div
                key={key}
                onClick={() => handleRoleCardSelect(key)}
                className={`relative rounded-3xl border-2 p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected 
                    ? 'border-rose-600 bg-white shadow-xl shadow-rose-600/10 scale-102 ring-2 ring-rose-600/20' 
                    : 'border-slate-200/90 bg-white/90 hover:bg-white hover:border-slate-300 shadow-sm opacity-85 hover:opacity-100'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-rose-600 text-white rounded-full p-1 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}

                <div>
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${role.color} text-white flex items-center justify-center shadow-md mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                    {role.roleTag}
                  </div>
                  <h3 className="font-black text-slate-900 text-base mt-0.5 leading-snug">
                    {role.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className={`font-mono font-bold text-[11px] ${isSelected ? 'text-rose-600' : 'text-slate-400'}`}>
                    {isSelected ? '● Selected Dept' : 'Click to Select'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {role.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secure Credentials Form Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl max-w-xl mx-auto space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${selectedRole.color} text-white flex items-center justify-center shadow-sm`}>
                {React.createElement(selectedRole.icon, { className: 'w-5 h-5' })}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400">Logging In As:</div>
                <div className="text-base font-black text-slate-900">{selectedRole.name}</div>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {selectedRole.badge}
            </span>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Security Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-bold flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <div>{errorMessage}</div>
                {failedAttempts > 0 && (
                  <div className="text-[10px] text-rose-600 font-mono mt-1">
                    Failed login attempts: {failedAttempts} / 4
                  </div>
                )}
                {lockoutTime > 0 && (
                  <div className="text-[11px] text-rose-700 font-black mt-1 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Cooldown active: please wait {lockoutTime}s before retry.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Strict Protected Form */}
          <form 
            onSubmit={handleSecureLogin} 
            className="space-y-4"
            autoComplete="off"
            noValidate
          >
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Operator Badge ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  name="amburoute_operator_badge"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  placeholder="Enter Operator Badge ID or Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={lockoutTime > 0}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Security Access Password / PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="amburoute_security_pin"
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck="false"
                  placeholder="Enter Security Password or PIN"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={lockoutTime > 0}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600 transition-colors disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || lockoutTime > 0}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Encrypted Access Token...</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4" />
                  <span>Authenticate & Enter {selectedRole.roleTag}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Operator Actions: Self-Registration & Forgot Password */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setRegError(null);
                setIsRegisterOpen(true);
                soundFx.playClick();
              }}
              className="font-black text-rose-600 hover:text-rose-700 flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Operator? Create Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setForgotError(null);
                setForgotSuccess(null);
                setIsForgotOpen(true);
                soundFx.playClick();
              }}
              className="font-bold text-slate-500 hover:text-slate-900 flex items-center space-x-1.5 cursor-pointer transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Forgot ID / Password?</span>
            </button>
          </div>

          {/* Security Status Ribbon */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>RBAC Protected Personnel Terminal</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">256-Bit Encrypted</span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center py-4 border-t border-slate-200/60 text-xs text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>AmbuRoute Multi-Tenant Disaster & Emergency Response System</span>
        <span className="text-emerald-600 font-bold flex items-center space-x-1">
          <span>●</span>
          <span>End-to-End TLS / WSS Encrypted</span>
        </span>
      </div>

      {/* ========================================== */}
      {/* 1. OPERATOR SELF-REGISTRATION MODAL */}
      {/* ========================================== */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base">New Operator Registration</h3>
                  <p className="text-xs text-rose-100">Sign up as an Ambulance Driver, Hospital Staff, or Traffic Officer</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSelfRegister} className="p-6 space-y-4" autoComplete="off">
              {regError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Department Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'driver', label: '🚑 Driver', badge: 'UNIT MEDIC (ALS)', dept: 'Ambulance Crew (ALS/BLS)' },
                    { id: 'hospital', label: '🏥 Hospital ER', badge: 'HOSPITAL ER DESK', dept: 'Hospital Emergency Room' },
                    { id: 'traffic', label: '🚦 Traffic HQ', badge: 'TRAFFIC ITMS POST', dept: 'Traffic Police ITMS' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRegForm(prev => ({ 
                        ...prev, 
                        role: r.id, 
                        department: r.dept,
                        badge: prev.badge || r.badge 
                      }))}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                        regForm.role === r.id
                          ? 'border-rose-600 bg-rose-50 text-rose-700 ring-2 ring-rose-600/20'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Full Operator Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar (Ambulance Driver)"
                  value={regForm.name}
                  onChange={(e) => setRegForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Choose Login Badge ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. driver_rajesh"
                    value={regForm.username}
                    onChange={(e) => setRegForm(prev => ({ ...prev, username: e.target.value.toLowerCase().trim() }))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">Used to log in</span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                    Password / Access PIN
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 characters"
                    value={regForm.password}
                    onChange={(e) => setRegForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Assigned Vehicle / Station / Hospital Unit Badge
                </label>
                <input
                  type="text"
                  placeholder="e.g. UNIT MEDIC-15 (ALS) or AIIMS Trauma Bay 2"
                  value={regForm.badge}
                  onChange={(e) => setRegForm(prev => ({ ...prev, badge: e.target.value }))}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Register & Ready to Log In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. FORGOT ID / PASSWORD RECOVERY & REQUEST MODAL */}
      {/* ========================================== */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base">Account Recovery & Reset Request</h3>
                  <p className="text-xs text-slate-300">Submit password reset request to Administrator for authorization</p>
                </div>
              </div>
              <button
                onClick={() => setIsForgotOpen(false)}
                className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-2 space-x-3">
              <button
                onClick={() => setForgotTab('submit')}
                className={`pb-2.5 px-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  forgotTab === 'submit' 
                    ? 'border-rose-600 text-rose-700' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📩 Request Password Reset
              </button>
              <button
                onClick={() => setForgotTab('status')}
                className={`pb-2.5 px-2 text-xs font-black border-b-2 transition-all cursor-pointer ${
                  forgotTab === 'status' 
                    ? 'border-rose-600 text-rose-700' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                🔍 Check Request Approval Status
              </button>
            </div>

            {/* TAB 1: SUBMIT RESET REQUEST */}
            {forgotTab === 'submit' && (
              <form onSubmit={handleSubmitResetRequest} className="p-6 space-y-4" autoComplete="off">
                {forgotError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center space-x-2 font-black text-sm text-emerald-800">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Request #{forgotSuccess.id} Submitted!</span>
                    </div>
                    <p className="leading-relaxed text-emerald-700">
                      {forgotSuccess.message}
                    </p>
                    <div className="p-2 bg-white rounded-xl border border-emerald-200 font-mono text-[11px] text-emerald-800 font-bold">
                      Keep your Request ID: <strong>{forgotSuccess.id}</strong> to track approval status.
                    </div>
                  </div>
                )}

                {!forgotSuccess && (
                  <>
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-snug">
                      <strong>Security Note:</strong> Since AmbuRoute manages critical emergency operations, password changes must be authorized by the Master Administrator.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                          Operator Badge / Username
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. driver108"
                          value={forgotForm.username}
                          onChange={(e) => setForgotForm(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                          Registered Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Paramedic J. Miller"
                          value={forgotForm.name}
                          onChange={(e) => setForgotForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                          Department Role
                        </label>
                        <select
                          value={forgotForm.role}
                          onChange={(e) => setForgotForm(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-600 bg-white"
                        >
                          <option value="driver">Ambulance Driver / Crew</option>
                          <option value="hospital">Hospital ER Staff</option>
                          <option value="traffic">Traffic Police ITMS</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                          Requested New Password / PIN
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Min 4 characters"
                          value={forgotForm.requestedPassword}
                          onChange={(e) => setForgotForm(prev => ({ ...prev, requestedPassword: e.target.value }))}
                          className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                        Reason for Reset / Emergency Contact
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Shift rotation password update / +91 9876543210"
                        value={forgotForm.reason}
                        onChange={(e) => setForgotForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsForgotOpen(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md cursor-pointer flex items-center space-x-1.5"
                      >
                        <Send className="w-4 h-4" />
                        <span>Send Request to Administrator</span>
                      </button>
                    </div>
                  </>
                )}

                {forgotSuccess && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-xs"
                    >
                      Close Window
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* TAB 2: CHECK REQUEST STATUS */}
            {forgotTab === 'status' && (
              <div className="p-6 space-y-4">
                <form onSubmit={handleCheckStatus} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Enter Username (e.g. driver108) or Request ID (e.g. REQ-1234)"
                      value={statusSearch}
                      onChange={(e) => setStatusSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer"
                  >
                    Check
                  </button>
                </form>

                {foundStatus && (
                  <div className="p-4 rounded-2xl border transition-all animate-in fade-in">
                    {foundStatus.notFound ? (
                      <div className="text-center py-3 text-xs text-slate-500">
                        No reset requests found matching "<strong>{foundStatus.query}</strong>".
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="font-mono font-black text-xs text-slate-800">
                            #{foundStatus.id} • {foundStatus.username}
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase ${
                            foundStatus.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            foundStatus.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            ● {foundStatus.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600">
                          <div>Operator: <strong>{foundStatus.name}</strong> ({foundStatus.department})</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Submitted: {foundStatus.createdAt}</div>
                        </div>

                        {foundStatus.status === 'approved' && (
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 font-bold space-y-1">
                            <div className="flex items-center space-x-1.5 text-emerald-700">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approved by Administrator!</span>
                            </div>
                            <p className="text-[11px] text-emerald-700 font-normal">
                              Your new password has been activated. You can now close this window and log in immediately.
                            </p>
                          </div>
                        )}

                        {foundStatus.status === 'pending' && (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Awaiting review and approval by Master Administrator in the Super Admin Deck.</span>
                          </div>
                        )}

                        {foundStatus.status === 'rejected' && (
                          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                            <strong>Declined:</strong> {foundStatus.adminNote || 'Administrator rejected this request.'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
