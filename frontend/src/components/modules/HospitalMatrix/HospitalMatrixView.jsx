import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  PhoneCall, 
  Check,
  Bed,
  Clock,
  Award
} from 'lucide-react';
import { soundFx } from '@/services/sound';
import { routeToHospital } from '@/services/api';

// Interactive Radar Multi-Metric Comparison Chart styled for Red & White Theme
function HospitalRadarSVG({ topHospitals = [] }) {
  if (!topHospitals.length) return null;

  const categories = [
    { key: 'travel_time_score', label: 'Transit Speed' },
    { key: 'trauma_readiness', label: 'Trauma Bay' },
    { key: 'bed_availability', label: 'ICU Beds' },
    { key: 'specialist_coverage', label: 'Specialists' },
    { key: 'queue_efficiency', label: 'Zero Wait' },
  ];

  const size = 260;
  const center = size / 2;
  const radius = 95;
  const angleStep = (Math.PI * 2) / categories.length;

  const colors = ['#E11D48', '#2563EB', '#F59E0B'];

  const getPoint = (val, idx) => {
    const r = (val / 100) * radius;
    const angle = idx * angleStep - Math.PI / 2;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
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
            stroke="#CBD5E1"
            strokeWidth="1"
          />
        ))}

        {/* Axis Lines & Labels */}
        {categories.map((cat, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          const labelX = center + (radius + 22) * Math.cos(angle);
          const labelY = center + (radius + 18) * Math.sin(angle);
          return (
            <g key={i}>
              <line x1={center} y1={center} x2={x} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="10"
                fontFamily="sans-serif"
                fontWeight="bold"
                fill="#64748B"
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
                fill={`${colors[hIdx]}20`}
                stroke={colors[hIdx]}
                strokeWidth="2.5"
              />
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs font-bold">
        {topHospitals.slice(0, 3).map((h, idx) => (
          <div key={h.id} className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx] }}></span>
            <span className="text-slate-800">{h.short_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HospitalMatrixView({ 
  hospitals = [], 
  currentHospitalId, 
  onHospitalSelected 
}) {
  const [selectedHospId, setSelectedHospId] = useState(currentHospitalId || 'hosp-gkp-aiims');
  const [isRouting, setIsRouting] = useState(false);

  const handleRouteTo = async (hospitalId) => {
    soundFx.playReroute();
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
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-2xl shadow-xs">
            🏥
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
              <span>Hospital Recommendation Matrix</span>
              <span className="text-xs bg-rose-50 border border-rose-200 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                AI MATCH
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked automatically by transit duration, real-time ICU bed vacancy, trauma capability, and ER intake speed.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-black text-rose-700">
          <Sparkles className="w-4 h-4 text-rose-600" />
          <span>One-Click Dynamic Rerouting</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Ranked Hospital Cards */}
        <div className="lg:col-span-2 space-y-4">
          {hospitals.map((h, idx) => {
            const isTarget = h.id === selectedHospId;
            const isRank1 = idx === 0;

            return (
              <div
                key={h.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 ${
                  isTarget
                    ? 'bg-rose-50/40 border-2 border-rose-600 shadow-md shadow-rose-600/10'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  
                  {/* Hospital Info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black flex items-center space-x-1 ${
                        isRank1 ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <span>🏆</span>
                        <span>Rank #{idx + 1} Best Match</span>
                      </span>

                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 flex items-center space-x-1">
                        <span>🚨</span>
                        <span>{h.trauma_level}</span>
                      </span>

                      {h.cath_lab_ready && (
                        <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 flex items-center space-x-1">
                          <span>❤️</span>
                          <span>24/7 Cath Lab Ready</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center space-x-2">
                        <span>{h.name}</span>
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center space-x-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{h.address}</span>
                      </p>
                    </div>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl flex items-center space-x-2.5">
                        <span className="text-xl">🛏️</span>
                        <div>
                          <div className="text-[10px] text-emerald-800 font-bold uppercase">ICU Beds Available</div>
                          <div className="text-sm font-black text-emerald-700">{h.icu_beds_available} Beds Open</div>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-2xl flex items-center space-x-2.5">
                        <span className="text-xl">⏱️</span>
                        <div>
                          <div className="text-[10px] text-amber-800 font-bold uppercase">Transit Duration</div>
                          <div className="text-sm font-black text-amber-700">{h.travel_time_min} Mins</div>
                        </div>
                      </div>

                      <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-2xl flex items-center space-x-2.5 col-span-2 sm:col-span-1">
                        <span className="text-xl">⭐</span>
                        <div>
                          <div className="text-[10px] text-rose-800 font-bold uppercase">Clinical Match</div>
                          <div className="text-sm font-black text-rose-700">{h.composite_score} / 100</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route Action Button */}
                  <div className="flex flex-col sm:items-end justify-between space-y-3 shrink-0">
                    <button
                      onClick={() => handleRouteTo(h.id)}
                      disabled={isTarget || isRouting}
                      className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-black text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs ${
                        isTarget
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isTarget ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Destination Active</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span>Route Ambulance Here</span>
                        </>
                      )}
                    </button>

                    <div className="text-xs text-slate-500 flex items-center space-x-1">
                      <span>Emergency Desk:</span>
                      <strong className="text-slate-900 font-mono">{h.contact_phone}</strong>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Right Col: Radar Comparison Chart & Emergency Contacts */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-1.5">
              <span>📊</span>
              <span>Comparative Facility Radar</span>
            </h3>
            <HospitalRadarSVG topHospitals={hospitals} />
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <span>Direct Hospital Despatch Lines</span>
            </h3>
            <div className="space-y-2 text-xs font-mono">
              {hospitals.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-800 font-bold truncate max-w-[150px]">{h.short_name}</span>
                  <a href={`tel:${h.contact_phone}`} className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-100">
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
