import * as THREE from 'three';

export class ExplosiveBarrel {
  constructor(scene, x, z) {
    this.scene = scene;
    this.pos = new THREE.Vector3(x, 0, z);
    this.radius = 0.6;
    this.maxHp = 40;
    this.hp = 40;
    this.hitFlash = 0;
    this.isExploded = false;

    this.mesh = this.createMesh();
    this.mesh.position.copy(this.pos);
    this.scene.add(this.mesh);
  }

  createMesh() {
    const group = new THREE.Group();

    // Red Metal Barrel Body
    const barrelGeo = new THREE.CylinderGeometry(0.48, 0.48, 1.2, 12);
    this.barrelMat = new THREE.MeshStandardMaterial({
      color: 0xd62828, // Bright hazard red
      roughness: 0.4,
      metalness: 0.3
    });
    const barrel = new THREE.Mesh(barrelGeo, this.barrelMat);
    barrel.position.y = 0.6;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);

    // Yellow Hazard Bands
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xfcbf49, // Hazard yellow
      roughness: 0.5,
      metalness: 0.2
    });

    const topBand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 12), bandMat);
    topBand.position.y = 0.95;
    group.add(topBand);

    const bottomBand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 12), bandMat);
    bottomBand.position.y = 0.25;
    group.add(bottomBand);

    // Explosive Warning Symbol
    const symbolMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const symbol = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.98), symbolMat);
    symbol.position.y = 0.6;
    group.add(symbol);

    return group;
  }

  takeDamage(amount) {
    if (this.isExploded) return;
    this.hp -= amount;
    this.hitFlash = 0.15;
  }

  update(dt) {
    if (this.isExploded) return;

    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      this.barrelMat.emissive.setHex(0xffffff);
      this.barrelMat.emissiveIntensity = 0.8;
    } else {
      this.barrelMat.emissive.setHex(0x000000);
      this.barrelMat.emissiveIntensity = 0;
    }
  }

  explode(particles, audio, zombies = [], cameraManager = null, player = null) {
    if (this.isExploded) return;
    this.isExploded = true;

    // 1. Particle Explosion FX
    particles.createExplosion(this.pos);

    // 2. Play Heavy Sound
    audio.playExplosion();

    // 3. Screen Shake
    if (cameraManager) {
      cameraManager.addShake(0.55);
    }

    // 4. AOE Damage to all Zombies in blast radius (6.5 unit radius)
    const explosionRadius = 6.5;
    const maxDamage = 160;

    for (const z of zombies) {
      const dx = z.pos.x - this.pos.x;
      const dz = z.pos.z - this.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= explosionRadius) {
        const falloff = 1 - (dist / explosionRadius) * 0.4;
        const blastDamage = Math.floor(maxDamage * falloff);
        z.takeDamage(blastDamage);
        particles.createBloodSplat(new THREE.Vector3(z.pos.x, 0.7, z.pos.z), 0xff3366, 10);
      }
    }

    // Direct damage to player if too close
    if (player) {
      const pdx = player.pos.x - this.pos.x;
      const pdz = player.pos.z - this.pos.z;
      const pDist = Math.sqrt(pdx * pdx + pdz * pdz);
      if (pDist <= explosionRadius) {
        player.takeDamage(20);
      }
    }

    // 5. Remove mesh from scene
    this.scene.remove(this.mesh);
  }
}

export class Environment {
  constructor(scene, worldSize = 120) {
    this.scene = scene;
    this.worldSize = worldSize;
    this.walls = [];
    this.obstacles = [];
    this.barrels = [];
    this.isDay = true;

    this.enterableBuildings = []; // Stores { roofMat, bounds } for all enterable buildings

    this.init();
  }

  getTerrainHeight(x, z) {
    // 3D Sloped Mountain Hill Path (X: 190 to 235, Z: -30 to +30)
    if (x >= 190 && x <= 235 && Math.abs(z) <= 30) {
      const progress = (x - 190) / 45;
      return progress * 5.0; // Smooth incline up to Y = 5.0m!
    } else if (x > 235) {
      return 5.0; // Elevated Yeti Mountain Plateau
    }
    return 0.0;
  }

  init() {
    // Fog (Daytime Bright Sky)
    this.scene.background = new THREE.Color(0x78a6db);
    this.scene.fog = new THREE.FogExp2(0x78a6db, 0.002);

    // Ambient Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(this.ambientLight);

    // Directional Sunlight
    this.dirLight = new THREE.DirectionalLight(0xfff5ea, 1.25);
    this.dirLight.position.set(80, 120, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 450;
    this.dirLight.shadow.camera.left = -200;
    this.dirLight.shadow.camera.right = 300;
    this.dirLight.shadow.camera.top = 200;
    this.dirLight.shadow.camera.bottom = -200;
    this.scene.add(this.dirLight);

    // FULL ORIGINAL TOWN GROUND PLANE (-120 to +120 X, -120 to +120 Z)
    const townFloorGeo = new THREE.PlaneGeometry(240, 240);
    this.floorMat = new THREE.MeshStandardMaterial({
      color: 0x2e4232,
      roughness: 0.85,
      metalness: 0.1
    });
    const townFloor = new THREE.Mesh(townFloorGeo, this.floorMat);
    townFloor.position.set(0, 0, 0);
    townFloor.rotation.x = -Math.PI / 2;
    townFloor.receiveShadow = true;
    this.scene.add(townFloor);

    // Grid Overlay for Full Town Arena
    this.gridHelper = new THREE.GridHelper(240, 60, 0x00ff88, 0x1f2e24);
    this.gridHelper.position.set(0, 0.02, 0);
    this.gridHelper.material.transparent = true;
    this.gridHelper.material.opacity = 0.18;
    this.scene.add(this.gridHelper);

    // Build Regions
    this.createBoundaryWalls();
    this.createAllEnterableBuildings();
    this.createObstacles();
    this.createExplosiveBarrels();
    this.createWoodlandForest();
    this.createMountainYetiLair();

    this.setTimeOfDay(true);
  }

  createWoodlandForest() {
    // 1. Woodland Mossy Forest Ground (X: 120 to 200, Z: -120 to +120)
    const forestFloorGeo = new THREE.PlaneGeometry(80, 240);
    const forestFloorMat = new THREE.MeshStandardMaterial({
      color: 0x1c3a21, // Mossy dark pine forest grass
      roughness: 0.9,
      metalness: 0.05
    });
    const forestFloor = new THREE.Mesh(forestFloorGeo, forestFloorMat);
    forestFloor.position.set(160, 0.01, 0);
    forestFloor.rotation.x = -Math.PI / 2;
    forestFloor.receiveShadow = true;
    this.scene.add(forestFloor);

    // Forest Transition Dirt Trail
    const trailGeo = new THREE.PlaneGeometry(80, 16);
    const trailMat = new THREE.MeshStandardMaterial({ color: 0x5a4332, roughness: 0.95 });
    const trail = new THREE.Mesh(trailGeo, trailMat);
    trail.position.set(160, 0.03, 0);
    trail.rotation.x = -Math.PI / 2;
    trail.receiveShadow = true;
    this.scene.add(trail);

    // 2. 3D Procedural Pine Trees (75 trees)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 0.9 });
    const leafColors = [0x1a4023, 0x24542d, 0x15361d];

    for (let i = 0; i < 75; i++) {
      const tx = 125 + Math.random() * 70;
      const tz = -112 + Math.random() * 224;

      // Keep dirt trail pathway clear near Z = 0
      if (Math.abs(tz) < 9 && tx < 190) continue;

      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);

      // Trunk
      const trunkHeight = 2.5 + Math.random() * 1.5;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, trunkHeight, 8), trunkMat);
      trunk.position.y = trunkHeight / 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      // 3-Tier Layered Cone Canopy
      const leafMat = new THREE.MeshStandardMaterial({
        color: leafColors[i % leafColors.length],
        roughness: 0.8
      });

      for (let tier = 0; tier < 3; tier++) {
        const radius = 1.8 - tier * 0.4;
        const cHeight = 2.2 - tier * 0.3;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, cHeight, 8), leafMat);
        cone.position.y = trunkHeight + tier * 1.4;
        cone.castShadow = true;
        cone.receiveShadow = true;
        treeGroup.add(cone);
      }

      this.scene.add(treeGroup);

      // Add trunk collision
      const collisionMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, trunkHeight, 6), trunkMat);
      collisionMesh.position.set(tx, trunkHeight / 2, tz);
      collisionMesh.userData.isWall = true;
      this.walls.push(collisionMesh);
    }

    // 3. Fallen Logs & Boulders
    const logMat = new THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.9 });
    const boulderMat = new THREE.MeshStandardMaterial({ color: 0x4a554d, roughness: 0.8 });

    for (let i = 0; i < 12; i++) {
      const lx = 130 + Math.random() * 60;
      const lz = -100 + Math.random() * 200;
      if (Math.abs(lz) < 9) continue;

      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 3.5, 8), logMat);
      log.position.set(lx, 0.35, lz);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = Math.random() * Math.PI;
      log.castShadow = true;
      this.scene.add(log);
      this.walls.push(log);
    }

    for (let i = 0; i < 14; i++) {
      const bx = 128 + Math.random() * 65;
      const bz = -105 + Math.random() * 210;
      if (Math.abs(bz) < 9) continue;

      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.7, 1), boulderMat);
      boulder.position.set(bx, 0.6, bz);
      boulder.castShadow = true;
      this.scene.add(boulder);
      this.walls.push(boulder);
    }
  }

  createMountainYetiLair() {
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xddeeff, roughness: 0.6, metalness: 0.1 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x2b3844, roughness: 0.85 });
    const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf4f9ff, roughness: 0.4 });

    // 1. REAL 3D INCLINED MOUNTAIN HILL RAMP (X: 190 to 235, Z: -30 to +30)
    // Slopes up 5.0m from X=190 to X=235
    const rampLength = 45; // meters long
    const rampWidth = 60; // meters wide
    const rampHeight = 5.0; // meters high
    const angle = Math.atan2(rampHeight, rampLength);

    const hillRampGeo = new THREE.BoxGeometry(rampLength + 1, 0.4, rampWidth);
    const hillRamp = new THREE.Mesh(hillRampGeo, snowMat);
    hillRamp.position.set(212.5, rampHeight / 2, 0);
    hillRamp.rotation.z = angle; // Real 3D Incline Angle!
    hillRamp.receiveShadow = true;
    this.scene.add(hillRamp);

    // Mountain Dirt/Snow Trail Ramp Center Line
    const trailRampGeo = new THREE.BoxGeometry(rampLength + 1, 0.42, 16);
    const trailRampMat = new THREE.MeshStandardMaterial({ color: 0x8a9ba8, roughness: 0.9 });
    const trailRamp = new THREE.Mesh(trailRampGeo, trailRampMat);
    trailRamp.position.set(212.5, rampHeight / 2 + 0.01, 0);
    trailRamp.rotation.z = angle;
    trailRamp.receiveShadow = true;
    this.scene.add(trailRamp);

    // 2. ELEVATED MOUNTAIN PLATEAU (X: 235 to 280, Z: -120 to +120) at Height Y = 5.0
    const plateauGeo = new THREE.BoxGeometry(45, 5.0, 240);
    const plateau = new THREE.Mesh(plateauGeo, snowMat);
    plateau.position.set(257.5, 2.5, 0);
    plateau.receiveShadow = true;
    this.scene.add(plateau);

    // 3. FLANKING MOUNTAIN RIDGE ROCKS (Forming a mountain pass gorge)
    const ridgePositions = [
      { x: 245, z: -70, w: 35, h: 12.0, d: 70 },
      { x: 245, z: 70, w: 35, h: 12.0, d: 70 },
      { x: 275, z: 0, w: 14, h: 14.0, d: 80 },
      { x: 205, z: -80, w: 45, h: 9.0, d: 45 },
      { x: 205, z: 80, w: 45, h: 9.0, d: 45 }
    ];

    for (const r of ridgePositions) {
      const rockBlock = new THREE.Mesh(new THREE.BoxGeometry(r.w, r.h, r.d), rockMat);
      rockBlock.position.set(r.x, r.h / 2, r.z);
      rockBlock.castShadow = true;
      rockBlock.receiveShadow = true;
      rockBlock.userData.isWall = true;
      this.scene.add(rockBlock);
      this.walls.push(rockBlock);

      // Thick Snow Cap Top
      const snowCap = new THREE.Mesh(new THREE.BoxGeometry(r.w + 0.2, 0.6, r.d + 0.2), snowCapMat);
      snowCap.position.set(r.x, r.h + 0.3, r.z);
      snowCap.receiveShadow = true;
      this.scene.add(snowCap);
    }

    // 4. THE YETI GLACIAL CAVE LAIR ATOP THE MOUNTAIN PLATEAU (X: 265, Z: 0, Y: 5.0)
    const caveGroup = new THREE.Group();
    caveGroup.position.set(265, 5.0, 0);

    // Dark Cavernous Entrance Interior
    const cavernInterior = new THREE.Mesh(
      new THREE.BoxGeometry(12, 8, 14),
      new THREE.MeshBasicMaterial({ color: 0x03060a })
    );
    cavernInterior.position.set(5, 4, 0);
    caveGroup.add(cavernInterior);

    // Cave Stone Archway Pillars
    const archPillarLeft = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), rockMat);
    archPillarLeft.position.set(0, 4, -5.5);
    archPillarLeft.castShadow = true;
    caveGroup.add(archPillarLeft);

    const archPillarRight = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), rockMat);
    archPillarRight.position.set(0, 4, 5.5);
    archPillarRight.castShadow = true;
    caveGroup.add(archPillarRight);

    const archLintel = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 16), rockMat);
    archLintel.position.set(0, 8.5, 0);
    archLintel.castShadow = true;
    caveGroup.add(archLintel);

    // Snow Mantle on Archway
    const archSnow = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.0, 16.6), snowCapMat);
    archSnow.position.set(0, 10.8, 0);
    caveGroup.add(archSnow);

    // Glowing Cyan Ice Stalagmites & Crystals framing entrance
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.9,
      transparent: true,
      opacity: 0.9
    });

    for (let i = 0; i < 8; i++) {
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.8 + (i % 3) * 0.6, 5), crystalMat);
      const side = (i % 2 === 0) ? -4.0 : 4.0;
      crystal.position.set(-0.6, 1.4 + (i % 3) * 0.2, side + Math.floor(i / 2) * 1.0 - 1.5);
      crystal.rotation.z = (i % 2 === 0) ? 0.2 : -0.2;
      caveGroup.add(crystal);
    }

    // Glowing Ice Light inside Cave
    const caveLight = new THREE.PointLight(0x00e5ff, 4.0, 25);
    caveLight.position.set(3, 5, 0);
    caveGroup.add(caveLight);

    this.scene.add(caveGroup);
  }

  createExplosiveBarrels() {
    const positions = [
      { x: 12, z: 8 },
      { x: -14, z: 12 },
      { x: 18, z: -15 },
      { x: -22, z: -10 },
      { x: 5, z: -25 },
      { x: -8, z: 28 },
      { x: 28, z: 22 },
      { x: -30, z: 18 },
      { x: 32, z: -28 },
      { x: -18, z: 32 },
      { x: 25, z: 5 },
      { x: -28, z: -25 },
      // Woodland Barrels
      { x: 145, z: 20 },
      { x: 172, z: -25 },
      { x: 188, z: 15 }
    ];

    for (const pos of positions) {
      const barrel = new ExplosiveBarrel(this.scene, pos.x, pos.z);
      this.barrels.push(barrel);
    }
  }

  createEnterableBuilding(posX, posZ, width, depth, height, wallColor, roofColor, lightColor, doorWidth, interiorType) {
    const group = new THREE.Group();
    group.position.set(posX, 0, posZ);

    const wallThickness = 0.8;
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.7 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x443322, roughness: 0.9 });
    const roofMat = new THREE.MeshStandardMaterial({
      color: roofColor,
      roughness: 0.6,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide
    });

    // 1. Building Floor
    const bFloor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, depth), floorMat);
    bFloor.position.set(0, 0.05, 0);
    bFloor.receiveShadow = true;
    group.add(bFloor);

    // 2. Solid Outer Walls & Doorway Gaps
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), wallMat);
    leftWall.position.set(-width / 2 + wallThickness / 2, height / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);
    this.walls.push(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, height, depth), wallMat);
    rightWall.position.set(width / 2 - wallThickness / 2, height / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);
    this.walls.push(rightWall);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, wallThickness), wallMat);
    backWall.position.set(0, height / 2, -depth / 2 + wallThickness / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);
    this.walls.push(backWall);

    const sideWallWidth = (width - doorWidth) / 2;

    const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(sideWallWidth, height, wallThickness), wallMat);
    frontLeft.position.set(-width / 2 + sideWallWidth / 2, height / 2, depth / 2 - wallThickness / 2);
    frontLeft.castShadow = true;
    frontLeft.receiveShadow = true;
    group.add(frontLeft);
    this.walls.push(frontLeft);

    const frontRight = new THREE.Mesh(new THREE.BoxGeometry(sideWallWidth, height, wallThickness), wallMat);
    frontRight.position.set(width / 2 - sideWallWidth / 2, height / 2, depth / 2 - wallThickness / 2);
    frontRight.castShadow = true;
    frontRight.receiveShadow = true;
    group.add(frontRight);
    this.walls.push(frontRight);

    // Door Frame Trim Beams
    const trimLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, 0.9), trimMat);
    trimLeft.position.set(-doorWidth / 2, height / 2, depth / 2);
    group.add(trimLeft);

    const trimRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, height, 0.9), trimMat);
    trimRight.position.set(doorWidth / 2, height / 2, depth / 2);
    group.add(trimRight);

    // 3. Warm Interior Lighting & Props
    const intLight = new THREE.PointLight(lightColor, 2.2, 16);
    intLight.position.set(0, height - 0.5, 0);
    group.add(intLight);

    if (interiorType === 'barn') {
      const hayMat = new THREE.MeshStandardMaterial({ color: 0xddaa33, roughness: 0.9 });
      for (let i = 0; i < 6; i++) {
        const hay = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 1.0), hayMat);
        hay.position.set(-width / 2 + 2 + (i % 2) * 1.5, 0.4 + Math.floor(i / 2) * 0.8, -depth / 2 + 3 + Math.floor(i / 2) * 1.2);
        hay.castShadow = true;
        group.add(hay);
      }
    } else if (interiorType === 'crates') {
      const crateMat = new THREE.MeshStandardMaterial({ color: 0x775533, roughness: 0.8 });
      for (let i = 0; i < 5; i++) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.0, 1.2), crateMat);
        crate.position.set(-width / 2 + 2.5 + (i % 3) * 1.4, 0.5 + Math.floor(i / 3) * 1.0, -depth / 2 + 3);
        crate.castShadow = true;
        group.add(crate);
      }
    } else if (interiorType === 'armory') {
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.4 });
      for (let i = 0; i < 4; i++) {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 0.8), steelMat);
        shelf.position.set(width / 2 - 2.5, 0.75, -depth / 2 + 3 + i * 2.2);
        shelf.castShadow = true;
        group.add(shelf);
      }
    } else if (interiorType === 'refuge') {
      const tableMat = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 0.7 });
      const table = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.9, 1.4), tableMat);
      table.position.set(0, 0.45, 0);
      table.castShadow = true;
      group.add(table);
    }

    // 4. Roof Assembly
    const roofGroup = new THREE.Group();
    roofGroup.position.y = height;

    const slopeAngle = 0.48;
    const roofPanelWidth = (width / 2) / Math.cos(slopeAngle) + 0.6;

    const leftRoof = new THREE.Mesh(new THREE.BoxGeometry(roofPanelWidth, 0.3, depth + 1.2), roofMat);
    leftRoof.position.set(-width / 4, 1.3, 0);
    leftRoof.rotation.z = slopeAngle;
    leftRoof.castShadow = true;
    roofGroup.add(leftRoof);

    const rightRoof = new THREE.Mesh(new THREE.BoxGeometry(roofPanelWidth, 0.3, depth + 1.2), roofMat);
    rightRoof.position.set(width / 4, 1.3, 0);
    rightRoof.rotation.z = -slopeAngle;
    rightRoof.castShadow = true;
    roofGroup.add(rightRoof);

    const gableShape = new THREE.Shape();
    gableShape.moveTo(-width / 2, 0);
    gableShape.lineTo(0, 2.6);
    gableShape.lineTo(width / 2, 0);
    gableShape.closePath();

    const gableGeo = new THREE.ShapeGeometry(gableShape);

    const frontGable = new THREE.Mesh(gableGeo, wallMat);
    frontGable.position.set(0, 0, depth / 2);
    roofGroup.add(frontGable);

    const backGable = new THREE.Mesh(gableGeo, wallMat);
    backGable.position.set(0, 0, -depth / 2);
    backGable.rotation.y = Math.PI;
    roofGroup.add(backGable);

    group.add(roofGroup);
    this.scene.add(group);

    // Save roof & bounds for transparency fade when hero is inside
    const bounds = new THREE.Box3(
      new THREE.Vector3(posX - width / 2 + 1, 0, posZ - depth / 2 + 1),
      new THREE.Vector3(posX + width / 2 - 1, height + 3, posZ + depth / 2 - 1)
    );

    this.enterableBuildings.push({
      roofMat,
      bounds
    });
  }

  createAllEnterableBuildings() {
    // 1. Red Country Barn at (20, 12)
    this.createEnterableBuilding(20, 12, 14, 18, 5.0, 0x992222, 0x442211, 0xffaa44, 5.0, 'barn');

    // 2. Tactical Outpost Compound at (-24, -18)
    this.createEnterableBuilding(-24, -18, 16, 20, 5.2, 0x3a4856, 0x1e2732, 0xffbb55, 5.5, 'crates');

    // 3. Supply Hangar Armory at (-26, 22)
    this.createEnterableBuilding(-26, 22, 18, 16, 5.5, 0x4a5d6e, 0x223344, 0x00e5ff, 6.0, 'armory');

    // 4. Brick Watchtower Refuge at (24, -22)
    this.createEnterableBuilding(24, -22, 14, 14, 5.0, 0x884433, 0x3a2218, 0xffdd44, 4.5, 'refuge');
  }

  update(playerPos, dt, particles, audio, zombies, cameraManager, player) {
    // 1. Roof Transparency Fade for ALL Enterable Buildings
    if (playerPos && this.enterableBuildings) {
      for (const b of this.enterableBuildings) {
        const isInside = b.bounds.containsPoint(playerPos);
        if (isInside) {
          b.roofMat.opacity = Math.max(0.0, b.roofMat.opacity - dt * 4.5);
        } else {
          b.roofMat.opacity = Math.min(1.0, b.roofMat.opacity + dt * 4.5);
        }
      }
    }

    // 2. Mountain Snow Particle FX in Woodland & Mountain regions (X > 120)
    if (playerPos && playerPos.x > 120 && particles) {
      particles.createSparkle(
        new THREE.Vector3(playerPos.x + (Math.random() - 0.5) * 25, 2 + Math.random() * 5, playerPos.z + (Math.random() - 0.5) * 25),
        0xe0f7fa,
        1
      );
    }

    // 3. Explosive Barrels Update & Cleanup
    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const b = this.barrels[i];
      b.update(dt);

      if (b.hp <= 0 && !b.isExploded) {
        b.explode(particles, audio, zombies, cameraManager, player);
        this.barrels.splice(i, 1);
      }
    }
  }

  setTimeOfDay(isDay = true) {
    this.isDay = true;
    this.scene.background.setHex(0x78a6db);
    this.scene.fog.color.setHex(0x78a6db);
    this.scene.fog.density = 0.002;

    this.ambientLight.color.setHex(0xffffff);
    this.ambientLight.intensity = 0.95;

    this.dirLight.color.setHex(0xfff5ea);
    this.dirLight.intensity = 1.25;
    this.dirLight.position.set(80, 120, 40);

    this.floorMat.color.setHex(0x2e4232);
    this.gridHelper.material.opacity = 0.18;
  }

  toggleTimeOfDay() {
    this.setTimeOfDay(true);
    return true;
  }

  createBoundaryWalls() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x2a3646,
      roughness: 0.7,
      metalness: 0.2
    });

    const height = 8;
    const thickness = 4;

    // Huge Map Bounds: X [-120 to +280], Z [-120 to +120]
    const wallPositions = [
      { x: 80, z: -120, w: 400, d: thickness }, // North Wall (400m long!)
      { x: 80, z: 120, w: 400, d: thickness },  // South Wall (400m long!)
      { x: -120, z: 0, w: thickness, d: 240 },  // West Town Wall
      { x: 280, z: 0, w: thickness, d: 240 }   // East Mountain Wall
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

    // Decorative Sandbag & Cover Barricades in Town
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const dist = 16 + (i % 3) * 8;
      const ox = Math.cos(angle) * dist;
      const oz = Math.sin(angle) * dist;

      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), obsMat);
      crate.position.set(ox, 0.6, oz);
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);
      this.walls.push(crate);
    }
  }

  checkCollision(pos, radius) {
    // 1. Boundary & Building Walls Collision
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

    // 2. Active Explosive Barrels Collision
    for (const b of this.barrels) {
      if (b.isExploded) continue;
      const dx = pos.x - b.pos.x;
      const dz = pos.z - b.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < (radius + b.radius)) return true;
    }

    return false;
  }
}
