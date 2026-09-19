/**
 * Location and Local Hospital Generator for AmbuRoute
 * Dynamically computes realistic hospital facilities, trauma capabilities,
 * and emergency corridor routes around Gorakhpur, device GPS coordinates, or any Indian city.
 */

// Realistic Hospitals for Gorakhpur, Uttar Pradesh
export const GORAKHPUR_HOSPITALS = [
  {
    id: "hosp-gkp-aiims",
    name: "AIIMS Gorakhpur Super Specialty & Trauma Center",
    short_name: "AIIMS Gorakhpur Trauma",
    coordinates: { lat: 26.7580, lng: 83.4210 },
    address: "Kushinagar Road, Gorakhpur, Uttar Pradesh 273008",
    trauma_level: "Level 1 Apex Trauma",
    icu_beds_total: 45,
    icu_beds_available: 12,
    cath_lab_ready: true,
    stroke_center: true,
    burn_unit: true,
    pediatric_er: true,
    avg_er_wait_min: 5,
    travel_distance_km: 3.2,
    travel_time_min: 6.5,
    composite_score: 97,
    match_reasons: [
      "Level 1 Apex Trauma Bay & Advanced Resuscitation on standby",
      "Active 24/7 STEMI Cath Lab with Interventional Cardiology",
      "High ICU Bed Vacancy (12 critical beds ready)",
      "Designated Regional Stroke Center with rapid neuro-intervention"
    ],
    radar_metrics: {
      travel_time_score: 92,
      trauma_readiness: 98,
      bed_availability: 90,
      specialist_coverage: 95,
      queue_efficiency: 92
    },
    contact_phone: "+91 551 220 5001"
  },
  {
    id: "hosp-gkp-brd",
    name: "BRD Medical College & Nehru Hospital",
    short_name: "BRD Medical College",
    coordinates: { lat: 26.7915, lng: 83.3770 },
    address: "Medical College Road, Gorakhpur, Uttar Pradesh 273013",
    trauma_level: "Level 1 Government Trauma",
    icu_beds_total: 50,
    icu_beds_available: 8,
    cath_lab_ready: true,
    stroke_center: true,
    burn_unit: true,
    pediatric_er: true,
    avg_er_wait_min: 12,
    travel_distance_km: 4.6,
    travel_time_min: 9.0,
    composite_score: 89,
    match_reasons: [
      "Level 1 Multi-disciplinary Emergency Department",
      "Specialized Pediatric Emergency & Intensive Care Unit",
      "Equipped Regional Burn Care & Trauma Unit",
      "Emergency Blood Bank & Critical Care Team on site"
    ],
    radar_metrics: {
      travel_time_score: 82,
      trauma_readiness: 94,
      bed_availability: 80,
      specialist_coverage: 88,
      queue_efficiency: 76
    },
    contact_phone: "+91 551 231 0022"
  },
  {
    id: "hosp-gkp-fatima",
    name: "Fatima Hospital & Emergency Care",
    short_name: "Fatima Hospital ER",
    coordinates: { lat: 26.7790, lng: 83.3930 },
    address: "Padri Bazar, Gorakhpur, Uttar Pradesh 273014",
    trauma_level: "Level 2 Multi-Specialty Trauma",
    icu_beds_total: 24,
    icu_beds_available: 6,
    cath_lab_ready: true,
    stroke_center: false,
    burn_unit: false,
    pediatric_er: true,
    avg_er_wait_min: 8,
    travel_distance_km: 2.8,
    travel_time_min: 5.8,
    composite_score: 85,
    match_reasons: [
      "Rapid Access Emergency Care with minimal triage queue",
      "Dedicated Cardiac ICU with ventilators ready",
      "Pediatric Care Facility with round-the-clock specialists"
    ],
    radar_metrics: {
      travel_time_score: 88,
      trauma_readiness: 80,
      bed_availability: 82,
      specialist_coverage: 78,
      queue_efficiency: 85
    },
    contact_phone: "+91 551 228 3101"
  },
  {
    id: "hosp-gkp-heart",
    name: "Gorakhpur City Heart & Critical Care Institute",
    short_name: "Gorakhpur Heart Care",
    coordinates: { lat: 26.7560, lng: 83.3750 },
    address: "Golghar Commercial Center, Gorakhpur, Uttar Pradesh 273001",
    trauma_level: "Specialized Cardiac Emergency",
    icu_beds_total: 18,
    icu_beds_available: 5,
    cath_lab_ready: true,
    stroke_center: true,
    burn_unit: false,
    pediatric_er: false,
    avg_er_wait_min: 4,
    travel_distance_km: 1.9,
    travel_time_min: 4.2,
    composite_score: 87,
    match_reasons: [
      "Immediate door-to-balloon time under 45 minutes",
      "24/7 Digital Cath Lab on active standby",
      "Zero ER queue congestion (4m admission time)"
    ],
    radar_metrics: {
      travel_time_score: 95,
      trauma_readiness: 84,
      bed_availability: 78,
      specialist_coverage: 90,
      queue_efficiency: 94
    },
    contact_phone: "+91 551 233 4567"
  },
  {
    id: "hosp-gkp-rana",
    name: "Rana Hospital & Trauma Center",
    short_name: "Rana Hospital ER",
    coordinates: { lat: 26.7520, lng: 83.3640 },
    address: "Civil Lines, Gorakhpur, Uttar Pradesh 273001",
    trauma_level: "Community Emergency Center",
    icu_beds_total: 15,
    icu_beds_available: 4,
    cath_lab_ready: false,
    stroke_center: false,
    burn_unit: false,
    pediatric_er: false,
    avg_er_wait_min: 7,
    travel_distance_km: 2.4,
    travel_time_min: 5.0,
    composite_score: 74,
    match_reasons: [
      "Nearby community emergency resuscitation unit",
      "Stable trauma care and basic intensive support"
    ],
    radar_metrics: {
      travel_time_score: 90,
      trauma_readiness: 65,
      bed_availability: 72,
      specialist_coverage: 60,
      queue_efficiency: 88
    },
    contact_phone: "+91 551 220 1199"
  }
];

/**
 * Dynamically computes 5 realistic hospitals centered around the user's GPS coordinates.
 */
export function generateHospitalsForCoordinates(centerLat, centerLng, areaName = 'Local Area') {
  const safeLat = parseFloat(centerLat) || 26.7606;
  const safeLng = parseFloat(centerLng) || 83.3732;

  // Check if coordinates are close to Gorakhpur (lat 26.6 - 26.9, lng 83.2 - 83.5)
  if (Math.abs(safeLat - 26.76) < 0.2 && Math.abs(safeLng - 83.37) < 0.2) {
    return GORAKHPUR_HOSPITALS;
  }

  // Offsets for 5 realistic radial hospitals
  const specs = [
    {
      nameSuffix: "Apex Multi-Specialty & Trauma Center",
      shortSuffix: "Apex Trauma",
      dLat: 0.012,
      dLng: 0.015,
      level: "Level 1 Apex Trauma",
      icuTotal: 40,
      icuAvail: 11,
      cathLab: true,
      stroke: true,
      burn: true,
      peds: true,
      wait: 6,
      score: 96,
      dist: 2.1,
      time: 4.8
    },
    {
      nameSuffix: "City Government Medical Hospital",
      shortSuffix: "City Civil Hospital",
      dLat: -0.015,
      dLng: 0.010,
      level: "Level 1 Regional Trauma",
      icuTotal: 48,
      icuAvail: 7,
      cathLab: true,
      stroke: true,
      burn: true,
      peds: true,
      wait: 14,
      score: 88,
      dist: 3.4,
      time: 7.2
    },
    {
      nameSuffix: "LifeLine Heart & Critical Care Institute",
      shortSuffix: "LifeLine Cardiac Center",
      dLat: 0.008,
      dLng: -0.014,
      level: "Cardiovascular Trauma Center",
      icuTotal: 22,
      icuAvail: 6,
      cathLab: true,
      stroke: true,
      burn: false,
      peds: false,
      wait: 5,
      score: 91,
      dist: 1.8,
      time: 3.9
    },
    {
      nameSuffix: "Care Memorial Multi-Specialty Hospital",
      shortSuffix: "Care Memorial ER",
      dLat: -0.010,
      dLng: -0.012,
      level: "Level 2 Multi-Specialty ER",
      icuTotal: 20,
      icuAvail: 5,
      cathLab: false,
      stroke: false,
      burn: false,
      peds: true,
      wait: 8,
      score: 81,
      dist: 2.7,
      time: 5.6
    },
    {
      nameSuffix: "District Emergency Resuscitation Center",
      shortSuffix: "District Resus ER",
      dLat: 0.018,
      dLng: -0.005,
      level: "Community Urgent Care",
      icuTotal: 14,
      icuAvail: 3,
      cathLab: false,
      stroke: false,
      burn: false,
      peds: false,
      wait: 7,
      score: 72,
      dist: 3.1,
      time: 6.2
    }
  ];

  return specs.map((spec, idx) => ({
    id: `hosp-dyn-${idx + 1}`,
    name: `${areaName} ${spec.nameSuffix}`,
    short_name: `${areaName} ${spec.shortSuffix}`,
    coordinates: {
      lat: parseFloat((safeLat + spec.dLat).toFixed(5)),
      lng: parseFloat((safeLng + spec.dLng).toFixed(5))
    },
    address: `Emergency Corridor Road, ${areaName}`,
    trauma_level: spec.level,
    icu_beds_total: spec.icuTotal,
    icu_beds_available: spec.icuAvail,
    cath_lab_ready: spec.cathLab,
    stroke_center: spec.stroke,
    burn_unit: spec.burn,
    pediatric_er: spec.peds,
    avg_er_wait_min: spec.wait,
    travel_distance_km: spec.dist,
    travel_time_min: spec.time,
    composite_score: spec.score,
    match_reasons: [
      `${spec.level} ready for acute emergency intake`,
      `${spec.icuAvail} ICU beds currently verified available`,
      `Estimated response corridor transit: ${spec.time} mins`
    ],
    radar_metrics: {
      travel_time_score: Math.max(70, Math.min(99, 100 - spec.time * 4)),
      trauma_readiness: spec.cathLab ? 95 : 75,
      bed_availability: Math.round((spec.icuAvail / spec.icuTotal) * 100),
      specialist_coverage: spec.stroke ? 92 : 70,
      queue_efficiency: Math.max(65, 100 - spec.wait * 3)
    },
    contact_phone: "+91 Emergency Line 108"
  }));
}

/**
 * Creates a realistic route and signals around a given center point and target hospital
 */
export function generateRouteAndSignals(centerLat, centerLng, targetHospital) {
  const destLat = targetHospital?.coordinates?.lat || (centerLat + 0.012);
  const destLng = targetHospital?.coordinates?.lng || (centerLng + 0.015);

  // Generate 6 waypoints connecting ambulance start -> incident -> target hospital
  const startLat = centerLat - 0.008;
  const startLng = centerLng - 0.006;
  const incLat = centerLat;
  const incLng = centerLng;

  const waypoints = [
    { lat: startLat, lng: startLng },
    { lat: startLat + (incLat - startLat) * 0.5, lng: startLng + (incLng - startLng) * 0.5 },
    { lat: incLat, lng: incLng },
    { lat: incLat + (destLat - incLat) * 0.33, lng: incLng + (destLng - incLng) * 0.33 },
    { lat: incLat + (destLat - incLat) * 0.66, lng: incLng + (destLng - incLng) * 0.66 },
    { lat: destLat, lng: destLng }
  ];

  const signals = [
    {
      id: "sig-loc-1",
      name: "Main Junction Corridor 1",
      coordinates: waypoints[1],
      sequence_order: 1,
      state: "green_wave",
      prep_countdown_sec: 12,
      distance_to_ambulance_m: 160
    },
    {
      id: "sig-loc-2",
      name: "City Central Crossing 2",
      coordinates: waypoints[3],
      sequence_order: 2,
      state: "amber_prep",
      prep_countdown_sec: 38,
      distance_to_ambulance_m: 480
    },
    {
      id: "sig-loc-3",
      name: "Hospital Approach Signal 3",
      coordinates: waypoints[4],
      sequence_order: 3,
      state: "red",
      prep_countdown_sec: 65,
      distance_to_ambulance_m: 850
    }
  ];

  return { waypoints, signals };
}

export const SCENARIOS_DATA = {
  scenario_stemi: {
    key: 'scenario_stemi',
    id: 'inc-stemi-901',
    title: 'Code-1 Acute STEMI / Massive Anterolateral MI',
    category: 'Cardiovascular Emergency',
    severity: 'critical',
    assigned_ambulance: 'MEDIC-12 (ALS)',
    ambulance_type: 'ALS',
    preferred_hosp_id: 'hosp-gkp-aiims',
    vitals: {
      heart_rate: 134,
      systolic_bp: 82,
      diastolic_bp: 54,
      spo2: 88,
      respiratory_rate: 28,
      temperature_c: 36.8,
      gcs_score: 14,
      age: 58,
      symptoms: [
        'Chest Pain (Crushing/Pressure)',
        'Radiating Left Arm / Jaw Pain',
        'Profuse Diaphoresis (Cold Sweats)',
        'Severe Dyspnea (Shortness of Breath)'
      ],
      notes: 'Patient collapsed near Golghar with severe crushing chest pain. 12-Lead ECG shows ST elevation in V1-V4.'
    }
  },
  scenario_trauma: {
    key: 'scenario_trauma',
    id: 'inc-trauma-404',
    title: 'High-Speed Multi-Vehicle Collision / Poly-Trauma',
    category: 'Major Trauma',
    severity: 'critical',
    assigned_ambulance: 'RESCUE-04 (MICU)',
    ambulance_type: 'MICU',
    preferred_hosp_id: 'hosp-gkp-brd',
    vitals: {
      heart_rate: 142,
      systolic_bp: 76,
      diastolic_bp: 48,
      spo2: 91,
      respiratory_rate: 32,
      temperature_c: 36.2,
      gcs_score: 7,
      age: 34,
      symptoms: [
        'Severe Arterial Hemorrhage',
        'Localized Moderate Pain / Contusion',
        'Altered Mental Status / GCS < 13'
      ],
      notes: 'Driver extricated after high-speed highway rollover. Blunt poly-trauma, unstable pelvis, arterial hemorrhage.'
    }
  },
  scenario_pediatric: {
    key: 'scenario_pediatric',
    id: 'inc-ped-202',
    title: 'Pediatric Acute Status Asthmaticus / Hypoxemia',
    category: 'Pediatric Emergency',
    severity: 'critical',
    assigned_ambulance: 'PEDS-09 (ALS)',
    ambulance_type: 'ALS',
    preferred_hosp_id: 'hosp-gkp-fatima',
    vitals: {
      heart_rate: 168,
      systolic_bp: 94,
      diastolic_bp: 58,
      spo2: 84,
      respiratory_rate: 46,
      temperature_c: 38.4,
      gcs_score: 12,
      age: 7,
      symptoms: [
        'Severe Dyspnea (Shortness of Breath)',
        'Unresponsive / Syncope',
        'Altered Mental Status / GCS < 13'
      ],
      notes: '7yo severe asthma exacerbation unresponsive to albuterol inhaler. Marked intercostal retractions, cyanosis.'
    }
  }
};

