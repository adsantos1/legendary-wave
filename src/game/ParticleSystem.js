import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  createBloodSplat(pos, color = 0x44ff44, count = 6) {
    const geo = new THREE.SphereGeometry(0.04, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const angle = Math.random() * Math.PI * 2;
      const elev = Math.random() * Math.PI * 0.4;
      const speed = 1.5 + Math.random() * 2.5;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * Math.cos(elev) * speed,
        vy: Math.sin(elev) * speed + 1,
        vz: Math.sin(angle) * Math.cos(elev) * speed,
        life: 0.35 + Math.random() * 0.3,
        gravity: true
      });
    }
  }

  createMuzzleFlash(pos, color = 0xffdd44) {
    const flashLight = new THREE.PointLight(color, 2.5, 6);
    flashLight.position.copy(pos);
    this.scene.add(flashLight);
    setTimeout(() => this.scene.remove(flashLight), 50);

    const geo = new THREE.SphereGeometry(0.05, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: (Math.random() - 0.5) * speed,
        vz: Math.sin(angle) * speed,
        life: 0.12,
        gravity: false
      });
    }
  }

  createSparkle(pos, color, count = 4) {
    const geo = new THREE.SphereGeometry(0.03, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.random() * speed,
        vz: Math.sin(angle) * speed,
        life: 0.25,
        gravity: true
      });
    }
  }

  createExplosion(pos, radius = 4.5) {
    // Explosion Flash Light
    const expLight = new THREE.PointLight(0xff5500, 5, radius * 3);
    expLight.position.copy(pos);
    this.scene.add(expLight);
    setTimeout(() => this.scene.remove(expLight), 150);

    // Shockwave Ring
    const ringGeo = new THREE.RingGeometry(0.3, 0.8, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const shockwave = new THREE.Mesh(ringGeo, ringMat);
    shockwave.rotation.x = -Math.PI / 2;
    shockwave.position.set(pos.x, 0.08, pos.z);
    this.scene.add(shockwave);

    this.particles.push({
      mesh: shockwave,
      vx: 0, vy: 0, vz: 0,
      life: 0.35,
      maxLife: 0.35,
      isShockwave: true,
      maxScale: radius * 1.8
    });

    // Fiery Embers
    const colors = [0xff2200, 0xff7700, 0xffff00, 0x444444];
    const geo = new THREE.SphereGeometry(0.12, 6, 6);

    for (let i = 0; i < 28; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);

      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.2) * Math.PI * 0.5;
      const speed = 3 + Math.random() * 7;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * Math.cos(elev) * speed,
        vy: Math.sin(elev) * speed + 2,
        vz: Math.sin(angle) * Math.cos(elev) * speed,
        life: 0.4 + Math.random() * 0.4,
        gravity: true
      });
    }
  }

  createFlameStream(pos, dir) {
    const colors = [0xff1100, 0xff6600, 0xffcc00];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const geo = new THREE.SphereGeometry(0.15, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });

    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      const offsetPos = pos.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.3
      ));
      mesh.position.copy(offsetPos);

      const spread = 0.25;
      const vx = (dir.x + (Math.random() - 0.5) * spread) * 22;
      const vy = (Math.random() - 0.2) * 1.5;
      const vz = (dir.z + (Math.random() - 0.5) * spread) * 22;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx, vy, vz,
        life: 0.28 + Math.random() * 0.15,
        maxLife: 0.4,
        isFlame: true,
        gravity: false
      });
    }
  }

  createDashTrail(pos) {
    const geo = new THREE.RingGeometry(0.2, 0.4, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.05, pos.z);
    this.scene.add(ring);

    this.particles.push({
      mesh: ring,
      vx: 0, vy: 0, vz: 0,
      life: 0.3,
      fadeRing: true
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.isShockwave) {
        p.life -= dt;
        const progress = 1 - (p.life / p.maxLife);
        p.mesh.scale.setScalar(1 + progress * p.maxScale);
        p.mesh.material.opacity = (p.life / p.maxLife) * 0.8;
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
        }
        continue;
      }

      if (p.isFlame) {
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.life -= dt;
        const progress = 1 - (p.life / p.maxLife);
        p.mesh.scale.setScalar(1 + progress * 2.5);
        p.mesh.material.opacity = (p.life / p.maxLife);
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
        }
        continue;
      }

      if (p.fadeRing) {
        p.life -= dt;
        p.mesh.material.opacity = p.life * 2;
        p.mesh.scale.addScalar(dt * 3);
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
        }
        continue;
      }

      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      if (p.gravity) p.vy -= 14 * dt;

      p.life -= dt;
      const s = Math.max(0.01, p.life * 2);
      p.mesh.scale.setScalar(s);

      if (p.life <= 0 || p.mesh.position.y < 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
  }
}
