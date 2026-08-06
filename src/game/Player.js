import * as THREE from 'three';
import { WEAPON_TYPES } from './WeaponSystem';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.radius = 0.5;
    this.hp = 100;
    this.maxHp = 100;
    this.currentWeapon = 'pistol';
    this.ammo = {
      pistol: Infinity,
      shotgun: 24,
      rifle: 60,
      smg: 100,
      sniper: 12,
      minigun: 150,
      rpg: 8,
      flamethrower: 200
    };
    this.lastShotTime = 0;
    this.dashCooldown = 0;
    this.maxDashCooldown = 2.5; // seconds
    this.isDashing = false;
    this.dashTimer = 0;

    this.mesh = this.createPlayerMesh();
    this.scene.add(this.mesh);
  }

  createPlayerMesh() {
    const group = new THREE.Group();

    // Body Cylinder
    const bodyGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.85, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.5, metalness: 0.3 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.425;
    body.castShadow = true;
    group.add(body);

    // Armor Plate
    const chestGeo = new THREE.BoxGeometry(0.5, 0.4, 0.4);
    const chestMat = new THREE.MeshStandardMaterial({ color: 0x121a28, roughness: 0.6 });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.set(0, 0.45, 0.05);
    group.add(chest);

    // Head Sphere
    const headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, roughness: 0.3 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.0;
    head.castShadow = true;
    group.add(head);

    // Gun Model
    const gunGeo = new THREE.BoxGeometry(0.1, 0.1, 0.6);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x8a9bb8, roughness: 0.4 });
    const gun = new THREE.Mesh(gunGeo, gunMat);
    gun.position.set(0.25, 0.55, 0.35);
    group.add(gun);
    this.gunMesh = gun;

    // Selection Ring Underfoot
    const ringGeo = new THREE.RingGeometry(0.45, 0.52, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    return group;
  }

  update(dt, movement, inputManager, environment, particleSystem, audioSystem) {
    // Dash Cooldown
    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    }

    // Trigger Dash
    if (inputManager.consumeDash() && this.dashCooldown <= 0 && movement.isMoving) {
      this.isDashing = true;
      this.dashTimer = 0.18;
      this.dashCooldown = this.maxDashCooldown;
      particleSystem.createDashTrail(this.pos);
      audioSystem.playDash();
    }

    // Move Calculation
    if (movement.isMoving || this.isDashing) {
      let speed = 7.5;
      if (this.isDashing) {
        speed = 22.0;
        this.dashTimer -= dt;
        if (this.dashTimer <= 0) this.isDashing = false;
      }

      const moveDist = speed * dt;
      const targetX = this.pos.x + movement.dx * moveDist;
      const targetZ = this.pos.z + movement.dz * moveDist;

      // Wall Collision Detection
      const nextPos = new THREE.Vector3(targetX, 0, targetZ);
      if (!environment.checkCollision(nextPos, this.radius)) {
        this.pos.x = targetX;
        this.pos.z = targetZ;
      } else {
        // Try slide on X
        const slideX = new THREE.Vector3(targetX, 0, this.pos.z);
        if (!environment.checkCollision(slideX, this.radius)) {
          this.pos.x = targetX;
        } else {
          // Try slide on Z
          const slideZ = new THREE.Vector3(this.pos.x, 0, targetZ);
          if (!environment.checkCollision(slideZ, this.radius)) {
            this.pos.z = targetZ;
          }
        }
      }

      // World Boundary Bounds
      const bound = environment.worldSize - 2;
      this.pos.x = Math.max(-bound, Math.min(bound, this.pos.x));
      this.pos.z = Math.max(-bound, Math.min(bound, this.pos.z));

      this.mesh.position.copy(this.pos);
    }

    // Update Weapon Gun Color
    const wData = WEAPON_TYPES[this.currentWeapon];
    if (wData && this.gunMesh) {
      this.gunMesh.material.color.setHex(wData.color);
    }
  }

  rotateToFace(dir) {
    if (!dir) return;
    const angle = Math.atan2(dir.x, dir.z);
    this.mesh.rotation.y = angle;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }

  reset() {
    this.pos.set(0, 0, 0);
    this.hp = this.maxHp;
    this.currentWeapon = 'pistol';
    this.ammo = {
      pistol: Infinity,
      shotgun: 24,
      rifle: 60,
      smg: 100,
      sniper: 12,
      minigun: 150,
      rpg: 8,
      flamethrower: 200
    };
    this.dashCooldown = 0;
    this.isDashing = false;
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.y = 0;
  }
}
