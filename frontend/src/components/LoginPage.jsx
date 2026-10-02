import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  CheckCircle2, 
  Sun, 
  Moon, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Clock, 
  UserPlus, 
  HelpCircle, 
  X, 
  Check, 
  Search,
  Activity,
  ArrowRight
} from 'lucide-react';
import { userService } from '../services/userService';
import { OPERATOR_ROLES, ROLE_MAP } from '../config/roles';

export { OPERATOR_ROLES as USER_ROLES };

export default function LoginPage({ onLogin, theme = 'light', toggleTheme }) {
  const [selectedRoleKey, setSelectedRoleKey] = useState('driver');
  const [username, setUsername] = useState('driver108');
  const [password, setPassword] = useState('1080');
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
    department: 'Emergency Medical Services (EMS)'
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

  const handleRoleSelect = (key) => {
    setSelectedRoleKey(key);
    const roleMeta = ROLE_MAP[key];
    if (roleMeta) {
      setUsername(roleMeta.demoUsername || '');
      setPassword(roleMeta.demoPassword || '');
    }
    setErrorMessage(null);
  };

  const handleQuickDemoLogin = (keyToUse) => {
    const roleKey = keyToUse || selectedRoleKey;
    const roleMeta = ROLE_MAP[roleKey] || ROLE_MAP['driver'];
    const u = roleMeta.demoUsername || 'driver108';
    const p = roleMeta.demoPassword || '1080';

    setSelectedRoleKey(roleKey);
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
    setIsVerifying(true);

    setTimeout(() => {
      const authResult = userService.authenticateUser(u, p, roleKey);
      setIsVerifying(false);
      if (authResult.success) {
        const authenticatedUser = {
          ...roleMeta,
          ...authResult.user,
          name: authResult.user.name || roleMeta.label,
          badge: authResult.user.badge || roleMeta.badge,
          defaultTab: authResult.user.assignedTab || roleMeta.assignedTab
        };
        onLogin(authenticatedUser);
      } else {
        setErrorMessage(authResult.message || 'Demo authentication failed.');
      }
    }, 150);
  };

  const handleSecureLogin = (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessBanner(null);

    if (lockoutTime > 0) return;

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please provide both Badge ID / Username and Password.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      const authResult = userService.authenticateUser(username, password, selectedRoleKey);

      if (!authResult.success) {
        setIsVerifying(false);
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= 4) {
          setLockoutTime(30);
          setErrorMessage('Too many failed sign-in attempts. Terminal locked for 30 seconds.');
          const interval = setInterval(() => {
            setLockoutTime((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                setFailedAttempts(0);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setErrorMessage(authResult.message || 'Authentication failed. Please verify credentials.');
        }
        return;
      }

      setIsVerifying(false);
      setFailedAttempts(0);

      const actualRoleMeta = ROLE_MAP[authResult.user.role] || ROLE_MAP['driver'];
      const authenticatedUser = {
        ...actualRoleMeta,
        ...authResult.user,
        name: authResult.user.name || actualRoleMeta.label,
        badge: authResult.user.badge || actualRoleMeta.badge,
        defaultTab: authResult.user.assignedTab || actualRoleMeta.assignedTab
      };

      onLogin(authenticatedUser);
    }, 250);
  };

  const handleSelfRegister = (e) => {
    e.preventDefault();
    setRegError(null);
    setIsRegistering(true);

    try {
      const newUser = userService.registerUser(regForm);
      setIsRegistering(false);
      setIsRegisterOpen(false);

      setSelectedRoleKey(newUser.role);
      setUsername(newUser.username);
      setPassword(newUser.password);
      setSuccessBanner(`Account provisioned for ${newUser.name}. Authenticate to enter.`);
    } catch (err) {
      setIsRegistering(false);
      setRegError(err.message || 'Registration failed.');
    }
  };

  const handleSubmitResetRequest = (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const req = userService.createResetRequest(forgotForm);
      setForgotSuccess({
        id: req.id,
        message: `Reset request #${req.id} submitted for supervisor approval.`
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
      setForgotError(err.message || 'Failed to submit reset request.');
    }
  };

  const handleCheckStatus = (e) => {
    e.preventDefault();
    const res = userService.checkRequestStatus(statusSearch);
    if (!res) {
      setFoundStatus({ notFound: true, query: statusSearch });
    } else {
      setFoundStatus(res);
    }
  };

  const selectedRole = ROLE_MAP[selectedRoleKey] || OPERATOR_ROLES[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 transition-colors">
      
      {/* Top Navbar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-md bg-red-600 dark:bg-red-500 text-white flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              AmbuRoute <span className="text-red-600 dark:text-red-500 text-xs font-mono ml-1">CAD</span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Emergency Dispatch & Telemetry
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>CAD Telemetry Online</span>
          </span>

          {toggleTheme && (
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-7 shadow-sm space-y-5">
          
          {/* Card Header */}
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Operator Sign-In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select department station and enter credentials to load dispatch telemetry.
            </p>
          </div>

          {/* Department Console Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Console Department
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                1-Click Demo Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {OPERATOR_ROLES.map((role) => {
                const isSelected = selectedRoleKey === role.id;
                const Icon = role.icon;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className={`p-2.5 rounded-md border text-left transition-all flex items-center space-x-2.5 ${
                      isSelected
                        ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate leading-tight">{role.shortLabel}</div>
                      <div className={`text-[10px] font-mono ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                        {role.badge}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1-Click Primary Action Button */}
          <button
            type="button"
            onClick={() => handleQuickDemoLogin(selectedRoleKey)}
            disabled={isVerifying || lockoutTime > 0}
            className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-md shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isVerifying ? (
              <span>Connecting to Dispatch CAD...</span>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>Launch {selectedRole.label} Console (1-Click)</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>

          {/* Quick Credential Hint */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Pre-filled Credentials:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedRole.credentialsHint}</span>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-800 dark:text-red-300 text-xs font-medium flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <div>{errorMessage}</div>
                {failedAttempts > 0 && failedAttempts < 4 && (
                  <div className="text-[10px] text-red-600 font-mono mt-0.5">
                    Failed attempts: {failedAttempts} / 4
                  </div>
                )}
                {lockoutTime > 0 && (
                  <div className="text-[11px] text-red-700 font-semibold mt-1 flex items-center space-x-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Terminal locked for {lockoutTime}s</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Divider with option to sign in manually */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
            <span className="bg-white dark:bg-slate-900 px-2 text-[10px] uppercase font-mono text-slate-400 shrink-0">
              or sign in with custom credentials
            </span>
            <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSecureLogin} className="space-y-3" autoComplete="off">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Badge ID / Username
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. driver108"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUsername(val);
                    if (val.trim().toLowerCase() === 'admin') {
                      setSelectedRoleKey('admin');
                    }
                  }}
                  disabled={lockoutTime > 0}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Security Password / PIN
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={lockoutTime > 0}
                  className="w-full pl-8 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || lockoutTime > 0}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-md font-medium text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <span>Authenticate Credentials</span>
            </button>
          </form>

          {/* Form Actions: Register & Reset */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setRegError(null);
                setIsRegisterOpen(true);
              }}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center space-x-1 font-medium"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Operator</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setForgotError(null);
                setForgotSuccess(null);
                setIsForgotOpen(true);
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center space-x-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Reset Password</span>
            </button>
          </div>

        </div>
      </div>

      {/* Page Footer */}
      <div className="max-w-5xl w-full mx-auto text-center py-2 text-[11px] text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-1">
        <span>AmbuRoute Computer-Aided Dispatch Subsystem</span>
        <span className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role-Based Access Control • TLS Secured</span>
        </span>
      </div>

      {/* 1. REGISTRATION MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden my-auto">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Register Operator Badge
                </h3>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSelfRegister} className="p-5 space-y-3.5" autoComplete="off">
              {regError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-700 dark:text-red-300 text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Department
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'driver', label: 'Ambulance Crew', badge: 'UNIT MEDIC (ALS)', dept: 'Ambulance Crew (ALS/BLS)' },
                    { id: 'hospital', label: 'Emergency Room', badge: 'HOSPITAL ER DESK', dept: 'Hospital Emergency Room' },
                    { id: 'traffic', label: 'Traffic Police', badge: 'TRAFFIC ITMS POST', dept: 'Traffic Police ITMS' }
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
                      className={`p-2 rounded-md border text-center font-medium text-xs transition-colors ${
                        regForm.role === r.id
                          ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Operator Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={regForm.name}
                  onChange={(e) => setRegForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Badge ID / Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. driver_rajesh"
                    value={regForm.username}
                    onChange={(e) => setRegForm(prev => ({ ...prev, username: e.target.value.toLowerCase().trim() }))}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Password / PIN
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 4 characters"
                    value={regForm.password}
                    onChange={(e) => setRegForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Unit / Station Call-sign
                </label>
                <input
                  type="text"
                  placeholder="e.g. UNIT MEDIC-15 (ALS)"
                  value={regForm.badge}
                  onChange={(e) => setRegForm(prev => ({ ...prev, badge: e.target.value }))}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-4 py-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Provision Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PASSWORD RESET REQUEST MODAL */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden my-auto">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Account Recovery & Password Reset
                </h3>
              </div>
              <button
                onClick={() => setIsForgotOpen(false)}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-5 space-x-4">
              <button
                onClick={() => setForgotTab('submit')}
                className={`py-2 text-xs font-medium border-b-2 transition-colors ${
                  forgotTab === 'submit' 
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Submit Reset Request
              </button>
              <button
                onClick={() => setForgotTab('status')}
                className={`py-2 text-xs font-medium border-b-2 transition-colors ${
                  forgotTab === 'status' 
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Check Request Status
              </button>
            </div>

            {forgotTab === 'submit' && (
              <form onSubmit={handleSubmitResetRequest} className="p-5 space-y-3" autoComplete="off">
                {forgotError && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-700 dark:text-red-300 text-xs font-medium flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
                {forgotSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md text-emerald-800 dark:text-emerald-300 text-xs font-medium space-y-1">
                    <div className="flex items-center space-x-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Request Submitted</span>
                    </div>
                    <div>{forgotSuccess.message}</div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Username / Badge ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. driver108"
                    value={forgotForm.username}
                    onChange={(e) => setForgotForm(prev => ({ ...prev, username: e.target.value.toLowerCase().trim() }))}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Operator Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Operator Name"
                      value={forgotForm.name}
                      onChange={(e) => setForgotForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      New Password Requested
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 4 characters"
                      value={forgotForm.requestedPassword}
                      onChange={(e) => setForgotForm(prev => ({ ...prev, requestedPassword: e.target.value }))}
                      className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Reset
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Forgot PIN after shift change"
                    value={forgotForm.reason}
                    onChange={(e) => setForgotForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}

            {forgotTab === 'status' && (
              <div className="p-5 space-y-3">
                <form onSubmit={handleCheckStatus} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Enter Badge ID or Request ID"
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    className="flex-1 p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center space-x-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </form>

                {foundStatus && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md text-xs">
                    {foundStatus.notFound ? (
                      <span className="text-slate-500">No active reset request found for "{foundStatus.query}".</span>
                    ) : (
                      <div className="space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Request #{foundStatus.id}</span>
                          <span className={`font-semibold uppercase ${
                            foundStatus.status === 'approved' ? 'text-emerald-600' :
                            foundStatus.status === 'rejected' ? 'text-red-600' : 'text-amber-600'
                          }`}>
                            {foundStatus.status}
                          </span>
                        </div>
                        <div className="text-slate-700 dark:text-slate-300">Operator: {foundStatus.name} ({foundStatus.username})</div>
                        {foundStatus.status === 'approved' && (
                          <div className="text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                            New password activated by administrator. You may now sign in.
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
