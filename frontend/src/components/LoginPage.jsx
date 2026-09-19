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
  Moon
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
  const [selectedRole, setSelectedRole] = useState('driver');
  const [username, setUsername] = useState('driver108');
  const [password, setPassword] = useState('1080');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const executeLogin = (role) => {
    try {
      soundFx?.playClick?.();
      soundFx?.playSuccess?.();
    } catch (err) {}

    setIsLoggingIn(true);
    // Instant login
    onLogin(role);
  };

  const handleSelectAndFill = (roleKey) => {
    const role = USER_ROLES[roleKey];
    setSelectedRole(roleKey);
    setUsername(role.defaultId);
    setPassword(role.defaultPass);
    try {
      soundFx?.playClick?.();
    } catch (err) {}
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const role = USER_ROLES[selectedRole] || USER_ROLES.driver;
    executeLogin(role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-rose-50/40 to-slate-200 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans selection:bg-rose-600 selection:text-white">
      
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-100/70 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider mb-3">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Select Your Department • Click Any Card To Enter</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            AmbuRoute Operational Sign-In
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto mt-2">
            Click any role below to immediately enter their dedicated workstation.
          </p>
        </div>

        {/* 4 Role Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(USER_ROLES).map(([key, role]) => {
            const isSelected = selectedRole === key;
            const Icon = role.icon;

            return (
              <div
                key={key}
                onClick={() => {
                  handleSelectAndFill(key);
                  executeLogin(role);
                }}
                className={`relative rounded-3xl border-2 p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between hover:scale-102 hover:shadow-xl ${
                  isSelected 
                    ? 'border-rose-600 bg-white shadow-xl shadow-rose-600/10 scale-102 ring-2 ring-rose-600/20' 
                    : 'border-slate-200/90 bg-white/90 hover:bg-white hover:border-rose-300 shadow-sm'
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

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      executeLogin(role);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-1 cursor-pointer bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25"
                  >
                    <span>Click to Enter ➔</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional Credentials Form Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl max-w-xl mx-auto">
          <div className="flex items-center space-x-3 mb-5 pb-4 border-b border-slate-100">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${USER_ROLES[selectedRole].color} text-white flex items-center justify-center shadow-sm`}>
              {React.createElement(USER_ROLES[selectedRole].icon, { className: 'w-5 h-5' })}
            </div>
            <div>
              <div className="text-xs font-black uppercase text-slate-400">Or Sign In with Credentials:</div>
              <div className="text-base font-black text-slate-900">{USER_ROLES[selectedRole].name}</div>
            </div>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Username / Badge ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Password / Access PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Sign In as {USER_ROLES[selectedRole].roleTag}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Helper Hint */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              💡 <strong>Instant Access:</strong> Click any of the 4 big cards above to log in directly without typing passwords!
            </span>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center py-4 border-t border-slate-200/60 text-xs text-slate-500 font-mono">
        AmbuRoute Multi-Tenant Disaster & Emergency Response System • Real-Time V2I Telemetry
      </div>

    </div>
  );
}
