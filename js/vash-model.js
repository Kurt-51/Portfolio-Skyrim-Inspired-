import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * 3D Vash the Stampede (Trigun Stampede 2023 Edition)
 * Accurately styled to the official Studio Orange key visual:
 * - Faces the screen forward (+Z) in an athletic combat stance
 * - Oversized red duster coat billowing open with dark teal inner lining & zipper trim
 * - Form-fitting black high-neck undershirt & slim black cargo pants
 * - Sweeping yellow-blond bangs with dark shaved undercut & amber sunglasses
 * - Articulated cybernetic left arm (slate/chrome plates, glowing cyan Plant conduits)
 * - Dynamic right arm aiming the custom .45 revolver straight at the screen/cursor
 */

export class VashCharacter {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'VashCharacter';

    // Materials
    this.initMaterials();

    // Rigging & Animation Pivots
    this.pivots = {};

    // Aim & Recoil State
    this.aimTarget = new THREE.Vector3(0, 0.4, 3.5);
    this.isAiming = true;
    this.windTime = 0;
    this.recoil = {
      pitch: 0,
      slide: 0,
      recoverySpeed: 18,
    };
    this.cylinderRotation = 0;
    this.flashLife = 0;

    // Build the Character facing the screen (+Z)
    this.buildCharacter();
    this.scene.add(this.group);
  }

  initMaterials() {
    // 1. Vibrant Crimson Coat Outer Shell (Trigun Stampede Red)
    this.coatOuterMat = new THREE.MeshStandardMaterial({
      color: 0xc8182b,
      roughness: 0.38,
      metalness: 0.12,
    });

    // 2. Dark Teal / Slate-Cyan Coat Inner Lining (Signature 2023 design)
    this.coatInnerMat = new THREE.MeshStandardMaterial({
      color: 0x122a36,
      roughness: 0.5,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    // 3. Thick Black Zipper & Belt Hardware
    this.zipperMat = new THREE.MeshStandardMaterial({
      color: 0x22242a,
      roughness: 0.45,
      metalness: 0.6,
    });

    // 4. Black Compression Undershirt & Cargo Pants
    this.blackClothMat = new THREE.MeshStandardMaterial({
      color: 0x101115,
      roughness: 0.7,
      metalness: 0.1,
    });

    // 5. Stylized Anime Skin
    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xf7d5be,
      roughness: 0.5,
      metalness: 0.05,
    });

    // 6. Vibrant Golden-Yellow Hair Bangs
    this.hairBlondMat = new THREE.MeshStandardMaterial({
      color: 0xfad02c,
      roughness: 0.35,
      metalness: 0.08,
    });

    // 7. Dark Brown Shaved Undercut Hair
    this.hairDarkMat = new THREE.MeshStandardMaterial({
      color: 0x281e18,
      roughness: 0.65,
      metalness: 0.05,
    });

    // 8. Amber-Orange Sunglasses Lenses
    this.sunglassesLensMat = new THREE.MeshPhysicalMaterial({
      color: 0xff6f00,
      transmission: 0.75,
      opacity: 0.95,
      transparent: true,
      roughness: 0.12,
      metalness: 0.1,
      ior: 1.5,
    });

    // 9. Thin Gold Wire Frames
    this.goldWireMat = new THREE.MeshStandardMaterial({
      color: 0xe6a800,
      roughness: 0.25,
      metalness: 0.95,
    });

    // 10. Cybernetic Arm - Glossy Slate-Teal Armor Plates
    this.cyberArmorMat = new THREE.MeshStandardMaterial({
      color: 0x183240,
      roughness: 0.22,
      metalness: 0.88,
    });

    // 11. Cybernetic Arm - Polished Chrome Pistons & Hand
    this.cyberChromeMat = new THREE.MeshStandardMaterial({
      color: 0xdde5eb,
      roughness: 0.18,
      metalness: 0.96,
    });

    // 12. Plant Energy Core & Conduits (Pulsing Cyan Glow)
    this.plantGlowMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.2,
      roughness: 0.2,
      metalness: 0.3,
    });

    // 13. Custom .45 Long Colt Gunmetal Weapon
    this.gunMetalMat = new THREE.MeshStandardMaterial({
      color: 0x2b2e36,
      roughness: 0.28,
      metalness: 0.9,
    });

    this.gunSilverMat = new THREE.MeshStandardMaterial({
      color: 0xc4cdd4,
      roughness: 0.2,
      metalness: 0.95,
    });

    // 14. Red Laser Targeting Sight
    this.laserMat = new THREE.MeshBasicMaterial({
      color: 0xff1035,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });
  }

  buildCharacter() {
    this.charRoot = new THREE.Group();
    // Position character grounded in viewport, FACING FORWARD (+Z)
    this.charRoot.position.set(0, -1.3, 0);
    this.charRoot.rotation.y = 0; // Exactly facing the screen!
    this.group.add(this.charRoot);

    // 1. Dynamic Stance Legs (Grounded wide combat lunge)
    this.buildLegs(this.charRoot);

    // 2. Torso, Black Undershirt, Open Billowing Red Coat & Hood
    this.buildTorso(this.charRoot);

    // 3. Head, Side-Swept Blond Bangs, Undercut & Orange Glasses
    this.buildHead(this.pivots.chest);

    // 4. Cybernetic Left Arm (Viewer's Right, +X side)
    this.buildCyberneticLeftArm(this.pivots.chest);

    // 5. Gun Right Arm (Viewer's Left, -X side)
    this.buildGunRightArm(this.pivots.chest);
  }

  buildLegs(parent) {
    const legsGroup = new THREE.Group();

    // Pelvis (Black Combat Pants)
    const pelvis = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.18, 0.22),
      this.blackClothMat
    );
    pelvis.position.set(0, 1.02, 0);
    legsGroup.add(pelvis);

    // Tactical Webbing Belt with Gun Holster on Right Thigh
    const belt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.19, 0.06, 16),
      this.zipperMat
    );
    belt.position.set(0, 1.1, 0);
    legsGroup.add(belt);

    // RIGHT LEG (Viewer's Left: x < 0) - Stepped forward into +Z
    const rightLeg = new THREE.Group();
    rightLeg.position.set(-0.18, 0.98, 0.08);

    const rightThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.07, 0.44, 12),
      this.blackClothMat
    );
    rightThigh.position.set(-0.04, -0.2, 0.06);
    rightThigh.rotation.x = -0.15;
    rightThigh.rotation.z = 0.18;
    rightLeg.add(rightThigh);

    // Right Thigh Holster
    const holster = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.22, 0.12),
      this.zipperMat
    );
    holster.position.set(-0.13, -0.2, 0.06);
    holster.rotation.z = 0.18;
    rightLeg.add(holster);

    // Right Shin
    const rightShin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.06, 0.46, 12),
      this.blackClothMat
    );
    rightShin.position.set(-0.09, -0.62, 0.12);
    rightShin.rotation.x = 0.1;
    rightLeg.add(rightShin);

    // Right Ankle (Showing small strip of skin)
    const rightAnkle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.06, 10),
      this.skinMat
    );
    rightAnkle.position.set(-0.09, -0.86, 0.14);
    rightLeg.add(rightAnkle);

    // Right Black Low-Top Shoe
    const rightShoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.07, 0.22),
      this.blackClothMat
    );
    rightShoe.position.set(-0.09, -0.91, 0.2);
    rightShoe.rotation.y = 0.25;
    rightLeg.add(rightShoe);

    legsGroup.add(rightLeg);

    // LEFT LEG (Viewer's Right: x > 0) - Extended back and outward in dynamic lunge
    const leftLeg = new THREE.Group();
    leftLeg.position.set(0.18, 0.98, -0.06);

    const leftThigh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.07, 0.48, 12),
      this.blackClothMat
    );
    leftThigh.position.set(0.1, -0.2, -0.08);
    leftThigh.rotation.x = 0.22;
    leftThigh.rotation.z = -0.32;
    leftLeg.add(leftThigh);

    // Left Shin
    const leftShin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.06, 0.48, 12),
      this.blackClothMat
    );
    leftShin.position.set(0.24, -0.6, -0.16);
    leftShin.rotation.x = -0.18;
    leftShin.rotation.z = -0.25;
    leftLeg.add(leftShin);

    // Left Ankle
    const leftAnkle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.06, 10),
      this.skinMat
    );
    leftAnkle.position.set(0.32, -0.84, -0.2);
    leftLeg.add(leftAnkle);

    // Left Shoe
    const leftShoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.07, 0.22),
      this.blackClothMat
    );
    leftShoe.position.set(0.34, -0.89, -0.16);
    leftShoe.rotation.y = -0.4;
    leftLeg.add(leftShoe);

    legsGroup.add(leftLeg);
    parent.add(legsGroup);
  }

  buildTorso(parent) {
    const spine = new THREE.Group();
    spine.position.set(0, 1.12, 0);
    this.pivots.spine = spine;

    const chest = new THREE.Group();
    chest.position.set(0, 0.26, 0);
    this.pivots.chest = chest;
    spine.add(chest);

    // 1. Black High-Neck Compression Undershirt
    const shirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.16, 0.44, 16),
      this.blackClothMat
    );
    shirt.position.set(0, 0.18, 0.01);
    chest.add(shirt);

    // High Turtleneck Collar
    const highCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.11, 0.12, 16),
      this.blackClothMat
    );
    highCollar.position.set(0, 0.43, 0.02);
    chest.add(highCollar);

    // 2. Open Red Parka / Coat Outer Shell
    // Back Panel
    const coatBack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.22, 0.48, 16, 1, true, Math.PI * 0.5, Math.PI),
      this.coatOuterMat
    );
    coatBack.position.set(0, 0.18, -0.01);
    chest.add(coatBack);

    // Right Billowing Lapel (Viewer's Left, x < 0)
    const rightLapel = new THREE.Group();
    rightLapel.position.set(-0.21, 0.18, 0.06);
    rightLapel.rotation.y = 0.45;

    const rightLapelOuter = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.48),
      this.coatOuterMat
    );
    rightLapel.add(rightLapelOuter);

    const rightLapelInner = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.48),
      this.coatInnerMat
    );
    rightLapelInner.rotation.y = Math.PI;
    rightLapel.add(rightLapelInner);

    // Zipper Track detail on edge
    const rZip = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.48, 0.015),
      this.zipperMat
    );
    rZip.position.set(0.11, 0, 0.005);
    rightLapel.add(rZip);

    chest.add(rightLapel);

    // Left Billowing Lapel (Viewer's Right, x > 0)
    const leftLapel = new THREE.Group();
    leftLapel.position.set(0.21, 0.18, 0.06);
    leftLapel.rotation.y = -0.45;

    const leftLapelOuter = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.48),
      this.coatOuterMat
    );
    leftLapel.add(leftLapelOuter);

    const leftLapelInner = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.48),
      this.coatInnerMat
    );
    leftLapelInner.rotation.y = Math.PI;
    leftLapel.add(leftLapelInner);

    const lZip = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.48, 0.015),
      this.zipperMat
    );
    lZip.position.set(-0.11, 0, 0.005);
    leftLapel.add(lZip);

    chest.add(leftLapel);

    // 3. Oversized Coat Hood (Resting folded behind neck at -Z)
    const hood = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      this.coatOuterMat
    );
    hood.position.set(0, 0.38, -0.16);
    hood.rotation.x = -1.2;
    chest.add(hood);

    // 4. Dramatic Flowing Coat Tails (Billowing backward and outward)
    this.coatTails = [];
    const tailConfigs = [
      { x: -0.18, rotY: 0.3, rotZ: 0.25, width: 0.28, length: 1.25, offset: 0 },
      { x: 0.18, rotY: -0.3, rotZ: -0.25, width: 0.28, length: 1.35, offset: 1.8 },
      { x: 0, rotY: 0, rotZ: 0, width: 0.32, length: 1.15, offset: 0.9 },
    ];

    tailConfigs.forEach((cfg) => {
      const tailPivot = new THREE.Group();
      tailPivot.position.set(cfg.x, 0, -0.1);
      tailPivot.rotation.y = cfg.rotY;
      tailPivot.rotation.z = cfg.rotZ;

      // Outer Red
      const tailOuter = new THREE.Mesh(
        new THREE.PlaneGeometry(cfg.width, cfg.length, 3, 6),
        this.coatOuterMat
      );
      tailOuter.position.set(0, -cfg.length * 0.5, 0);
      tailOuter.castShadow = true;
      tailPivot.add(tailOuter);

      // Inner Dark Teal
      const tailInner = new THREE.Mesh(
        new THREE.PlaneGeometry(cfg.width, cfg.length, 3, 6),
        this.coatInnerMat
      );
      tailInner.position.set(0, -cfg.length * 0.5, -0.002);
      tailInner.rotation.y = Math.PI;
      tailPivot.add(tailInner);

      spine.add(tailPivot);
      this.coatTails.push({ pivot: tailPivot, offset: cfg.offset });
    });

    parent.add(spine);
  }

  buildHead(parent) {
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.48, 0.03);
    this.pivots.head = headPivot;

    // Face / Head mesh (Facing +Z)
    const headMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.125, 18, 18),
      this.skinMat
    );
    headMesh.position.set(0, 0.08, 0);
    headMesh.scale.set(0.88, 1.12, 0.95);
    headPivot.add(headMesh);

    // Left Earring Stud (Viewer's Right, +X side)
    const earring = new THREE.Mesh(
      new THREE.TorusGeometry(0.015, 0.003, 8, 16),
      this.cyberChromeMat
    );
    earring.position.set(0.12, 0.08, 0);
    earring.rotation.y = Math.PI / 2;
    headPivot.add(earring);

    // --- HAIR: Trigun Stampede Side-Swept Bangs & Undercut ---
    const hairGroup = new THREE.Group();

    // Dark Shaved Undercut Base (on viewer's left side: x < 0)
    const undercut = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 14, 14, 0, Math.PI, 0, Math.PI),
      this.hairDarkMat
    );
    undercut.position.set(-0.02, 0.09, -0.02);
    undercut.scale.set(0.9, 1.08, 0.95);
    hairGroup.add(undercut);

    // Main Golden-Yellow Spikes & Sweeping Bangs
    // Big layered bangs draping across forehead toward +X / viewer's right
    const bangsData = [
      // Signature sweeping front bangs (covers left forehead and swoops down)
      { pos: [0.03, 0.18, 0.12], rot: [0.65, 0.3, -0.4], scale: [0.07, 0.26, 0.07] },
      { pos: [-0.04, 0.17, 0.13], rot: [0.75, -0.1, -0.2], scale: [0.065, 0.24, 0.065] },
      { pos: [0.08, 0.15, 0.11], rot: [0.55, 0.5, -0.55], scale: [0.06, 0.22, 0.06] },
      { pos: [-0.08, 0.19, 0.1], rot: [0.6, -0.3, 0.1], scale: [0.06, 0.2, 0.06] },
      // Top Spikes
      { pos: [0.02, 0.27, 0.04], rot: [0.25, 0.2, -0.2], scale: [0.085, 0.28, 0.085] },
      { pos: [-0.05, 0.26, 0.02], rot: [0.15, -0.2, 0.15], scale: [0.08, 0.26, 0.08] },
      { pos: [0.07, 0.24, -0.03], rot: [-0.1, 0.4, -0.35], scale: [0.075, 0.25, 0.075] },
      { pos: [-0.03, 0.26, -0.05], rot: [-0.3, -0.15, 0.1], scale: [0.08, 0.26, 0.08] },
    ];

    bangsData.forEach((b) => {
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(b.scale[0], b.scale[1], 5),
        this.hairBlondMat
      );
      spike.position.set(...b.pos);
      spike.rotation.set(...b.rot);
      hairGroup.add(spike);
    });

    headPivot.add(hairGroup);

    // --- ORANGE SUNGLASSES (Sitting on nose facing +Z) ---
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.08, 0.125);

    // Center Gold Bridge
    const bridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.045),
      this.goldWireMat
    );
    bridge.rotation.z = Math.PI / 2;
    glassesGroup.add(bridge);

    // Lenses & Rims (+Z facing)
    [-0.046, 0.046].forEach((xOff) => {
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.027, 0.0028, 8, 24),
        this.goldWireMat
      );
      rim.position.set(xOff, 0, 0);
      glassesGroup.add(rim);

      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.025, 24),
        this.sunglassesLensMat
      );
      lens.position.set(xOff, 0, 0.002);
      glassesGroup.add(lens);
    });

    headPivot.add(glassesGroup);
    parent.add(headPivot);
  }

  buildCyberneticLeftArm(parent) {
    // Left Cybernetic Arm (Viewer's Right side: x = +0.32)
    const leftShoulder = new THREE.Group();
    leftShoulder.position.set(0.3, 0.32, 0);
    this.pivots.leftShoulder = leftShoulder;

    // Glowing Plant Core Socket Ring
    const socketRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.07, 0.015, 12, 24),
      this.plantGlowMat
    );
    socketRing.rotation.y = Math.PI / 2;
    leftShoulder.add(socketRing);

    // Glossy Dark Slate Armor Shoulder Cap
    const shoulderCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12, 0, Math.PI, 0, Math.PI),
      this.cyberArmorMat
    );
    shoulderCap.position.set(0.03, 0, 0);
    shoulderCap.rotation.z = -Math.PI / 2;
    leftShoulder.add(shoulderCap);

    // Bicep Titanium Plating
    const bicep = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.05, 0.3, 10),
      this.cyberArmorMat
    );
    bicep.position.set(0.05, -0.16, 0);
    leftShoulder.add(bicep);

    // Cyan Energy Conduit running down bicep
    const conduit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.28, 8),
      this.plantGlowMat
    );
    conduit.position.set(0.1, -0.16, 0.03);
    leftShoulder.add(conduit);

    // Elbow Mechanical Hinge & Chrome Hydraulic Piston
    const leftElbow = new THREE.Group();
    leftElbow.position.set(0.05, -0.32, 0);
    this.pivots.leftElbow = leftElbow;

    const elbowHinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.08, 12),
      this.zipperMat
    );
    elbowHinge.rotation.z = Math.PI / 2;
    leftElbow.add(elbowHinge);

    const piston = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8),
      this.cyberChromeMat
    );
    piston.position.set(0.02, 0.04, -0.04);
    leftElbow.add(piston);

    // Forearm Armor (Slate plates over chrome skeletal frame)
    const forearm = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.32, 0.09),
      this.cyberArmorMat
    );
    forearm.position.set(0.02, -0.16, 0.04);
    leftElbow.add(forearm);

    // Articulated Chrome Hand (Dynamic splayed claws pose from reference)
    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.09, 0.07),
      this.cyberChromeMat
    );
    hand.position.set(0.02, -0.34, 0.06);
    leftElbow.add(hand);

    // 5 Articulated Fingers
    [-0.025, -0.01, 0.005, 0.02, 0.035].forEach((xOff, i) => {
      const finger = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.005, 0.09, 6),
        this.cyberChromeMat
      );
      finger.position.set(0.02 + xOff, -0.4, 0.08 + (i === 4 ? -0.03 : 0));
      finger.rotation.x = 0.45;
      finger.rotation.z = (i - 2) * 0.15;
      leftElbow.add(finger);
    });

    // Pose left arm dynamically like the reference photo (elbow bent, hand forward & out)
    leftShoulder.rotation.z = -0.45;
    leftShoulder.rotation.x = -0.2;
    leftElbow.rotation.x = 0.55;
    leftElbow.rotation.z = -0.2;

    parent.add(leftShoulder);
  }

  buildGunRightArm(parent) {
    // Right Shoulder Pivot (Viewer's Left side: x = -0.30)
    // This is the active aiming shoulder that points toward the screen!
    const rightShoulder = new THREE.Group();
    rightShoulder.position.set(-0.3, 0.32, 0);
    this.pivots.rightShoulder = rightShoulder;

    // Red Coat Sleeve Shoulder Cap
    const sleeveCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 12, 12),
      this.coatOuterMat
    );
    rightShoulder.add(sleeveCap);

    // Upper Arm Sleeve
    const upperArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.065, 0.32, 12),
      this.coatOuterMat
    );
    upperArm.position.set(-0.02, -0.16, 0);
    rightShoulder.add(upperArm);

    // Elbow Pivot
    const rightElbow = new THREE.Group();
    rightElbow.position.set(-0.02, -0.32, 0);
    this.pivots.rightElbow = rightElbow;
    rightShoulder.add(rightElbow);

    // Forearm Sleeve
    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.055, 0.3, 12),
      this.coatOuterMat
    );
    forearm.position.set(0, -0.15, 0);
    rightElbow.add(forearm);

    // Wrist Pivot
    const rightWrist = new THREE.Group();
    rightWrist.position.set(0, -0.3, 0);
    this.pivots.rightWrist = rightWrist;
    rightElbow.add(rightWrist);

    // Black Tactical Gloved Hand gripping the weapon
    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.08, 0.07),
      this.blackClothMat
    );
    hand.position.set(0, -0.04, 0.02);
    rightWrist.add(hand);

    // BUILD THE GUN (FACING +Z / TOWARDS THE SCREEN)
    this.buildRevolver(rightWrist);

    parent.add(rightShoulder);
  }

  buildRevolver(wrist) {
    const gun = new THREE.Group();
    // Gun forward barrel points along +Z!
    gun.position.set(0, -0.06, 0.06);
    this.pivots.revolver = gun;

    // 1. Grip (Black Tactical Grip)
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.06),
      this.zipperMat
    );
    grip.position.set(0, -0.04, -0.04);
    grip.rotation.x = -0.35;
    gun.add(grip);

    // 2. Revolver Frame & Body (Dark gunmetal with silver accents)
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.046, 0.08, 0.15),
      this.gunMetalMat
    );
    frame.position.set(0, 0.02, 0.02);
    gun.add(frame);

    // Break-top hinge & hammer
    const hammer = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.045, 0.03),
      this.gunSilverMat
    );
    hammer.position.set(0, 0.065, -0.05);
    hammer.rotation.x = -0.4;
    gun.add(hammer);

    // 3. Rotating 6-Chamber Cylinder
    const cylinderGroup = new THREE.Group();
    cylinderGroup.position.set(0, 0.02, 0.02);
    this.pivots.cylinder = cylinderGroup;

    const cylMain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.09, 16),
      this.gunMetalMat
    );
    cylMain.rotation.x = Math.PI / 2;
    cylinderGroup.add(cylMain);

    // Fluted chambers
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const fluting = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.091, 8),
        this.gunSilverMat
      );
      fluting.position.set(Math.cos(angle) * 0.024, Math.sin(angle) * 0.024, 0);
      fluting.rotation.x = Math.PI / 2;
      cylinderGroup.add(fluting);
    }
    gun.add(cylinderGroup);

    // 4. Heavy Slab-Sided Barrel (Extending forward into +Z)
    const barrel = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.068, 0.3),
      this.gunMetalMat
    );
    barrel.position.set(0, 0.032, 0.22);
    gun.add(barrel);

    // Front Sight Post
    const frontSight = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.025, 0.02),
      this.gunSilverMat
    );
    frontSight.position.set(0, 0.078, 0.35);
    gun.add(frontSight);

    // Barrel Muzzle Hole (facing +Z straight towards screen)
    const muzzleHole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12),
      this.blackClothMat
    );
    muzzleHole.position.set(0, 0.032, 0.37);
    muzzleHole.rotation.x = Math.PI / 2;
    gun.add(muzzleHole);

    // 5. Under-Barrel Laser Targeting Sight
    const laserModule = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.026, 0.08),
      this.zipperMat
    );
    laserModule.position.set(0, -0.012, 0.22);
    gun.add(laserModule);

    // Laser Beam (Extending forward +Z toward the screen)
    const beamGeo = new THREE.CylinderGeometry(0.003, 0.003, 12, 8);
    beamGeo.translate(0, 6, 0);
    beamGeo.rotateX(Math.PI / 2);
    const laserBeam = new THREE.Mesh(beamGeo, this.laserMat);
    laserBeam.position.set(0, -0.012, 0.26);
    this.laserBeam = laserBeam;
    gun.add(laserBeam);

    // 6. Dynamic Muzzle Flash Light
    const flashLight = new THREE.PointLight(0xffedd0, 0, 10, 2);
    flashLight.position.set(0, 0.032, 0.42);
    this.flashLight = flashLight;
    gun.add(flashLight);

    const flashMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      })
    );
    flashMesh.position.set(0, 0.032, 0.42);
    this.flashMesh = flashMesh;
    gun.add(flashMesh);

    wrist.add(gun);
  }

  /**
   * Dynamic Aiming Controller (Facing the Screen +Z)
   * Calculates the aim direction from Vash's right shoulder directly
   * towards the cursor/camera in world coordinates.
   */
  update(delta, targetWorldPoint, camera) {
    this.windTime += delta * 2.8;

    // 1. Procedural Wind swaying the coat tails
    if (this.coatTails) {
      this.coatTails.forEach((tail) => {
        const sway = Math.sin(this.windTime + tail.offset) * 0.14;
        tail.pivot.rotation.x = 0.22 + sway;
        tail.pivot.rotation.z = Math.cos(this.windTime * 0.8 + tail.offset) * 0.08;
      });
    }

    // 2. Plant Energy Core Pulse
    if (this.plantGlowMat) {
      const pulse = 1.8 + Math.sin(this.windTime * 2.2) * 0.6;
      this.plantGlowMat.emissiveIntensity = pulse;
    }

    // 3. Recoil Recovery Dampening
    if (this.recoil.pitch > 0) {
      this.recoil.pitch -= delta * this.recoil.recoverySpeed;
      if (this.recoil.pitch < 0) this.recoil.pitch = 0;
    }
    if (this.recoil.slide > 0) {
      this.recoil.slide -= delta * this.recoil.recoverySpeed * 0.2;
      if (this.recoil.slide < 0) this.recoil.slide = 0;
    }

    // Muzzle Flash Fade
    if (this.flashLife > 0) {
      this.flashLife -= delta * 14;
      if (this.flashLife <= 0) {
        this.flashLife = 0;
        this.flashLight.intensity = 0;
        this.flashMesh.material.opacity = 0;
      } else {
        this.flashLight.intensity = this.flashLife * 7.5;
        this.flashMesh.material.opacity = this.flashLife;
      }
    }

    // 4. Dynamic Aiming IK Facing Forward (+Z)
    if (this.isAiming && targetWorldPoint) {
      this.aimTarget.lerp(targetWorldPoint, 0.15);

      // Get Right Shoulder World Position
      const shoulderWorldPos = new THREE.Vector3();
      this.pivots.rightShoulder.getWorldPosition(shoulderWorldPos);

      // Direction vector from shoulder to aim target
      const aimDir = new THREE.Vector3().subVectors(this.aimTarget, shoulderWorldPos).normalize();

      // Convert aim direction into local space of the chest
      const invChestMat = new THREE.Matrix4().copy(this.pivots.chest.matrixWorld).invert();
      const localAimDir = aimDir.clone().transformDirection(invChestMat).normalize();

      // Since Vash faces +Z:
      // targetYaw is horizontal angle (left/right)
      // targetPitch is vertical angle (up/down)
      const targetYaw = Math.atan2(localAimDir.x, localAimDir.z);
      const targetPitch = Math.asin(THREE.MathUtils.clamp(localAimDir.y, -0.85, 0.85));

      // Right arm aims directly forward toward target
      // Base shoulder rotation raising arm forward-up towards +Z
      const baseShoulderX = Math.PI * 0.48 - targetPitch;
      const baseShoulderY = -targetYaw * 0.8;
      const baseShoulderZ = 0.15;

      this.pivots.rightShoulder.rotation.x = THREE.MathUtils.lerp(
        this.pivots.rightShoulder.rotation.x,
        baseShoulderX - this.recoil.pitch,
        0.2
      );
      this.pivots.rightShoulder.rotation.y = THREE.MathUtils.lerp(
        this.pivots.rightShoulder.rotation.y,
        baseShoulderY,
        0.2
      );
      this.pivots.rightShoulder.rotation.z = THREE.MathUtils.lerp(
        this.pivots.rightShoulder.rotation.z,
        baseShoulderZ,
        0.2
      );

      // Elbow subtle flex
      this.pivots.rightElbow.rotation.x = THREE.MathUtils.lerp(
        this.pivots.rightElbow.rotation.x,
        0.18 + targetPitch * 0.2,
        0.2
      );

      // Wrist alignment to keep revolver barrel locked on target
      this.pivots.rightWrist.rotation.x = THREE.MathUtils.lerp(
        this.pivots.rightWrist.rotation.x,
        0.12 - this.recoil.pitch * 0.5,
        0.22
      );
      this.pivots.rightWrist.rotation.y = THREE.MathUtils.lerp(
        this.pivots.rightWrist.rotation.y,
        -targetYaw * 0.3,
        0.22
      );

      // Head turns and tilts towards the viewer and sights down the gun
      const headYaw = THREE.MathUtils.clamp(targetYaw * 0.55, -0.7, 0.7);
      const headPitch = THREE.MathUtils.clamp(-targetPitch * 0.45, -0.4, 0.4);

      this.pivots.head.rotation.y = THREE.MathUtils.lerp(this.pivots.head.rotation.y, headYaw, 0.16);
      this.pivots.head.rotation.x = THREE.MathUtils.lerp(this.pivots.head.rotation.x, headPitch, 0.16);
      this.pivots.head.rotation.z = THREE.MathUtils.lerp(this.pivots.head.rotation.z, -headYaw * 0.2, 0.16);

      // Torso slight twist into aim
      this.pivots.chest.rotation.y = THREE.MathUtils.lerp(this.pivots.chest.rotation.y, targetYaw * 0.15, 0.12);
    }
  }

  /**
   * Fire Gun Action
   * Kicks barrel upward, slides back, spins 6-chamber cylinder, flashes muzzle
   */
  triggerShot() {
    this.recoil.pitch = 0.42; // Upward kick
    this.recoil.slide = 0.08;

    this.cylinderRotation += Math.PI / 3;
    if (this.pivots.cylinder) {
      this.pivots.cylinder.rotation.z = this.cylinderRotation;
    }

    this.flashLife = 1.0;
    this.flashLight.intensity = 8.0;
    this.flashMesh.material.opacity = 1.0;

    const muzzlePos = new THREE.Vector3();
    if (this.pivots.revolver) {
      this.pivots.revolver.getWorldPosition(muzzlePos);
    }
    return muzzlePos;
  }

  setAimMode(enabled) {
    this.isAiming = enabled;
  }
}
