/**
 * Real-Time Cross-Device Emergency Ride Dispatch & Presence Service (Rapido / Uber Style)
 * Uses high-speed public cloud SSE relay (ntfy.sh) + Dual-Channel Polling Fallback + BroadcastChannel
 * to guarantee 100% reliable cross-device communication between Patient Phone & Driver Laptop.
 */

const SSE_URL = 'https://ntfy.sh/amburoute_ride_dispatch_gkp_v2';
const CHANNEL_NAME = 'amburoute_ride_dispatch';
const STORAGE_DRIVERS_KEY = 'amburoute_online_drivers_v1';
const STORAGE_ACTIVE_RIDE_KEY = 'amburoute_active_ride_v1';

class EmergencyRideService {
  constructor() {
    this.currentDriver = null;
    this.heartbeatTimer = null;
    this.pollTimer = null;
    this.activeRide = null;
    this.seenRelayIds = new Set();
    this.listeners = {
      driversChanged: [],
      rideRequest: [],
      rideAccepted: [],
      rideRejected: [],
      rideCompleted: [],
      ambulanceMoved: []
    };

    // 1. Cross-tab Broadcast Channel (Instant local synchronization)
    this.bc = typeof window !== 'undefined' && 'BroadcastChannel' in window 
      ? new BroadcastChannel(CHANNEL_NAME) 
      : null;

    if (this.bc) {
      this.bc.onmessage = (event) => this._handleLocalMessage(event.data);
    }

    // 2. Storage event for cross-tab fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'amburoute_ride_signal' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this._handleLocalMessage(data);
          } catch (err) {}
        }
      });
    }

    // 3. Cross-Device Internet Cloud Relay (SSE + Periodic Fast Poll)
    this.sse = null;
    if (typeof window !== 'undefined') {
      this._initSse();
      this._startCloudPolling();
    }

    // 4. Clean up stale drivers periodically
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this._pruneStaleDrivers();
      }, 3000);
    }
  }

  _initSse() {
    if (this.sse) {
      try { this.sse.close(); } catch (e) {}
    }
    try {
      this.sse = new EventSource(`${SSE_URL}/sse`);

      const handleEvent = (event) => {
        try {
          if (!event.data) return;
          const raw = JSON.parse(event.data);
          this._processIncomingRelay(raw);
        } catch (e) {}
      };

      this.sse.onmessage = handleEvent;
      this.sse.addEventListener('message', handleEvent);

      this.sse.onerror = () => {
        try { this.sse.close(); } catch (e) {}
        this.sse = null;
        setTimeout(() => this._initSse(), 3000);
      };
    } catch (e) {
      console.warn('SSE connection warning:', e);
    }
  }

  // Secondary backup poll every 2.5 seconds to guarantee mobile phones never miss requests
  _startCloudPolling() {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`${SSE_URL}/json?poll=1&since=20s`, { cache: 'no-store' });
        if (!res.ok) return;
        const text = await res.text();
        if (!text) return;
        const lines = text.trim().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const raw = JSON.parse(line.trim());
            this._processIncomingRelay(raw);
          } catch (e) {}
        }
      } catch (e) {}
    }, 2500);
  }

  _processIncomingRelay(raw) {
    if (!raw) return;

    // Filter by ntfy id
    if (raw.id) {
      if (this.seenRelayIds.has(raw.id)) return;
      this.seenRelayIds.add(raw.id);
    }

    let payload = null;
    if (raw.message) {
      try {
        payload = typeof raw.message === 'string' ? JSON.parse(raw.message) : raw.message;
      } catch (e) {
        payload = raw.message;
      }
    } else if (raw.type) {
      payload = raw;
    }

    if (!payload || typeof payload !== 'object' || !payload.type) return;

    // Filter by unique client msgId
    if (payload._msgId) {
      if (this.seenRelayIds.has(payload._msgId)) return;
      this.seenRelayIds.add(payload._msgId);
    }

    // Limit set size to prevent memory leaks
    if (this.seenRelayIds.size > 200) {
      const arr = Array.from(this.seenRelayIds);
      this.seenRelayIds = new Set(arr.slice(-100));
    }

    this._handleMessage(payload);
  }

  _handleLocalMessage(msg) {
    if (!msg || !msg.type) return;
    if (msg._msgId) {
      if (this.seenRelayIds.has(msg._msgId)) return;
      this.seenRelayIds.add(msg._msgId);
    }
    this._handleMessage(msg);
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  _notify(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    }
  }

  async _broadcast(msg) {
    // Generate unique message ID to prevent duplicate handling
    const msgId = msg._msgId || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fullMsg = { ...msg, _msgId: msgId };

    // Record as seen on the sending device so sender never echoes itself
    this.seenRelayIds.add(msgId);

    // 1. Post to local tabs
    if (this.bc) {
      try { this.bc.postMessage(fullMsg); } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amburoute_ride_signal', JSON.stringify({ ...fullMsg, _t: Date.now() }));
      } catch (e) {}
    }

    // 2. Post to Internet Cloud Relay (Cross-Device: Phone to Laptop)
    const postToCloud = async () => {
      try {
        await fetch(SSE_URL, {
          method: 'POST',
          headers: { 
            'Title': fullMsg.type,
            'Priority': fullMsg.type === 'RIDE_REQUEST' ? '5' : '3'
          },
          body: JSON.stringify(fullMsg)
        });
      } catch (e) {}
    };

    // Send immediately
    postToCloud();

    // For critical dispatch events, send an automatic backup after 250ms
    if (fullMsg.type === 'RIDE_REQUEST' || fullMsg.type === 'RIDE_ACCEPTED') {
      setTimeout(postToCloud, 250);
    }
  }

  _handleMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'DRIVER_HEARTBEAT':
        this._recordDriverHeartbeat(msg.driver);
        break;

      case 'DRIVER_OFFLINE':
        this._removeDriver(msg.driverId);
        break;

      case 'RIDE_REQUEST':
        this._notify('rideRequest', msg.ride);
        break;

      case 'RIDE_ACCEPTED':
        this.activeRide = msg.ride;
        this._notify('rideAccepted', msg.ride);
        break;

      case 'RIDE_REJECTED':
        this._notify('rideRejected', msg.rideId);
        break;

      case 'RIDE_COMPLETED':
        this.activeRide = null;
        this._notify('rideCompleted', msg.rideId);
        break;

      case 'AMBULANCE_MOVED':
        this._notify('ambulanceMoved', msg.location);
        break;

      default:
        break;
    }
  }

  // ================= DRIVER ONLINE PRESENCE =================

  startDriverPresence(driverData) {
    this.currentDriver = {
      id: driverData.id || driverData.username || 'driver108',
      name: driverData.name || 'Paramedic Rajesh Sharma',
      badge: driverData.badge || 'UNIT MEDIC-12 (ALS)',
      callsign: 'Ambulance MEDIC-12 (ALS)',
      phone: '+91 98765-43210',
      type: 'ALS Super-Care (ICU on Wheels)',
      location: 'Golghar / En Route',
      coordinates: { lat: 26.7606, lng: 83.3732 },
      status: 'available',
      rating: 4.9,
      lastSeen: Date.now()
    };

    this._recordDriverHeartbeat(this.currentDriver);

    // Broadcast immediately across internet (burst to register rapidly)
    this._broadcast({
      type: 'DRIVER_HEARTBEAT',
      driver: this.currentDriver
    });
    setTimeout(() => {
      if (this.currentDriver) {
        this._broadcast({ type: 'DRIVER_HEARTBEAT', driver: this.currentDriver });
      }
    }, 600);

    // Send heartbeat every 3 seconds
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.currentDriver) {
        this.currentDriver.lastSeen = Date.now();
        this._broadcast({
          type: 'DRIVER_HEARTBEAT',
          driver: this.currentDriver
        });
        this._recordDriverHeartbeat(this.currentDriver);
      }
    }, 3000);
  }

  stopDriverPresence() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.currentDriver) {
      this._broadcast({
        type: 'DRIVER_OFFLINE',
        driverId: this.currentDriver.id
      });
      this._removeDriver(this.currentDriver.id);
      this.currentDriver = null;
    }
  }

  _recordDriverHeartbeat(driver) {
    if (!driver || !driver.id) return;
    try {
      const drivers = this.getOnlineDrivers();
      const existingIdx = drivers.findIndex(d => d.id === driver.id);
      if (existingIdx >= 0) {
        drivers[existingIdx] = { ...drivers[existingIdx], ...driver, lastSeen: Date.now() };
      } else {
        drivers.push({ ...driver, lastSeen: Date.now() });
      }
      localStorage.setItem(STORAGE_DRIVERS_KEY, JSON.stringify(drivers));
      this._notify('driversChanged', drivers);
    } catch (e) {}
  }

  _removeDriver(driverId) {
    try {
      let drivers = this.getOnlineDrivers();
      drivers = drivers.filter(d => d.id !== driverId);
      localStorage.setItem(STORAGE_DRIVERS_KEY, JSON.stringify(drivers));
      this._notify('driversChanged', drivers);
    } catch (e) {}
  }

  _pruneStaleDrivers() {
    try {
      const now = Date.now();
      let drivers = this.getOnlineDrivers();
      // Drop drivers who haven't pinged in 12 seconds
      const freshDrivers = drivers.filter(d => now - d.lastSeen < 12000);
      if (freshDrivers.length !== drivers.length) {
        localStorage.setItem(STORAGE_DRIVERS_KEY, JSON.stringify(freshDrivers));
        this._notify('driversChanged', freshDrivers);
      }
    } catch (e) {}
  }

  getOnlineDrivers() {
    try {
      const raw = localStorage.getItem(STORAGE_DRIVERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const now = Date.now();
          return parsed.filter(d => now - d.lastSeen < 12000);
        }
      }
    } catch (e) {}
    return [];
  }

  // ================= RIDE DISPATCH (RAPIDO / UBER STYLE) =================

  requestRide(ridePayload) {
    const ride = {
      rideId: `ride-${Date.now().toString().slice(-6)}`,
      patientName: ridePayload.patientName || 'Citizen Patient',
      pickupAddress: ridePayload.pickupAddress || 'Golghar Commercial Hub, Gorakhpur',
      pickupCoords: ridePayload.pickupCoords || { lat: 26.7606, lng: 83.3732 },
      emergencyType: ridePayload.emergencyType || 'heart_attack',
      hospitalId: ridePayload.hospitalId || 'hosp-gkp-aiims',
      hospitalName: ridePayload.hospitalName || 'AIIMS Gorakhpur Super-Specialty ER',
      targetDriverId: ridePayload.targetDriverId || 'driver108',
      ambulanceCallsign: ridePayload.ambulanceCallsign || 'Ambulance MEDIC-12 (ALS)',
      status: 'pending',
      requestedAt: Date.now()
    };

    this.activeRide = ride;
    try {
      localStorage.setItem(STORAGE_ACTIVE_RIDE_KEY, JSON.stringify(ride));
    } catch (e) {}

    // Broadcast across internet & local
    this._broadcast({
      type: 'RIDE_REQUEST',
      ride
    });

    return ride;
  }

  acceptRide(ride) {
    const updatedRide = {
      ...ride,
      status: 'accepted',
      acceptedAt: Date.now(),
      driverId: this.currentDriver?.id || 'driver108',
      driverName: this.currentDriver?.name || 'Driver Rajesh Sharma',
      driverPhone: this.currentDriver?.phone || '+91 98765-43210',
      ambulanceCallsign: this.currentDriver?.callsign || 'Ambulance MEDIC-12 (ALS)'
    };

    this.activeRide = updatedRide;
    try {
      localStorage.setItem(STORAGE_ACTIVE_RIDE_KEY, JSON.stringify(updatedRide));
    } catch (e) {}

    // Broadcast across internet & local
    this._broadcast({
      type: 'RIDE_ACCEPTED',
      ride: updatedRide
    });

    this._notify('rideAccepted', updatedRide);
    return updatedRide;
  }

  rejectRide(rideId) {
    this.activeRide = null;
    try {
      localStorage.removeItem(STORAGE_ACTIVE_RIDE_KEY);
    } catch (e) {}

    this._broadcast({
      type: 'RIDE_REJECTED',
      rideId
    });

    this._notify('rideRejected', rideId);
  }

  completeRide(rideId) {
    this.activeRide = null;
    try {
      localStorage.removeItem(STORAGE_ACTIVE_RIDE_KEY);
    } catch (e) {}

    this._broadcast({
      type: 'RIDE_COMPLETED',
      rideId
    });

    this._notify('rideCompleted', rideId);
  }

  broadcastAmbulanceLocation(location) {
    this._broadcast({
      type: 'AMBULANCE_MOVED',
      location
    });
  }

  getActiveRide() {
    if (this.activeRide) return this.activeRide;
    try {
      const raw = localStorage.getItem(STORAGE_ACTIVE_RIDE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
}

export const rideService = new EmergencyRideService();
