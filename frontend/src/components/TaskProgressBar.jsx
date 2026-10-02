import React from 'react';
import { Navigation, Signal, Building2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function TaskProgressBar({ 
  activeTab, 
  setActiveTab, 
  telemetry, 
  currentUser 
}) {
  const role = currentUser?.role || currentUser?.id || 'driver';

  // For traffic or hospital-only roles, only show their domain
  if (role === 'traffic' || role === 'hospital') {
    return null;
  }

  const steps = [
    {
      id: 'command_map',
      number: '1',
      title: 'Dispatch & Route',
      hint: 'Incident map & GPS telemetry',
      icon: Navigation,
      targetTab: 'command_map',
      isCompleted: telemetry?.ambulance?.status === 'en_route' || telemetry?.progress > 0.05
    },
    {
      id: 'signals',
      number: '2',
      title: 'Clear Signals (Green Wave)',
      hint: 'Preempt intersection traffic lights',
      icon: Signal,
      targetTab: 'signals',
      isCompleted: (telemetry?.signals || []).some(s => s.state === 'green_wave')
    },
    {
      id: 'hospitals',
      number: '3',
      title: 'Select Hospital & ER Bay',
      hint: 'MCDM allocation & ER handoff',
      icon: Building2,
      targetTab: 'hospitals',
      isCompleted: Boolean(telemetry?.ambulance?.target_hospital_id)
    }
  ];

  const currentStepIndex = activeTab === 'signals' ? 1 : (activeTab === 'hospitals' || activeTab === 'handoff') ? 2 : 0;
  const nextTab = currentStepIndex === 0 ? 'signals' : currentStepIndex === 1 ? 'hospitals' : 'handoff';
  const nextLabel = currentStepIndex === 0 
    ? 'Proceed to Signal Preemption' 
    : currentStepIndex === 1 
    ? 'Proceed to Hospital Selection' 
    : 'View Pre-Arrival ER Handoff';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 sm:p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Left: Task Step Navigator */}
        <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline-block shrink-0">
            Guided Workflow:
          </span>

          {steps.map((step, idx) => {
            const isActive = (idx === 0 && activeTab === 'command_map') ||
                             (idx === 1 && activeTab === 'signals') ||
                             (idx === 2 && (activeTab === 'hospitals' || activeTab === 'handoff'));
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveTab(step.targetTab)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md border text-left transition-all shrink-0 ${
                  isActive
                    ? 'border-slate-900 dark:border-white bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                  isActive
                    ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {step.number}
                </div>

                <div className="leading-tight">
                  <div className="text-xs font-semibold flex items-center space-x-1">
                    <span>{step.title}</span>
                    {step.isCompleted && !isActive && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 inline shrink-0" />
                    )}
                  </div>
                  <div className={`text-[10px] hidden sm:block ${
                    isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400'
                  }`}>
                    {step.hint}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Next Step CTA */}
        <div className="flex items-center justify-end space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab(nextTab)}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5"
          >
            <span>{nextLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
