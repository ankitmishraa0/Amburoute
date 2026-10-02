import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  ArrowRight, 
  PhoneCall, 
  Check,
  Bed,
  Clock,
  Activity,
  BarChart2
} from 'lucide-react';
import { routeToHospital } from '@/services/api';

// Interactive Radar Multi-Metric Comparison Chart
function HospitalRadarSVG({ topHospitals = [] }) {
  if (!topHospitals.length) return null;

  const categories = [
    { key: 'travel_time_score', label: 'Transit Speed' },
    { key: 'trauma_readiness', label: 'Trauma Bay' },
    { key: 'bed_availability', label: 'ICU Beds' },
    { key: 'specialist_coverage', label: 'Specialists' },
    { key: 'queue_efficiency', label: 'Efficiency' },
  ];

  const size = 240;
  const center = size / 2;
  const radius = 80;
  const angleStep = (Math.PI * 2) / categories.length;

  const colors = ['#DC2626', '#2563EB', '#D97706'];

  const getPoint = (val, idx) => {
    const r = (val / 100) * radius;
    const angle = idx * angleStep - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Radar Webs */}
        {[0.25, 0.5, 0.75, 1.0].map((level, lvlIdx) => (
          <polygon
            key={lvlIdx}
            points={categories
              .map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                return `${center + radius * level * Math.cos(angle)},${center + radius * level * Math.sin(angle)}`;
              })
              .join(' ')}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray={lvlIdx < 3 ? '2 2' : 'none'}
          />
        ))}

        {/* Axis Lines & Labels */}
        {categories.map((cat, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          const labelX = center + (radius + 20) * Math.cos(angle);
          const labelY = center + (radius + 14) * Math.sin(angle);
          return (
            <g key={i}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9"
                fontFamily="inherit"
                fontWeight="500"
                fill="#64748b"
              >
                {cat.label}
              </text>
            </g>
          );
        })}

        {/* Radar Polygons for Top 3 */}
        {topHospitals.slice(0, 3).map((h, hIdx) => {
          const radar = h.radar_metrics || {};
          const points = categories
            .map((cat, cIdx) => {
              const val = radar[cat.key] || 50;
              const pt = getPoint(val, cIdx);
              return `${pt.x},${pt.y}`;
            })
            .join(' ');

          return (
            <g key={h.id}>
              <polygon
                points={points}
                fill={`${colors[hIdx]}18`}
                stroke={colors[hIdx]}
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs">
        {topHospitals.slice(0, 3).map((h, idx) => (
          <div key={h.id} className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-[11px]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx] }}></span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">{h.short_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HospitalMatrixView({ 
  hospitals = [], 
  currentHospitalId, 
  onHospitalSelected,
  onNavigateTab 
}) {
  const [selectedHospId, setSelectedHospId] = useState(currentHospitalId || 'hosp-gkp-aiims');
  const [isRouting, setIsRouting] = useState(false);

  const handleRouteTo = async (hospitalId) => {
    setIsRouting(true);
    setSelectedHospId(hospitalId);
    try {
      await routeToHospital(hospitalId);
      if (onHospitalSelected) onHospitalSelected(hospitalId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Hospital Allocation Matrix</span>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                MCDM Scored
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked dynamically by transit duration, real-time ICU bed vacancy, trauma specialty capabilities, and intake speed.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Dynamic Rerouting Active</span>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('handoff')}
              className="px-3 py-1 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-medium text-xs transition-colors flex items-center space-x-1.5"
            >
              <span>View ER Bay Handoff</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Ranked Hospital Cards */}
        <div className="lg:col-span-2 space-y-3">
          {hospitals.map((h, idx) => {
            const isTarget = h.id === selectedHospId;
            const isRank1 = idx === 0;

            return (
              <div
                key={h.id}
                className={`p-4 sm:p-5 rounded-lg border transition-colors ${
                  isTarget
                    ? 'bg-slate-50 dark:bg-slate-850 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  
                  {/* Hospital Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                        isRank1 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        Rank #{idx + 1}
                      </span>

                      <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {h.trauma_level}
                      </span>

                      {h.cath_lab_ready && (
                        <span className="text-[11px] font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-200 dark:border-red-900">
                          24/7 Cath Lab
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {h.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{h.address}</span>
                      </p>
                    </div>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono">
                      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-2 rounded flex items-center space-x-2">
                        <Bed className="w-3.5 h-3.5 text-slate-500" />
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">ICU Beds</div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">{h.icu_beds_available} Open</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-2 rounded flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">Transit Time</div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">{h.travel_time_min} min</div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-2 rounded flex items-center space-x-2 col-span-2 sm:col-span-1">
                        <Activity className="w-3.5 h-3.5 text-slate-500" />
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase">Match Score</div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">{h.composite_score}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Action Button */}
                  <div className="flex flex-col sm:items-end justify-between space-y-2 shrink-0">
                    {isTarget ? (
                      <div className="space-y-1.5 text-right w-full sm:w-auto">
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Active Locked Destination</span>
                        </div>

                        {onNavigateTab && (
                          <button
                            type="button"
                            onClick={() => onNavigateTab('handoff')}
                            className="w-full sm:w-auto px-3.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                          >
                            <span>Open ER Handoff Bay</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRouteTo(h.id)}
                        disabled={isRouting}
                        className="w-full sm:w-auto px-4 py-2 rounded-md font-medium text-xs transition-colors flex items-center justify-center space-x-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-white"
                      >
                        <span>Select as Destination</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="text-[11px] text-slate-500 font-mono">
                      Desk: <strong className="text-slate-700 dark:text-slate-300">{h.contact_phone}</strong>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Right Col: Radar Comparison Chart & Emergency Contacts */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <h3 className="text-xs font-mono font-semibold uppercase text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center space-x-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Facility Metric Comparison</span>
            </h3>
            <HospitalRadarSVG topHospitals={hospitals} />
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
            <h3 className="text-xs font-mono font-semibold uppercase text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center space-x-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
              <span>Direct Emergency Despatch</span>
            </h3>
            <div className="space-y-1.5 text-xs font-mono">
              {hospitals.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{h.short_name}</span>
                  <a href={`tel:${h.contact_phone}`} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                    {h.contact_phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
