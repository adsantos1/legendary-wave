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
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    filter.type = 'lowpass';

    switch (type) {
      case 'rpg':
        // Warm Sine Sub-Bass Thump + Air Expansion Rocket Launch (Zero Buzz!)
        osc.type = 'sine';
        filter.frequency.setValueAtTime(220, t); // Removes high frequency buzz completely
        osc.frequency.setValueAtTime(65, t);
        osc.frequency.exponentialRampToValueAtTime(22, t + 0.38);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        break;

      case 'flamethrower':
        // Warm Soft Flame Hiss
        osc.type = 'triangle';
        filter.frequency.setValueAtTime(180, t);
        osc.frequency.setValueAtTime(75 + Math.random() * 20, t);
        osc.frequency.linearRampToValueAtTime(35, t + 0.08);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        break;

      case 'shotgun':
        // Warm Sub-Bass Tactical Thud
        osc.type = 'sine';
        filter.frequency.setValueAtTime(250, t);
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(25, t + 0.22);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        break;

      case 'sniper':
        // Smooth Soft Sci-Fi Beam Pulse
        osc.type = 'triangle';
        filter.frequency.setValueAtTime(280, t);
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(75, t + 0.3);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        break;

      case 'smg':
      case 'minigun':
        // Soft Quiet Mechanical Click
        osc.type = 'triangle';
        filter.frequency.setValueAtTime(280, t);
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        break;

      case 'rifle':
        // Soft Warm Tactical Punch
        osc.type = 'sine';
        filter.frequency.setValueAtTime(300, t);
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.11);
        gain.gain.setValueAtTime(0.035, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        break;

      default: // Pistol
        // Soft Quiet Thud
        osc.type = 'sine';
        filter.frequency.setValueAtTime(320, t);
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        break;
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + (type === 'rpg' ? 0.38 : type === 'sniper' ? 0.3 : 0.15));
  }

  playExplosion() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine'; // Warm sub-bass explosion
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);

    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(18, t + 0.45);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  playHit() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);

    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);
    gain.gain.setValueAtTime(0.03, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  playZombieDeath() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);

    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playPickup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.linearRampToValueAtTime(420, t + 0.12);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  playHeal() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(360, t + 0.18);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  playSlip() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.2);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  playDamage() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);

    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playDash() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(320, t + 0.14);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  playWaveClear() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      gain.gain.setValueAtTime(0.06, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

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
