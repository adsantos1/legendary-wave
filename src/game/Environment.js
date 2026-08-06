import * as THREE from 'three';

export class Environment {
  constructor(scene, worldSize = 120) {
    this.scene = scene;
    this.worldSize = worldSize;
    this.walls = [];
    this.obstacles = [];
    this.isDay = true; // Default to Day time

    this.barnRoofs = [];
    this.barnInteriorBounds = null;

    this.init();
  }

  init() {
    // Fog
    this.scene.background = new THREE.Color(0x78a6db);
    this.scene.fog = new THREE.FogExp2(0x78a6db, 0.003);

    // Ambient Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(this.ambientLight);

    // Directional Sunlight / Moonlight
    this.dirLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
    this.dirLight.position.set(50, 100, 30);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 250;
    this.dirLight.shadow.camera.left = -this.worldSize;
    this.dirLight.shadow.camera.right = this.worldSize;
    this.dirLight.shadow.camera.top = this.worldSize;
    this.dirLight.shadow.camera.bottom = -this.worldSize;
    this.scene.add(this.dirLight);

    // Ground Plane
    const floorGeo = new THREE.PlaneGeometry(this.worldSize * 2, this.worldSize * 2);
    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x2e4232,
      roughness: 0.85,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeo, this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Grid Overlay
    this.gridHelper = new THREE.GridHelper(this.worldSize * 2, 60, 0x00ff88, 0x223828);
    this.gridHelper.position.y = 0.02;
    this.gridHelper.material.opacity = 0.25;
    this.gridHelper.material.transparent = true;
    this.scene.add(this.gridHelper);

    // Build Boundary Walls, Barn, and City Obstacles
    this.createBoundaryWalls();
    this.createBarn(20, 12);
    this.createObstacles();

    // Set initial lighting according to default mode (Day)
    this.setTimeOfDay(this.isDay);
  }

  createBarn(posX, posZ) {
    const group = new THREE.Group();
    group.position.set(posX, 0, posZ);

    const barnWidth = 14;
    const barnDepth = 18;
    const wallHeight = 5;
    const wallThickness = 0.8;

    // Materials
    const barnWoodMat = new THREE.MeshStandardMaterial({ color: 0x992222, roughness: 0.7 }); // Classic Red Barn
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });
    const barnFloorMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x442211,
      roughness: 0.6,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide
    });

    // 1. Barn Floor Planks
    const barnFloor = new THREE.Mesh(
      new THREE.BoxGeometry(barnWidth, 0.1, barnDepth),
      barnFloorMat
    );
    barnFloor.position.set(0, 0.05, 0);
    barnFloor.receiveShadow = true;
    group.add(barnFloor);

    // 2. Barn Walls & Collisions
    // Left Wall
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, barnDepth),
      barnWoodMat
    );
    leftWall.position.set(-barnWidth / 2 + wallThickness / 2, wallHeight / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);
    this.walls.push(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, barnDepth),
      barnWoodMat
    );
    rightWall.position.set(barnWidth / 2 - wallThickness / 2, wallHeight / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);
    this.walls.push(rightWall);

    // Back Wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(barnWidth, wallHeight, wallThickness),
      barnWoodMat
    );
    backWall.position.set(0, wallHeight / 2, -barnDepth / 2 + wallThickness / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);
    this.walls.push(backWall);

    // Front Wall with Center Entrance Doorway (Doorway width = 5)
    const doorGap = 5;
    const sideWallWidth = (barnWidth - doorGap) / 2;

    // Front Left Wall
    const frontLeft = new THREE.Mesh(
      new THREE.BoxGeometry(sideWallWidth, wallHeight, wallThickness),
      barnWoodMat
    );
    frontLeft.position.set(-barnWidth / 2 + sideWallWidth / 2, wallHeight / 2, barnDepth / 2 - wallThickness / 2);
    frontLeft.castShadow = true;
    frontLeft.receiveShadow = true;
    group.add(frontLeft);
    this.walls.push(frontLeft);

    // Front Right Wall
    const frontRight = new THREE.Mesh(
      new THREE.BoxGeometry(sideWallWidth, wallHeight, wallThickness),
      barnWoodMat
    );
    frontRight.position.set(barnWidth / 2 - sideWallWidth / 2, wallHeight / 2, barnDepth / 2 - wallThickness / 2);
    frontRight.castShadow = true;
    frontRight.receiveShadow = true;
    group.add(frontRight);
    this.walls.push(frontRight);

    // White Trim Borders on Front Door Frame
    const trimBeamLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallHeight, 1.0), trimMat);
    trimBeamLeft.position.set(-doorGap / 2, wallHeight / 2, barnDepth / 2);
    group.add(trimBeamLeft);

    const trimBeamRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallHeight, 1.0), trimMat);
    trimBeamRight.position.set(doorGap / 2, wallHeight / 2, barnDepth / 2);
    group.add(trimBeamRight);

    // 3. Barn Interior Details (Hay Bales & Warm Lantern)
    const hayMat = new THREE.MeshStandardMaterial({ color: 0xddaa33, roughness: 0.9 });
    for (let i = 0; i < 6; i++) {
      const hay = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.0), hayMat);
      hay.position.set(
        -barnWidth / 2 + 2 + (i % 2) * 1.5,
        0.4 + Math.floor(i / 2) * 0.8,
        -barnDepth / 2 + 3 + Math.floor(i / 2) * 1.2
      );
      hay.castShadow = true;
      group.add(hay);
    }

    // Warm Interior Point Light
    const barnLight = new THREE.PointLight(0xffaa44, 2.0, 15);
    barnLight.position.set(0, wallHeight - 0.5, 0);
    group.add(barnLight);

    // 4. Roof Assembly (Gabled Sloped Roof Planes with Disappear Mechanics)
    const roofGroup = new THREE.Group();
    roofGroup.position.y = wallHeight;

    const slopeAngle = 0.5; // ~28 deg
    const roofPanelWidth = (barnWidth / 2) / Math.cos(slopeAngle) + 0.6;

    // Left Roof Slope
    const leftRoof = new THREE.Mesh(
      new THREE.BoxGeometry(roofPanelWidth, 0.3, barnDepth + 1.2),
      roofMat
    );
    leftRoof.position.set(-barnWidth / 4, 1.4, 0);
    leftRoof.rotation.z = slopeAngle;
    leftRoof.castShadow = true;
    roofGroup.add(leftRoof);

    // Right Roof Slope
    const rightRoof = new THREE.Mesh(
      new THREE.BoxGeometry(roofPanelWidth, 0.3, barnDepth + 1.2),
      roofMat
    );
    rightRoof.position.set(barnWidth / 4, 1.4, 0);
    rightRoof.rotation.z = -slopeAngle;
    rightRoof.castShadow = true;
    roofGroup.add(rightRoof);

    // Triangular Gable Covers (Front & Back Roof Peaks)
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-barnWidth / 2, 0);
    gableShape.lineTo(0, 2.8);
    gableShape.lineTo(barnWidth / 2, 0);
    gableShape.closePath();

    const gableGeo = new THREE.ShapeGeometry(gableShape);

    const frontGable = new THREE.Mesh(gableGeo, barnWoodMat);
    frontGable.position.set(0, 0, barnDepth / 2);
    roofGroup.add(frontGable);

    const backGable = new THREE.Mesh(gableGeo, barnWoodMat);
    backGable.position.set(0, 0, -barnDepth / 2);
    backGable.rotation.y = Math.PI;
    roofGroup.add(backGable);

    group.add(roofGroup);
    this.scene.add(group);

    // Store Roof references for fading mechanics
    this.barnRoofs.push(roofMat);

    // Store Barn Interior Bounding Box for player detection
    this.barnInteriorBounds = new THREE.Box3(
      new THREE.Vector3(posX - barnWidth / 2 + 1, 0, posZ - barnDepth / 2 + 1),
      new THREE.Vector3(posX + barnWidth / 2 - 1, wallHeight + 3, posZ + barnDepth / 2 - 1)
    );
  }

  update(playerPos, dt) {
    if (!playerPos || !this.barnInteriorBounds) return;

    // Check if player is inside the barn interior
    const isInsideBarn = this.barnInteriorBounds.containsPoint(playerPos);

    // Smooth Roof Fade Transition (Disappears when entering, reappears when leaving)
    for (const roofMat of this.barnRoofs) {
      if (isInsideBarn) {
        roofMat.opacity = Math.max(0.0, roofMat.opacity - dt * 4.5);
      } else {
        roofMat.opacity = Math.min(1.0, roofMat.opacity + dt * 4.5);
      }
    }
  }

  setTimeOfDay(isDay) {
    this.isDay = isDay;
    if (isDay) {
      this.scene.background.setHex(0x78a6db);
      this.scene.fog.color.setHex(0x78a6db);
      this.scene.fog.density = 0.003;

      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.95;

      this.dirLight.color.setHex(0xfff5ea);
      this.dirLight.intensity = 1.25;
      this.dirLight.position.set(50, 100, 30);

      this.floorMat.color.setHex(0x2e4232);
      this.gridHelper.material.opacity = 0.2;
    } else {
      this.scene.background.setHex(0x080c14);
      this.scene.fog.color.setHex(0x080c14);
      this.scene.fog.density = 0.007;

      this.ambientLight.color.setHex(0x405070);
      this.ambientLight.intensity = 0.5;

      this.dirLight.color.setHex(0x7090cc);
      this.dirLight.intensity = 0.75;
      this.dirLight.position.set(30, 80, 30);

      this.floorMat.color.setHex(0x121a28);
      this.gridHelper.material.opacity = 0.35;
    }
  }

  toggleTimeOfDay() {
    this.setTimeOfDay(!this.isDay);
    return this.isDay;
  }

  createBoundaryWalls() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2a3646,
      roughness: 0.7,
      metalness: 0.2
    });
    const half = this.worldSize;
    const height = 6;
    const thickness = 3;

    const wallPositions = [
      { x: 0, z: -half, w: half * 2, d: thickness },
      { x: 0, z: half, w: half * 2, d: thickness },
      { x: -half, z: 0, w: thickness, d: half * 2 },
      { x: half, z: 0, w: thickness, d: half * 2 }
    ];

    for (const p of wallPositions) {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(p.w, height, p.d),
        wallMat
      );
      wall.position.set(p.x, height / 2, p.z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.userData.isWall = true;
      this.scene.add(wall);
      this.walls.push(wall);
    }
  }

  createObstacles() {
    const obsMat = new THREE.MeshStandardMaterial({
      color: 0x34455b,
      roughness: 0.8
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x00ff88,
      emissive: 0x00ff88,
      emissiveIntensity: 0.3
    });

    for (let i = 0; i < 18; i++) {
      const width = 4 + Math.random() * 8;
      const height = 3 + Math.random() * 4;
      const depth = 4 + Math.random() * 8;

      const group = new THREE.Group();
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        obsMat
      );
      building.position.y = height / 2;
      building.castShadow = true;
      building.receiveShadow = true;
      group.add(building);

      const stripeGeo = new THREE.BoxGeometry(width + 0.1, 0.2, depth + 0.1);
      const stripe = new THREE.Mesh(stripeGeo, accentMat);
      stripe.position.y = height + 0.1;
      group.add(stripe);

      let posX, posZ;
      do {
        posX = (Math.random() - 0.5) * (this.worldSize * 1.5);
        posZ = (Math.random() - 0.5) * (this.worldSize * 1.5);
      } while (Math.sqrt(posX * posX + posZ * posZ) < 16); // avoid barn at (20,12)

      group.position.set(posX, 0, posZ);
      building.userData.isWall = true;
      building.userData.worldGroup = group;

      this.scene.add(group);
      this.walls.push(building);
    }
  }

  checkCollision(pos, radius) {
    for (const wall of this.walls) {
      const box = new THREE.Box3().setFromObject(wall);
      const closest = new THREE.Vector3(
        Math.max(box.min.x, Math.min(pos.x, box.max.x)),
        0,
        Math.max(box.min.z, Math.min(pos.z, box.max.z))
      );
      const dx = pos.x - closest.x;
      const dz = pos.z - closest.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < radius) return true;
    }
    return false;
  }
}
