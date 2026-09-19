/**
 * REST API client for AmbuRoute Emergency Operations
 */

const API_BASE = '/api';

export async function fetchTelemetrySnapshot() {
  const res = await fetch(`${API_BASE}/telemetry/snapshot`);
  if (!res.ok) throw new Error('Failed to fetch telemetry snapshot');
  return res.json();
}

export async function fetchIncidents() {
  const res = await fetch(`${API_BASE}/incidents`);
  if (!res.ok) throw new Error('Failed to fetch incidents');
  return res.json();
}

export async function fetchAmbulances() {
  const res = await fetch(`${API_BASE}/ambulances`);
  if (!res.ok) throw new Error('Failed to fetch ambulances');
  return res.json();
}

export async function controlSimulation({ action, speed = 1.0, scenarioKey = 'scenario_stemi' }) {
  const res = await fetch(`${API_BASE}/simulation/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, speed, scenario_key: scenarioKey })
  });
  if (!res.ok) throw new Error(`Simulation control error: ${action}`);
  return res.json();
}

export async function fetchSymptoms() {
  const res = await fetch(`${API_BASE}/ml/symptoms`);
  if (!res.ok) throw new Error('Failed to fetch symptoms');
  return res.json();
}

export async function calculateRiskAssessment(vitals) {
  const res = await fetch(`${API_BASE}/ml/risk-assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vitals)
  });
  if (!res.ok) throw new Error('Failed to calculate patient risk assessment');
  return res.json();
}

export async function fetchHospitals() {
  const res = await fetch(`${API_BASE}/hospitals`);
  if (!res.ok) throw new Error('Failed to fetch hospitals');
  return res.json();
}

export async function recommendHospitals({ patientCoords, vitals, severity = 'critical', primaryCondition = null }) {
  const res = await fetch(`${API_BASE}/hospitals/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_coords: patientCoords,
      vitals: vitals,
      severity,
      primary_condition: primaryCondition
    })
  });
  if (!res.ok) throw new Error('Failed to rank hospitals');
  return res.json();
}

export async function routeToHospital(hospitalId) {
  const res = await fetch(`${API_BASE}/hospitals/route-to/${hospitalId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to route to hospital ${hospitalId}`);
  return res.json();
}

export async function fetchCorridorSignals() {
  const res = await fetch(`${API_BASE}/signals/corridor`);
  if (!res.ok) throw new Error('Failed to fetch corridor signals');
  return res.json();
}

export async function overrideSignal(signalId) {
  const res = await fetch(`${API_BASE}/signals/override/${signalId}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to override signal ${signalId}`);
  return res.json();
}

export async function fetchHandoffSummary() {
  const res = await fetch(`${API_BASE}/handoff/summary`);
  if (!res.ok) throw new Error('Failed to fetch ER handoff summary');
  return res.json();
}
