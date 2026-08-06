import * as THREE from 'three';

export class CameraManager {
  constructor() {
    this.height = 36;
    this.angle = Math.PI / 5.5; // ~32 deg from vertical
    this.distance = 45;
    this.shakeIntensity = 0;

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      400
    );
  }

  update(playerPos, dt) {
    if (!playerPos) return;

    // Base MOBA position
    const targetX = playerPos.x + Math.sin(this.angle) * this.distance * 0.3;
    const targetY = this.height;
    const targetZ = playerPos.z + Math.cos(this.angle) * this.distance * 0.3;

    // Apply Camera Shake
    let shakeX = 0;
    let shakeZ = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeZ = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 4);
    }

    this.camera.position.set(targetX + shakeX, targetY, targetZ + shakeZ);
    this.camera.lookAt(playerPos.x, 0, playerPos.z);
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(2.5, this.shakeIntensity + amount);
  }

  onResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
