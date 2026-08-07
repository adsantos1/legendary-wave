import * as THREE from 'three';
import { characterLoader } from './CharacterLoader';
import { AnimationManager } from './AnimationManager';

export class Zombie {
  constructor(scene, type, x, z, wave) {
    this.scene = scene;
    this.type = type;
    this.pos = new THREE.Vector3(x, 0, z);
    this.wave = wave;

    this.hitFlash = 0;
    this.animTime = Math.random() * 10;
    this.attackCooldown = 0;
    this.animManager = null;
    this.slipTimer = 0;

    this.setupStats();
    this.mesh = this.createMesh();
    this.mesh.position.copy(this.pos);
    this.scene.add(this.mesh);

    this.tryLoadGltfModel();
  }

  applySlip(duration = 3.5) {
    this.slipTimer = duration;
  }

  tryLoadGltfModel() {
    characterLoader.loadModel('/assets/zombie.glb')
      .then((gltf) => {
        this.scene.remove(this.mesh);
        this.mesh = gltf.scene;
        const scaleVal = this.type === 'boss' ? 2.6 : this.type === 'tank' ? 1.6 : this.type === 'runner' ? 0.85 : 1.0;
        this.mesh.scale.setScalar(scaleVal);
        this.mesh.position.copy(this.pos);
        this.scene.add(this.mesh);

        if (gltf.animations && gltf.animations.length > 0) {
          this.animManager = new AnimationManager(this.mesh, gltf.animations);
          this.animManager.play('run');
        }
      })
      .catch(() => {
        // High-Quality Low-Poly Procedural Zombie Active
      });
  }

  setupStats() {
    switch (this.type) {
      case 'boss':
        this.maxHp = 800 + this.wave * 200;
        this.speed = 1.4 + this.wave * 0.05;
        this.damage = 45 + this.wave * 8;
        this.radius = 1.4;
        this.skinColor = 0x990022; // Abomination Crimson
        this.clothColor = 0x110011;
        this.isBoss = true;
        this.smashCooldown = 5.0;
        this.chargeCooldown = 9.0;
        this.isCharging = false;
        this.chargeTimer = 0;
        break;

      case 'runner':
        this.maxHp = 30 + this.wave * 8;
        this.speed = 3.5 + this.wave * 0.15;
        this.damage = 10 + this.wave * 2;
        this.radius = 0.35;
        this.skinColor = 0xa33b24; // Crimson bloodied
        this.clothColor = 0x221111;
        break;

      case 'tank':
        this.maxHp = 150 + this.wave * 35;
        this.speed = 1.2 + this.wave * 0.05;
        this.damage = 30 + this.wave * 5;
        this.radius = 0.8;
        this.skinColor = 0x2d4d2d; // Dark brute green
        this.clothColor = 0x111e11;
        break;

      case 'spitter':
        this.maxHp = 45 + this.wave * 10;
        this.speed = 2.0 + this.wave * 0.1;
        this.damage = 15 + this.wave * 3;
        this.radius = 0.45;
        this.skinColor = 0x44aa22; // Toxic green
        this.clothColor = 0x1b3b1b;
        break;

      default: // walker
        this.maxHp = 50 + this.wave * 12;
        this.speed = 2.2 + this.wave * 0.1;
        this.damage = 14 + this.wave * 3;
        this.radius = 0.45;
        this.skinColor = 0x446633; // Decaying green
        this.clothColor = 0x2b332b;
        break;
    }
    this.hp = this.maxHp;
  }

  createMesh() {
    const group = new THREE.Group();
    const scale = this.type === 'boss' ? 2.6 : this.type === 'tank' ? 1.5 : this.type === 'runner' ? 0.85 : 1.0;

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ color: this.skinColor, roughness: 0.8 });
    const clothMat = new THREE.MeshStandardMaterial({ color: this.clothColor, roughness: 0.9 });
    const eyeColor = this.type === 'boss' ? 0xff0033 : this.type === 'spitter' ? 0x00ff00 : 0xff0000;
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });

    // --- TORSO ---
    const torsoGroup = new THREE.Group();
    torsoGroup.position.y = 0.5 * scale;
    group.add(torsoGroup);
    this.torsoGroup = torsoGroup;

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, 0.45 * scale, 0.28 * scale), clothMat);
    chest.castShadow = true;
    torsoGroup.add(chest);
    this.bodyMesh = chest;

    // --- HEAD ---
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.38 * scale;
    torsoGroup.add(headGroup);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18 * scale, 8, 8), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Glowing Eyes
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.038 * scale, 6, 6), eyeMat);
    leftEye.position.set(-0.07 * scale, 0.02 * scale, 0.14 * scale);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.038 * scale, 6, 6), eyeMat);
    rightEye.position.set(0.07 * scale, 0.02 * scale, 0.14 * scale);
    headGroup.add(rightEye);

    // --- ARMS ---
    const armGeo = new THREE.CylinderGeometry(0.06 * scale, 0.05 * scale, 0.45 * scale, 6);

    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.26 * scale, 0.15 * scale, 0);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.y = -0.2 * scale;
    leftArm.castShadow = true;
    leftArmGroup.add(leftArm);
    torsoGroup.add(leftArmGroup);
    this.leftArmGroup = leftArmGroup;

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.26 * scale, 0.15 * scale, 0);
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.y = -0.2 * scale;
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);
    torsoGroup.add(rightArmGroup);
    this.rightArmGroup = rightArmGroup;

    // --- LEGS ---
    const legGeo = new THREE.CylinderGeometry(0.07 * scale, 0.06 * scale, 0.48 * scale, 6);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.12 * scale, 0.25 * scale, 0);
    const leftLeg = new THREE.Mesh(legGeo, clothMat);
    leftLeg.position.y = -0.22 * scale;
    leftLeg.castShadow = true;
    leftLegGroup.add(leftLeg);
    group.add(leftLegGroup);
    this.leftLegGroup = leftLegGroup;

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.12 * scale, 0.25 * scale, 0);
    const rightLeg = new THREE.Mesh(legGeo, clothMat);
    rightLeg.position.y = -0.22 * scale;
    rightLeg.castShadow = true;
    rightLegGroup.add(rightLeg);
    group.add(rightLegGroup);
    this.rightLegGroup = rightLegGroup;

    // HP Bar Outer Box above head
    const hpBgGeo = new THREE.PlaneGeometry(0.7 * scale, 0.08 * scale);
    const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
    const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
    hpBg.position.set(0, 1.45 * scale, 0);
    group.add(hpBg);

    const hpFillGeo = new THREE.PlaneGeometry(0.68 * scale, 0.06 * scale);
    const hpFillMat = new THREE.MeshBasicMaterial({ color: this.type === 'boss' ? 0xff0055 : 0xff3366, side: THREE.DoubleSide });
    const hpFill = new THREE.Mesh(hpFillGeo, hpFillMat);
    hpFill.position.set(0, 1.45 * scale, 0.001);
    group.add(hpFill);
    this.hpFill = hpFill;
    this.scale = scale;

    return group;
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.hitFlash = 0.12;
  }

  update(dt, player, environment, audioSystem, particleSystem, cameraManager = null) {
    let effectiveSpeed = this.speed;

    // Slip slow & spin wobble physics
    if (this.slipTimer > 0) {
      this.slipTimer -= dt;
      effectiveSpeed *= 0.25; // 75% movement speed penalty while slipping!
      if (this.torsoGroup) {
        this.torsoGroup.rotation.y += dt * 14.0; // Comical slip spin!
      }
    }

    // --- MEGA BOSS SPECIAL ATTACK PHYSICS ---
    if (this.isBoss && cameraManager) {
      // 1. Ground Pound Smash (Shockwave Ring & Knockback)
      this.smashCooldown -= dt;
      if (this.smashCooldown <= 0) {
        this.smashCooldown = 7.5;
        audioSystem.playExplosion();
        particleSystem.createExplosion(this.pos);
        cameraManager.addShake(0.65);

        // AOE Damage to player if nearby
        const pdx = player.pos.x - this.pos.x;
        const pdz = player.pos.z - this.pos.z;
        const pDist = Math.sqrt(pdx * pdx + pdz * pdz);
        if (pDist < 7.5) {
          player.takeDamage(35);
          particleSystem.createBloodSplat(new THREE.Vector3(player.pos.x, 0.5, player.pos.z), 0xff3366, 12);
        }
      }

      // 2. Berserker Charge Rush
      this.chargeCooldown -= dt;
      if (this.chargeCooldown <= 0 && !this.isCharging) {
        this.chargeCooldown = 11.0;
        this.isCharging = true;
        this.chargeTimer = 1.8;
      }

      if (this.isCharging) {
        this.chargeTimer -= dt;
        effectiveSpeed *= 3.5; // High speed rush charge!
        particleSystem.createSparkle(this.pos, 0xff0033, 4);

        if (this.chargeTimer <= 0) {
          this.isCharging = false;
        }
      }
    }

    this.animTime += dt * (effectiveSpeed * 4);

    // Movement toward player
    const dx = player.pos.x - this.pos.x;
    const dz = player.pos.z - this.pos.z;
    const distToPlayer = Math.sqrt(dx * dx + dz * dz);

    if (distToPlayer > 0.9) {
      const angle = Math.atan2(dx, dz);
      const moveSpeed = effectiveSpeed * dt;
      const targetX = this.pos.x + Math.sin(angle) * moveSpeed;
      const targetZ = this.pos.z + Math.cos(angle) * moveSpeed;

      const nextPos = new THREE.Vector3(targetX, 0, targetZ);
      if (!environment.checkCollision(nextPos, this.radius)) {
        this.pos.x = targetX;
        this.pos.z = targetZ;
      }

      this.mesh.position.copy(this.pos);
      this.mesh.lookAt(player.pos.x, 0, player.pos.z);

      // --- ZOMBIE LUNGE RUNNING ANIMATION PHYSICS ---
      const stride = Math.sin(this.animTime);

      if (this.leftLegGroup && this.rightLegGroup) {
        this.leftLegGroup.rotation.x = stride * 0.65;
        this.rightLegGroup.rotation.x = -stride * 0.65;
      }

      if (this.leftArmGroup && this.rightArmGroup) {
        this.leftArmGroup.rotation.x = -Math.PI / 3.5 + stride * 0.3;
        this.rightArmGroup.rotation.x = -Math.PI / 3.5 - stride * 0.3;
      }

      if (this.torsoGroup) {
        this.torsoGroup.rotation.z = Math.sin(this.animTime * 0.5) * 0.08; // Zombie gait sway
      }
    }

    // Update GLTF Skeletal Animation (if glb model loaded)
    if (this.animManager) {
      this.animManager.update(dt);
    }

    // Attack Player
    if (distToPlayer < (0.9 + this.radius)) {
      if (this.attackCooldown <= 0) {
        player.takeDamage(this.damage);
        this.attackCooldown = 1.2;
        audioSystem.playDamage();
        particleSystem.createBloodSplat(new THREE.Vector3(player.pos.x, 0.5, player.pos.z), 0xff3366, 6);
      }
    }
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // Hit Flash FX
    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      if (this.bodyMesh && this.bodyMesh.material) {
        this.bodyMesh.material.emissive.setHex(0xffffff);
        this.bodyMesh.material.emissiveIntensity = 0.6;
      }
    } else {
      if (this.bodyMesh && this.bodyMesh.material) {
        this.bodyMesh.material.emissive.setHex(0x000000);
        this.bodyMesh.material.emissiveIntensity = 0;
      }
    }

    // HP Bar Update
    if (this.hpFill) {
      const hpPercent = Math.max(0, this.hp / this.maxHp);
      this.hpFill.scale.x = hpPercent;
      this.hpFill.position.x = -0.34 * this.scale * (1 - hpPercent);
    }
  }

  destroy() {
    this.scene.remove(this.mesh);
  }
}

export class ZombieManager {
  constructor(scene) {
    this.scene = scene;
    this.zombies = [];
    this.spawnTimer = 0;
    this.activeBoss = null;
    this.bossSpawnedForWave = 0;
  }

  spawnZombie(playerPos, wave, worldSize) {
    const types = ['walker', 'walker', 'runner', 'spitter'];
    if (wave >= 3) types.push('tank');

    const type = types[Math.floor(Math.random() * types.length)];
    const angle = Math.random() * Math.PI * 2;
    const dist = 28 + Math.random() * 30;

    let spawnX = playerPos.x + Math.cos(angle) * dist;
    let spawnZ = playerPos.z + Math.sin(angle) * dist;

    const bound = worldSize - 5;
    spawnX = Math.max(-bound, Math.min(bound, spawnX));
    spawnZ = Math.max(-bound, Math.min(bound, spawnZ));

    const zombie = new Zombie(this.scene, type, spawnX, spawnZ, wave);
    this.zombies.push(zombie);
  }

  spawnBoss(playerPos, wave, worldSize, ui) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 26;

    let spawnX = playerPos.x + Math.cos(angle) * dist;
    let spawnZ = playerPos.z + Math.sin(angle) * dist;

    const bound = worldSize - 6;
    spawnX = Math.max(-bound, Math.min(bound, spawnX));
    spawnZ = Math.max(-bound, Math.min(bound, spawnZ));

    const boss = new Zombie(this.scene, 'boss', spawnX, spawnZ, wave);
    this.zombies.push(boss);
    this.activeBoss = boss;

    if (ui) {
      ui.showBossBanner(wave);
    }
  }

  update(dt, player, environment, audioSystem, particleSystem, wave, worldSize, cameraManager = null, ui = null) {
    // Check Wave Boss Spawn Condition (Spawns on Wave 5, 10, 15...)
    if (wave % 5 === 0 && this.bossSpawnedForWave !== wave && (!this.activeBoss || this.activeBoss.hp <= 0)) {
      this.bossSpawnedForWave = wave;
      this.spawnBoss(player.pos, wave, worldSize, ui);
    }

    // Update Boss HUD Health Bar
    if (ui) {
      ui.updateBossHp(this.activeBoss);
    }

    // Spawning logic for regular horde zombies (Balanced for tactical RPG maneuverability)
    const maxActiveZombies = Math.min(22, 6 + wave * 3); // Max active cap per wave (e.g. Wave 1: 9, Wave 3: 15, Wave 5: 21)
    if (this.zombies.length < maxActiveZombies) {
      this.spawnTimer += dt;
      const spawnRate = Math.max(1.2, 3.2 - wave * 0.15);
      if (this.spawnTimer > spawnRate) {
        this.spawnTimer = 0;
        const count = wave >= 6 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          if (this.zombies.length < maxActiveZombies) {
            this.spawnZombie(player.pos, wave, worldSize);
          }
        }
      }
    }

    // Update existing zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.update(dt, player, environment, audioSystem, particleSystem, cameraManager);

      if (z.hp <= 0) {
        particleSystem.createBloodSplat(new THREE.Vector3(z.pos.x, 0.5, z.pos.z), 0x8b0000, 10);
        audioSystem.playZombieDeath();

        const isBossKilled = z.isBoss;
        if (isBossKilled) {
          this.activeBoss = null;
        }

        z.destroy();
        this.zombies.splice(i, 1);
        return {
          killed: true,
          score: isBossKilled ? 500 + wave * 50 : 20 + wave * 5,
          type: z.type
        };
      }
    }
    return null;
  }

  clear() {
    for (const z of this.zombies) {
      z.destroy();
    }
    this.zombies = [];
    this.activeBoss = null;
    this.bossSpawnedForWave = 0;
  }
}
