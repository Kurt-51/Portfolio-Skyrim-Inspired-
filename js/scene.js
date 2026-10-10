import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { WildWestWorld } from './west-world.js';
import { PORTFOLIO_DATA } from './data.js';

/**
 * Three.js Scene Manager
 * - 3D Wild Wild West Environment (red rock buttes, dunes, cacti, tumbleweeds, campfire)
 * - Scroll-driven Day-to-Sunset-to-Night sky and celestial cycle
 * - First-Person POV Gunslinger firing mechanics with bullet tracers & terrain impact sparks
 */

export class SceneManager {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.canvas = document.getElementById('webgl-canvas');

    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();

    this.initRenderer();
    this.initCamera();
    this.initLighting();

    // 3D Wild West World (Replaces the character)
    this.westWorld = new WildWestWorld(this.scene);

    // Aim Target Raycaster & Mouse State
    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2(0, 0);
    this.targetWorldPoint = new THREE.Vector3(0, 0, -20);

    // Camera Motion & Scroll Interpolation
    this.scrollProgress = 0;
    this.currentCamPos = new THREE.Vector3(0, 2.2, 8.0);
    this.targetCamPos = new THREE.Vector3(0, 2.2, 8.0);
    this.currentCamLookAt = new THREE.Vector3(0, 1.2, -10.0);
    this.targetCamLookAt = new THREE.Vector3(0, 1.2, -10.0);
    this.parallaxOffset = new THREE.Vector2(0, 0);

    // Camera Mode: 'scroll' vs 'free-orbit'
    this.mode = 'scroll';
    this.orbitAngles = { yaw: 0, pitch: 0.15, distance: 9.0 };
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };

    // Gunfire FX: Bullet Tracers & Rock Impact Sparks
    this.initGunfireFX();

    // Bindings
    this.bindEvents();

    // Start Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    );
    this.camera.position.set(0, 2.2, 8.0);
    this.camera.lookAt(0, 1.2, -10.0);
  }

  initLighting() {
    // 1. Ambient Hemisphere Light
    this.hemiLight = new THREE.HemisphereLight(0xffecd4, 0x5a2d12, 1.0);
    this.scene.add(this.hemiLight);

    // 2. Key Sun Light (Warm desert sunlight, dynamically transitions to moonlight)
    this.keyLight = new THREE.DirectionalLight(0xffeed6, 2.5);
    this.keyLight.position.set(20, 35, 15);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.bias = -0.0004;
    this.scene.add(this.keyLight);

    // 3. Fill Light (Sky bounce)
    this.fillLight = new THREE.DirectionalLight(0x5da8d8, 1.2);
    this.fillLight.position.set(-20, 15, -10);
    this.scene.add(this.fillLight);
  }

  initGunfireFX() {
    // Bullet Tracer Line
    const tracerGeo = new THREE.BufferGeometry();
    const tracerPositions = new Float32Array(6); // 2 vertices
    tracerGeo.setAttribute('position', new THREE.BufferAttribute(tracerPositions, 3));
    this.tracerMat = new THREE.LineBasicMaterial({
      color: 0xffd055,
      transparent: true,
      opacity: 0,
      linewidth: 3,
      blending: THREE.AdditiveBlending,
    });
    this.tracerLine = new THREE.Line(tracerGeo, this.tracerMat);
    this.scene.add(this.tracerLine);
    this.tracerLife = 0;

    // Rock & Sand Impact Sparks
    this.maxSparks = 60;
    this.sparks = [];
    this.sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    this.sparkMat = new THREE.PointsMaterial({
      color: 0xffe6a8,
      size: 0.12,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });
    this.sparkPoints = new THREE.Points(this.sparkGeo, this.sparkMat);
    this.sparkPoints.visible = false;
    this.scene.add(this.sparkPoints);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Pointer Tracking for Camera Parallax and Crosshair Aiming
    window.addEventListener('pointermove', (e) => {
      this.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.parallaxOffset.x = this.mouseNDC.x * 0.35;
      this.parallaxOffset.y = this.mouseNDC.y * 0.22;

      this.updateAimRay();

      if (this.mode === 'free-orbit' && this.isDragging) {
        const dx = e.clientX - this.prevMouse.x;
        const dy = e.clientY - this.prevMouse.y;
        this.orbitAngles.yaw -= dx * 0.005;
        this.orbitAngles.pitch = THREE.MathUtils.clamp(
          this.orbitAngles.pitch + dy * 0.005,
          -0.15,
          0.7
        );
        this.prevMouse = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('pointerdown', (e) => {
      if (this.mode === 'free-orbit') {
        this.isDragging = true;
        this.prevMouse = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    // Scroll Integration: Drives Day-to-Night and Camera Flight through Wild West
    window.addEventListener('scroll', () => {
      if (this.mode !== 'scroll') return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      this.scrollProgress = window.scrollY / maxScroll;
      this.updateScrollCamera(this.scrollProgress);
    });
  }

  updateAimRay() {
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    // Find impact point on ground or distance
    const hitPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.5);
    const hitPoint = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(hitPlane, hitPoint);
    if (hit) {
      this.targetWorldPoint.copy(hitPoint);
    } else {
      this.raycaster.ray.at(40, this.targetWorldPoint);
    }
  }

  /**
   * Cinematic Wild West Flight Path Synced to Portfolio Chapters
   */
  updateScrollCamera(progress) {
    const p = Math.max(0, Math.min(1, progress));

    if (p < 0.25) {
      // 0.0 - 0.25: Hero (High Noon Over Canyon)
      const t = p / 0.25;
      this.targetCamPos.set(
        THREE.MathUtils.lerp(0, 2.5, t),
        THREE.MathUtils.lerp(2.2, 1.8, t),
        THREE.MathUtils.lerp(8.0, 5.2, t)
      );
      this.targetCamLookAt.set(
        THREE.MathUtils.lerp(0, 1.5, t),
        THREE.MathUtils.lerp(1.2, 0.8, t),
        THREE.MathUtils.lerp(-10.0, -14.0, t)
      );
    } else if (p < 0.5) {
      // 0.25 - 0.50: About & Identity (Golden Hour Past Saguaro & Fence)
      const t = (p - 0.25) / 0.25;
      this.targetCamPos.set(
        THREE.MathUtils.lerp(2.5, -3.2, t),
        THREE.MathUtils.lerp(1.8, 1.4, t),
        THREE.MathUtils.lerp(5.2, 3.8, t)
      );
      this.targetCamLookAt.set(
        THREE.MathUtils.lerp(1.5, -2.0, t),
        THREE.MathUtils.lerp(0.8, 0.6, t),
        THREE.MathUtils.lerp(-14.0, -18.0, t)
      );
    } else if (p < 0.75) {
      // 0.50 - 0.75: Arsenal & Missions (Sunset Over Great Western Mesa)
      const t = (p - 0.5) / 0.25;
      this.targetCamPos.set(
        THREE.MathUtils.lerp(-3.2, 1.8, t),
        THREE.MathUtils.lerp(1.4, 0.9, t),
        THREE.MathUtils.lerp(3.8, 2.4, t)
      );
      this.targetCamLookAt.set(
        THREE.MathUtils.lerp(-2.0, 2.2, t),
        THREE.MathUtils.lerp(0.6, 0.3, t),
        THREE.MathUtils.lerp(-18.0, -12.0, t)
      );
    } else {
      // 0.75 - 1.0: Works & Comms (Midnight Under Starry Sky & Campfire)
      const t = (p - 0.75) / 0.25;
      this.targetCamPos.set(
        THREE.MathUtils.lerp(1.8, 0.2, t),
        THREE.MathUtils.lerp(0.9, 1.2, t),
        THREE.MathUtils.lerp(2.4, 4.2, t)
      );
      this.targetCamLookAt.set(
        THREE.MathUtils.lerp(2.2, 0.0, t),
        THREE.MathUtils.lerp(0.3, 1.8, t),
        THREE.MathUtils.lerp(-12.0, -25.0, t) // Look up at the stars and crescent moon!
      );
    }
  }

  setCameraPreset(presetIndex) {
    const presets = [
      { pos: [0, 2.2, 8.0], target: [0, 1.2, -10.0] },      // 01: Valley Vista
      { pos: [5.2, 1.6, 4.0], target: [0, 1.0, -12.0] },    // 02: Saguaro Ridge
      { pos: [2.8, 0.6, 1.4], target: [2.4, -0.8, -1.0] },  // 03: Campfire Glow
      { pos: [-4.5, 2.0, 3.2], target: [8.0, 3.0, -35.0] }, // 04: Mesa Sunset
      { pos: [0, 7.5, 12.0], target: [0, 0, -20.0] },       // 05: High Sightline
    ];

    const preset = presets[presetIndex];
    if (!preset) return;
    this.targetCamPos.set(...preset.pos);
    this.targetCamLookAt.set(...preset.target);
  }

  setMode(mode) {
    this.mode = mode;
  }

  /**
   * First-Person Gunslinger Shot Trigger
   * Fires a blazing bullet tracer from the camera into the desert canyon,
   * producing rock impact sparks, screen kick, and muzzle illumination.
   */
  triggerFire() {
    this.updateAimRay();

    // 1. Bullet Tracer from lower-right viewport to target
    const muzzleOrigin = new THREE.Vector3(0.4, -0.3, -0.6);
    muzzleOrigin.applyMatrix4(this.camera.matrixWorld);

    const targetPos = this.targetWorldPoint.clone();

    const tracerPos = this.tracerLine.geometry.attributes.position.array;
    tracerPos[0] = muzzleOrigin.x;
    tracerPos[1] = muzzleOrigin.y;
    tracerPos[2] = muzzleOrigin.z;
    tracerPos[3] = targetPos.x;
    tracerPos[4] = targetPos.y;
    tracerPos[5] = targetPos.z;
    this.tracerLine.geometry.attributes.position.needsUpdate = true;

    this.tracerLife = 1.0;
    this.tracerMat.opacity = 1.0;

    // 2. Rock Impact Sparks at target hit location
    this.sparkPoints.visible = true;
    const positions = this.sparkGeo.attributes.position.array;
    this.sparks = [];

    for (let i = 0; i < this.maxSparks; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 5.0;
      this.sparks.push({
        pos: targetPos.clone(),
        vel: new THREE.Vector3(
          Math.cos(angle) * speed * 0.5,
          Math.random() * speed * 0.8 + 1.2,
          Math.sin(angle) * speed * 0.5
        ),
        life: 1.0,
      });
      positions[i * 3] = targetPos.x;
      positions[i * 3 + 1] = targetPos.y;
      positions[i * 3 + 2] = targetPos.z;
    }
    this.sparkGeo.attributes.position.needsUpdate = true;

    // 3. Screen Recoil Kick
    this.camera.position.y += 0.08;
    this.camera.position.x += (Math.random() - 0.5) * 0.06;

    return targetPos;
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // 1. Update Wild West World & Day-to-Night cycle
    if (this.westWorld) {
      this.westWorld.updateTimeOfDay(this.scrollProgress, delta, {
        keyLight: this.keyLight,
        fillLight: this.fillLight,
        hemiLight: this.hemiLight,
      }, this.camera);
    }

    // 2. Camera interpolation
    if (this.mode === 'scroll') {
      this.currentCamPos.lerp(this.targetCamPos, 0.07);
      this.currentCamLookAt.lerp(this.targetCamLookAt, 0.07);

      this.camera.position.copy(this.currentCamPos);
      this.camera.position.x += this.parallaxOffset.x;
      this.camera.position.y += this.parallaxOffset.y;
      this.camera.lookAt(this.currentCamLookAt);
    } else {
      // Free orbit mode
      const d = this.orbitAngles.distance;
      const x = Math.sin(this.orbitAngles.yaw) * Math.cos(this.orbitAngles.pitch) * d;
      const y = Math.sin(this.orbitAngles.pitch) * d + 1.2;
      const z = Math.cos(this.orbitAngles.yaw) * Math.cos(this.orbitAngles.pitch) * d;
      this.camera.position.lerp(new THREE.Vector3(x, y, z), 0.1);
      this.camera.lookAt(0, 0.8, -10.0);
    }

    // 3. Bullet Tracer Fade
    if (this.tracerLife > 0) {
      this.tracerLife -= delta * 14;
      if (this.tracerLife <= 0) {
        this.tracerLife = 0;
        this.tracerMat.opacity = 0;
      } else {
        this.tracerMat.opacity = this.tracerLife;
      }
    }

    // 4. Impact Sparks Physics
    if (this.sparks.length > 0) {
      const positions = this.sparkGeo.attributes.position.array;
      let aliveCount = 0;
      for (let i = 0; i < this.sparks.length; i++) {
        const s = this.sparks[i];
        if (s.life > 0) {
          s.life -= delta * 3.2;
          s.pos.addScaledVector(s.vel, delta);
          s.vel.y -= delta * 6.5; // gravity
          positions[i * 3] = s.pos.x;
          positions[i * 3 + 1] = s.pos.y;
          positions[i * 3 + 2] = s.pos.z;
          aliveCount++;
        }
      }
      this.sparkGeo.attributes.position.needsUpdate = true;
      if (aliveCount === 0) {
        this.sparkPoints.visible = false;
        this.sparks = [];
      }
    }

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}
