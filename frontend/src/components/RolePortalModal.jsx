import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Building2, 
  Navigation, 
  Signal, 
  CheckCircle2, 
  ArrowRight, 
  UserCheck, 
  KeyRound,
  Lock,
  User,
  Fingerprint,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { soundFx } from '../services/sound';

export const PORTAL_ROLES = [
  {
    id: 'driver',
    name: 'Ambulance Driver / Paramedic',
    badge: 'UNIT MEDIC-12 (ALS)',
    icon: Navigation,
    color: 'from-rose-600 to-red-600',
    borderColor: 'border-rose-300',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-700',
    assignedTab: 'command_map',
    userTitle: 'Paramedic J. Miller & Driver Rajesh',
    sampleId: 'driver108',
    samplePin: '1080',
    desc: 'Access turn-by-turn GPS emergency routing, live patient vitals intake, and nearest hospital selector.'
  },
  {
    id: 'hospital',
    name: 'Hospital ER Trauma Bay Desk',
    badge: 'AIIMS GORAKHPUR ER',
    icon: Building2,
    color: 'from-blue-600 to-indigo-600',
    borderColor: 'border-blue-300',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
    assignedTab: 'handoff',
    userTitle: 'Dr. C. Sterling (Attending ER Physician)',
    sampleId: 'doctor_aiims',
    samplePin: 'aiims123',
    desc: 'Receive pre-arrival patient vitals, live Lead-II ECG telemetry, reserve ICU beds, and print clinical admission slips.'
  },
  {
    id: 'traffic',
    name: 'Smart City Traffic Police (ITMS)',
    badge: 'GORAKHPUR TRAFFIC HQ',
    icon: Signal,
    color: 'from-emerald-600 to-teal-600',
    borderColor: 'border-emerald-300',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    assignedTab: 'signals',
    userTitle: 'Officer R. Verma (Traffic Preemption Controller)',
    sampleId: 'traffic_gkp',
    samplePin: 'traffic123',
    desc: 'Monitor citywide V2I intersection clearance, green wave corridors, and execute manual emergency signal overrides.'
  },
  {
    id: 'admin',
    name: 'Master Administrator (Super Admin)',
    badge: 'ALL POWERS ENABLED',
    icon: ShieldAlert,
    color: 'from-amber-500 to-orange-600',
    borderColor: 'border-amber-300',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-800',
    assignedTab: 'admin_panel',
    userTitle: 'System Administrator (Full God Mode)',
    sampleId: 'admin',
    samplePin: 'admin123',
    desc: 'Full root authority: Edit speeds, inject patient vitals, override all signals, modify hospital beds, and trigger gridlocks.'
  }
];

export default function RolePortalModal({ 
  isOpen, 
  onClose, 
  currentRole, 
  onSelectRole 
}) {
  const [authMode, setAuthMode] = useState('quick'); // 'quick' or 'form'
  const [loginId, setLoginId] = useState('driver108');
  const [loginPin, setLoginPin] = useState('1080');
  const [selectedRoleId, setSelectedRoleId] = useState('driver');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFormLogin = (e) => {
    e?.preventDefault();
    setIsAuthenticating(true);
    soundFx.playClick();

    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthSuccess(true);
      soundFx.playSuccess();

      const matchedRole = PORTAL_ROLES.find(r => r.id === selectedRoleId) || PORTAL_ROLES[0];
      
      setTimeout(() => {
        onSelectRole(matchedRole);
        setAuthSuccess(false);
        onClose();
      }, 700);
    }, 600);
  };

  const handleFillPreset = (role) => {
    setSelectedRoleId(role.id);
    setLoginId(role.sampleId);
    setLoginPin(role.samplePin);
    soundFx.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-rose-50 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-rose-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">AmbuRoute Operational Portal Access</h3>
              <p className="text-[11px] text-slate-500 font-medium">Role-Based Authentication: Ambulance Crew & Hospital ER Desks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 px-6 pt-3 space-x-2">
          <button
            onClick={() => {
              setAuthMode('quick');
              soundFx.playClick();
            }}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
              authMode === 'quick' 
                ? 'border-rose-600 text-rose-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ⚡ Instant Role Switch (Viva Demo Mode)
          </button>
          <button
            onClick={() => {
              setAuthMode('form');
              soundFx.playClick();
            }}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
              authMode === 'form' 
                ? 'border-rose-600 text-rose-700' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🔒 Secure Credentials Login
          </button>
        </div>

        {/* TAB 1: QUICK ROLE SWITCH */}
        {authMode === 'quick' && (
          <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto max-h-[calc(92vh-130px)]">
            <div className="text-xs text-slate-500 font-medium pb-1 flex items-center justify-between">
              <span>Select workstation portal to instantly assume operator identity:</span>
              <span className="text-[11px] text-rose-600 font-bold">1-Click Live Switch</span>
            </div>

            {PORTAL_ROLES.map((role) => {
              const isSelected = currentRole?.id === role.id;
              const Icon = role.icon;

              return (
                <div
                  key={role.id}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectRole(role);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start space-x-4 ${
                    isSelected
                      ? 'border-rose-600 bg-rose-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${role.color} text-white shrink-0 shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-black text-sm text-slate-900">{role.name}</h4>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${role.bgLight} ${role.textColor} ${role.borderColor}`}>
                        {role.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-normal">
                      {role.desc}
                    </p>
                    <div className="text-[11px] font-mono text-slate-500 mt-2 flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Logged in as: <strong className="text-slate-800">{role.userTitle}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-2">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 ${
                      isSelected ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <span>{isSelected ? 'Active Session' : 'Enter Portal'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CREDENTIALS FORM LOGIN */}
        {authMode === 'form' && (
          <form onSubmit={handleFormLogin} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-130px)]">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Select Department Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PORTAL_ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleFillPreset(role)}
                    className={`p-2.5 rounded-xl border text-left flex items-center space-x-2 cursor-pointer transition-all ${
                      selectedRoleId === role.id 
                        ? 'border-rose-600 bg-rose-50/60 ring-2 ring-rose-600/10' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg bg-gradient-to-br ${role.color} text-white`}>
                      <role.icon className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-900 truncate">{role.name.split(' ')[0]} {role.name.split(' ')[1]}</div>
                      <div className="text-[10px] font-mono text-slate-500">{role.badge}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Operator Badge ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="e.g. PARAMEDIC-108"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                  Security Access PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                </div>
              </div>
            </div>

            {/* Quick Demo Credentials Help */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start space-x-2">
              <Fingerprint className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">Pre-Configured Demo Credentials:</span> Click any role button above to auto-populate official badge ID & PIN for fast college viva testing.
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating || authSuccess}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs text-white uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer ${
                authSuccess 
                  ? 'bg-emerald-600 shadow-emerald-600/20' 
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
              }`}
            >
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Encrypted Access Token...</span>
                </>
              ) : authSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Access Granted • Navigating to Workstation...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate & Open Portal</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Role-Based Access Control (RBAC) • Multi-Tenant Telemetry</span>
          <span className="text-emerald-600 font-bold">● System Encrypted</span>
        </div>

      </div>
    </div>
  );
}
