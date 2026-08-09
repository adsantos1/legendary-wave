import * as THREE from 'three';

export class CameraManager {
  constructor() {
    this.height = 20; // Optimal tactical height
    this.distance = 24; // Optimal tactical distance
    this.angle = Math.PI / 5.2; // ~34.5 deg tilt angle
    this.shakeIntensity = 0;

    this.currentCamPos = new THREE.Vector3(0, 20, 24);
    this.currentLookAt = new THREE.Vector3(0, 0, 0);
    this.aimOffset = new THREE.Vector3(0, 0, 0); // Smooth aim offset

    this.camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      400
    );
  }

  update(playerPos, isRightStickActive, aimDir, dt, environment = null) {
    if (!playerPos) return;

    const terrainY = (environment && environment.getTerrainHeight) ? environment.getTerrainHeight(playerPos.x, playerPos.z) : 0;

    // 1. Calculate Target Aim Offset (Smooth 2.5 unit offset ONLY when aiming)
    const targetOffset = new THREE.Vector3(0, 0, 0);
    if (isRightStickActive && aimDir) {
      targetOffset.set(aimDir.x * 2.5, 0, aimDir.z * 2.5);
    }

    // Ultra-Smooth Damped Interpolation for Aim Offset (eliminates camera jostle completely!)
    const offsetLerpSpeed = Math.min(1.0, dt * 3.5);
    this.aimOffset.lerp(targetOffset, offsetLerpSpeed);

    // 2. Desired Focal Look Target & Camera Position
    const desiredLookTarget = new THREE.Vector3(
      playerPos.x + this.aimOffset.x,
      0.5 + terrainY,
      playerPos.z + this.aimOffset.z
    );

    const desiredCamPos = new THREE.Vector3(
      playerPos.x + this.aimOffset.x + Math.sin(this.angle) * this.distance * 0.28,
      this.height + terrainY,
      playerPos.z + this.aimOffset.z + Math.cos(this.angle) * this.distance * 0.95
    );

    // 3. Smooth Damped Tracking (Fluid LERP)
    const lerpSpeed = Math.min(1.0, dt * 8.0);
    this.currentCamPos.lerp(desiredCamPos, lerpSpeed);
    this.currentLookAt.lerp(desiredLookTarget, lerpSpeed);

    // 4. Screen Shake Impulse
    let shakeX = 0;
    let shakeZ = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeZ = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 4.5);
    }

    this.camera.position.set(
      this.currentCamPos.x + shakeX,
      this.currentCamPos.y,
      this.currentCamPos.z + shakeZ
    );
    this.camera.lookAt(this.currentLookAt.x, this.currentLookAt.y, this.currentLookAt.z);
  }

  addShake(amount) {
    this.shakeIntensity = Math.min(2.5, this.shakeIntensity + amount);
  }

  onResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
