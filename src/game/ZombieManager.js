import * as THREE from 'three';

export class Zombie {
  constructor(scene, type, x, z, wave) {
    this.scene = scene;
    this.type = type;
    this.pos = new THREE.Vector3(x, 0, z);
    this.wave = wave;

    this.hitFlash = 0;
    this.animTime = Math.random() * 10;
    this.attackCooldown = 0;

    this.setupStats();
    this.mesh = this.createMesh();
    this.mesh.position.copy(this.pos);
    this.scene.add(this.mesh);
  }

  setupStats() {
    switch (this.type) {
      case 'runner':
        this.maxHp = 30 + this.wave * 8;
        this.speed = 3.5 + this.wave * 0.15;
        this.damage = 10 + this.wave * 2;
        this.radius = 0.35;
        this.color = 0xa33b24;
        break;

      case 'tank':
        this.maxHp = 150 + this.wave * 35;
        this.speed = 1.2 + this.wave * 0.05;
        this.damage = 30 + this.wave * 5;
        this.radius = 0.8;
        this.color = 0x2d4d2d;
        break;

      case 'spitter':
        this.maxHp = 45 + this.wave * 10;
        this.speed = 2.0 + this.wave * 0.1;
        this.damage = 15 + this.wave * 3;
        this.radius = 0.45;
        this.color = 0x66ff00;
        break;

      default: // walker
        this.maxHp = 50 + this.wave * 12;
        this.speed = 2.2 + this.wave * 0.1;
        this.damage = 14 + this.wave * 3;
        this.radius = 0.45;
        this.color = 0x446633;
        break;
    }
    this.hp = this.maxHp;
  }

  createMesh() {
    const group = new THREE.Group();
    const scale = this.type === 'tank' ? 1.6 : this.type === 'runner' ? 0.85 : 1.0;

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.25 * scale, 0.3 * scale, 0.9 * scale, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: this.color, roughness: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.45 * scale;
    body.castShadow = true;
    group.add(body);
    this.bodyMesh = body;

    // Head
    const headGeo = new THREE.SphereGeometry(0.22 * scale, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: this.color });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.05 * scale;
    head.castShadow = true;
    group.add(head);

    // Glowing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.04 * scale, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: this.type === 'spitter' ? 0x00ff00 : 0xff0000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08 * scale, 1.08 * scale, 0.16 * scale);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08 * scale, 1.08 * scale, 0.16 * scale);
    group.add(rightEye);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.1 * scale, 0.6 * scale, 0.1 * scale);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.32 * scale, 0.5 * scale, 0);
    group.add(leftArm);
    this.leftArm = leftArm;

    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.32 * scale, 0.5 * scale, 0);
    group.add(rightArm);
    this.rightArm = rightArm;

    // HP Bar Floating Above
    const hpBgGeo = new THREE.PlaneGeometry(0.7 * scale, 0.08 * scale);
    const hpBgMat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide });
    const hpBg = new THREE.Mesh(hpBgGeo, hpBgMat);
    hpBg.position.set(0, 1.45 * scale, 0);
    group.add(hpBg);

    const hpFillGeo = new THREE.PlaneGeometry(0.68 * scale, 0.06 * scale);
    const hpFillMat = new THREE.MeshBasicMaterial({ color: 0xff3366, side: THREE.DoubleSide });
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

  update(dt, player, environment, audioSystem, particleSystem) {
    this.animTime += dt * 5;

    // Movement toward player
    const dx = player.pos.x - this.pos.x;
    const dz = player.pos.z - this.pos.z;
    const distToPlayer = Math.sqrt(dx * dx + dz * dz);

    if (distToPlayer > 0.9) {
      const angle = Math.atan2(dx, dz);
      const moveSpeed = this.speed * dt;
      const targetX = this.pos.x + Math.sin(angle) * moveSpeed;
      const targetZ = this.pos.z + Math.cos(angle) * moveSpeed;

      const nextPos = new THREE.Vector3(targetX, 0, targetZ);
      if (!environment.checkCollision(nextPos, this.radius)) {
        this.pos.x = targetX;
        this.pos.z = targetZ;
      }

      this.mesh.position.copy(this.pos);
      this.mesh.lookAt(player.pos.x, 0, player.pos.z);

      // Walk animation
      if (this.leftArm && this.rightArm) {
        this.leftArm.rotation.x = Math.sin(this.animTime) * 0.4;
        this.rightArm.rotation.x = -Math.sin(this.animTime) * 0.4;
      }
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
      this.bodyMesh.material.emissive.setHex(0xffffff);
      this.bodyMesh.material.emissiveIntensity = 0.6;
    } else {
      this.bodyMesh.material.emissive.setHex(0x000000);
      this.bodyMesh.material.emissiveIntensity = 0;
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

  update(dt, player, environment, audioSystem, particleSystem, wave, worldSize) {
    // Spawning logic
    this.spawnTimer += dt;
    const spawnRate = Math.max(0.4, 2.5 - wave * 0.12);
    if (this.spawnTimer > spawnRate) {
      this.spawnTimer = 0;
      const count = 1 + Math.floor(wave / 2);
      for (let i = 0; i < count; i++) {
        this.spawnZombie(player.pos, wave, worldSize);
      }
    }

    // Update existing zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.update(dt, player, environment, audioSystem, particleSystem);

      if (z.hp <= 0) {
        particleSystem.createBloodSplat(new THREE.Vector3(z.pos.x, 0.5, z.pos.z), 0x8b0000, 10);
        audioSystem.playZombieDeath();
        z.destroy();
        this.zombies.splice(i, 1);
        return { killed: true, score: 20 + wave * 5, type: z.type };
      }
    }
    return null;
  }

  clear() {
    for (const z of this.zombies) {
      z.destroy();
    }
    this.zombies = [];
  }
}
