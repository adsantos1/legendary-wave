import * as THREE from 'three';
import { WEAPON_TYPES } from './WeaponSystem';
import { characterLoader } from './CharacterLoader';
import { AnimationManager } from './AnimationManager';

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
    this.bananaInventory = 3;
    this.lastShotTime = 0;
    this.dashCooldown = 0;
    this.maxDashCooldown = 2.5; // seconds
    this.isDashing = false;
    this.dashTimer = 0;
    this.animTime = 0;

    this.animManager = null;
    this.mesh = this.createPlayerMesh();
    this.scene.add(this.mesh);

    this.tryLoadGltfModel();
  }

  tryLoadGltfModel() {
    characterLoader.loadModel('/assets/survivor.glb')
      .then((gltf) => {
        this.scene.remove(this.mesh);
        this.mesh = gltf.scene;

        const ringGeo = new THREE.RingGeometry(0.45, 0.52, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        this.mesh.add(ring);

        this.scene.add(this.mesh);

        if (gltf.animations && gltf.animations.length > 0) {
          this.animManager = new AnimationManager(this.mesh, gltf.animations);
          this.animManager.play('idle');
        }
      })
      .catch(() => {
        // High-Quality Low-Poly Procedural Hero Active
      });
  }

  createPlayerMesh() {
    const group = new THREE.Group();

    // Materials
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.4 }); // Dark Kevlar
    const suitMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.6 }); // Tactical Teal Uniform
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 0.6 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.6 });

    // --- TORSO GROUP ---
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.55;
    group.add(torsoGroup);
    this.torsoGroup = torsoGroup;

    // Chest & Vest
    const chestGeo = new THREE.BoxGeometry(0.48, 0.45, 0.32);
    const chest = new THREE.Mesh(chestGeo, suitMat);
    chest.castShadow = true;
    torsoGroup.add(chest);

    const vestGeo = new THREE.BoxGeometry(0.52, 0.38, 0.36);
    const vest = new THREE.Mesh(vestGeo, armorMat);
    vest.position.set(0, 0.02, 0.01);
    vest.castShadow = true;
    torsoGroup.add(vest);

    // Tactical Pouches on Belt
    for (let i = -1; i <= 1; i += 2) {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), armorMat);
      pouch.position.set(i * 0.18, -0.2, 0.18);
      torsoGroup.add(pouch);
    }

    // Tactical Backpack
    const packGeo = new THREE.BoxGeometry(0.36, 0.4, 0.18);
    const backpack = new THREE.Mesh(packGeo, armorMat);
    backpack.position.set(0, 0.04, -0.22);
    backpack.castShadow = true;
    torsoGroup.add(backpack);

    // --- HEAD GROUP ---
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.38;
    torsoGroup.add(headGroup);

    // Head Sphere & Tactical Helmet
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), skinMat);
    headGroup.add(head);

    const helmetGeo = new THREE.SphereGeometry(0.19, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.65);
    const helmet = new THREE.Mesh(helmetGeo, armorMat);
    helmet.position.y = 0.02;
    helmet.castShadow = true;
    headGroup.add(helmet);

    // Sci-Fi Visor Band
    const visorGeo = new THREE.BoxGeometry(0.26, 0.08, 0.12);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.02, 0.13);
    headGroup.add(visor);

    // --- ARMS (Jointed for Animation) ---
    // Left Arm Group
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.32, 0.18, 0);
    torsoGroup.add(leftArmGroup);
    this.leftArmGroup = leftArmGroup;

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.12), suitMat);
    leftArm.position.y = -0.18;
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);

    const leftShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), armorMat);
    leftShoulder.position.set(0, 0.02, 0);
    leftArmGroup.add(leftShoulder);

    // Right Arm Group (Holding Weapon)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.32, 0.18, 0);
    torsoGroup.add(rightArmGroup);
    this.rightArmGroup = rightArmGroup;

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.42, 0.12), suitMat);
    rightArm.position.y = -0.18;
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);

    const rightShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), armorMat);
    rightShoulder.position.set(0, 0.02, 0);
    rightArmGroup.add(rightShoulder);

    // --- DETAILED 3D WEAPON MODEL ---
    const gunGroup = new THREE.Group();
    gunGroup.position.set(0, -0.28, 0.25);
    rightArmGroup.add(gunGroup);

    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.55), gunMat);
    gunGroup.add(gunBody);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8), gunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.35);
    gunGroup.add(barrel);

    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.08), armorMat);
    mag.position.set(0, -0.12, 0.05);
    gunGroup.add(mag);
    this.gunMesh = gunBody;

    // --- LEGS (Jointed for Running Animation) ---
    // Left Leg Group
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.16, 0.32, 0);
    group.add(leftLegGroup);
    this.leftLegGroup = leftLegGroup;

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.14), suitMat);
    leftLeg.position.y = -0.16;
    leftLeg.castShadow = true;
    leftLegGroup.add(leftLeg);

    const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.22), bootMat);
    leftBoot.position.set(0, -0.32, 0.03);
    leftBoot.castShadow = true;
    leftLegGroup.add(leftBoot);

    // Right Leg Group
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.16, 0.32, 0);
    group.add(rightLegGroup);
    this.rightLegGroup = rightLegGroup;

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.38, 0.14), suitMat);
    rightLeg.position.y = -0.16;
    rightLeg.castShadow = true;
    rightLegGroup.add(rightLeg);

    const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.22), bootMat);
    rightBoot.position.set(0, -0.32, 0.03);
    rightBoot.castShadow = true;
    rightLegGroup.add(rightBoot);

    // Selection Halo underfoot
    const ringGeo = new THREE.RingGeometry(0.48, 0.56, 24);
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

    // Move Calculation & Running Animation
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
        const slideX = new THREE.Vector3(targetX, 0, this.pos.z);
        if (!environment.checkCollision(slideX, this.radius)) {
          this.pos.x = targetX;
        } else {
          const slideZ = new THREE.Vector3(this.pos.x, 0, targetZ);
          if (!environment.checkCollision(slideZ, this.radius)) {
            this.pos.z = targetZ;
          }
        }
      }

      const bound = environment.worldSize - 2;
      this.pos.x = Math.max(-bound, Math.min(bound, this.pos.x));
      this.pos.z = Math.max(-bound, Math.min(bound, this.pos.z));

      this.mesh.position.copy(this.pos);

      // --- RUNNING LIMB ANIMATION PHYSICS ---
      this.animTime += dt * (this.isDashing ? 18 : 12);
      const stride = Math.sin(this.animTime);

      if (this.leftLegGroup && this.rightLegGroup) {
        this.leftLegGroup.rotation.x = stride * 0.7;
        this.rightLegGroup.rotation.x = -stride * 0.7;
      }

      if (this.leftArmGroup && this.rightArmGroup) {
        this.leftArmGroup.rotation.x = -stride * 0.5;
        this.rightArmGroup.rotation.x = stride * 0.25; // Keeps weapon aiming forward
      }

      if (this.torsoGroup) {
        this.torsoGroup.position.y = 0.55 + Math.abs(Math.sin(this.animTime * 2)) * 0.05; // Torso run bounce
      }

      if (this.animManager) {
        this.animManager.play(this.isDashing ? 'sprint' : 'run');
      }
    } else {
      // --- IDLE ANIMATION ---
      this.animTime += dt * 3;
      const breath = Math.sin(this.animTime) * 0.02;

      if (this.leftLegGroup && this.rightLegGroup) {
        this.leftLegGroup.rotation.x = THREE.MathUtils.lerp(this.leftLegGroup.rotation.x, 0, 0.15);
        this.rightLegGroup.rotation.x = THREE.MathUtils.lerp(this.rightLegGroup.rotation.x, 0, 0.15);
      }

      if (this.leftArmGroup && this.rightArmGroup) {
        this.leftArmGroup.rotation.x = THREE.MathUtils.lerp(this.leftArmGroup.rotation.x, 0, 0.15);
        this.rightArmGroup.rotation.x = THREE.MathUtils.lerp(this.rightArmGroup.rotation.x, 0, 0.15);
      }

      if (this.torsoGroup) {
        this.torsoGroup.position.y = 0.55 + breath;
      }

      if (this.animManager) {
        this.animManager.play('idle');
      }
    }

    // Update Skeletal Animation Mixer
    if (this.animManager) {
      this.animManager.update(dt);
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
    this.bananaInventory = 3;
    this.dashCooldown = 0;
    this.isDashing = false;
    this.mesh.position.set(0, 0, 0);
    this.mesh.rotation.y = 0;

    if (this.animManager) {
      this.animManager.play('idle');
    }
  }
}
