/**
 * AmbuRoute User & Operator Management Service
 * Handles RBAC authentication, persistent user storage,
 * dynamic driver/operator account creation by Admin, and security validation.
 */

const STORAGE_KEY = 'amburoute_users_v2';

// Baseline system operator accounts
export const DEFAULT_USERS = [
  {
    id: 'admin',
    username: 'admin',
    name: 'System Administrator (God Mode)',
    role: 'admin',
    department: 'Master Administration',
    badge: 'ALL POWERS ENABLED',
    password: 'admin123',
    status: 'active',
    assignedTab: 'admin_panel',
    createdAt: '2026-01-01',
    description: 'Full Root Authority: V2I traffic override, live telemetry simulation, hospital beds, and system users.'
  },
  {
    id: 'driver108',
    username: 'driver108',
    name: 'Paramedic J. Miller & Driver Rajesh',
    role: 'driver',
    department: 'Ambulance Crew (ALS)',
    badge: 'UNIT MEDIC-12 (ALS)',
    password: '1080',
    status: 'active',
    assignedTab: 'command_map',
    createdAt: '2026-01-01',
    description: 'Emergency turn-by-turn navigation, patient vitals transmission, and dynamic hospital routing.'
  },
  {
    id: 'doctor_aiims',
    username: 'doctor_aiims',
    name: 'Dr. C. Sterling (Attending Physician)',
    role: 'hospital',
    department: 'Hospital Emergency Room',
    badge: 'AIIMS GORAKHPUR ER',
    password: 'aiims123',
    status: 'active',
    assignedTab: 'handoff',
    createdAt: '2026-01-01',
    description: 'Pre-arrival patient telemetry intake, Lead-II ECG monitor, ICU bed reservation, and clinical triage.'
  },
  {
    id: 'traffic_gkp',
    username: 'traffic_gkp',
    name: 'Officer R. Verma (Traffic ITMS)',
    role: 'traffic',
    department: 'ITMS Traffic Police HQ',
    badge: 'GORAKHPUR TRAFFIC POLICE',
    password: 'traffic123',
    status: 'active',
    assignedTab: 'signals',
    createdAt: '2026-01-01',
    description: 'Real-time V2I intersection preemption, automated green wave corridors, and manual cycle overrides.'
  }
];

export const userService = {
  /**
   * Retrieve all registered users from localStorage or fallback to defaults
   */
  getUsers: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load users from localStorage, using default accounts', err);
    }
    // Initialize with defaults if empty
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
  },

  /**
   * Persist user accounts list to localStorage
   */
  saveUsers: (users) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
      // Optional async sync to backend if available
      try {
        fetch('http://127.0.0.1:8000/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(users)
        }).catch(() => {});
      } catch (e) {}
      return true;
    } catch (err) {
      console.error('Error saving users to localStorage:', err);
      return false;
    }
  },

  /**
   * Strict and secure credential authentication
   */
  authenticateUser: (username, password, selectedRoleKey = null) => {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      return {
        success: false,
        message: 'Please provide both Badge ID/Username and Security Password.'
      };
    }

    const users = userService.getUsers();
    const matchedUser = users.find(
      u => (u.username || u.id || '').toLowerCase() === cleanUsername
    );

    if (!matchedUser) {
      return {
        success: false,
        message: 'Authentication Denied: User ID / Badge not recognized in registry.'
      };
    }

    // Check account status
    if (matchedUser.status === 'suspended' || matchedUser.status === 'inactive') {
      return {
        success: false,
        message: 'Account Disabled: This operator account has been deactivated by the Administrator.'
      };
    }

    // Verify Password
    if (matchedUser.password !== cleanPassword) {
      return {
        success: false,
        message: 'Security Alert: Invalid credentials. Access Denied.'
      };
    }

    // Check department role compatibility if a specific role was chosen
    if (selectedRoleKey && matchedUser.role !== selectedRoleKey && matchedUser.role !== 'admin') {
      return {
        success: false,
        message: `Department Mismatch: User '${matchedUser.username}' is assigned to ${matchedUser.department || matchedUser.role.toUpperCase()} and cannot log in as ${selectedRoleKey.toUpperCase()}.`
      };
    }

    // Successful login - generate transient session details
    const sessionUser = {
      ...matchedUser,
      sessionToken: `SEC-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      loginTimestamp: new Date().toLocaleTimeString()
    };

    return {
      success: true,
      user: sessionUser
    };
  },

  /**
   * Create a new User / Driver ID (Admin capability)
   */
  createUser: (userData) => {
    const users = userService.getUsers();
    const cleanUsername = (userData.username || '').trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('User ID / Username must be at least 3 characters long.');
    }

    if (!userData.name || userData.name.trim().length < 2) {
      throw new Error('Please enter a valid Operator Full Name.');
    }

    if (!userData.password || userData.password.trim().length < 4) {
      throw new Error('Password / PIN must be at least 4 characters for security.');
    }

    const exists = users.some(u => (u.username || u.id || '').toLowerCase() === cleanUsername);
    if (exists) {
      throw new Error(`A user with ID '${cleanUsername}' already exists. Please choose another Badge ID.`);
    }

    // Assign default tab based on role
    const tabMap = {
      driver: 'command_map',
      hospital: 'handoff',
      traffic: 'signals',
      admin: 'admin_panel'
    };

    const deptMap = {
      driver: 'Ambulance Crew (ALS/BLS)',
      hospital: 'Hospital Emergency Room',
      traffic: 'Traffic Police ITMS',
      admin: 'Master Administration'
    };

    const newUser = {
      id: cleanUsername,
      username: cleanUsername,
      name: userData.name.trim(),
      role: userData.role || 'driver',
      department: userData.department || deptMap[userData.role] || 'Ambulance Unit',
      badge: userData.badge ? userData.badge.trim().toUpperCase() : `UNIT-${cleanUsername.toUpperCase()}`,
      password: userData.password.trim(),
      status: userData.status || 'active',
      assignedTab: tabMap[userData.role] || 'command_map',
      createdAt: new Date().toISOString().split('T')[0],
      description: userData.description || `Operator ${userData.name.trim()} assigned to ${deptMap[userData.role] || 'duty'}.`
    };

    users.push(newUser);
    userService.saveUsers(users);
    return newUser;
  },

  /**
   * Update existing user details or credentials
   */
  updateUser: (username, updatedData) => {
    const users = userService.getUsers();
    const cleanUsername = (username || '').trim().toLowerCase();
    const index = users.findIndex(u => (u.username || u.id || '').toLowerCase() === cleanUsername);

    if (index === -1) {
      throw new Error('User not found.');
    }

    // Do not allow deactivating or changing role of root 'admin'
    if (cleanUsername === 'admin') {
      if (updatedData.status && updatedData.status !== 'active') {
        throw new Error('The primary root admin account cannot be deactivated.');
      }
      if (updatedData.role && updatedData.role !== 'admin') {
        throw new Error('The primary root admin account must remain an admin.');
      }
    }

    users[index] = {
      ...users[index],
      ...updatedData,
      id: users[index].id, // keep immutable key
      username: users[index].username
    };

    userService.saveUsers(users);
    return users[index];
  },

  /**
   * Delete a user account (Admin capability)
   */
  deleteUser: (username) => {
    const cleanUsername = (username || '').trim().toLowerCase();
    if (cleanUsername === 'admin') {
      throw new Error('The primary root admin account cannot be deleted.');
    }

    const users = userService.getUsers();
    const filtered = users.filter(u => (u.username || u.id || '').toLowerCase() !== cleanUsername);

    if (filtered.length === users.length) {
      throw new Error('User not found.');
    }

    userService.saveUsers(filtered);
    return true;
  },

  /**
   * Reset user database back to default factory credentials
   */
  resetToDefaults: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
  }
};
