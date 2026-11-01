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

  // Strict Role-Based View Tabs (Jiska jitna use hai, usko sirf wahi dikhega)
  const roleNavItems = {
    driver: [
      { id: 'command_map', label: '🗺️ Live GPS Navigation', icon: Navigation, desc: 'Turn-by-turn route' },
      { id: 'hospitals', label: '🏥 Hospital Directory', icon: Building2, desc: 'Nearest ER Beds' },
    ],
    hospital: [
      { id: 'handoff', label: '🩺 Patient ER Intake', icon: HeartPulse, desc: 'Pre-Arrival Telemetry' },
      { id: 'hospitals', label: '🛏️ Hospital Bed Status', icon: Building2, desc: 'ICU Availability' },
    ],
    traffic: [
      { id: 'signals', label: '🚦 Traffic Signal Preemption', icon: Signal, desc: 'Green Wave Corridor' },
    ],
    patient: [
      { id: 'patient_portal', label: '🚑 Book Ambulance (SOS)', icon: Navigation, desc: 'Zomato/Rapido style booking' },
      { id: 'hospitals', label: '🏥 Emergency Hospitals', icon: Building2, desc: 'Nearby ICU beds' },
    ],
    admin: [
      { id: 'admin_panel', label: '⚙️ Admin Deck', icon: Shield, desc: 'Control Center' },
      { id: 'command_map', label: '🗺️ Fleet Map', icon: Navigation, desc: 'Ambulance GPS' },
      { id: 'signals', label: '🚦 Traffic Signals', icon: Signal, desc: 'City Junctions' },
      { id: 'handoff', label: '🩺 ER Intake', icon: HeartPulse, desc: 'Trauma Bay' },
      { id: 'hospitals', label: '🏥 Hospital Beds', icon: Building2, desc: 'Bed Directory' },
    ]
  };

  const currentTabs = roleNavItems[currentRoleKey] || roleNavItems.driver;

  const roleMeta = {
    driver: {
      badge: '🚑 UNIT MEDIC-12',
      department: 'Ambulance Crew (EMS)',
      station: 'Emergency Medical Services'
    },
    hospital: {
      badge: '🩺 ER TRAUMA DESK',
      department: 'Hospital Emergency Medicine',
      station: 'AIIMS Gorakhpur Trauma Intake'
    },
    traffic: {
      badge: '🚦 ITMS CONTROL',
      department: 'Traffic Police ITMS',
      station: 'City Traffic Signal Control'
    },
    patient: {
      badge: '👤 CITIZEN SOS',
      department: 'Emergency SOS Rider',
      station: 'Patient Booking Terminal'
    },
    admin: {
      badge: '🛡️ SUPER ADMIN',
      department: 'System Operations & CAD Management',
      station: 'Central Dispatch Command'
    }
  };

  const activeMeta = roleMeta[currentRoleKey] || roleMeta.driver;

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
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              {activeMeta.station}
            </p>
          </div>
        </div>

        {/* Center: Strict Role-Isolated Tabs (Sirf user ke role ka index show hoga) */}
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-inner overflow-x-auto scrollbar-none">
          {currentTabs.map((tab) => {
            const isTabActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  try { soundFx?.playClick?.(); } catch (e) {}
                  setActiveTab(tab.id);
                }}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isTabActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-102 font-black'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isTabActive ? 'text-white dark:text-slate-900' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Role Identity Badge & Logout */}
        <div className="flex items-center space-x-2 shrink-0 justify-end">
          
          {/* Station Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <div className="text-left leading-tight hidden xs:block">
              <div className="font-black text-slate-900 dark:text-white text-[11px]">
                {currentUser?.name || currentUser?.badge || activeMeta.badge}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {activeMeta.badge}
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Alerts' : 'Mute Sound'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold transition-colors cursor-pointer"
            title="Log Out Station"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

      </div>

    </header>
  );
}
