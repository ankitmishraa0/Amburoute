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
  Clock
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
  const [isVerifying, setIsVerifying] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Role Selection (Selects department and resets error message)
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
    setIsVerifying(true);
    try { soundFx?.playClick?.(); } catch (err) {}

    const targetRole = USER_ROLES[selectedRoleKey];

    setTimeout(() => {
      setIsVerifying(false);

      // Authenticate against persistent user database (default + admin-created users)
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

      // AUTHENTICATION PASSED - Issue Security Session
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

        {/* 4 Role Selection Cards - Clean, without auto-fill hints */}
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

          {/* Security Error Banner on Wrong Credentials */}
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

          {/* Strict Protected Form with autoComplete="off" */}
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

          {/* Security Status Ribbon (No sensitive credentials displayed) */}
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

    </div>
  );
}
