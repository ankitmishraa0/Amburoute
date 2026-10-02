import { Navigation, Building2, Signal, Shield } from 'lucide-react';

export const OPERATOR_ROLES = [
  {
    id: 'driver',
    label: 'Ambulance Crew',
    shortLabel: 'Ambulance',
    badge: 'UNIT MEDIC-12',
    icon: Navigation,
    assignedTab: 'command_map',
    department: 'Emergency Medical Services (EMS)',
    description: 'Turn-by-turn route telemetry, patient vitals transmission, and hospital destination routing.',
    credentialsHint: 'driver108 / 1080'
  },
  {
    id: 'hospital',
    label: 'Emergency Department',
    shortLabel: 'Hospital ER',
    badge: 'ER TRAUMA DESK',
    icon: Building2,
    assignedTab: 'handoff',
    department: 'Hospital Emergency Medicine',
    description: 'Pre-arrival patient vitals telemetry, ECG stream monitoring, and trauma bed reservation.',
    credentialsHint: 'doctor_aiims / aiims123'
  },
  {
    id: 'traffic',
    label: 'Traffic Control (ITMS)',
    shortLabel: 'Traffic ITMS',
    badge: 'ITMS CONTROL',
    icon: Signal,
    assignedTab: 'signals',
    department: 'Intelligent Traffic Management',
    description: 'Corridor signal preemption, intersection clearance monitoring, and manual cycle overrides.',
    credentialsHint: 'traffic_gkp / traffic123'
  },
  {
    id: 'admin',
    label: 'Dispatch Administration',
    shortLabel: 'Admin',
    badge: 'CAD SUPERVISOR',
    icon: Shield,
    assignedTab: 'admin_panel',
    department: 'System Operations & CAD Management',
    description: 'Operator account provisioning, corridor telemetry configuration, and global overrides.',
    credentialsHint: 'admin / admin123'
  }
];

export const ROLE_MAP = OPERATOR_ROLES.reduce((acc, r) => {
  acc[r.id] = r;
  return acc;
}, {});
