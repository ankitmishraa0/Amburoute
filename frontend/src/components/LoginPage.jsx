import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Fingerprint,
  RefreshCw,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { userService } from '../services/userService';
import { OPERATOR_ROLES, ROLE_MAP } from '../config/roles';

export { OPERATOR_ROLES as USER_ROLES };

export default function LoginPage({ onLogin, theme = 'light', toggleTheme }) {
  // Console Role Selection
  const [selectedRoleKey, setSelectedRoleKey] = useState('driver');

  // Login Form State
  const [username, setUsername] = useState('driver108');
  const [password, setPassword] = useState('1080');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successBanner, setSuccessBanner] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Rate Limiting & Lockout
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Security CAPTCHA State (after repeated failed attempts)
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);
  const [captchaChallenge, setCaptchaChallenge] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);

  // Two-Factor Authentication (2FA) State
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState(null);
  const [twoFactorOtpHint, setTwoFactorOtpHint] = useState(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  // Passkey / WebAuthn State
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [passkeyNotice, setPasskeyNotice] = useState(null);

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
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regError, setRegError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Forgot Password / Token Reset Form State
  const [forgotTab, setForgotTab] = useState('token_reset'); // 'token_reset' | 'request_token' | 'status'
  const [forgotUsername, setForgotUsername] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  // Lockout Countdown Timer
  useEffect(() => {
    if (lockoutTime <= 0) return;
    const interval = setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  // Load CAPTCHA challenge when required
  const loadCaptcha = async () => {
    setIsLoadingCaptcha(true);
    try {
      const challenge = await userService.fetchCaptcha();
      setCaptchaChallenge(challenge);
      setCaptchaAnswer('');
    } catch (e) {
      console.warn('Failed to load CAPTCHA challenge');
    } finally {
      setIsLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    if (requiresCaptcha || failedAttempts >= 3) {
      loadCaptcha();
    }
  }, [requiresCaptcha, failedAttempts]);

  // Select department role preset
  const handleRoleSelect = (key) => {
    setSelectedRoleKey(key);
    const roleMeta = ROLE_MAP[key];
    if (roleMeta) {
      setUsername(roleMeta.demoUsername || '');
      setPassword(roleMeta.demoPassword || '');
    }
    setErrorMessage(null);
  };

  // 1-Click Fast Dispatch CAD Demo Login
  const handleQuickDemoLogin = async (keyToUse) => {
    if (lockoutTime > 0) return;

    const roleKey = keyToUse || selectedRoleKey;
    const roleMeta = ROLE_MAP[roleKey] || ROLE_MAP['driver'];
    const u = roleMeta.demoUsername || 'driver108';
    const p = roleMeta.demoPassword || '1080';

    setSelectedRoleKey(roleKey);
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
    setIsVerifying(true);

    try {
      const result = await userService.loginWithCredentials({
        username: u,
        password: p,
        role: roleKey
      });

      setIsVerifying(false);

      if (result.success) {
        const authenticatedUser = {
          ...roleMeta,
          ...result.user,
          name: result.user.name || roleMeta.label,
          badge: result.user.badge || roleMeta.badge,
          defaultTab: result.user.assignedTab || roleMeta.assignedTab
        };
        onLogin(authenticatedUser);
      } else if (result.requires2FA) {
        setRequires2FA(true);
        setTwoFactorToken(result.tempToken);
        setTwoFactorOtpHint(result.demoOtpHint);
      } else {
        setErrorMessage(result.message || 'Invalid email or password');
      }
    } catch (e) {
      setIsVerifying(false);
      setErrorMessage('Invalid email or password');
    }
  };

  // Secure Form Login Handler
  const handleSecureLogin = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessBanner(null);

    if (lockoutTime > 0) {
      setErrorMessage(`Terminal is locked. Please wait ${lockoutTime} seconds.`);
      return;
    }

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Invalid email or password');
      return;
    }

    // CAPTCHA check if required
    if ((requiresCaptcha || failedAttempts >= 3) && !captchaAnswer.trim()) {
      setErrorMessage('Please complete the security check (CAPTCHA) before proceeding.');
      return;
    }

    setIsVerifying(true);

    try {
      const result = await userService.loginWithCredentials({
        username: username.trim(),
        password: password.trim(),
        role: selectedRoleKey,
        captchaId: captchaChallenge?.challenge_id,
        captchaAnswer: captchaAnswer.trim()
      });

      setIsVerifying(false);

      if (result.isLocked) {
        setLockoutTime(result.lockoutSeconds || 60);
        setRequiresCaptcha(true);
        setErrorMessage(`Terminal locked for ${result.lockoutSeconds || 60} seconds due to repeated sign-in failures.`);
        return;
      }

      if (!result.success) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (result.requiresCaptcha || nextAttempts >= 3) {
          setRequiresCaptcha(true);
          loadCaptcha();
        }

        if (nextAttempts >= 5) {
          setLockoutTime(60);
          setErrorMessage('Terminal locked for 60 seconds due to repeated sign-in failures.');
        } else {
          // Strict generic error message to prevent account enumeration
          setErrorMessage(result.message || 'Invalid email or password');
        }
        return;
      }

      // 2FA required
      if (result.requires2FA) {
        setRequires2FA(true);
        setTwoFactorToken(result.tempToken);
        setTwoFactorOtpHint(result.demoOtpHint);
        return;
      }

      // Successful Authentication
      setFailedAttempts(0);
      setRequiresCaptcha(false);

      const actualRoleMeta = ROLE_MAP[result.user.role] || ROLE_MAP['driver'];
      const authenticatedUser = {
        ...actualRoleMeta,
        ...result.user,
        name: result.user.name || actualRoleMeta.label,
        badge: result.user.badge || actualRoleMeta.badge,
        defaultTab: result.user.assignedTab || actualRoleMeta.assignedTab
      };

      onLogin(authenticatedUser);
    } catch (err) {
      setIsVerifying(false);
      setErrorMessage('Invalid email or password');
    }
  };

  // Two-Factor Authentication Submission
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setTwoFactorError(null);

    if (!twoFactorCode.trim() || twoFactorCode.trim().length !== 6) {
      setTwoFactorError('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsVerifying2FA(true);
    const res = await userService.verify2FA(twoFactorToken, twoFactorCode.trim());
    setIsVerifying2FA(false);

    if (!res.success) {
      setTwoFactorError(res.message || 'Invalid or expired 2FA code.');
      return;
    }

    setRequires2FA(false);
    const actualRoleMeta = ROLE_MAP[res.user.role] || ROLE_MAP['driver'];
    onLogin({
      ...actualRoleMeta,
      ...res.user,
      name: res.user.name || actualRoleMeta.label,
      badge: res.user.badge || actualRoleMeta.badge,
      defaultTab: res.user.assignedTab || actualRoleMeta.assignedTab
    });
  };

  // Passkey (WebAuthn) Login Handler
  const handlePasskeyLogin = async () => {
    if (lockoutTime > 0) return;
    setIsPasskeyLoading(true);
    setPasskeyNotice('Verifying biometric / hardware passkey...');
    setErrorMessage(null);

    try {
      const result = await userService.loginWithPasskey(username.trim() || 'driver108');
      setIsPasskeyLoading(false);
      setPasskeyNotice(null);

      if (result.success) {
        const actualRoleMeta = ROLE_MAP[result.user.role] || ROLE_MAP['driver'];
        onLogin({
          ...actualRoleMeta,
          ...result.user,
          name: result.user.name || actualRoleMeta.label,
          badge: result.user.badge || actualRoleMeta.badge,
          defaultTab: result.user.assignedTab || actualRoleMeta.assignedTab
        });
      } else {
        setErrorMessage(result.message || 'Passkey authentication was not completed.');
      }
    } catch (err) {
      setIsPasskeyLoading(false);
      setPasskeyNotice(null);
      setErrorMessage(err.message || 'Passkey sign-in failed.');
    }
  };

  // Operator Self-Registration
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
      setPassword(regForm.password);
      setSuccessBanner(`Operator account registered for ${newUser.name}. Authenticate to access CAD telemetry.`);
    } catch (err) {
      setIsRegistering(false);
      setRegError(err.message || 'Registration failed.');
    }
  };

  // Password Reset Token Request
  const handleRequestResetToken = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setIsResetting(true);

    try {
      const res = await userService.requestPasswordReset({
        username: forgotUsername.trim()
      });
      setIsResetting(false);

      if (res.reset_token) {
        setResetToken(res.reset_token);
        setForgotSuccess({
          message: `Single-use reset token generated. Valid for 15 minutes.`,
          token: res.reset_token
        });
        setForgotTab('token_reset');
      } else {
        setForgotSuccess({
          message: res.message || 'If an account matches, recovery instructions have been dispatched.'
        });
      }
    } catch (err) {
      setIsResetting(false);
      setForgotError(err.message || 'Failed to request reset token.');
    }
  };

  // Submit Password Reset with Single-Use Token
  const handleSubmitPasswordReset = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!resetToken.trim() || !newPassword.trim()) {
      setForgotError('Both reset token and new password are required.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setForgotError('New password must be at least 4 characters long.');
      return;
    }

    setIsResetting(true);
    const res = await userService.submitPasswordReset(resetToken.trim(), newPassword.trim());
    setIsResetting(false);

    if (res.success) {
      setForgotSuccess({
        message: 'Password reset successful! You can now log in with your new password.'
      });
      setPassword(newPassword.trim());
      setTimeout(() => {
        setIsForgotOpen(false);
        setSuccessBanner('Password updated successfully. Please authenticate.');
      }, 1500);
    } else {
      setForgotError(res.message || 'Invalid, expired, or used reset token.');
    }
  };

  const selectedRole = ROLE_MAP[selectedRoleKey] || OPERATOR_ROLES[0];

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] flex flex-col justify-between p-4 sm:p-6 transition-colors">
      
      {/* Top CAD Header Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-md bg-red-600 dark:bg-red-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-[var(--text-primary)] leading-tight flex items-center gap-1.5">
              <span>AmbuRoute</span>
              <span className="text-red-600 dark:text-red-500 text-xs font-mono font-extrabold px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900">
                CAD
              </span>
            </div>
            <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              Emergency Dispatch & Telemetry Command
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[11px] font-mono text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>CAD Security Online</span>
          </span>

          {toggleTheme && (
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="max-w-md w-full mx-auto my-auto py-6">
        <div className="cad-panel bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-6 sm:p-7 shadow-sm space-y-5">
          
          {/* Card Title & Description */}
          <div className="space-y-1">
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              Operator Sign-In
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Select department station and enter credentials to access live CAD telemetry.
            </p>
          </div>

          {/* Department Console Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Select Console Department
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                1-Click Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Console Department">
              {OPERATOR_ROLES.map((role) => {
                const isSelected = selectedRoleKey === role.id;
                const Icon = role.icon;

                return (
                  <button
                    key={role.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleRoleSelect(role.id)}
                    className={`p-2.5 rounded-md border text-left transition-all flex items-center space-x-2.5 min-h-[44px] cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:bg-slate-200/50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white dark:text-slate-900' : 'text-slate-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold truncate leading-tight">{role.shortLabel}</div>
                      <div className={`text-[10px] font-mono ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-[var(--text-muted)]'}`}>
                        {role.badge}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1-Click Fast CAD Access Button */}
          <button
            type="button"
            onClick={() => handleQuickDemoLogin(selectedRoleKey)}
            disabled={isVerifying || lockoutTime > 0}
            className="w-full min-h-[44px] py-2.5 px-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-xs rounded-md shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Connecting to Dispatch CAD...
              </span>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>Launch {selectedRole.label} Console (1-Click)</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            )}
          </button>

          {/* Pre-filled Credential Hint */}
          <div className="px-3 py-1.5 bg-[var(--bg-surface-elevated)] rounded border border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
            <span>Pre-filled Credentials:</span>
            <span className="font-semibold text-[var(--text-primary)]">{selectedRole.credentialsHint}</span>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <div role="status" className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Error Banner with Lockout Alert */}
          {errorMessage && (
            <div role="alert" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-800 dark:text-red-300 text-xs font-medium flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <div>{errorMessage}</div>
                {failedAttempts > 0 && failedAttempts < 5 && (
                  <div className="text-[10px] text-red-600 dark:text-red-400 font-mono mt-0.5">
                    Failed sign-in attempts: {failedAttempts} / 5
                  </div>
                )}
                {lockoutTime > 0 && (
                  <div className="text-[11px] text-red-700 dark:text-red-300 font-semibold mt-1 flex items-center space-x-1 font-mono">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Terminal locked for {lockoutTime}s</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Passkey Notice */}
          {passkeyNotice && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-md text-blue-800 dark:text-blue-300 text-xs font-medium flex items-center space-x-2">
              <Fingerprint className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
              <span>{passkeyNotice}</span>
            </div>
          )}

          {/* Passkey (WebAuthn) Optional Sign-In Button */}
          <button
            type="button"
            onClick={handlePasskeyLogin}
            disabled={isPasskeyLoading || isVerifying || lockoutTime > 0}
            className="w-full min-h-[44px] py-2 px-3 border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] rounded-md font-medium text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Fingerprint className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Sign in with Passkey (Touch ID / Face ID / Security Key)</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-[var(--border-subtle)] w-full"></div>
            <span className="bg-[var(--bg-surface)] px-2 text-[10px] uppercase font-mono text-[var(--text-muted)] shrink-0">
              or sign in with credentials
            </span>
            <div className="border-t border-[var(--border-subtle)] w-full"></div>
          </div>

          {/* Standards-Compliant Autofill Form */}
          <form
            method="post"
            onSubmit={handleSecureLogin}
            className="space-y-3.5"
          >
            {/* Username / Badge ID with autocomplete="username" */}
            <div>
              <label 
                htmlFor="login-username" 
                className="block text-xs font-medium text-[var(--text-primary)] mb-1"
              >
                Badge ID / Username
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
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
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-colors"
                />
              </div>
            </div>

            {/* Password with autocomplete="current-password" & Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label 
                  htmlFor="login-password" 
                  className="block text-xs font-medium text-[var(--text-primary)]"
                >
                  Security Password / PIN
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotError(null);
                    setForgotSuccess(null);
                    setIsForgotOpen(true);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={lockoutTime > 0}
                  className="w-full min-h-[44px] pl-9 pr-10 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security CAPTCHA Challenge (Rendered upon multiple failed attempts) */}
            {(requiresCaptcha || failedAttempts >= 3) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-amber-800 dark:text-amber-300">
                  <div className="flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Security Verification Required</span>
                  </div>
                  <button
                    type="button"
                    onClick={loadCaptcha}
                    title="Reload challenge"
                    className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCaptcha ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">
                  {captchaChallenge?.question || 'Solving security challenge...'}
                </p>

                <input
                  id="captcha-answer"
                  name="captcha"
                  type="text"
                  required
                  inputMode="numeric"
                  placeholder="Enter answer"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-1.5 bg-[var(--bg-surface)] border border-amber-300 dark:border-amber-700 rounded-md text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}

            {/* Form Submit Button */}
            <button
              type="submit"
              disabled={isVerifying || lockoutTime > 0}
              className="w-full min-h-[44px] py-2.5 px-3 bg-slate-900 hover:bg-slate-800 active:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-md font-medium text-xs transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Authenticating Credentials...
                </span>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authenticate Credentials</span>
                </>
              )}
            </button>
          </form>

          {/* Form Footer Links */}
          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setRegError(null);
                setIsRegisterOpen(true);
              }}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center space-x-1 font-medium cursor-pointer"
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
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Reset Password</span>
            </button>
          </div>

        </div>
      </main>

      {/* CAD Subsystem Security Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-2 text-[11px] text-[var(--text-muted)] font-mono flex flex-col sm:flex-row items-center justify-between gap-1 border-t border-[var(--border-subtle)] pt-3">
        <span>AmbuRoute Computer-Aided Dispatch Subsystem • TLS Secured</span>
        <span className="flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Bcrypt Hashed • Rate-Limited • RBAC Enforced</span>
        </span>
      </footer>

      {/* ========================================================================= */}
      {/* 1. TWO-FACTOR AUTHENTICATION (2FA / OTP) MODAL                           */}
      {/* ========================================================================= */}
      {requires2FA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-red-600 dark:text-red-500" />
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">Two-Factor Authentication</h3>
              </div>
              <button
                type="button"
                onClick={() => setRequires2FA(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Enter the 6-digit verification code from your authenticator app or dispatch notification.
            </p>

            {twoFactorOtpHint && (
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-md text-xs font-mono text-blue-800 dark:text-blue-300 flex items-center justify-between">
                <span>Demo 2FA Code:</span>
                <span className="font-bold tracking-widest text-sm">{twoFactorOtpHint}</span>
              </div>
            )}

            {twoFactorError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-700 dark:text-red-300 text-xs font-medium">
                {twoFactorError}
              </div>
            )}

            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div>
                <label htmlFor="twofa-code" className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  id="twofa-code"
                  name="twofa"
                  type="text"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full min-h-[44px] text-center tracking-widest text-lg font-mono py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequires2FA(false)}
                  className="px-3 py-2 min-h-[44px] rounded-md border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifying2FA || twoFactorCode.length !== 6}
                  className="px-4 py-2 min-h-[44px] rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  {isVerifying2FA ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REGISTRATION MODAL                                                    */}
      {/* ========================================================================= */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden my-auto">
            <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)]">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-[var(--text-primary)]" />
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">
                  Register Operator Badge
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form method="post" onSubmit={handleSelfRegister} className="p-5 space-y-3.5">
              {regError && (
                <div role="alert" className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-700 dark:text-red-300 text-xs font-medium flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[var(--text-primary)] mb-1.5">
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
                      className={`p-2 rounded-md border text-center font-medium text-xs transition-colors min-h-[44px] cursor-pointer ${
                        regForm.role === r.id
                          ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="reg-fullname" className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  Full Operator Name
                </label>
                <input
                  id="reg-fullname"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Rajesh Kumar"
                  value={regForm.name}
                  onChange={(e) => setRegForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full min-h-[44px] p-2.5 border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-md text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-username" className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                    Badge ID / Username
                  </label>
                  <input
                    id="reg-username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="e.g. driver_rajesh"
                    value={regForm.username}
                    onChange={(e) => setRegForm(prev => ({ ...prev, username: e.target.value.toLowerCase().trim() }))}
                    className="w-full min-h-[44px] p-2.5 border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-md text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                    Password / PIN
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      name="password"
                      type={regShowPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Min 4 characters"
                      value={regForm.password}
                      onChange={(e) => setRegForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full min-h-[44px] p-2.5 pr-9 border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-md text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setRegShowPassword(!regShowPassword)}
                      className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {regShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="reg-badge" className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                  Assigned Unit / Station Call-sign
                </label>
                <input
                  id="reg-badge"
                  name="badge"
                  type="text"
                  placeholder="e.g. UNIT MEDIC-15 (ALS)"
                  value={regForm.badge}
                  onChange={(e) => setRegForm(prev => ({ ...prev, badge: e.target.value }))}
                  className="w-full min-h-[44px] p-2.5 border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-md text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-2 min-h-[44px] rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium text-xs hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="px-4 py-2 min-h-[44px] rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isRegistering ? 'Provisioning...' : 'Provision Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PASSWORD RESET & SINGLE-USE TOKEN FLOW MODAL                          */}
      {/* ========================================================================= */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden my-auto">
            <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-elevated)]">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-[var(--text-primary)]" />
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">
                  Expiring Single-Use Password Reset
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] px-5 space-x-4">
              <button
                type="button"
                onClick={() => setForgotTab('token_reset')}
                className={`py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  forgotTab === 'token_reset' 
                    ? 'border-slate-900 dark:border-white text-[var(--text-primary)] font-semibold' 
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Reset with Token
              </button>
              <button
                type="button"
                onClick={() => setForgotTab('request_token')}
                className={`py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  forgotTab === 'request_token' 
                    ? 'border-slate-900 dark:border-white text-[var(--text-primary)] font-semibold' 
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Request Single-Use Token
              </button>
            </div>

            {/* Tab 1: Reset with Token */}
            {forgotTab === 'token_reset' && (
              <form method="post" onSubmit={handleSubmitPasswordReset} className="p-5 space-y-3.5">
                {forgotError && (
                  <div role="alert" className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-700 dark:text-red-300 text-xs font-medium flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
                {forgotSuccess && (
                  <div role="status" className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md text-emerald-800 dark:text-emerald-300 text-xs font-medium space-y-1">
                    <div className="flex items-center space-x-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{forgotSuccess.message}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="reset-token-input" className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                    Expiring Single-Use Reset Token (15-min validity)
                  </label>
                  <input
                    id="reset-token-input"
                    name="token"
                    type="text"
                    required
                    placeholder="Paste 32-character single-use reset token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value.trim())}
                    className="w-full min-h-[44px] p-2.5 border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-md text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="reset-new-password" className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                    New Security Password / PIN
                  </label>
                  <div className="relative">
                    <input
                      id="reset-new-password"
                      name="new_password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      placeholder="Enter new password (min 4 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full min-h-[44px] p-2.5 pr-10 border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-md text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-3 py-2 min-h-[44px] rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium text-xs hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting || !resetToken || !newPassword}
                    className="px-4 py-2 min-h-[44px] rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isResetting ? 'Updating...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Request Token */}
            {forgotTab === 'request_token' && (
              <form method="post" onSubmit={handleRequestResetToken} className="p-5 space-y-3.5">
                {forgotError && (
                  <div role="alert" className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-700 dark:text-red-300 text-xs font-medium flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}
                {forgotSuccess && (
                  <div role="status" className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-md text-emerald-800 dark:text-emerald-300 text-xs font-medium space-y-2">
                    <div className="flex items-center space-x-1.5 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{forgotSuccess.message}</span>
                    </div>
                    {forgotSuccess.token && (
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 rounded font-mono text-[11px] break-all select-all">
                        {forgotSuccess.token}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="request-token-user" className="block text-xs font-medium text-[var(--text-primary)] mb-1">
                    Badge ID / Registered Username
                  </label>
                  <input
                    id="request-token-user"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="e.g. driver108"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value.toLowerCase().trim())}
                    className="w-full min-h-[44px] p-2.5 border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-md text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    A cryptographically secure, 15-minute expiring single-use reset token will be created.
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-3 py-2 min-h-[44px] rounded-md border border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium text-xs hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting || !forgotUsername}
                    className="px-4 py-2 min-h-[44px] rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isResetting ? 'Generating Token...' : 'Issue Reset Token'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
