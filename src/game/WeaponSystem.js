import * as THREE from 'three';

export const WEAPON_TYPES = {
  pistol: { id: 'pistol', key: '1', name: 'PISTOL', damage: 24, fireRate: 0.28, speed: 45, spread: 0.03, color: 0x00ff88, nameColor: '#00ff88' },
  shotgun: { id: 'shotgun', key: '2', name: 'SHOTGUN', damage: 18, fireRate: 0.7, speed: 40, spread: 0.16, pellets: 6, color: 0xffaa00, nameColor: '#ffaa00' },
  rifle: { id: 'rifle', key: '3', name: 'ASSAULT RIFLE', damage: 32, fireRate: 0.12, speed: 52, spread: 0.05, color: 0x00e5ff, nameColor: '#00e5ff' },
  smg: { id: 'smg', key: '4', name: 'SMG', damage: 16, fireRate: 0.07, speed: 42, spread: 0.1, color: 0xff00ff, nameColor: '#ff00ff' },
  sniper: { id: 'sniper', key: '5', name: 'PLASMA SNIPER', damage: 130, fireRate: 1.1, speed: 75, spread: 0.005, color: 0x3388ff, nameColor: '#3388ff' },
  minigun: { id: 'minigun', key: '6', name: 'MINIGUN', damage: 22, fireRate: 0.05, speed: 50, spread: 0.14, color: 0xffff00, nameColor: '#ffff00' },
  rpg: { id: 'rpg', key: '7', name: 'RPG ROCKET', damage: 180, fireRate: 1.4, speed: 32, spread: 0.02, color: 0xff4400, nameColor: '#ff4400', isRpg: true, aoeRadius: 5.5 },
  flamethrower: { id: 'flamethrower', key: '8', name: 'FLAMETHROWER', damage: 8, fireRate: 0.04, speed: 18, spread: 0.35, color: 0xff7700, nameColor: '#ff7700', isFlame: true }
};

export class WeaponSystem {
  constructor(scene, particles, audio) {
    this.scene = scene;
    this.particles = particles;
    this.audio = audio;
    this.bullets = [];
    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }

  getMouseWorldDirection(mouse, camera, playerPos) {
    const mouseNDC = new THREE.Vector2(
      (mouse.x / window.innerWidth) * 2 - 1,
      -(mouse.y / window.innerHeight) * 2 + 1
    );

    this.raycaster.setFromCamera(mouseNDC, camera);
    const target = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, target);

    if (!target) return new THREE.Vector3(0, 0, 1);

    const dir = new THREE.Vector3(target.x - playerPos.x, 0, target.z - playerPos.z);
    dir.normalize();
    return dir;
  }

  triggerExplosion(pos, radius, damage, zombies) {
    // 1. Particle Explosion FX
    this.particles.createExplosion(pos);

    // 2. Play Heavy Sound
    this.audio.playExplosion();

    // 3. AOE Damage to all Zombies in blast radius
    for (const z of zombies) {
      const dx = z.pos.x - pos.x;
      const dz = z.pos.z - pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= radius) {
        const falloff = 1 - (dist / radius) * 0.5;
        const blastDamage = Math.floor(damage * falloff);
        z.takeDamage(blastDamage);
        this.particles.createBloodSplat(new THREE.Vector3(z.pos.x, 0.7, z.pos.z), 0xff3366, 8);
      }
    }
  }

  shoot(player, mouse, camera, overrideAimDir = null, zombies = [], environment = null, cameraManager = null) {
    const now = performance.now() / 1000;
    const weaponData = WEAPON_TYPES[player.currentWeapon];
    if (!weaponData) return false;

    if (now - player.lastShotTime < weaponData.fireRate) return false;

    // Ammo Check
    if (player.ammo[player.currentWeapon] <= 0) return false;
    if (player.ammo[player.currentWeapon] !== Infinity) {
      player.ammo[player.currentWeapon]--;
    }

    player.lastShotTime = now;

    // Aim Vector
    let aimDir = overrideAimDir;
    if (!aimDir) {
      aimDir = this.getMouseWorldDirection(mouse, camera, player.pos);
    }

    // Muzzle flash origin
    const muzzlePos = new THREE.Vector3(player.pos.x, 0.55, player.pos.z).add(aimDir.clone().multiplyScalar(0.7));

    // Sound FX
    if (weaponData.id === 'rpg') {
      this.audio.playRpgLaunch();
    } else if (weaponData.id === 'flamethrower') {
      this.audio.playFlamethrower();
    } else {
      this.audio.playShoot(weaponData.id);
    }

    // 1. FLAMETHROWER CONE SPRAY
    if (weaponData.isFlame) {
      this.particles.createFlameStream(muzzlePos, aimDir);

      const coneRange = 7.5;
      for (const z of zombies) {
        const dx = z.pos.x - player.pos.x;
        const dz = z.pos.z - player.pos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist <= coneRange) {
          const zDir = new THREE.Vector3(dx, 0, dz).normalize();
          const dot = aimDir.dot(zDir);
          if (dot > 0.75) {
            z.takeDamage(weaponData.damage);
            this.particles.createBloodSplat(new THREE.Vector3(z.pos.x, 0.6, z.pos.z), 0xff4400, 3);
          }
        }
      }

      // Check Barrels in Flamethrower cone
      if (environment && environment.barrels) {
        for (const barrel of environment.barrels) {
          if (barrel.isExploded) continue;
          const bdx = barrel.pos.x - player.pos.x;
          const bdz = barrel.pos.z - player.pos.z;
          const bDist = Math.sqrt(bdx * bdx + bdz * bdz);
          if (bDist <= coneRange) {
            const bDir = new THREE.Vector3(bdx, 0, bdz).normalize();
            if (aimDir.dot(bDir) > 0.75) {
              barrel.takeDamage(weaponData.damage * 0.5);
              this.particles.createSparkle(barrel.pos, 0xffaa00, 2);
            }
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

  update(dt, environment, zombies, cameraManager = null, player = null) {
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

      // Check Explosive Barrel Direct Hit
      let barrelHit = false;
      if (environment && environment.barrels) {
        for (let k = environment.barrels.length - 1; k >= 0; k--) {
          const barrel = environment.barrels[k];
          if (barrel.isExploded) continue;

          const bdx = b.pos.x - barrel.pos.x;
          const bdz = b.pos.z - barrel.pos.z;
          const bDist = Math.sqrt(bdx * bdx + bdz * bdz);

          if (bDist < (barrel.radius + 0.3)) {
            barrelHit = true;
            if (b.isRpg) {
              this.triggerExplosion(b.pos, b.aoeRadius, b.damage, zombies);
              barrel.explode(this.particles, this.audio, zombies, cameraManager, player);
            } else {
              barrel.takeDamage(b.damage);
              this.audio.playHit();
              this.particles.createSparkle(b.pos, 0xffaa00, 5);
              if (barrel.hp <= 0) {
                barrel.explode(this.particles, this.audio, zombies, cameraManager, player);
              }
            }

            this.scene.remove(b.mesh);
            this.bullets.splice(i, 1);
            break;
          }
        }
      }
      if (barrelHit) continue;

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
