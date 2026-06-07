export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ready = false;
    this._volume = 0.7;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.ready = true;
    } catch {
      this.ready = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
    }
  }

  _out() {
    return this.masterGain || this.ctx.destination;
  }

  _tone(freq, duration, type = 'square', volume = 0.15, rampDown = true) {
    if (!this.ready) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    if (rampDown) {
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(this._out());
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _noise(duration, volume = 0.08) {
    if (!this.ready) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this._out());
    source.start();
  }

  _sweep(startFreq, endFreq, duration, type = 'sine', volume = 0.15) {
    if (!this.ready) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this._out());
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playLaserFire() {
    this._sweep(2200, 800, 0.1, 'sawtooth', 0.12);
    this._tone(900, 0.12, 'square', 0.06);
    this._noise(0.05, 0.04);
  }

  playHitConfirm() {
    this._tone(1200, 0.06, 'sine', 0.2);
    this._tone(1600, 0.1, 'sine', 0.15);
    this._sweep(800, 1600, 0.08, 'triangle', 0.1);
  }

  playHeadshot() {
    this._tone(1600, 0.05, 'sine', 0.25);
    this._tone(2200, 0.08, 'sine', 0.2);
    this._tone(2800, 0.12, 'sine', 0.15);
    this._sweep(1400, 3200, 0.15, 'sawtooth', 0.08);
  }

  playDamage() {
    this._tone(200, 0.15, 'sawtooth', 0.2);
    this._sweep(400, 100, 0.12, 'square', 0.1);
    this._noise(0.1, 0.1);
  }

  playRespawn() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [400, 600, 800, 1000].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.08);
      gain.gain.setValueAtTime(0.12, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.15);
      osc.connect(gain);
      gain.connect(this._out());
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.15);
    });
  }

  playMatchEnd() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.15);
      gain.gain.setValueAtTime(0.15, t + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.4);
      osc.connect(gain);
      gain.connect(this._out());
      osc.start(t + i * 0.15);
      osc.stop(t + i * 0.15 + 0.4);
    });
  }

  playCountdown() {
    this._tone(880, 0.1, 'sine', 0.2);
  }

  playMenuClick() {
    this._tone(1400, 0.04, 'sine', 0.12);
  }

  playMenuHover() {
    this._tone(1800, 0.02, 'sine', 0.06);
  }
}
