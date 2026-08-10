export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.init();
  }

  init() {
    const startAudio = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
      window.removeEventListener('pointerdown', startAudio);
    };

    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);
    window.addEventListener('pointerdown', startAudio);
  }

  playShoot(type) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (type) {
      case 'rpg': {
        // ENHANCED RPG: Micro-Pitch Variation + Gentle Warmth Filter + Smooth Envelope
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t); // Gentle warmth filter (strips harsh high static, zero echo)

        // Micro-pitch variation (+-6% per shot)
        const startFreq = 135 + Math.random() * 16;
        const endFreq = 30 + Math.random() * 6;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.24);

        // Smooth 3ms attack envelope to prevent digital pops
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.065, t + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);

        osc.start(t);
        osc.stop(t + 0.24);
        break;
      }

      case 'flamethrower':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
        osc.frequency.linearRampToValueAtTime(60, t + 0.08);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.08);
        break;

      case 'shotgun':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.22);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.start(t);
        osc.stop(t + 0.22);
        break;

      case 'sniper': {
        // ENHANCED PLASMA BEAM: Micro-Pitch Variation + Gentle Laser Warmth + Smooth Envelope
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, t); // Strips harsh square-wave screeching

        // Micro-pitch variation (+-5% per beam shot)
        const startFreq = 950 + Math.random() * 80;
        const endFreq = 75 + Math.random() * 10;

        osc.type = 'square';
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.32);

        // Smooth 3ms attack envelope
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.03, t + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);

        osc.start(t);
        osc.stop(t + 0.32);
        break;
      }

      case 'smg':
      case 'minigun':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.07);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.start(t);
        osc.stop(t + 0.07);
        break;

      case 'rifle': {
        // SOLFEGGIO 528 Hz HARMONIC ASSAULT RIFLE: Warm, human-friendly frequency sweep
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, t); // Smooth warmth filter

        // Micro-pitch variation around 528 Hz (+-3% per bullet)
        const startFreq = 528 + (Math.random() - 0.5) * 30;
        const endFreq = 110 + (Math.random() - 0.5) * 10;

        osc.type = 'triangle'; // Warm harmonic tone instead of harsh sawtooth
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.11);

        // Smooth 2ms attack envelope
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.035, t + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);

        osc.start(t);
        osc.stop(t + 0.11);
        break;
      }

      default: { // Pistol: 432 Hz Solfeggio Harmonic Acoustic Pitch
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);

        // Micro-pitch variation around 432 Hz (+-4% per click)
        const startFreq = 432 + (Math.random() - 0.5) * 36;
        const endFreq = 90 + (Math.random() - 0.5) * 10;

        osc.type = 'triangle'; // Warm organic tone instead of harsh square wave
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.09);

        // Smooth 2ms attack envelope
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.05, t + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        osc.disconnect();
        osc.connect(filter);
        filter.connect(gain);

        osc.start(t);
        osc.stop(t + 0.09);
        break;
      }
    }
  }

  playExplosion() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.4);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  playHit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.08);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  playZombieDeath() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playPickup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.15);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playHeal() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.linearRampToValueAtTime(400, t + 0.2);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playSlip() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.2);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playDamage() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playDash() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.linearRampToValueAtTime(350, t + 0.15);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playWaveClear() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.08, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.3);
    });
  }

  playRpgLaunch() {
    this.playShoot('rpg');
  }

  playFlamethrower() {
    this.playShoot('flamethrower');
  }

  playMotorcycleEngine() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);

    osc.frequency.setValueAtTime(45, t);
    osc.frequency.linearRampToValueAtTime(85 + Math.random() * 20, t + 0.2);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.5);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.05, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  startAmbientSynth() {
    if (!this.ctx) return;
    try {
      this.bgOsc = this.ctx.createOscillator();
      this.bgGain = this.ctx.createGain();
      this.bgOsc.type = 'sine';
      this.bgOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.bgGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
      this.bgOsc.connect(this.bgGain);
      this.bgGain.connect(this.ctx.destination);
      this.bgOsc.start();
    } catch (e) {
      // Audio autoplay policy handled
    }
  }

  stopAmbientSynth() {
    if (this.bgOsc) {
      try {
        this.bgOsc.stop();
      } catch (e) {}
    }
  }
}
