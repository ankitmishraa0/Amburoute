import React, { useState, useEffect } from 'react';
import { 
  Navigation,
  Signal,
  HeartPulse,
  Building2,
  Shield,
  User,
  LogOut,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { soundFx } from '@/services/sound';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  currentUser,
  onLogout,
  onSwitchRole,
  theme = 'light',
  toggleTheme
}) {
  const [timeStr, setTimeStr] = useState('');
  const [isMuted, setIsMuted] = useState(soundFx.isMuted);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const currentRoleKey = currentUser?.role || currentUser?.id || 'driver';

  // 4 Primary Roles - Big, clear, kid-simple
  const primaryRoles = [
    {
      id: 'driver',
      label: 'Driver View',
      subLabel: 'Ambulance & Route',
      icon: Navigation,
      targetTab: 'command_map',
      activeColor: 'bg-red-600 text-white dark:bg-red-600 dark:text-white ring-2 ring-red-400',
      badgeColor: 'bg-red-500'
    },
    {
      id: 'hospital',
      label: 'Doctor View',
      subLabel: 'Hospital ER Intake',
      icon: HeartPulse,
      targetTab: 'handoff',
      activeColor: 'bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white ring-2 ring-emerald-400',
      badgeColor: 'bg-emerald-500'
    },
    {
      id: 'traffic',
      label: 'Traffic Police',
      subLabel: 'Signal Control',
      icon: Signal,
      targetTab: 'signals',
      activeColor: 'bg-amber-600 text-white dark:bg-amber-600 dark:text-white ring-2 ring-amber-400',
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'admin',
      label: 'Admin Deck',
      subLabel: 'System Overview',
      icon: Shield,
      targetTab: 'admin_panel',
      activeColor: 'bg-indigo-600 text-white dark:bg-indigo-600 dark:text-white ring-2 ring-indigo-400',
      badgeColor: 'bg-indigo-500'
    }
  ];

  const handleRoleClick = (roleItem) => {
    try { soundFx?.playClick?.(); } catch (e) {}
    if (onSwitchRole) {
      onSwitchRole(roleItem.id);
    }
    if (roleItem.targetTab) {
      setActiveTab(roleItem.targetTab);
    }
  };

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 transition-colors shadow-xs">
      
      {/* Main Top Bar */}
      <div className="max-w-[1780px] mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20 animate-pulse">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Ambu<span className="text-red-600 dark:text-red-500">Route</span>
              </span>
              <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Emergency Response Network
            </p>
          </div>
        </div>

        {/* Center: The 4 Big Kid-Friendly Role Switcher Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-inner overflow-x-auto scrollbar-none">
          {primaryRoles.map((r) => {
            const isRoleActive = currentRoleKey === r.id;
            const Icon = r.icon;

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleRoleClick(r)}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isRoleActive
                    ? `${r.activeColor} shadow-md scale-102`
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={`Switch to ${r.label}`}
              >
                <Icon className={`w-4 h-4 ${isRoleActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <div className="text-left leading-tight">
                  <div className="text-xs font-bold">{r.label}</div>
                  <div className={`text-[9px] font-normal hidden md:block ${isRoleActive ? 'text-white/80' : 'text-slate-400'}`}>
                    {r.subLabel}
                  </div>
                </div>
                {isRoleActive && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-white/90 hidden sm:inline-block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Quick Controls, Profile, & Logout */}
        <div className="flex items-center space-x-1.5 shrink-0 justify-end">
          
          {/* Current User Pill */}
          <div className="hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {currentUser?.name || currentUser?.badge || 'Operator'}
            </span>
            <span className="text-[10px] text-slate-400">({timeStr})</span>
          </div>

          {/* Theme Toggle (Sun/Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Emergency Alerts' : 'Mute Sound'}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold transition-colors cursor-pointer"
            title="Log Out of System"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

      </div>

      {/* Sub-bar for Secondary Views (Hospital Directory & Triage) */}
      {(currentRoleKey === 'driver' || currentRoleKey === 'hospital' || currentRoleKey === 'admin') && (
        <div className="bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200/80 dark:border-slate-800/80 px-4 py-1.5">
          <div className="max-w-[1780px] mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Quick Views:
              </span>
              
              {currentRoleKey === 'driver' && (
                <>
                  <button
                    onClick={() => setActiveTab('command_map')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'command_map'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    🗺️ Live GPS Navigation
                  </button>
                  <button
                    onClick={() => setActiveTab('hospitals')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'hospitals'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    🏥 Hospital Bed Directory
                  </button>
                </>
              )}

              {currentRoleKey === 'hospital' && (
                <>
                  <button
                    onClick={() => setActiveTab('handoff')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'handoff'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    🩺 Patient ER Intake
                  </button>
                  <button
                    onClick={() => setActiveTab('hospitals')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'hospitals'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    🛏️ Hospital Bed Status
                  </button>
                </>
              )}

              {currentRoleKey === 'admin' && (
                <>
                  <button
                    onClick={() => setActiveTab('admin_panel')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'admin_panel'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    ⚙️ Master Admin Panel
                  </button>
                  <button
                    onClick={() => setActiveTab('command_map')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'command_map'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    🗺️ Fleet Map
                  </button>
                  <button
                    onClick={() => setActiveTab('signals')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'signals'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    🚦 City Signals
                  </button>
                </>
              )}
            </div>

            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              All Systems Operational
            </span>
          </div>
        </div>
      )}

    </header>
  );
}
