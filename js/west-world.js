import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * 3D Wild Wild West Environment & Dynamic Day-to-Night Sky
 * Features:
 * - Monument Valley red rock buttes and mesas
 * - Rolling desert dunes with sand wave textures
 * - Saguaro cacti with iconic curved branches
 * - Rolling tumbleweeds drifting with wind physics
 * - Frontier campfire with glowing embers & lanterns
 * - Dynamic scroll-driven Day-to-Sunset-to-Night sky & celestial cycle
 */

export class WildWestWorld {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'WildWestWorld';

    this.timeOfDay = 0; // 0 = High Noon, 0.5 = Sunset, 1.0 = Midnight
    this.tumbleweeds = [];
    this.embers = [];

    this.initMaterials();
    this.buildSkyAndCelestials();
    this.buildTerrain();
    this.buildMesas();
    this.buildCacti();
    this.buildFrontierProps();
    this.buildCampfire();
    this.buildTumbleweeds();
    this.buildNightEmbers();

    this.scene.add(this.group);
  }

  initMaterials() {
    // Red Sandstone / Canyon Rock Material
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x9b3b24, // Terracotta red rock
      roughness: 0.88,
      metalness: 0.05,
      flatShading: true,
    });

    this.rockDarkMat = new THREE.MeshStandardMaterial({
      color: 0x6e2515, // Shadowed rock strata
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true,
    });

    // Desert Sand Ground
    this.sandMat = new THREE.MeshStandardMaterial({
      color: 0xd98236, // Warm golden canyon sand
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true,
    });

    // Saguaro Cactus Green
    this.cactusMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a27, // Desert olive green
      roughness: 0.75,
      metalness: 0.05,
    });

    // Weathered Western Wood (fences, signs)
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x4a3525,
      roughness: 0.9,
      metalness: 0.05,
    });

    // Tumbleweed Dry Thicket
    this.tumbleweedMat = new THREE.MeshStandardMaterial({
      color: 0x8a6f4d,
      roughness: 0.95,
      wireframe: true,
    });
  }

  buildSkyAndCelestials() {
    // 1. Dynamic Day-to-Night Sky Dome Shader
    const domeGeo = new THREE.SphereGeometry(220, 32, 24);
    this.skyUniforms = {
      uTime: { value: 0.0 }, // 0.0 = Noon, 0.5 = Sunset, 1.0 = Midnight
      uSunDir: { value: new THREE.Vector3(0.5, 0.8, -0.4).normalize() },
      // Colors for 3 stages:
      cDayZenith: { value: new THREE.Color(0x1d64b4) },    // Desert Sky Blue
      cDayHorizon: { value: new THREE.Color(0xf59e0b) },   // Warm Golden Sand Haze
      cSunsetZenith: { value: new THREE.Color(0x3b123d) }, // Deep Violet Dusk
      cSunsetHorizon: { value: new THREE.Color(0xe11d48) },// Fiery Crimson Sunset
      cNightZenith: { value: new THREE.Color(0x02040a) },  // Midnight Space Black
      cNightHorizon: { value: new THREE.Color(0x0c1426) }, // Deep Indigo Horizon
    };

    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: this.skyUniforms,
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 cDayZenith;
        uniform vec3 cDayHorizon;
        uniform vec3 cSunsetZenith;
        uniform vec3 cSunsetHorizon;
        uniform vec3 cNightZenith;
        uniform vec3 cNightHorizon;
        varying vec3 vWorldPos;

        void main() {
          vec3 dir = normalize(vWorldPos);
          float y = clamp(dir.y, 0.0, 1.0);
          float h = pow(1.0 - y, 2.5); // Horizon factor

          // Interpolate Day -> Sunset (uTime 0.0 -> 0.5)
          // Interpolate Sunset -> Night (uTime 0.5 -> 1.0)
          vec3 zenith, horizon;
          if (uTime < 0.5) {
            float t = uTime / 0.5;
            zenith = mix(cDayZenith, cSunsetZenith, t);
            horizon = mix(cDayHorizon, cSunsetHorizon, t);
          } else {
            float t = (uTime - 0.5) / 0.5;
            zenith = mix(cSunsetZenith, cNightZenith, t);
            horizon = mix(cSunsetHorizon, cNightHorizon, t);
          }

          vec3 skyColor = mix(zenith, horizon, h);
          gl_FragColor = vec4(skyColor, 1.0);
        }
      `,
    });

    this.skyDome = new THREE.Mesh(domeGeo, skyMat);
    this.group.add(this.skyDome);

    // 2. The Sun (Brilliant desert sun that sets as you scroll)
    this.sunGroup = new THREE.Group();
    this.sunGroup.name = 'SunGroup';

    // Core Solar Disc (Pure incandescent white/gold)
    const sunMesh = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, depthWrite: false })
    );
    this.sunMesh = sunMesh;
    this.sunGroup.add(sunMesh);

    // Inner Corona Flare Ring
    const sunCorona = new THREE.Mesh(
      new THREE.RingGeometry(4.4, 9.2, 64),
      new THREE.MeshBasicMaterial({
        color: 0xffd166,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    this.sunCorona = sunCorona;
    this.sunGroup.add(sunCorona);

    // Outer Atmospheric Desert Glow
    const sunGlow = new THREE.Mesh(
      new THREE.RingGeometry(8.5, 22.0, 64),
      new THREE.MeshBasicMaterial({
        color: 0xf39c12,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    this.sunGlow = sunGlow;
    this.sunGroup.add(sunGlow);

    // Radiant Sun Glare Cross-Rays (High Noon Desert Glare)
    this.sunRays = new THREE.Group();
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xfff0b3,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const rayH = new THREE.Mesh(new THREE.PlaneGeometry(36, 1.2), rayMat);
    const rayV = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 36), rayMat);
    const rayD1 = new THREE.Mesh(new THREE.PlaneGeometry(24, 0.8), rayMat);
    rayD1.rotation.z = Math.PI / 4;
    const rayD2 = new THREE.Mesh(new THREE.PlaneGeometry(24, 0.8), rayMat);
    rayD2.rotation.z = -Math.PI / 4;
    this.sunRays.add(rayH, rayV, rayD1, rayD2);
    this.sunGroup.add(this.sunRays);

    // Set initial daytime position
    this.sunGroup.position.set(9.5, 12.5, -48.0);
    this.group.add(this.sunGroup);

    // 3. The Moon (Crescent Moon rises as night arrives)
    this.moonGroup = new THREE.Group();
    const moonGeo = new THREE.CircleGeometry(5.0, 32);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf0f5ff, fog: false });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.moonGroup.add(moonMesh);

    // Crescent shadow cutout
    const moonShadow = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 32),
      new THREE.MeshBasicMaterial({ color: 0x050a16, fog: false })
    );
    moonShadow.position.set(1.6, 0.4, 0.05);
    this.moonGroup.add(moonShadow);

    this.moonGroup.position.set(-35, -20, -110); // Starts below horizon
    this.group.add(this.moonGroup);

    // 4. Midnight Desert Stars Field (Fades in at night)
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 210;

      // Keep mostly above horizon
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 5;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));

    this.starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.4,
      transparent: true,
      opacity: 0.0, // Hidden at noon, visible at night
      blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.group.add(this.stars);
  }

  buildTerrain() {
    // Vast undulating desert sand dunes
    const terrainGeo = new THREE.PlaneGeometry(160, 160, 48, 48);
    terrainGeo.rotateX(-Math.PI / 2);

    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Procedural sand dune ridges
      const dune1 = Math.sin(x * 0.06 + z * 0.04) * 1.8;
      const dune2 = Math.cos(x * 0.03 - z * 0.07) * 1.2;
      const noise = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.3;

      let y = dune1 + dune2 + noise - 1.6;
      // Flatten central pathway for camera clearance
      const distFromCenter = Math.sqrt(x * x * 0.5 + z * z * 0.2);
      if (distFromCenter < 12) {
        y *= distFromCenter / 12;
      }
      pos.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMesh = new THREE.Mesh(terrainGeo, this.sandMat);
    terrainMesh.receiveShadow = true;
    this.terrainMesh = terrainMesh;
    this.group.add(terrainMesh);
  }

  buildMesas() {
    // Monument Valley iconic flat-topped sandstone mesas & buttes
    const mesaData = [
      // Left Great Butte
      { pos: [-42, 6, -65], scale: [22, 18, 18] },
      // Distant Center Mesa (where sun sets)
      { pos: [12, 4, -85], scale: [36, 14, 24] },
      // Right Towering Spire Butte
      { pos: [45, 10, -60], scale: [18, 26, 16] },
      // Midground Left Canyon Wall
      { pos: [-24, 2, -32], scale: [12, 8, 14] },
      // Midground Right Rocky Ridge
      { pos: [26, 1, -28], scale: [14, 7, 12] },
    ];

    mesaData.forEach((m) => {
      const mesaGroup = new THREE.Group();
      mesaGroup.position.set(...m.pos);

      // Lower Sloped Talus Base
      const baseGeo = new THREE.CylinderGeometry(m.scale[0] * 0.7, m.scale[0], m.scale[1] * 0.45, 8);
      const base = new THREE.Mesh(baseGeo, this.rockDarkMat);
      base.castShadow = true;
      base.receiveShadow = true;
      mesaGroup.add(base);

      // Upper Sheer Cliff Wall
      const cliffGeo = new THREE.CylinderGeometry(m.scale[0] * 0.55, m.scale[0] * 0.68, m.scale[1] * 0.55, 8);
      const cliff = new THREE.Mesh(cliffGeo, this.rockMat);
      cliff.position.y = m.scale[1] * 0.5;
      cliff.castShadow = true;
      cliff.receiveShadow = true;
      mesaGroup.add(cliff);

      // Flat Mesa Cap
      const capGeo = new THREE.CylinderGeometry(m.scale[0] * 0.56, m.scale[0] * 0.55, m.scale[1] * 0.08, 8);
      const cap = new THREE.Mesh(capGeo, this.sandMat);
      cap.position.y = m.scale[1] * 0.8;
      mesaGroup.add(cap);

      this.group.add(mesaGroup);
    });
  }

  buildCacti() {
    // Classic Saguaro Cacti with thick ribbed trunks and curved branches
    const cactiPositions = [
      { x: -5.5, z: -4, scale: 1.1, rotY: 0.3 },
      { x: 6.2, z: -5, scale: 1.3, rotY: -0.5 },
      { x: -9, z: -10, scale: 1.5, rotY: 1.1 },
      { x: 12, z: -14, scale: 1.6, rotY: 0.8 },
      { x: -16, z: -20, scale: 2.1, rotY: -0.2 },
      { x: 18, z: -24, scale: 2.4, rotY: 1.6 },
      { x: -3.5, z: -12, scale: 0.9, rotY: -1.2 },
      { x: 4.8, z: -16, scale: 1.2, rotY: 0.4 },
    ];

    cactiPositions.forEach((cp) => {
      const cactus = new THREE.Group();
      cactus.position.set(cp.x, -1.4, cp.z);
      cactus.scale.setScalar(cp.scale);
      cactus.rotation.y = cp.rotY;

      // Central Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.6, 12);
      const trunk = new THREE.Mesh(trunkGeo, this.cactusMat);
      trunk.position.y = 1.3;
      trunk.castShadow = true;
      cactus.add(trunk);

      // Rounded Top
      const topGeo = new THREE.SphereGeometry(0.18, 12, 8);
      const top = new THREE.Mesh(topGeo, this.cactusMat);
      top.position.y = 2.6;
      cactus.add(top);

      // Left Arm (horizontal connector + vertical branch)
      const leftArmH = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.45, 10),
        this.cactusMat
      );
      leftArmH.rotation.z = Math.PI / 2;
      leftArmH.position.set(-0.3, 1.4, 0);
      cactus.add(leftArmH);

      const leftArmV = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.9, 10),
        this.cactusMat
      );
      leftArmV.position.set(-0.52, 1.85, 0);
      cactus.add(leftArmV);

      // Right Arm (higher up, offset)
      const rightArmH = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.5, 10),
        this.cactusMat
      );
      rightArmH.rotation.z = -Math.PI / 2;
      rightArmH.position.set(0.32, 1.7, 0.05);
      cactus.add(rightArmH);

      const rightArmV = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.11, 0.8, 10),
        this.cactusMat
      );
      rightArmV.position.set(0.56, 2.1, 0.05);
      cactus.add(rightArmV);

      this.group.add(cactus);
    });
  }

  buildFrontierProps() {
    // 1. Weathered Wooden Frontier Trail Signpost
    const signGroup = new THREE.Group();
    signGroup.position.set(-3.2, -1.4, -2.2);
    signGroup.rotation.y = 0.4;

    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 2.2, 8),
      this.woodMat
    );
    post.position.y = 1.1;
    post.castShadow = true;
    signGroup.add(post);

    // Signboard 1: "GUNSMOKE VALLEY"
    const board1 = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.22, 0.05),
      this.woodMat
    );
    board1.position.set(0.4, 1.8, 0.06);
    board1.rotation.z = -0.06;
    board1.castShadow = true;
    signGroup.add(board1);

    // Signboard 2: "NO MAN'S LAND"
    const board2 = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.2, 0.05),
      this.woodMat
    );
    board2.position.set(-0.35, 1.45, 0.06);
    board2.rotation.z = 0.08;
    board2.castShadow = true;
    signGroup.add(board2);

    this.group.add(signGroup);

    // 2. Frontier Wooden Rail Fence along the trail
    for (let i = 0; i < 5; i++) {
      const fencePost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.07, 1.4, 6),
        this.woodMat
      );
      fencePost.position.set(5.5 + i * 2.2, -0.7, -1.8 - i * 1.4);
      fencePost.castShadow = true;
      this.group.add(fencePost);

      if (i < 4) {
        const railUpper = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6),
          this.woodMat
        );
        railUpper.rotation.z = Math.PI / 2;
        railUpper.rotation.y = -0.55;
        railUpper.position.set(6.6 + i * 2.2, -0.35, -2.5 - i * 1.4);
        this.group.add(railUpper);
      }
    }
  }

  buildCampfire() {
    // Frontier Campfire (glows softly by day, blazes warmly at night!)
    const fireGroup = new THREE.Group();
    fireGroup.position.set(2.4, -1.35, -0.8);

    // Stone Circle
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.12, 1),
        this.rockDarkMat
      );
      stone.position.set(Math.cos(angle) * 0.45, 0.06, Math.sin(angle) * 0.45);
      fireGroup.add(stone);
    }

    // Crossed Charred Logs
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.65, 6),
        this.woodMat
      );
      log.rotation.z = Math.PI / 3;
      log.rotation.y = (i * Math.PI) / 2;
      log.position.y = 0.12;
      fireGroup.add(log);
    }

    // Glowing Flame Core
    this.fireMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.45, 8),
      new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.85,
      })
    );
    this.fireMesh.position.y = 0.28;
    fireGroup.add(this.fireMesh);

    // Campfire Point Light
    this.fireLight = new THREE.PointLight(0xff7722, 1.5, 12, 1.8);
    this.fireLight.position.set(0, 0.35, 0);
    this.fireLight.castShadow = true;
    fireGroup.add(this.fireLight);

    this.group.add(fireGroup);
  }

  buildTumbleweeds() {
    // Animated Tumbleweeds rolling across the dunes
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.IcosahedronGeometry(0.35 + Math.random() * 0.2, 1);
      const mesh = new THREE.Mesh(geo, this.tumbleweedMat);

      mesh.position.set(
        -15 + i * 8 + Math.random() * 4,
        -1.0 + Math.random() * 0.3,
        -6 - i * 5
      );
      mesh.castShadow = true;

      this.group.add(mesh);
      this.tumbleweeds.push({
        mesh,
        speedX: 1.2 + Math.random() * 1.5,
        rotSpeed: 2.0 + Math.random() * 1.5,
        baseY: mesh.position.y,
        bounceOffset: Math.random() * Math.PI,
      });
    }
  }

  buildNightEmbers() {
    // Campfire Embers & Desert Fireflies rising into the night sky
    const emberCount = 120;
    const emberGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(emberCount * 3);

    for (let i = 0; i < emberCount; i++) {
      positions[i * 3] = 2.4 + (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 1] = -1.0 + Math.random() * 5.0;
      positions[i * 3 + 2] = -0.8 + (Math.random() - 0.5) * 1.5;

      this.embers.push({
        baseX: 2.4,
        baseZ: -0.8,
        speedY: 0.6 + Math.random() * 0.8,
        driftSpeed: 1.5 + Math.random(),
        seed: Math.random() * 10,
      });
    }

    emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.emberMat = new THREE.PointsMaterial({
      color: 0xff8811,
      size: 0.08,
      transparent: true,
      opacity: 0.0, // Fades in as it gets dark
      blending: THREE.AdditiveBlending,
    });

    this.emberPoints = new THREE.Points(emberGeo, this.emberMat);
    this.group.add(this.emberPoints);
  }

  /**
   * Update Day-to-Night Transition synced to scrollProgress
   * @param {number} progress 0.0 (High Noon) -> 0.5 (Sunset) -> 1.0 (Midnight)
   * @param {number} delta Frame elapsed time
   * @param {object} lights Key/Fill lights reference
   * @param {THREE.Camera} camera Camera instance for billboarding
   */
  updateTimeOfDay(progress, delta, lights, camera) {
    this.timeOfDay = Math.max(0, Math.min(1, progress));
    const t = this.timeOfDay;

    // 1. Update Sky Dome Shader Uniform
    if (this.skyUniforms) {
      this.skyUniforms.uTime.value = t;
    }

    // 2. Celestial Movements: Sun descends and sets, Moon rises
    if (t < 0.55) {
      this.sunGroup.visible = true;
      const sunsetFactor = Math.min(1.0, t / 0.50);

      // Sun position: Starts high and prominent in daytime sky (X: 9.5, Y: 12.5, Z: -48.0)
      // Descends smoothly in a gentle arc towards the western mesas
      const sunProg = Math.min(1.0, t / 0.52);
      const sunX = THREE.MathUtils.lerp(9.5, 2.5, sunProg);
      const sunY = THREE.MathUtils.lerp(12.5, -4.5, Math.pow(sunProg, 1.25));
      const sunZ = -48.0;
      this.sunGroup.position.set(sunX, sunY, sunZ);

      // Color progression: Brilliant noon white/gold -> Warm afternoon -> Fiery sunset blood orange
      if (sunsetFactor < 0.5) {
        const st = sunsetFactor / 0.5;
        this.sunMesh.material.color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xfff3b0), st);
        this.sunCorona.material.color.lerpColors(new THREE.Color(0xffd166), new THREE.Color(0xfb8500), st);
        this.sunGlow.material.color.lerpColors(new THREE.Color(0xf39c12), new THREE.Color(0xe85d04), st);
      } else {
        const st = (sunsetFactor - 0.5) / 0.5;
        this.sunMesh.material.color.lerpColors(new THREE.Color(0xfff3b0), new THREE.Color(0xff5722), st);
        this.sunCorona.material.color.lerpColors(new THREE.Color(0xfb8500), new THREE.Color(0xd90429), st);
        this.sunGlow.material.color.lerpColors(new THREE.Color(0xe85d04), new THREE.Color(0x7209b7), st);
      }

      if (this.sunRays) {
        this.sunRays.scale.setScalar(Math.max(0.01, 1.0 - sunsetFactor * 0.75));
      }
    } else {
      this.sunGroup.visible = false;
    }

    // Moon rises as night arrives (t > 0.40)
    if (t > 0.40) {
      const moonProg = (t - 0.40) / 0.60;
      const moonX = THREE.MathUtils.lerp(15.0, -9.0, moonProg);
      const moonY = THREE.MathUtils.lerp(-8.0, 13.5, Math.sin(moonProg * Math.PI * 0.5));
      const moonZ = -50.0;
      this.moonGroup.position.set(moonX, moonY, moonZ);
      this.moonGroup.visible = true;
    } else {
      this.moonGroup.visible = false;
    }

    // Always billboard Sun & Moon to face camera perpendicular
    if (camera) {
      this.sunGroup.quaternion.copy(camera.quaternion);
      this.moonGroup.quaternion.copy(camera.quaternion);
    }

    // 3. Stars fade in at twilight/night
    if (this.starMat) {
      if (t > 0.45) {
        this.starMat.opacity = Math.min(1.0, (t - 0.45) / 0.4);
      } else {
        this.starMat.opacity = 0.0;
      }
    }

    // 4. Dynamic Lighting Shift (Sun Key Light -> Moon Key Light)
    if (lights) {
      if (t < 0.55) {
        // Daytime / Sunset Sun Key Light
        const sunIntensity = THREE.MathUtils.lerp(2.5, 0.4, t / 0.55);
        lights.keyLight.intensity = sunIntensity;
        lights.keyLight.color.setHex(t > 0.35 ? 0xff6633 : 0xffeed6);
        lights.keyLight.position.set(sunX * 0.1, Math.max(1, sunY * 0.1), 5);

        // Fill Light
        lights.fillLight.intensity = THREE.MathUtils.lerp(1.2, 0.3, t / 0.55);
        lights.fillLight.color.setHex(0x5ca8d8);

        // Ambient / Hemisphere Light
        lights.hemiLight.color.setHex(t > 0.35 ? 0xff9966 : 0xffecd4);
        lights.hemiLight.groundColor.setHex(0x73361a);
        lights.hemiLight.intensity = THREE.MathUtils.lerp(1.0, 0.35, t / 0.55);
      } else {
        // Nighttime Moonlight
        const nightProg = (t - 0.55) / 0.45;
        lights.keyLight.intensity = THREE.MathUtils.lerp(0.4, 0.9, nightProg);
        lights.keyLight.color.setHex(0x7ca5d8); // Cool silvery moonlight
        lights.keyLight.position.set(-2, 5, 2);

        lights.fillLight.intensity = 0.25;
        lights.fillLight.color.setHex(0x182845);

        lights.hemiLight.color.setHex(0x18243c);
        lights.hemiLight.groundColor.setHex(0x060910);
        lights.hemiLight.intensity = THREE.MathUtils.lerp(0.35, 0.25, nightProg);
      }
    }

    // 5. Campfire Flame & Night Embers
    if (this.fireLight) {
      // Flame flickers realistically
      const flicker = (Math.random() - 0.5) * 0.4;
      const nightFlameMultiplier = THREE.MathUtils.lerp(0.8, 3.2, t);
      this.fireLight.intensity = (1.8 + flicker) * nightFlameMultiplier;
      this.fireMesh.scale.set(
        1.0 + Math.sin(delta * 10) * 0.15,
        1.0 + Math.cos(delta * 15) * 0.25,
        1.0
      );

      // Embers visibility
      if (this.emberMat) {
        this.emberMat.opacity = THREE.MathUtils.lerp(0.05, 0.95, t);
      }
    }

    // 6. Update Rolling Tumbleweeds
    const windSpeed = 1.0;
    this.tumbleweeds.forEach((tw) => {
      tw.mesh.position.x += tw.speedX * delta * windSpeed;
      tw.mesh.rotation.z -= tw.rotSpeed * delta;
      tw.mesh.rotation.y += delta * 0.5;

      // Small bounce on the sand
      tw.bounceOffset += delta * 4;
      tw.mesh.position.y = tw.baseY + Math.abs(Math.sin(tw.bounceOffset)) * 0.25;

      // Wrap around desert bounds
      if (tw.mesh.position.x > 25) {
        tw.mesh.position.x = -25;
      }
    });

    // 7. Update Night Embers rising
    if (this.emberPoints && this.emberMat.opacity > 0.05) {
      const pos = this.emberPoints.geometry.attributes.position.array;
      for (let i = 0; i < this.embers.length; i++) {
        const emb = this.embers[i];
        pos[i * 3 + 1] += emb.speedY * delta; // rise up
        pos[i * 3] += Math.sin(emb.seed + delta * 2) * delta * 0.4;

        // Reset once above campfire
        if (pos[i * 3 + 1] > 4.5) {
          pos[i * 3] = emb.baseX + (Math.random() - 0.5) * 0.4;
          pos[i * 3 + 1] = -1.1;
          pos[i * 3 + 2] = emb.baseZ + (Math.random() - 0.5) * 0.4;
        }
      }
      this.emberPoints.geometry.attributes.position.needsUpdate = true;
    }
  }
}
