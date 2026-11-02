/**
 * AmbuRoute High-Performance Real-Time Emergency Ride Dispatch Service
 * Multi-layer Hybrid Architecture:
 * 1. Local Network / API Sync (/api/ride/state) - zero external dependency
 * 2. WebRTC P2P DataChannel (PeerJS) - direct cross-device internet communication
 * 3. BroadcastChannel & LocalStorage - sub-millisecond local tab synchronization
 */

import { Peer } from 'peerjs';

const CHANNEL_NAME = 'amburoute_ride_dispatch';
const STORAGE_DRIVERS_KEY = 'amburoute_online_drivers_v1';
const STORAGE_ACTIVE_RIDE_KEY = 'amburoute_active_ride_v1';
const DRIVER_PEER_ID = 'amburoute-gkp-driver-108';

class EmergencyRideService {
  constructor() {
    this.currentDriver = null;
    this.activeRide = null;
    this.onlineDrivers = [];
    this.lastRideId = null;
    this.lastRideStatus = null;
    this.driverPeer = null;
    this.patientPeer = null;
    this.activeP2PConn = null;
    this.apiSyncTimer = null;
    this.heartbeatTimer = null;

    this.listeners = {
      driversChanged: [],
      rideRequest: [],
      rideAccepted: [],
      rideRejected: [],
      rideCompleted: [],
      ambulanceMoved: []
    };

    // 1. Cross-tab Broadcast Channel (Instant local sync)
    this.bc = typeof window !== 'undefined' && 'BroadcastChannel' in window 
      ? new BroadcastChannel(CHANNEL_NAME) 
      : null;

    if (this.bc) {
      this.bc.onmessage = (event) => this._handleMessage(event.data);
    }

    // 2. Storage event for cross-tab fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'amburoute_ride_signal' && e.newValue) {
          try {
            this._handleMessage(JSON.parse(e.newValue));
          } catch (err) {}
        }
      });
    }

    // 3. Start Local / LAN API Polling Sync (every 1 second)
    if (typeof window !== 'undefined') {
      this._startApiSync();
    }
  }

  // ================= 1. LOCAL API SYNC (/api/ride/state) =================

  _startApiSync() {
    if (this.apiSyncTimer) clearInterval(this.apiSyncTimer);
    this._fetchApiState();
    this.apiSyncTimer = setInterval(() => {
      this._fetchApiState();
    }, 1000);
  }

  async _fetchApiState() {
    try {
      const res = await fetch('/api/ride/state', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data) return;

      // Sync online drivers
      if (Array.isArray(data.online_drivers)) {
        this.onlineDrivers = data.online_drivers;
        localStorage.setItem(STORAGE_DRIVERS_KEY, JSON.stringify(data.online_drivers));
        this._notify('driversChanged', data.online_drivers);
      }

      // Sync active ride
      const remoteRide = data.active_ride;
      if (remoteRide && remoteRide.rideId) {
        if (remoteRide.status === 'pending') {
          if (this.lastRideId !== remoteRide.rideId || this.lastRideStatus !== 'pending') {
            this.lastRideId = remoteRide.rideId;
            this.lastRideStatus = 'pending';
            this.activeRide = remoteRide;
            console.log('🚨 [RideService] Pending Ride from API:', remoteRide);
            this._notify('rideRequest', remoteRide);
          }
        } else if (remoteRide.status === 'accepted') {
          if (this.lastRideId === remoteRide.rideId && this.lastRideStatus !== 'accepted') {
            this.lastRideId = remoteRide.rideId;
            this.lastRideStatus = 'accepted';
            this.activeRide = remoteRide;
            console.log('✅ [RideService] Accepted Ride from API:', remoteRide);
            this._notify('rideAccepted', remoteRide);
          }
        }
      } else {
        if (this.activeRide && this.lastRideStatus) {
          const oldId = this.activeRide.rideId;
          this.activeRide = null;
          this.lastRideId = null;
          this.lastRideStatus = null;
          this._notify('rideCompleted', oldId);
        }
      }
    } catch (e) {
      // Local API unavailable (e.g. running purely on static host), WebRTC and local channels take over
    }
  }

  // ================= 2. WEBRTC P2P DATACHANNEL (PeerJS) =================

  _initDriverPeer() {
    if (this.driverPeer) return;
    try {
      this.driverPeer = new Peer(DRIVER_PEER_ID, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.driverPeer.on('open', () => {
        console.log('[PeerJS] Driver Peer Ready on WebRTC:', DRIVER_PEER_ID);
      });

      this.driverPeer.on('connection', (conn) => {
        this.activeP2PConn = conn;
        console.log('[PeerJS] Patient Connected via WebRTC DataChannel!');

        conn.on('data', (data) => {
          console.log('[PeerJS] Driver received P2P message:', data);
          if (data?.type === 'RIDE_REQUEST') {
            this._handleMessage(data);
          }
        });
      });

      this.driverPeer.on('error', (err) => {
        console.warn('[PeerJS] Driver notice:', err.type);
      });
    } catch (e) {
      console.warn('[PeerJS] Driver peer init error:', e);
    }
  }

  _sendP2PToDriver(payload) {
    try {
      if (!this.patientPeer) {
        this.patientPeer = new Peer(null, {
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });
      }

      const transmit = () => {
        try {
          const conn = this.patientPeer.connect(DRIVER_PEER_ID, { reliable: true });
          this.activeP2PConn = conn;

          conn.on('open', () => {
            console.log('[PeerJS] WebRTC connection established to driver. Sending payload:', payload);
            conn.send(payload);
          });

          conn.on('data', (data) => {
            console.log('[PeerJS] Patient received reply from driver:', data);
            if (data?.type === 'RIDE_ACCEPTED') {
              this._handleMessage(data);
            }
          });
        } catch (e) {}
      };

      if (this.patientPeer.open) {
        transmit();
      } else {
        this.patientPeer.on('open', transmit);
      }
    } catch (e) {}
  }

  // ================= 3. DISPATCH & RIDE STATE LOGIC =================

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

  _broadcastLocal(msg) {
    if (this.bc) {
      try { this.bc.postMessage(msg); } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('amburoute_ride_signal', JSON.stringify({ ...msg, _t: Date.now() }));
      } catch (e) {}
    }
  }

  _handleMessage(msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case 'RIDE_REQUEST':
        this.activeRide = msg.ride;
        this.lastRideId = msg.ride?.rideId;
        this.lastRideStatus = 'pending';
        this._notify('rideRequest', msg.ride);
        break;

      case 'RIDE_ACCEPTED':
        this.activeRide = msg.ride;
        this.lastRideId = msg.ride?.rideId;
        this.lastRideStatus = 'accepted';
        this._notify('rideAccepted', msg.ride);
        break;

      case 'RIDE_REJECTED':
        this.activeRide = null;
        this.lastRideStatus = 'rejected';
        this._notify('rideRejected', msg.rideId);
        break;

      case 'RIDE_COMPLETED':
        this.activeRide = null;
        this.lastRideId = null;
        this.lastRideStatus = null;
        this._notify('rideCompleted', msg.rideId);
        break;

            case 'AMBULANCE_MOVED':
        this._notify('ambulanceMoved', msg.location);
        break;

      case 'DRIVER_HEARTBEAT':
        this._recordDriverHeartbeat(msg.driver);
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

    // 1. Initialize Driver WebRTC P2P Receiver
    this._initDriverPeer();

    // 2. Broadcast local heartbeat
    this._recordDriverHeartbeat(this.currentDriver);
    this._broadcastLocal({ type: 'DRIVER_HEARTBEAT', driver: this.currentDriver });

    // 3. Post to backend API
    const pingApi = () => {
      fetch('/api/drivers/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver: this.currentDriver })
      }).catch(() => {});
    };

    pingApi();

    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.currentDriver) {
        this.currentDriver.lastSeen = Date.now();
        this._recordDriverHeartbeat(this.currentDriver);
        this._broadcastLocal({ type: 'DRIVER_HEARTBEAT', driver: this.currentDriver });
        pingApi();
      }
    }, 4000);
  }

  stopDriverPresence() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.driverPeer) {
      try { this.driverPeer.destroy(); } catch (e) {}
      this.driverPeer = null;
    }

    this.currentDriver = null;
  }

  _recordDriverHeartbeat(driver) {
    if (!driver || !driver.id) return;
    try {
      let drivers = this.getOnlineDrivers();
      const idx = drivers.findIndex(d => d.id === driver.id);
      if (idx >= 0) {
        drivers[idx] = { ...drivers[idx], ...driver, lastSeen: Date.now() };
      } else {
        drivers.push({ ...driver, lastSeen: Date.now() });
      }
      localStorage.setItem(STORAGE_DRIVERS_KEY, JSON.stringify(drivers));
      this._notify('driversChanged', drivers);
    } catch (e) {}
  }

  getOnlineDrivers() {
    if (this.onlineDrivers && this.onlineDrivers.length > 0) {
      return this.onlineDrivers;
    }
    try {
      const raw = localStorage.getItem(STORAGE_DRIVERS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    return [
      {
        id: 'driver108',
        name: 'Paramedic Rajesh Sharma',
        badge: 'UNIT MEDIC-12 (ALS)',
        callsign: 'Ambulance MEDIC-12 (ALS Super-Care)',
        phone: '+91 98765-43210',
        type: 'ALS Super-Care (ICU on Wheels)',
        location: 'Golghar Hub, Gorakhpur',
        coordinates: { lat: 26.7606, lng: 83.3732 },
        status: 'available',
        rating: 4.9,
        lastSeen: Date.now()
      }
    ];
  }

  // ================= RIDE DISPATCH (Emergency Dispatch) =================

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
    this.lastRideId = ride.rideId;
    this.lastRideStatus = 'pending';

    try {
      localStorage.setItem(STORAGE_ACTIVE_RIDE_KEY, JSON.stringify(ride));
    } catch (e) {}

    // 1. Post to local tabs immediately
    this._broadcastLocal({ type: 'RIDE_REQUEST', ride });

    // 2. Post to Local / LAN Backend API
    fetch('/api/ride/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ride })
    }).catch(() => {});

    // 3. Post to WebRTC P2P DataChannel (Cross-device internet)
    this._sendP2PToDriver({ type: 'RIDE_REQUEST', ride });

    console.log('🚀 [RideService] Dispatched Emergency Ride via Hybrid Network:', ride);
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
    this.lastRideId = updatedRide.rideId;
    this.lastRideStatus = 'accepted';

    try {
      localStorage.setItem(STORAGE_ACTIVE_RIDE_KEY, JSON.stringify(updatedRide));
    } catch (e) {}

    // 1. Post to local tabs immediately
    this._broadcastLocal({ type: 'RIDE_ACCEPTED', ride: updatedRide });

    // 2. Post to Local / LAN Backend API
    fetch('/api/ride/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ride: updatedRide })
    }).catch(() => {});

    // 3. Send over WebRTC P2P to patient
    if (this.activeP2PConn && this.activeP2PConn.open) {
      try {
        this.activeP2PConn.send({ type: 'RIDE_ACCEPTED', ride: updatedRide });
      } catch (e) {}
    }

    this._notify('rideAccepted', updatedRide);
    console.log('🟢 [RideService] Driver Accepted Ride via Hybrid Network:', updatedRide);
    return updatedRide;
  }

  rejectRide(rideId) {
    this.activeRide = null;
    this.lastRideStatus = 'rejected';

    try {
      localStorage.removeItem(STORAGE_ACTIVE_RIDE_KEY);
    } catch (e) {}

    this._broadcastLocal({ type: 'RIDE_REJECTED', rideId });

    fetch('/api/ride/complete', { method: 'POST' }).catch(() => {});

    if (this.activeP2PConn && this.activeP2PConn.open) {
      try {
        this.activeP2PConn.send({ type: 'RIDE_REJECTED', rideId });
      } catch (e) {}
    }

    this._notify('rideRejected', rideId);
  }

  completeRide(rideId) {
    this.activeRide = null;
    this.lastRideId = null;
    this.lastRideStatus = null;

    try {
      localStorage.removeItem(STORAGE_ACTIVE_RIDE_KEY);
    } catch (e) {}

    this._broadcastLocal({ type: 'RIDE_COMPLETED', rideId });

    fetch('/api/ride/complete', { method: 'POST' }).catch(() => {});

    if (this.activeP2PConn && this.activeP2PConn.open) {
      try {
        this.activeP2PConn.send({ type: 'RIDE_COMPLETED', rideId });
      } catch (e) {}
    }

    this._notify('rideCompleted', rideId);
  }

  broadcastAmbulanceLocation(location) {
    this._broadcastLocal({
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

