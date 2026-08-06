import * as THREE from 'three';
import { AudioSystem } from './AudioSystem';
import { InputManager } from './InputManager';
import { CameraManager } from './CameraManager';
import { Environment } from './Environment';
import { Player } from './Player';
import { WeaponSystem, WEAPON_TYPES } from './WeaponSystem';
import { ParticleSystem } from './ParticleSystem';
import { ZombieManager } from './ZombieManager';
import { UIManager } from './UIManager';

export class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.worldSize = 120;
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;

    this.stats = {
      score: 0,
      kills: 0,
      wave: 1
    };

    this.waveTimer = 0;
    this.weaponSpawnTimer = 0;
    this.weaponDrops = [];

    // Modules
    this.audio = new AudioSystem();
    this.input = new InputManager();
    this.cameraManager = new CameraManager();
    this.environment = new Environment(this.scene, this.worldSize);
    this.particles = new ParticleSystem(this.scene);
    this.weaponSystem = new WeaponSystem(this.scene, this.audio, this.particles);
    this.player = new Player(this.scene);
    this.zombieManager = new ZombieManager(this.scene);
    this.ui = new UIManager();

    this.setupEventListeners();
    this.animate = this.animate.bind(this);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => {
      this.cameraManager.onResize(window.innerWidth, window.innerHeight);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.audio.init();
        this.startNewGame();
      });
    }

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.startNewGame();
      });
    }

    const timeToggleBtn = document.getElementById('time-toggle-btn');
    if (timeToggleBtn) {
      timeToggleBtn.addEventListener('click', () => {
        this.toggleTimeOfDay();
      });
    }

    const pauseCardBtn = document.getElementById('pause-card-btn');
    if (pauseCardBtn) {
      pauseCardBtn.addEventListener('click', () => {
        this.togglePause();
      });
    }

    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        this.resumeGame();
      });
    }

    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    if (pauseRestartBtn) {
      pauseRestartBtn.addEventListener('click', () => {
        this.resumeGame();
        this.startNewGame();
      });
    }
  }

  toggleTimeOfDay() {
    const isDay = this.environment.toggleTimeOfDay();
    this.ui.updateTimeOfDayDisplay(isDay);
  }

  pauseGame() {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    document.getElementById('pause-screen').classList.remove('hidden');
  }

  resumeGame() {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    document.getElementById('pause-screen').classList.add('hidden');
    this.lastTime = performance.now();
  }

  togglePause() {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  startNewGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('ui-overlay').classList.remove('hidden');

    this.stats = { score: 0, kills: 0, wave: 1 };
    this.waveTimer = 0;
    this.weaponSpawnTimer = 0;
    this.clearWeaponDrops();

    this.player.reset();
    this.zombieManager.clear();
    this.weaponSystem.clear();
    this.particles.clear();

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    this.environment.setTimeOfDay(true);
    this.ui.updateTimeOfDayDisplay(true);
    this.ui.showWaveBanner(this.stats.wave, true);
  }

  spawnWeaponDrop() {
    const types = ['shotgun', 'rifle', 'smg', 'sniper', 'minigun', 'rpg', 'flamethrower'];
    const type = types[Math.floor(Math.random() * types.length)];
    const wData = WEAPON_TYPES[type];

    const group = new THREE.Group();
    const crateGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
    const crateMat = new THREE.MeshStandardMaterial({
      color: wData.color,
      emissive: wData.color,
      emissiveIntensity: 0.4
    });
    const crate = new THREE.Mesh(crateGeo, crateMat);
    crate.castShadow = true;
    group.add(crate);

    const light = new THREE.PointLight(wData.color, 1.8, 10);
    light.position.y = 0.8;
    group.add(light);

    const angle = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 25;
    const posX = Math.max(-this.worldSize + 6, Math.min(this.worldSize - 6, this.player.pos.x + Math.cos(angle) * dist));
    const posZ = Math.max(-this.worldSize + 6, Math.min(this.worldSize - 6, this.player.pos.z + Math.sin(angle) * dist));

    group.position.set(posX, 0.2, posZ);
    this.scene.add(group);

    this.weaponDrops.push({
      mesh: group,
      type,
      light,
      pulse: Math.random() * Math.PI * 2
    });
  }

  clearWeaponDrops() {
    for (const d of this.weaponDrops) {
      this.scene.remove(d.mesh);
    }
    this.weaponDrops = [];
  }

  update(dt) {
    if (!this.isRunning) return;

    // Check Pause Input (ESC / P key)
    if (this.input.consumePause()) {
      this.togglePause();
    }

    if (this.isPaused) return;

    // Check weapon hotbar selection input
    const selectIdx = this.input.consumeWeaponSelect();
    if (selectIdx !== null) {
      const keysList = Object.keys(WEAPON_TYPES);
      const curIdx = keysList.indexOf(this.player.currentWeapon);

      if (selectIdx === 'prev') {
        const prevIdx = (curIdx - 1 + keysList.length) % keysList.length;
        this.player.currentWeapon = keysList[prevIdx];
      } else if (selectIdx === 'next') {
        const nextIdx = (curIdx + 1) % keysList.length;
        this.player.currentWeapon = keysList[nextIdx];
      } else if (typeof selectIdx === 'number' && keysList[selectIdx]) {
        this.player.currentWeapon = keysList[selectIdx];
      }
    }

    // Movement
    const movement = this.input.getMovementVector();
    this.player.update(dt, movement, this.input, this.environment, this.particles, this.audio);

    // Aiming direction (Mouse or Gamepad Right Stick)
    const aimDir = this.input.getAimDirection(this.cameraManager.camera, this.player.pos);
    this.player.rotateToFace(aimDir);

    // Shooting
    if (this.input.isShooting()) {
      const shot = this.weaponSystem.shoot(this.player, this.input.mouse, this.cameraManager.camera, aimDir, this.zombieManager.zombies);
      if (shot) {
        this.cameraManager.addShake(this.player.currentWeapon === 'rpg' ? 0.45 : 0.15);
      }
    }

    // Bullets Update
    this.weaponSystem.update(dt, this.environment, this.zombieManager.zombies);

    // Zombies Update
    const killResult = this.zombieManager.update(
      dt,
      this.player,
      this.environment,
      this.audio,
      this.particles,
      this.stats.wave,
      this.worldSize
    );

    if (killResult && killResult.killed) {
      this.stats.kills++;
      this.stats.score += killResult.score;
    }

    // Particles Update
    this.particles.update(dt);

    // Weapon Drops Update & Pickups
    for (let i = this.weaponDrops.length - 1; i >= 0; i--) {
      const drop = this.weaponDrops[i];
      drop.pulse += dt * 2.5;
      drop.mesh.rotation.y += dt * 1.5;
      drop.mesh.position.y = 0.2 + Math.sin(drop.pulse) * 0.1;
      drop.light.intensity = 1.2 + Math.sin(drop.pulse * 2) * 0.6;

      const dx = this.player.pos.x - drop.mesh.position.x;
      const dz = this.player.pos.z - drop.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 1.3) {
        const wData = WEAPON_TYPES[drop.type];
        this.player.currentWeapon = drop.type;
        this.player.ammo[drop.type] = wData.maxAmmo;
        this.audio.playPickup();
        this.particles.createSparkle(drop.mesh.position, wData.color, 8);
        this.stats.score += 75;

        this.scene.remove(drop.mesh);
        this.weaponDrops.splice(i, 1);
      }
    }

    // Spawning Crate Timer
    this.weaponSpawnTimer += dt;
    if (this.weaponSpawnTimer > 10) {
      this.weaponSpawnTimer = 0;
      if (this.weaponDrops.length < 4) {
        this.spawnWeaponDrop();
      }
    }

    // Check T key toggle for Day/Night
    if (this.input.consumeToggleTime()) {
      this.toggleTimeOfDay();
    }

    // Wave Advancement
    this.waveTimer += dt;
    if (this.waveTimer > 32) {
      this.waveTimer = 0;
      this.stats.wave++;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
      this.audio.playWaveClear();
      this.toggleTimeOfDay();
      this.ui.showWaveBanner(this.stats.wave, this.environment.isDay);
    }

    // Environment & Barn Roof update
    this.environment.update(this.player.pos, dt);

    // Camera follow with ultra-smooth aim offset (zero jostle)
    this.cameraManager.update(this.player.pos, this.input.gamepadRightStickActive, aimDir, dt);

    // UI Updates
    this.ui.update(this.player, this.stats);
    this.ui.renderMinimap(this.player, this.zombieManager.zombies, this.weaponDrops, this.worldSize);

    // Game Over Check
    if (this.player.hp <= 0) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.isRunning = false;
    document.getElementById('ui-overlay').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');

    document.getElementById('final-score').textContent = this.stats.score;
    document.getElementById('final-wave').textContent = this.stats.wave;
    document.getElementById('final-kills').textContent = this.stats.kills;
  }

  animate() {
    requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.renderer.render(this.scene, this.cameraManager.camera);
  }

  start() {
    this.lastTime = performance.now();
    this.animate();
  }
}
