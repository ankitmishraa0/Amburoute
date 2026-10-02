import React, { useState } from 'react';
import { 
  X, 
  UserCheck, 
  KeyRound, 
  Lock, 
  User, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { userService } from '../services/userService';
import { OPERATOR_ROLES } from '../config/roles';

export { OPERATOR_ROLES as PORTAL_ROLES };

export default function RolePortalModal({ 
  isOpen, 
  onClose, 
  currentRole, 
  onSelectRole 
}) {
  const [authMode, setAuthMode] = useState('quick'); // 'quick' | 'form'
  const [loginId, setLoginId] = useState('driver108');
  const [loginPin, setLoginPin] = useState('1080');
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

    setTimeout(() => {
      const authResult = userService.authenticateUser(loginId, loginPin, selectedRoleId);

      if (!authResult.success) {
        setIsAuthenticating(false);
        setErrorMsg(authResult.message);
        return;
      }

      setIsAuthenticating(false);
      setAuthSuccess(true);

      const matchedRole = OPERATOR_ROLES.find(r => r.id === authResult.user.role) || OPERATOR_ROLES[0];
      const mergedUserRole = {
        ...matchedRole,
        ...authResult.user,
        name: authResult.user.name || matchedRole.label,
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
      }, 400);
    }, 250);
  };

  const handleSelectRoleTab = (roleId) => {
    setSelectedRoleId(roleId);
    const matched = OPERATOR_ROLES.find(r => r.id === roleId);
    if (matched) {
      setLoginId(matched.demoUsername || '');
      setLoginPin(matched.demoPassword || '');
    }
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden my-auto">
        
        {/* Header Ribbon */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <KeyRound className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Operator Station Access
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Switch operational view or authenticate with badge credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-5 space-x-4">
          <button
            onClick={() => setAuthMode('quick')}
            className={`py-2 text-xs font-medium border-b-2 transition-colors ${
              authMode === 'quick' 
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Switch Workstation
          </button>
          <button
            onClick={() => setAuthMode('form')}
            className={`py-2 text-xs font-medium border-b-2 transition-colors ${
              authMode === 'form' 
                ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-semibold' 
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Credential Sign-In
          </button>
        </div>

        {/* TAB 1: WORKSTATION SWITCH */}
        {authMode === 'quick' && (
          <div className="p-4 sm:p-5 space-y-2 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="text-xs text-slate-500 dark:text-slate-400 pb-1">
              Select an operator console to load the corresponding dispatch views:
            </div>

            {OPERATOR_ROLES.map((role) => {
              const isSelected = currentRole?.id === role.id;
              const Icon = role.icon;

              return (
                <div
                  key={role.id}
                  onClick={() => {
                    onSelectRole(role);
                    onClose();
                  }}
                  className={`p-3 rounded-md border transition-colors cursor-pointer flex items-start space-x-3 ${
                    isSelected
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="p-2 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{role.label}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {role.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                      {role.description}
                    </p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: CREDENTIALS FORM LOGIN */}
        {authMode === 'form' && (
          <form 
            onSubmit={handleFormLogin} 
            className="p-4 sm:p-5 space-y-3.5 overflow-y-auto max-h-[calc(90vh-120px)]"
            autoComplete="off"
          >
            {errorMsg && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-md text-xs font-medium flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Target Console Department
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OPERATOR_ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRoleTab(role.id)}
                    className={`p-2 rounded-md border text-left flex items-center space-x-2 transition-colors ${
                      selectedRoleId === role.id 
                        ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800' 
                        : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-850 hover:bg-slate-50'
                    }`}
                  >
                    <role.icon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{role.label}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{role.badge}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Operator Username / Badge ID
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="e.g. driver108"
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password / PIN
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    required
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-8 pr-8 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating || authSuccess}
              className="w-full py-2 px-3 rounded-md font-medium text-xs text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors flex items-center justify-center space-x-2"
            >
              {isAuthenticating ? (
                <span>Verifying credentials...</span>
              ) : authSuccess ? (
                <span>Access verified. Loading console...</span>
              ) : (
                <span>Authenticate Operator</span>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="bg-slate-50 dark:bg-slate-850 px-5 py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Role-Based Access Control (RBAC)</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">CAD Secure</span>
        </div>

      </div>
    </div>
  );
}
