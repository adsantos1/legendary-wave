import { WEAPON_TYPES } from './WeaponSystem';

export class UIManager {
  constructor() {
    this.hpDisplay = document.getElementById('hp-display');
    this.hpBar = document.getElementById('hp-bar');
    this.dashBar = document.getElementById('dash-bar');
    this.scoreDisplay = document.getElementById('score-display');
    this.waveDisplay = document.getElementById('wave-display');
    this.killsDisplay = document.getElementById('kills-display');
    this.weaponDisplay = document.getElementById('weapon-display');
    this.ammoDisplay = document.getElementById('ammo-display');

    this.damageVignette = document.getElementById('damage-vignette');
    this.waveBanner = document.getElementById('wave-banner');
    this.waveNumberBanner = document.getElementById('wave-number-banner');
    this.waveSubtitleBanner = document.getElementById('wave-subtitle-banner');
    this.timeDisplay = document.getElementById('time-display');

    this.bossHpContainer = document.getElementById('boss-hp-container');
    this.bossHpBar = document.getElementById('boss-hp-bar');
    this.bossNameDisplay = document.getElementById('boss-name-display');

    this.minimapCanvas = document.getElementById('minimap-canvas');
    if (this.minimapCanvas) {
      this.ctxMap = this.minimapCanvas.getContext('2d');
    }

    this.setupWeaponHotbar();
  }

  setupWeaponHotbar() {
    const hotbar = document.getElementById('weapon-hotbar');
    if (!hotbar) return;

    hotbar.innerHTML = '';
    Object.values(WEAPON_TYPES).forEach((w, idx) => {
      const slot = document.createElement('div');
      slot.className = `weapon-slot ${idx === 0 ? 'active' : ''}`;
      slot.dataset.weapon = w.id;
      slot.innerHTML = `
        <span class="key-hint">${w.key}</span>
        <span class="w-name">${w.name.split(' ')[0]}</span>
      `;
      hotbar.appendChild(slot);
    });
  }

  update(player, gameStats) {
    // HP Update
    const hpPercent = Math.max(0, player.hp / player.maxHp);
    if (this.hpDisplay) this.hpDisplay.textContent = Math.floor(player.hp);
    if (this.hpBar) {
      this.hpBar.style.width = `${hpPercent * 100}%`;
      this.hpBar.style.background = hpPercent > 0.5 ? 'linear-gradient(90deg, #00ff88, #00e5ff)' : hpPercent > 0.25 ? 'linear-gradient(90deg, #ffaa00, #ff5500)' : 'linear-gradient(90deg, #ff3366, #ff0000)';
    }

    // Dash Cooldown Bar
    if (this.dashBar) {
      const dashPercent = 1 - (player.dashCooldown / player.maxDashCooldown);
      this.dashBar.style.width = `${Math.min(1, dashPercent) * 100}%`;
    }

    // Stats
    if (this.scoreDisplay) this.scoreDisplay.textContent = gameStats.score;
    if (this.waveDisplay) this.waveDisplay.textContent = gameStats.wave;
    if (this.killsDisplay) this.killsDisplay.textContent = gameStats.kills;

    // Current Weapon
    const wData = WEAPON_TYPES[player.currentWeapon];
    if (wData) {
      if (this.weaponDisplay) this.weaponDisplay.textContent = wData.name;
      const ammoVal = player.ammo[player.currentWeapon];
      if (this.ammoDisplay) this.ammoDisplay.textContent = ammoVal === Infinity ? '∞' : ammoVal;
    }

    // Update Hotbar Active Slot
    const slots = document.querySelectorAll('.weapon-slot');
    slots.forEach(slot => {
      if (slot.dataset.weapon === player.currentWeapon) {
        slot.classList.add('active');
      } else {
        slot.classList.remove('active');
      }
    });
  }

  showDamageFlash() {
    if (!this.damageVignette) return;
    this.damageVignette.style.opacity = '1';
    setTimeout(() => {
      this.damageVignette.style.opacity = '0';
    }, 150);
  }

  updateTimeOfDayDisplay(isDay) {
    if (this.timeDisplay) {
      if (isDay) {
        this.timeDisplay.textContent = '☀️ DAY';
        this.timeDisplay.style.color = '#ffaa00';
      } else {
        this.timeDisplay.textContent = '🌙 NIGHT';
        this.timeDisplay.style.color = '#00e5ff';
      }
    }
  }

  showWaveBanner(wave, isDay = true) {
    if (!this.waveBanner) return;
    if (this.waveNumberBanner) this.waveNumberBanner.textContent = wave;
    if (this.waveSubtitleBanner) {
      this.waveSubtitleBanner.textContent = isDay ? 'SUNRISE - CLEAR VISIBILITY!' : 'NIGHTFALL - ZOMBIES ARE AGGRESSIVE!';
    }
    this.waveBanner.classList.add('show');
    setTimeout(() => {
      this.waveBanner.classList.remove('show');
    }, 2500);
  }

  showBossBanner(wave) {
    if (!this.waveBanner) return;
    if (this.waveNumberBanner) this.waveNumberBanner.textContent = wave;
    if (this.waveSubtitleBanner) {
      this.waveSubtitleBanner.textContent = '⚠️ WARNING: MEGA BOSS ABOMINATION HAS AWAKENED!';
    }
    this.waveBanner.classList.add('show');
    setTimeout(() => {
      this.waveBanner.classList.remove('show');
    }, 3500);
  }

  updateBossHp(bossZombie) {
    if (!this.bossHpContainer) return;
    if (bossZombie && bossZombie.hp > 0) {
      this.bossHpContainer.classList.remove('hidden');
      this.bossHpContainer.style.display = 'flex';
      const percent = Math.max(0, bossZombie.hp / bossZombie.maxHp);
      if (this.bossHpBar) {
        this.bossHpBar.style.width = `${percent * 100}%`;
      }
      if (this.bossNameDisplay) {
        this.bossNameDisplay.textContent = `MEGA BOSS - ABOMINATION (WAVE ${bossZombie.wave})`;
      }
    } else {
      this.bossHpContainer.classList.add('hidden');
      this.bossHpContainer.style.display = 'none';
    }
  }

  renderMinimap(player, zombies, weaponDrops, worldSize, bananas = [], peels = []) {
    if (!this.ctxMap || !this.minimapCanvas) return;
    const ctx = this.ctxMap;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Expanded Map Scale (World coordinates X[-65 to 145], Z[-65 to 65])
    const minX = -65, maxX = 145;
    const minZ = -65, maxZ = 65;
    const scaleX = w / (maxX - minX);
    const scaleY = h / (maxZ - minZ);

    const getMapX = (x) => (x - minX) * scaleX;
    const getMapY = (z) => (z - minZ) * scaleY;

    // Draw Zombies (Red dots)
    ctx.fillStyle = '#ff3366';
    for (const z of zombies) {
      const mx = getMapX(z.pos.x);
      const my = getMapY(z.pos.z);
      ctx.beginPath();
      ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Weapon Drops (Orange dots)
    ctx.fillStyle = '#ffaa00';
    for (const d of weaponDrops) {
      const mx = getMapX(d.mesh.position.x);
      const my = getMapY(d.mesh.position.z);
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Bananas (Bright Yellow dots)
    ctx.fillStyle = '#ffff00';
    for (const b of bananas) {
      const mx = getMapX(b.pos.x);
      const my = getMapY(b.pos.z);
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Banana Peel Traps (Golden Brown dots)
    ctx.fillStyle = '#e6b800';
    for (const p of peels) {
      const mx = getMapX(p.pos.x);
      const my = getMapY(p.pos.z);
      ctx.beginPath();
      ctx.arc(mx, my, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Player (Green dot with glow)
    const px = getMapX(player.pos.x);
    const py = getMapY(player.pos.z);
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
