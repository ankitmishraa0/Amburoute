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
  Fingerprint
} from 'lucide-react';
import { soundFx } from '../services/sound';

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
    defaultId: 'driver108',
    defaultPass: '1080',
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
    defaultId: 'doctor_aiims',
    defaultPass: 'aiims123',
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
    defaultId: 'traffic_gkp',
    defaultPass: 'traffic123',
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
    defaultId: 'admin',
    defaultPass: 'admin123',
    description: 'Ultimate power: Change speed, edit patient vitals, override all signals, edit hospital beds, and inject incidents.'
  }
};

export default function LoginPage({ onLogin, theme = 'light', toggleTheme }) {
  const [selectedRoleKey, setSelectedRoleKey] = useState('driver');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Role Selection (Selects department and gives clean feedback)
  const handleRoleCardSelect = (key) => {
    setSelectedRoleKey(key);
    setErrorMessage(null);
    try { soundFx?.playClick?.(); } catch (e) {}
  };

  // Quick-fill hint for authorized users
  const handleFillAuthorizedPreset = (key) => {
    const role = USER_ROLES[key];
    setSelectedRoleKey(key);
    setUsername(role.defaultId);
    setPassword(role.defaultPass);
    setErrorMessage(null);
    try { soundFx?.playClick?.(); } catch (e) {}
  };

  // Strict Authentication Handler
  const handleSecureLogin = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsVerifying(true);
    try { soundFx?.playClick?.(); } catch (err) {}

    const targetRole = USER_ROLES[selectedRoleKey];

    setTimeout(() => {
      setIsVerifying(false);

      // STRICT VALIDATION CHECK
      const isUsernameCorrect = username.trim().toLowerCase() === targetRole.defaultId.toLowerCase();
      const isPasswordCorrect = password.trim() === targetRole.defaultPass;

      if (!isUsernameCorrect || !isPasswordCorrect) {
        // AUTHENTICATION FAILED
        try { soundFx?.playCriticalAlert?.(); } catch (e) {}
        setFailedAttempts(prev => prev + 1);
        setErrorMessage(
          `Security Alert: Invalid credentials for ${targetRole.name}. Access Denied. Verify Badge ID & Security Password.`
        );
        return;
      }

      // AUTHENTICATION PASSED - Issue Security Session
      try { soundFx?.playSuccess?.(); } catch (err) {}

      const authenticatedUser = {
        ...targetRole,
        sessionToken: `SEC-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        loginTimestamp: new Date().toLocaleTimeString()
      };

      onLogin(authenticatedUser);
    }, 450);
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
                {/* Active check bubble */}
                {isSelected && (
                  <div className="absolute top-3 right-3 bg-rose-600 text-white rounded-full p-1 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}

                <div>
                  {/* Icon badge */}
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFillAuthorizedPreset(key);
                    }}
                    className="text-[10px] font-mono font-bold text-slate-400 hover:text-slate-700 underline"
                    title="Fill official badge preset for fast testing"
                  >
                    Auto-Fill ID
                  </button>
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

          {/* Security Error Banner on Wrong Credentials */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 text-xs font-bold flex items-start space-x-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <div>{errorMessage}</div>
                <div className="text-[10px] text-rose-600 font-mono mt-1">Failed attempts logged: {failedAttempts}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSecureLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Operator Badge ID / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder={`e.g. ${selectedRole.defaultId}`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600"
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
                  required
                  placeholder="Enter security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
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

          {/* Authorized Credentials Card for Presentation */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <div>
              Authorized ID for <strong className="text-slate-800">{selectedRole.name.split(' ')[0]}</strong>: <code className="text-rose-600 font-bold">{selectedRole.defaultId}</code> / <code className="text-rose-600 font-bold">{selectedRole.defaultPass}</code>
            </div>
            <button
              type="button"
              onClick={() => handleFillAuthorizedPreset(selectedRoleKey)}
              className="px-2 py-1 rounded-lg bg-white border border-slate-300 hover:border-rose-500 text-slate-700 text-[10px] font-bold cursor-pointer"
            >
              Auto-Fill
            </button>
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

    </div>
  );
}
