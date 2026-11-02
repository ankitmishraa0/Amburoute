import React, { useState, useEffect } from 'react';
import { 
  X, 
  PhoneCall, 
  Video, 
  Radio, 
  ShieldCheck, 
  Heart, 
  Activity, 
  Building2, 
  Navigation,
  Sparkles,
  PhoneForwarded,
  UserCheck
} from 'lucide-react';
import { 
  callService, 
  DOCTORS_DIRECTORY, 
  AMBULANCES_DIRECTORY, 
  TRAFFIC_DIRECTORY,
  PATIENTS_DIRECTORY,
  normalizeRole
} from '@/services/callService';
import { rideService } from '@/services/rideService';
import { soundFx } from '@/services/sound';

export default function CallSelectorModal({ 
  isOpen, 
  onClose, 
  callerRole = 'driver',
  callerName = null,
  initialTab = null
}) {
  const normalizedCallerRole = normalizeRole(callerRole);
  const isDriver = normalizedCallerRole === 'driver';
  const isPatient = normalizedCallerRole === 'patient';
  const isHospital = normalizedCallerRole === 'hospital';

  const calculateDefaultTab = () => {
    if (initialTab) return initialTab;
    if (isHospital) return 'ambulances';
    if (isDriver) return 'doctors';
    if (isPatient) return 'ambulances';
    return 'doctors';
  };

  const [activeTab, setActiveTab] = useState(calculateDefaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(calculateDefaultTab());
    }
  }, [isOpen, initialTab, callerRole]);

  if (!isOpen) return null;

  const activeRide = rideService?.getActiveRide?.();

  const handleMakeCall = (targetRole, callType, targetName, department) => {
    try { soundFx?.playClick?.(); } catch (e) {}
    onClose();

    const actualCallerName = callerName || (
      isDriver ? 'Ambulance MEDIC-12 (Paramedic Rajesh)' :
      isPatient ? 'Citizen Patient (Emergency SOS)' :
      isHospital ? 'Dr. Rajesh Sharma (AIIMS ER Desk)' :
      'ITMS Traffic Control'
    );

    callService.makeCall({
      targetRole,
      callerRole,
      callType,
      callerName: actualCallerName,
      targetName,
      department
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
              📞
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <span>Emergency Direct Dispatch</span>
                <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900 uppercase">
                  Encrypted Telemedicine
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Direct calling between Citizen Patient, Ambulance Driver, and Hospital Doctors
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 p-1.5 gap-1.5 text-xs font-bold overflow-x-auto">
          
          {/* TAB 1: Hospital ER Doctors */}
          <button
            type="button"
            onClick={() => setActiveTab('doctors')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'doctors'
                ? 'bg-white dark:bg-slate-850 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-750 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hospital ER Doctors ({DOCTORS_DIRECTORY.length})</span>
          </button>

          {/* TAB 2: Ambulance Driver */}
          <button
            type="button"
            onClick={() => setActiveTab('ambulances')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'ambulances'
                ? 'bg-white dark:bg-slate-850 text-red-600 dark:text-red-400 shadow-sm border border-slate-200 dark:border-slate-750 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Ambulance Driver ({AMBULANCES_DIRECTORY.length})</span>
          </button>

          {/* TAB 3: Citizen Patient */}
          <button
            type="button"
            onClick={() => setActiveTab('patients')}
            className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'patients'
                ? 'bg-white dark:bg-slate-850 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-750 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Citizen Patient (SOS)</span>
          </button>

          {/* TAB 4: Traffic Police */}
          <button
            type="button"
            onClick={() => setActiveTab('traffic')}
            className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'traffic'
                ? 'bg-white dark:bg-slate-850 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-750 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Traffic ITMS</span>
          </button>
        </div>

        {/* Directory Content List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">

          {/* TAB: DOCTORS DIRECTORY */}
          {activeTab === 'doctors' && (
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                AIIMS Gorakhpur ER Duty Specialists (Select Doctor to Call):
              </div>

              {DOCTORS_DIRECTORY.map((doc) => (
                <div 
                  key={doc.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="text-3xl shrink-0 mt-0.5 p-2 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900">
                      {doc.avatar}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          {doc.name}
                        </h4>
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        {doc.specialty}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {doc.hospital} • {doc.department} ({doc.phoneExt})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleMakeCall('hospital', 'voice', `${doc.name} (${doc.specialty})`, doc.department)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer ring-2 ring-blue-400/30"
                    >
                      <PhoneCall className="w-4 h-4 fill-current" />
                      <span>Audio Call 📞</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMakeCall('hospital', 'video', `${doc.name} (${doc.specialty})`, doc.department)}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Video Call</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: AMBULANCE UNITS DIRECTORY */}
          {activeTab === 'ambulances' && (
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Active Ambulance Vehicles in Fleet (Select Unit to Call):
              </div>

              {AMBULANCES_DIRECTORY.map((amb) => (
                <div 
                  key={amb.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-500 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="text-3xl shrink-0 mt-0.5 p-2 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900">
                      {amb.avatar}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          {amb.callsign}
                        </h4>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          amb.statusColor === 'red'
                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                          {amb.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                        Crew: {amb.crew} • 📍 {amb.location}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {amb.features.map((f, i) => (
                          <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-400 font-mono">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2 Big Action Buttons per Ambulance: Voice & Video */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleMakeCall('driver', 'voice', amb.callsign, amb.location)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer ring-2 ring-red-400/30"
                    >
                      <PhoneCall className="w-4 h-4 fill-current" />
                      <span>Call Driver (Voice)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMakeCall('driver', 'video', amb.callsign, amb.location)}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Live Video</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: CITIZEN PATIENT SOS */}
          {activeTab === 'patients' && (
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Citizen Patient Emergency Line (Select to Call):
              </div>

              {/* Active Ride Patient if active */}
              {activeRide && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-2 border-emerald-500 dark:border-emerald-500/60 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="text-3xl shrink-0 mt-0.5 p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                      🧑‍⚕️
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          {activeRide.patientName || 'Emergency Patient'}
                        </h4>
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          ASSIGNED PATIENT MISSION
                        </span>
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                        📍 Pickup: {activeRide.pickupAddress}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Hospital: {activeRide.hospitalName} • Priority Ambulance Transit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleMakeCall('patient', 'voice', activeRide.patientName || 'Citizen Patient', 'Patient Intercom')}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer ring-2 ring-emerald-400/40"
                    >
                      <PhoneCall className="w-4 h-4 fill-current" />
                      <span>Call Patient (Voice) 📞</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMakeCall('patient', 'video', activeRide.patientName || 'Citizen Patient', 'Patient Video')}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Video</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Citizen Patient Entry */}
              {PATIENTS_DIRECTORY.map((pat) => (
                <div 
                  key={pat.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="text-3xl shrink-0 mt-0.5 p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900">
                      {pat.avatar}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          {pat.name}
                        </h4>
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          {pat.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                        Emergency: {pat.condition} • 📍 {pat.location}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Citizen Hotline: {pat.phone} • Instant Audio/Video Intercom
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleMakeCall('patient', 'voice', pat.name, 'Citizen SOS')}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer ring-2 ring-emerald-400/40"
                    >
                      <PhoneCall className="w-4 h-4 fill-current" />
                      <span>Voice Call Patient</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMakeCall('patient', 'video', pat.name, 'Citizen Video')}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Video</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: TRAFFIC CONTROL DIRECTORY */}
          {activeTab === 'traffic' && (
            <div className="space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                Traffic Police Dispatch Unit:
              </div>

              {TRAFFIC_DIRECTORY.map((traf) => (
                <div 
                  key={traf.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-amber-400 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="text-3xl shrink-0 mt-0.5 p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-900">
                      {traf.avatar}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          {traf.name}
                        </h4>
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                          {traf.status}
                        </span>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                        {traf.station}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Controls V2I Traffic Signal Green Wave Corridors
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleMakeCall('traffic', 'voice', traf.name, traf.station)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Radio className="w-4 h-4" />
                      <span>Radio Intercom Channel</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400">
          Calls ring instantly on target doctor, ambulance, or patient device via encrypted audio & video intercom.
        </div>

      </div>
    </div>
  );
}
