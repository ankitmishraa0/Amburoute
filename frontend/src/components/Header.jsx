import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Building2, 
  Stethoscope, 
  Presentation, 
  Navigation,
  HeartPulse,
  Signal,
  Activity,
  Layers,
  Siren,
  KeyRound,
  UserCheck,
  Crown,
  LogOut,
  Sun,
  Moon
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
    if (!muted) soundFx.playClick();
  };

  // Clean, professional navigation tabs (Red & White Emergency Theme)
  const navItems = [
    { id: 'command_map', icon: Navigation, label: 'Live Dispatch Map', sub: 'Real-Time GPS' },
    { id: 'signals', icon: Signal, label: 'Traffic Preemption', sub: 'Green Wave Corridor' },
    { id: 'hospitals', icon: Building2, label: 'Hospital Directory', sub: 'AI Match & Beds' },
    { id: 'triage', icon: Stethoscope, label: 'Clinical Triage', sub: 'Patient Risk AI' },
    { id: 'handoff', icon: HeartPulse, label: 'ER Trauma Bay', sub: 'Hospital Screen' },
  ];

  // If Admin is logged in or user has admin tab, show Super Admin Deck
  if (currentUser?.id === 'admin') {
    navItems.push({
      id: 'admin_panel',
      icon: Crown,
      label: 'Super Admin Deck',
      sub: 'Root Control Mode'
    });
  }

  return (
    <header className="border-b border-slate-200 bg-white/98 backdrop-blur-md sticky top-0 z-30 shadow-xs transition-colors duration-200">
      {/* Top Banner Bar */}
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-600 flex items-center justify-center text-lg text-white shadow-md shadow-rose-600/25">
            🚑
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-slate-900">
                AMBU<span className="text-rose-600">ROUTE</span>
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-600 hidden sm:inline-block">
                EMERGENCY OS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-tight hidden md:flex items-center space-x-2">
              <span>Dynamic Routing</span>
              <span>•</span>
              <span>V2I Traffic Clearance</span>
              <span>•</span>
              <span>Hospital Matrix</span>
            </p>
          </div>
        </div>

        {/* Center: Live Mission Status Badge */}
        <div className="hidden lg:flex items-center space-x-3 bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-full">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Code-1 Emergency Active
            </span>
          </div>
          <div className="h-3 w-[1px] bg-rose-200"></div>
          <div className="text-xs font-mono text-slate-700 font-bold">
            {timeStr}
          </div>
        </div>

        {/* Right: User Role Badge, Theme Switcher, Logout, Pitch Modal & Sound Control */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* User Role Badge */}
          <div
            onClick={onOpenRoleModal}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-xs cursor-pointer group"
            title="Click to switch operator role or manage authentication"
          >
            <div className={`p-1.5 rounded-lg text-white shrink-0 ${
              currentUser?.id === 'admin' ? 'bg-amber-600 shadow-amber-500/20' :
              currentUser?.id === 'hospital' ? 'bg-blue-600 shadow-blue-500/20' :
              currentUser?.id === 'traffic' ? 'bg-emerald-600 shadow-emerald-500/20' :
              'bg-rose-600 shadow-rose-500/20'
            }`}>
              {currentUser?.id === 'admin' ? <Crown className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left leading-tight">
              <div className="flex items-center space-x-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">User:</span>
                <span className="text-xs font-black text-slate-900 group-hover:text-rose-600 truncate max-w-[120px] sm:max-w-[140px]">
                  {currentUser?.badge || 'OPERATOR'}
                </span>
                <span className="text-[10px] text-slate-400">▾</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate max-w-[140px] hidden sm:block">
                {currentUser?.userName?.split(' (')[0] || currentUser?.name}
              </div>
            </div>
          </div>

          {/* Theme Toggle Button (Light ☀️ / Dark 🌙) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Crisp Light Mode' : 'Switch to Tactical Dark Mode'}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline text-slate-800">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline text-slate-700">Dark</span>
              </>
            )}
          </button>

          {/* Logout / Switch Role Button */}
          <button
            onClick={() => {
              soundFx.playClick();
              onLogout();
            }}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Log out and return to the Login Page"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Project Pitch / Presentation */}
          <button
            onClick={onOpenPitch}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Presentation className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Mission Tech</span>
          </button>

          {/* Siren Audio Mute */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Audio Sirens' : 'Mute Audio Sirens'}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-rose-600" />}
          </button>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="max-w-[1780px] mx-auto px-4 sm:px-6 flex items-center space-x-2 overflow-x-auto py-1.5 border-t border-slate-100 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          const isAdminTab = item.id === 'admin_panel';

          return (
            <button
              key={item.id}
              onClick={() => {
                soundFx.playClick();
                setActiveTab(item.id);
              }}
              className={`flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? isAdminTab 
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 border border-amber-600'
                    : 'bg-rose-600 text-white shadow-md shadow-rose-600/25 border border-rose-600'
                  : isAdminTab
                    ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isAdminTab ? 'text-amber-600' : 'text-slate-500'}`} />
              <div className="text-left leading-tight">
                <div className={isActive ? 'text-white font-black' : isAdminTab ? 'text-amber-900 font-black' : 'text-slate-800'}>
                  {item.label}
                </div>
                <div className={`text-[10px] font-normal font-mono ${isActive ? 'text-rose-100' : isAdminTab ? 'text-amber-600' : 'text-slate-400'}`}>
                  {item.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </header>
  );
}
