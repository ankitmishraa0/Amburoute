/**
 * Web Audio API Sound Generator for AmbuRoute Mission Control
 * Generates futuristic telemetry pings, sirens, and alerts purely via Web Audio API (zero audio file dependencies).
 */

class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
  }

  _initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playBeep(freq = 880, type = 'sine', duration = 0.12, volume = 0.1) {
    if (this.isMuted) return;
    try {
      this._initContext();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  playGreenWavePing() {
    if (this.isMuted) return;
    this.playBeep(587.33, 'sine', 0.15, 0.08); // D5
    setTimeout(() => this.playBeep(880, 'sine', 0.22, 0.1), 100); // A5
  }

  playCriticalAlert() {
    if (this.isMuted) return;
    this.playBeep(880, 'sawtooth', 0.15, 0.12);
    setTimeout(() => this.playBeep(659.25, 'sawtooth', 0.18, 0.12), 140);
  }

  playClick() {
    if (this.isMuted) return;
    this.playBeep(1200, 'triangle', 0.04, 0.04);
  }

  playReroute() {
    if (this.isMuted) return;
    this.playBeep(440, 'triangle', 0.1, 0.08);
    setTimeout(() => this.playBeep(660, 'sine', 0.1, 0.08), 80);
    setTimeout(() => this.playBeep(990, 'sine', 0.15, 0.1), 160);
  }

  playSuccess() {
    if (this.isMuted) return;
    this.playBeep(523.25, 'sine', 0.1, 0.08);
    setTimeout(() => this.playBeep(659.25, 'sine', 0.1, 0.08), 80);
    setTimeout(() => this.playBeep(783.99, 'sine', 0.18, 0.1), 160);
  }
}

export const soundFx = new SoundEngine();
