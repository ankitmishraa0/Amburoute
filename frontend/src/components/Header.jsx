import React, { useState, useEffect } from 'react';
import { 
  Navigation,
  Signal,
  HeartPulse,
  Stethoscope,
  Building2,
  Shield,
  User,
  LogOut,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Info,
  Activity
} from 'lucide-react';
import { soundFx } from '@/services/sound';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  wsStatus, 
  onOpenPitch, 
  activeScenarioKey,
  currentUser,
  onLogout,
  onOpenRoleModal,
  theme = 'light',
  toggleTheme
}) {
  const [timeStr, setTimeStr] = useState('');
  const [isMuted, setIsMuted] = useState(soundFx.isMuted);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const role = currentUser?.role || currentUser?.id || 'driver';

  const allNavItems = [
    { id: 'command_map', icon: Navigation, label: 'Dispatch Map', sub: 'Live Telemetry', roles: ['driver', 'admin'] },
    { id: 'signals', icon: Signal, label: 'Traffic Preemption', sub: 'V2I Corridor', roles: ['traffic', 'admin'] },
    { id: 'handoff', icon: HeartPulse, label: 'Trauma Intake', sub: 'ER Telemetry', roles: ['hospital', 'admin'] },
    { id: 'triage', icon: Stethoscope, label: 'Clinical Triage', sub: 'Decision Support', roles: ['hospital', 'admin'] },
    { id: 'hospitals', icon: Building2, label: 'Hospital Directory', sub: 'Bed Matrix', roles: ['driver', 'hospital', 'admin'] },
    { id: 'admin_panel', icon: Shield, label: 'Admin Console', sub: 'System Ops', roles: ['admin'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 transition-colors">
      {/* Top Console Bar */}
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded-md bg-red-600 dark:bg-red-500 text-white flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                AmbuRoute <span className="text-red-600 dark:text-red-500 text-xs font-mono font-medium ml-1">CAD</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hidden sm:inline-block">
                Emergency Dispatch
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal hidden md:block">
              Dynamic CAD routing, V2I corridor preemption & ER telemetry
            </p>
          </div>
        </div>

        {/* Center: Live Mission Status */}
        <div className="hidden lg:flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-md">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              CAD Link Active
            </span>
          </div>
          <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
          <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
            UTC {timeStr}
          </div>
        </div>

        {/* Right: Controls & Role Switcher */}
        <div className="flex items-center space-x-1.5 shrink-0 justify-end">
          
          {/* Operator Badge */}
          <button
            onClick={onOpenRoleModal}
            className="flex items-center space-x-2 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-left"
            title="Switch operator role"
          >
            <div className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight hidden xs:block">
              <div className="text-[11px] font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                {currentUser?.badge || currentUser?.username || 'Operator'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {currentUser?.role ? currentUser.role.toUpperCase() : 'DRIVER'}
              </div>
            </div>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Audio Alert Toggle */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute alerts' : 'Mute alerts'}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />}
          </button>

          {/* Architecture / Specs */}
          <button
            onClick={onOpenPitch}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            title="System specifications and architecture"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Architecture</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
            title="Log out session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 flex items-center space-x-1 overflow-x-auto py-1 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-500'}`} />
              <span>{item.label}</span>
              <span className={`text-[10px] font-mono ml-1 ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'}`}>
                {item.sub}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
