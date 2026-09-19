/**
 * WebSocket Telemetry Client for Real-Time Streaming Updates
 */

export class TelemetryWebSocket {
  constructor(onMessageCallback, onStatusChangeCallback) {
    this.onMessage = onMessageCallback;
    this.onStatusChange = onStatusChangeCallback;
    this.socket = null;
    this.reconnectTimer = null;
    this.isExplicitlyClosed = false;
  }

  connect() {
    this.isExplicitlyClosed = false;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // Vite proxy handles /ws/telemetry, or fallback direct to localhost:8000
    const wsUrl = `${protocol}//${host}/ws/telemetry`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        if (this.onStatusChange) this.onStatusChange('connected');
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (this.onMessage) {
            this.onMessage(payload);
          }
        } catch (err) {
          console.error('Error parsing WS payload', err);
        }
      };

      this.socket.onclose = () => {
        if (this.onStatusChange) this.onStatusChange('disconnected');
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        if (this.onStatusChange) this.onStatusChange('error');
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 2000);
  }

  sendMessage(action, payload = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, ...payload }));
    }
  }

  close() {
    this.isExplicitlyClosed = true;
    clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
    }
  }
}
