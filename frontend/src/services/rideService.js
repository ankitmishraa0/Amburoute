/**
 * Real-Time Emergency Ride Dispatch & Presence Service (Rapido / Uber Style)
 * Synchronizes driver online presence, patient ride requests, driver acceptance,
 * and live ambulance movement between Patient & Driver devices.
 */

const CHANNEL_NAME = 'amburoute_ride_dispatch';
const STORAGE_DRIVERS_KEY = 'amburoute_online_drivers_v1';
const STORAGE_ACTIVE_RIDE_KEY = 'amburoute_active_ride_v1';

class EmergencyRideService {
  constructor() {
    this.currentDriver = null;
    this.heartbeatTimer = null;
    this.activeRide = null;
    this.listeners = {
      driversChanged: [],
      rideRequest: [],
      rideAccepted: [],
      rideRejected: [],
      rideCompleted: [],
      ambulanceMoved: []
    };

    // Cross-tab broadcast channel
    this.bc = typeof window !== 'undefined' && 'BroadcastChannel' in window 
      ? new BroadcastChannel(CHANNEL_NAME) 
      : null;

    if (this.bc) {
      this.bc.onmessage = (event) => this._handleMessage(event.data);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'amburoute_ride_signal' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this._handleMessage(data);
          } catch (err) {}
        }
      });
    }

    // Clean up stale drivers periodically
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this._pruneStaleDrivers();
      }, 3000);
    }
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

  _broadcast(msg) {
    if (this.bc) {
      this.bc.postMessage(msg);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('amburoute_ride_signal', JSON.stringify({ ...msg, _t: Date.now() }));
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

    // Send heartbeat every 2.5 seconds
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
    }, 2500);
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
      // Drop drivers who haven't pinged in 8 seconds
      const freshDrivers = drivers.filter(d => now - d.lastSeen < 8000);
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
          return parsed.filter(d => now - d.lastSeen < 8000);
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
      ambulanceCallsign: ridePayload.ambulanceCallsign || 'Ambulance MEDIC-12',
      status: 'pending',
      requestedAt: Date.now()
    };

    this.activeRide = ride;
    try {
      localStorage.setItem(STORAGE_ACTIVE_RIDE_KEY, JSON.stringify(ride));
    } catch (e) {}

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
