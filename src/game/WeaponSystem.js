import * as THREE from 'three';

export const WEAPON_TYPES = {
  pistol: { id: 'pistol', name: 'Pistol', ammo: Infinity, maxAmmo: Infinity, fireRate: 260, damage: 28, spread: 0.02, speed: 55, color: 0x00ff88, key: 1 },
  shotgun: { id: 'shotgun', name: 'Shotgun', ammo: 24, maxAmmo: 24, fireRate: 850, damage: 16, pellets: 7, spread: 0.14, speed: 45, color: 0xffaa00, key: 2 },
  rifle: { id: 'rifle', name: 'Assault Rifle', ammo: 60, maxAmmo: 60, fireRate: 130, damage: 36, spread: 0.015, speed: 65, color: 0x00e5ff, key: 3 },
  smg: { id: 'smg', name: 'SMG', ammo: 100, maxAmmo: 100, fireRate: 90, damage: 14, spread: 0.06, speed: 50, color: 0xa855f7, key: 4 },
  sniper: { id: 'sniper', name: 'Plasma Sniper', ammo: 12, maxAmmo: 12, fireRate: 1300, damage: 120, spread: 0.0, speed: 90, color: 0xff3366, key: 5 },
  minigun: { id: 'minigun', name: 'Minigun', ammo: 150, maxAmmo: 150, fireRate: 65, damage: 18, spread: 0.08, speed: 58, color: 0xffff00, key: 6 },
  rpg: { id: 'rpg', name: 'RPG Rocket', ammo: 8, maxAmmo: 8, fireRate: 1400, damage: 180, aoeRadius: 5.5, spread: 0.01, speed: 38, color: 0xff5500, key: 7 },
  flamethrower: { id: 'flamethrower', name: 'Flamethrower', ammo: 200, maxAmmo: 200, fireRate: 45, damage: 10, spread: 0.22, speed: 28, color: 0xff4400, key: 8 }
};

export class WeaponSystem {
  constructor(scene, audioSystem, particleSystem) {
    this.scene = scene;
    this.audio = audioSystem;
    this.particles = particleSystem;
    this.bullets = [];
    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }

  getMouseWorldDirection(mouseScreen, camera, playerPos) {
    this.mouseNDC.x = (mouseScreen.x / window.innerWidth) * 2 - 1;
    this.mouseNDC.y = -(mouseScreen.y / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseNDC, camera);
    const target = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, target);

    if (!target) return new THREE.Vector3(0, 0, 1);

    const dir = new THREE.Vector3(target.x - playerPos.x, 0, target.z - playerPos.z);
    dir.normalize();
    return dir;
  }

  triggerExplosion(pos, radius, damage, zombies) {
    this.particles.createExplosion(pos, radius);
    this.audio.playExplosion();

    // Damage all zombies within radius
    for (const z of zombies) {
      const dx = z.pos.x - pos.x;
      const dz = z.pos.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= radius + z.radius) {
        // Falloff damage calculation based on distance from epicenter
        const factor = Math.max(0.4, 1 - (dist / radius));
        const finalDamage = Math.round(damage * factor);
        z.takeDamage(finalDamage);
        this.particles.createBloodSplat(new THREE.Vector3(z.pos.x, 0.7, z.pos.z), 0x8b0000, 6);
      }
    }
  }

  shoot(player, mouseScreen, camera, overrideAimDir = null, zombies = []) {
    const now = Date.now();
    const weaponData = WEAPON_TYPES[player.currentWeapon];
    if (!weaponData) return false;

    if (now - player.lastShotTime < weaponData.fireRate) return false;
    if (player.ammo[player.currentWeapon] <= 0 && player.ammo[player.currentWeapon] !== Infinity) return false;

    player.lastShotTime = now;
    if (player.ammo[player.currentWeapon] !== Infinity) {
      player.ammo[player.currentWeapon]--;
    }

    const aimDir = overrideAimDir || this.getMouseWorldDirection(mouseScreen, camera, player.pos);
    const muzzlePos = new THREE.Vector3(player.pos.x, 0.6, player.pos.z).add(aimDir.clone().multiplyScalar(0.6));

    this.audio.playShoot(weaponData.id);

    // 1. FLAMETHROWER SPECIAL SHOOTING LOGIC
    if (weaponData.id === 'flamethrower') {
      this.particles.createFlameStream(muzzlePos, aimDir);

      // Damage all zombies in a cone in front of player
      const coneRange = 7.5;
      for (const z of zombies) {
        const dx = z.pos.x - player.pos.x;
        const dz = z.pos.z - player.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist <= coneRange) {
          const zDir = new THREE.Vector3(dx, 0, dz).normalize();
          const dot = aimDir.dot(zDir);
          if (dot > 0.75) { // ~40 degree cone
            z.takeDamage(weaponData.damage);
            this.particles.createBloodSplat(new THREE.Vector3(z.pos.x, 0.6, z.pos.z), 0xff4400, 3);
          }
        }
      }
      return true;
    }

    // 2. STANDARD & RPG / SNIPER / SHOTGUN PROJECTILES
    this.particles.createMuzzleFlash(muzzlePos, weaponData.color);
    const pellets = weaponData.pellets || 1;

    for (let i = 0; i < pellets; i++) {
      const spreadAngle = (Math.random() - 0.5) * weaponData.spread * 2;
      const cos = Math.cos(spreadAngle);
      const sin = Math.sin(spreadAngle);

      const dir = new THREE.Vector3(
        aimDir.x * cos - aimDir.z * sin,
        0,
        aimDir.x * sin + aimDir.z * cos
      );

      let bulletMesh;

      if (weaponData.id === 'rpg') {
        // Rocket mesh model
        const group = new THREE.Group();
        const rocketGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
        const rocketMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.3 });
        const rocket = new THREE.Mesh(rocketGeo, rocketMat);
        rocket.rotation.x = Math.PI / 2;
        group.add(rocket);

        const tailGeo = new THREE.ConeGeometry(0.12, 0.2, 8);
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const tail = new THREE.Mesh(tailGeo, tailMat);
        tail.rotation.x = -Math.PI / 2;
        tail.position.z = -0.3;
        group.add(tail);

        bulletMesh = group;
      } else {
        const bulletGeo = new THREE.SphereGeometry(weaponData.id === 'sniper' ? 0.08 : 0.05, 6, 6);
        const bulletMat = new THREE.MeshBasicMaterial({ color: weaponData.color });
        bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
      }

      const startPos = new THREE.Vector3(player.pos.x, 0.55, player.pos.z).add(dir.clone().multiplyScalar(0.6));
      bulletMesh.position.copy(startPos);
      bulletMesh.lookAt(startPos.clone().add(dir));
      this.scene.add(bulletMesh);

      this.bullets.push({
        mesh: bulletMesh,
        pos: startPos.clone(),
        dir,
        speed: weaponData.speed,
        damage: weaponData.damage,
        isRpg: weaponData.id === 'rpg',
        aoeRadius: weaponData.aoeRadius || 0,
        color: weaponData.color,
        life: 2.5,
        distTraveled: 0
      });
    }

    return true;
  }

  update(dt, environment, zombies) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.dir.x * b.speed * dt;
      b.pos.z += b.dir.z * b.speed * dt;
      b.mesh.position.copy(b.pos);
      b.distTraveled += b.speed * dt;
      b.life -= dt;

      // Rocket Trail FX
      if (b.isRpg) {
        this.particles.createSparkle(b.pos, 0xff7700, 2);
      }

      // Check Wall Hit
      if (environment.checkCollision(b.pos, 0.15) || b.life <= 0 || b.distTraveled > 90) {
        if (b.isRpg) {
          this.triggerExplosion(b.pos, b.aoeRadius, b.damage, zombies);
        } else {
          this.particles.createSparkle(b.pos, b.color, 4);
        }
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
        continue;
      }

      // Check Zombie Direct Hit
      let hit = false;
      for (let j = zombies.length - 1; j >= 0; j--) {
        const z = zombies[j];
        const dx = b.pos.x - z.pos.x;
        const dz = b.pos.z - z.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < z.radius + 0.28) {
          hit = true;
          if (b.isRpg) {
            this.triggerExplosion(b.pos, b.aoeRadius, b.damage, zombies);
          } else {
            z.takeDamage(b.damage);
            this.audio.playHit();
            this.particles.createBloodSplat(new THREE.Vector3(z.pos.x, 0.7, z.pos.z), 0x44ff44, 5);
          }

          this.scene.remove(b.mesh);
          this.bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  clear() {
    for (const b of this.bullets) {
      this.scene.remove(b.mesh);
    }
    this.bullets = [];
  }
}
