import * as THREE from 'three';

export class BananaConsumable {
  constructor(scene, x, z) {
    this.scene = scene;
    this.pos = new THREE.Vector3(x, 0.4, z);
    this.pulse = Math.random() * Math.PI * 2;
    this.isEaten = false;

    this.group = new THREE.Group();
    this.group.position.copy(this.pos);

    // 3D Banana Model (Curved composite geometry)
    const bananaMat = new THREE.MeshStandardMaterial({ color: 0xffdd00, roughness: 0.3, metalness: 0.1 });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x55aa22, roughness: 0.5 });

    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.7, 8);
    const body = new THREE.Mesh(bodyGeo, bananaMat);
    body.rotation.z = Math.PI / 6;
    body.castShadow = true;
    this.group.add(body);

    const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.18, 6);
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.set(-0.15, 0.35, 0);
    this.group.add(stem);

    // Yellow glowing light indicator
    this.light = new THREE.PointLight(0xffdd00, 1.2, 6);
    this.light.position.y = 0.5;
    this.group.add(this.light);

    this.scene.add(this.group);
  }

  update(dt) {
    this.pulse += dt * 3.0;
    this.group.rotation.y += dt * 2.0;
    this.group.position.y = 0.4 + Math.sin(this.pulse) * 0.12;
    this.light.intensity = 1.0 + Math.sin(this.pulse * 2) * 0.5;
  }

  destroy() {
    this.scene.remove(this.group);
  }
}

export class BananaPeelTrap {
  constructor(scene, x, z) {
    this.scene = scene;
    this.pos = new THREE.Vector3(x, 0.04, z);
    this.isTriggered = false;

    this.group = new THREE.Group();
    this.group.position.copy(this.pos);

    const peelMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4 });
    const innerMat = new THREE.MeshStandardMaterial({ color: 0xfffae0, roughness: 0.6 });

    // Center core
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 8), peelMat);
    this.group.add(center);

    // 3 Curved Peel Flaps spreading flat on floor
    for (let i = 0; i < 3; i++) {
      const flapAngle = (i * Math.PI * 2) / 3;
      const flapGroup = new THREE.Group();
      flapGroup.rotation.y = flapAngle;

      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.6), peelMat);
      flap.position.set(0, 0.015, 0.3);
      flap.rotation.x = -Math.PI / 16;
      flapGroup.add(flap);

      const innerFlap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.55), innerMat);
      innerFlap.position.set(0, 0.02, 0.3);
      innerFlap.rotation.x = -Math.PI / 16;
      flapGroup.add(innerFlap);

      this.group.add(flapGroup);
    }

    this.scene.add(this.group);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}

export class BananaSystem {
  constructor(scene, worldSize) {
    this.scene = scene;
    this.worldSize = worldSize;
    this.bananas = [];
    this.peels = [];
    this.spawnTimer = 0;

    // Initial banana drops at map start
    this.spawnInitialBananas();
  }

  spawnInitialBananas() {
    const coords = [
      { x: -12, z: 8 },
      { x: 15, z: -10 },
      { x: 8, z: 18 },
      { x: -20, z: -15 }
    ];
    for (const c of coords) {
      this.bananas.push(new BananaConsumable(this.scene, c.x, c.z));
    }
  }

  spawnRandomBanana(playerPos) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 22;
    const px = Math.max(-this.worldSize + 6, Math.min(this.worldSize - 6, playerPos.x + Math.cos(angle) * dist));
    const pz = Math.max(-this.worldSize + 6, Math.min(this.worldSize - 6, playerPos.z + Math.sin(angle) * dist));

    this.bananas.push(new BananaConsumable(this.scene, px, pz));
  }

  dropPeel(x, z) {
    this.peels.push(new BananaPeelTrap(this.scene, x, z));
  }

  update(dt, player, zombies, audio, particles) {
    // 1. Update Floating Banana Consumables
    for (let i = this.bananas.length - 1; i >= 0; i--) {
      const b = this.bananas[i];
      b.update(dt);

      const dx = player.pos.x - b.pos.x;
      const dz = player.pos.z - b.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Player Eats Banana (+35 HP & Drop Peel Trap!)
      if (dist < 1.3) {
        player.hp = Math.min(player.maxHp, player.hp + 35);
        audio.playHeal();
        particles.createSparkle(new THREE.Vector3(player.pos.x, 1.0, player.pos.z), 0x00ff88, 14);

        // Drop Banana Peel Trap on Floor at player position!
        this.dropPeel(player.pos.x, player.pos.z);

        b.destroy();
        this.bananas.splice(i, 1);
      }
    }

    // 2. Check Zombies Walking Over Banana Peel Traps
    for (let i = this.peels.length - 1; i >= 0; i--) {
      const peel = this.peels[i];

      for (const z of zombies) {
        if (z.slipTimer > 0) continue; // Already slipping

        const zdx = z.pos.x - peel.pos.x;
        const zdz = z.pos.z - peel.pos.z;
        const zDist = Math.sqrt(zdx * zdx + zdz * zdz);

        if (zDist < 1.2) {
          // Trigger Zombie Slip & 75% Slow!
          z.applySlip(3.5);
          audio.playSlip();
          particles.createSparkle(new THREE.Vector3(peel.pos.x, 0.4, peel.pos.z), 0xffff00, 12);

          peel.destroy();
          this.peels.splice(i, 1);
          break;
        }
      }
    }

    // 3. Periodic Spawning Timer
    this.spawnTimer += dt;
    if (this.spawnTimer > 12) {
      this.spawnTimer = 0;
      if (this.bananas.length < 6) {
        this.spawnRandomBanana(player.pos);
      }
    }
  }

  clear() {
    for (const b of this.bananas) {
      b.destroy();
    }
    for (const p of this.peels) {
      p.destroy();
    }
    this.bananas = [];
    this.peels = [];
    this.spawnInitialBananas();
  }
}
