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
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { soundFx } from '../services/sound';
import { userService } from '../services/userService';

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
    desc: 'Full root authority: Manage operator user IDs, edit speeds, inject patient vitals, override all signals, and modify beds.'
  }
];

export default function RolePortalModal({ 
  isOpen, 
  onClose, 
  currentRole, 
  onSelectRole 
}) {
  const [authMode, setAuthMode] = useState('quick'); // 'quick' or 'form'
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('driver');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleFormLogin = (e) => {
    e?.preventDefault();
    setErrorMsg(null);
    setIsAuthenticating(true);
    soundFx.playClick();

    setTimeout(() => {
      const authResult = userService.authenticateUser(loginId, loginPin, selectedRoleId);

      if (!authResult.success) {
        setIsAuthenticating(false);
        soundFx.playCriticalAlert();
        setErrorMsg(authResult.message);
        return;
      }

      setIsAuthenticating(false);
      setAuthSuccess(true);
      soundFx.playSuccess();

      const matchedRole = PORTAL_ROLES.find(r => r.id === authResult.user.role) || PORTAL_ROLES[0];
      const mergedUserRole = {
        ...matchedRole,
        ...authResult.user,
        name: authResult.user.name || matchedRole.name,
        badge: authResult.user.badge || matchedRole.badge,
        assignedTab: authResult.user.assignedTab || matchedRole.assignedTab
      };

      setTimeout(() => {
        onSelectRole(mergedUserRole);
        setAuthSuccess(false);
        setLoginId('');
        setLoginPin('');
        setErrorMsg(null);
        onClose();
      }, 600);
    }, 400);
  };

  const handleSelectRoleTab = (roleId) => {
    setSelectedRoleId(roleId);
    setErrorMsg(null);
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
              <p className="text-[11px] text-slate-500 font-medium">Role-Based Access: Ambulance Crew, ER Bay, Traffic HQ & Admin</p>
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
            ⚡ Workstation Switch
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
            🔒 Secure Badge Credentials Login
          </button>
        </div>

        {/* TAB 1: QUICK ROLE SWITCH */}
        {authMode === 'quick' && (
          <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto max-h-[calc(92vh-130px)]">
            <div className="text-xs text-slate-500 font-medium pb-1 flex items-center justify-between">
              <span>Select workstation portal to assume operational view:</span>
              <span className="text-[11px] text-rose-600 font-bold">Fast Switch</span>
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
                      <span>Assigned: <strong className="text-slate-800">{role.userTitle}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CREDENTIALS FORM LOGIN (Clean, without auto-fill hints) */}
        {authMode === 'form' && (
          <form 
            onSubmit={handleFormLogin} 
            className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-130px)]"
            autoComplete="off"
            noValidate
          >
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Target Department
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PORTAL_ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRoleTab(role.id)}
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
                      <div className="text-xs font-black text-slate-900 truncate">{role.name.split(' ')[0]} {role.name.split(' ')[1] || ''}</div>
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
                    name="amburoute_portal_id"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter Badge ID"
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
                    type={showPin ? 'text' : 'password'}
                    name="amburoute_portal_key"
                    required
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="Enter PIN"
                    className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Enter authorized badge ID and password configured by System Administrator.</span>
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
                  <span>Verifying Credentials...</span>
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
