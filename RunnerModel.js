import * as THREE from 'three';

// ── Shared material factories ──
const _mat  = (c) => new THREE.MeshLambertMaterial({ color: c });
const _glow = (c) => new THREE.MeshBasicMaterial({ color: c });
const _sensor = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.95 });

// ── Geometry cache ──
const _box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const _cyl = (r, h, s) => new THREE.CylinderGeometry(r, r, h, s || 8);
const _sphere = (r, s) => new THREE.SphereGeometry(r, s || 6, s || 6);

/**
 * RunnerModel — premium laser-game character built from Three.js primitives.
 *
 * Features:
 *  - Helmet with glowing visor
 *  - Armored torso with chest & back sensors
 *  - Shoulder pads with sensors
 *  - Segmented arms with elbow, gloves, and laser gun
 *  - Segmented legs with knees and boots
 *  - Backpack / laser module
 *  - Walk animation (arm/leg swing)
 *  - Aim direction (torso twist)
 *  - Hit zone flash on damage
 *  - Variations per bot index
 */
export class RunnerModel {
  constructor(primaryColor, accentColor, variationIndex) {
    this.primaryColor = primaryColor;
    this.accentColor = accentColor || primaryColor;
    this.variation = (variationIndex || 0) % 6;

    this.group = new THREE.Group();
    this._hitTargets = [];
    this._sensorMeshes = {};   // zone → mesh[]
    this._flashTimers = {};    // zone → timer

    // Animation state
    this._walkTimer = 0;
    this._walkIntensity = 0;
    this._aimYaw = 0;
    this._disabled = false;
    this._invulnerable = false;
    this._invulnTimer = 0;
    this._fireFlashTimer = 0;
    this._deathTimer = 0;

    // Part groups for animation
    this._leftLeg = new THREE.Group();
    this._rightLeg = new THREE.Group();
    this._leftArm = new THREE.Group();
    this._rightArm = new THREE.Group();
    this._upperBody = new THREE.Group();

    this._build();
    this._buildDeathIndicator();
    this.group.scale.set(1.8, 1.8, 1.8);
  }

  // ═══════════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════════

  _build() {
    const suit   = 0x1a1a28;
    const suitLt = 0x222238;
    const armor  = 0x2a2a40;
    const pc     = this.primaryColor;
    const ac     = this.accentColor;
    const v      = this.variation;

    // ── Legs (pivot at hip = y 0.85) ──
    this._leftLeg.position.set(-0.12, 0.85, 0);
    this._rightLeg.position.set(0.12, 0.85, 0);
    this._buildLeg(this._leftLeg, suit, armor, pc, -1);
    this._buildLeg(this._rightLeg, suit, armor, pc, 1);
    this.group.add(this._leftLeg);
    this.group.add(this._rightLeg);

    // ── Upper body (contains torso, head, arms, backpack) ──
    this.group.add(this._upperBody);

    // ── Torso ──
    // Lower torso (waist)
    this._addPart(this._upperBody, _box(0.38, 0.22, 0.22), _mat(suitLt), 0, 0.93, 0);
    // Upper torso (chest)
    this._addPart(this._upperBody, _box(0.44, 0.32, 0.26), _mat(armor), 0, 1.2, 0);
    // Armor plate front
    this._addPart(this._upperBody, _box(0.36, 0.22, 0.04), _mat(0x333350), 0, 1.22, 0.13);
    // Armor plate back
    this._addPart(this._upperBody, _box(0.36, 0.22, 0.04), _mat(0x333350), 0, 1.22, -0.13);

    // ── CHEST SENSOR (hit zone: torso) ──
    const chestSensor = this._addSensor(this._upperBody, _box(0.18, 0.14, 0.03), pc, 0, 1.22, 0.16, 'torso');
    // Sensor frame
    this._addPart(this._upperBody, _box(0.22, 0.18, 0.01), _glow(0x444466), 0, 1.22, 0.155);

    // ── BACK SENSOR (hit zone: back) ──
    this._addSensor(this._upperBody, _box(0.18, 0.14, 0.03), pc, 0, 1.22, -0.16, 'back');
    this._addPart(this._upperBody, _box(0.22, 0.18, 0.01), _glow(0x444466), 0, 1.22, -0.155);

    // ── Neck ──
    this._addPart(this._upperBody, _cyl(0.06, 0.08, 6), _mat(suit), 0, 1.4, 0);

    // ── Head / Helmet ──
    this._buildHelmet(v, suit, armor, pc, ac);

    // ── Shoulder pads ──
    this._buildShoulder(this._upperBody, -0.3, 1.3, armor, pc, v, 'left');
    this._buildShoulder(this._upperBody, 0.3, 1.3, armor, pc, v, 'right');

    // ── Arms ──
    this._leftArm.position.set(-0.3, 1.22, 0);
    this._rightArm.position.set(0.3, 1.22, 0);
    this._buildArm(this._leftArm, suit, armor, pc, false);
    this._buildArm(this._rightArm, suit, armor, pc, true);
    this._upperBody.add(this._leftArm);
    this._upperBody.add(this._rightArm);

    // ── Backpack ──
    this._buildBackpack(v, armor, pc, ac);

    // ── Neon accent lines ──
    // Side torso stripes
    this._addPart(this._upperBody, _box(0.01, 0.28, 0.18), _glow(ac), -0.225, 1.18, 0);
    this._addPart(this._upperBody, _box(0.01, 0.28, 0.18), _glow(ac), 0.225, 1.18, 0);
    // Belt glow
    this._addPart(this._upperBody, _box(0.42, 0.025, 0.24), _glow(ac), 0, 0.84, 0);

    // ── Hit zone raycast targets (invisible) ──
    this._buildHitZones();
  }

  _buildLeg(group, suit, armor, pc, side) {
    // Upper leg
    this._addPart(group, _box(0.14, 0.35, 0.14), _mat(suit), 0, -0.2, 0);
    // Knee pad
    this._addPart(group, _box(0.12, 0.08, 0.16), _mat(armor), 0, -0.38, 0.02);
    // Lower leg
    this._addPart(group, _box(0.12, 0.3, 0.12), _mat(suit), 0, -0.56, 0);
    // Boot
    this._addPart(group, _box(0.15, 0.12, 0.2), _mat(armor), 0, -0.78, 0.02);
    // Boot sole accent
    this._addPart(group, _box(0.15, 0.02, 0.2), _glow(pc), 0, -0.84, 0.02);
    // Leg sensor (small neon strip)
    this._addSensor(group, _box(0.06, 0.08, 0.02), pc, 0, -0.18, 0.08, 'legs');
  }

  _buildHelmet(variation, suit, armor, pc, ac) {
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.52, 0);

    // Helmet base
    const helmetW = 0.26 + (variation % 3) * 0.02;
    const helmetH = 0.22 + (variation > 3 ? 0.03 : 0);
    this._addPart(headGroup, _box(helmetW, helmetH, 0.24), _mat(armor), 0, 0, 0);

    // Visor — glowing, color varies
    const visorH = 0.08 + (variation % 2) * 0.02;
    const visorColor = [pc, ac, 0x00ffcc, pc, 0xff4444, ac][variation];
    this._addPart(headGroup, _box(helmetW - 0.02, visorH, 0.02), _glow(visorColor), 0, 0.02, 0.12);

    // Helmet top ridge
    this._addPart(headGroup, _box(0.06, 0.04, 0.2), _glow(ac), 0, helmetH / 2, 0);

    // Side vents
    this._addPart(headGroup, _box(0.02, 0.06, 0.08), _glow(0x333355), -helmetW / 2 - 0.01, 0, -0.04);
    this._addPart(headGroup, _box(0.02, 0.06, 0.08), _glow(0x333355), helmetW / 2 + 0.01, 0, -0.04);

    // Head sensor (headband glow)
    this._addSensor(headGroup, _box(helmetW + 0.02, 0.03, 0.26), pc, 0, -0.08, 0, 'head');

    this._upperBody.add(headGroup);
  }

  _buildShoulder(parent, x, y, armor, pc, variation, side) {
    const padW = 0.12 + (variation % 3) * 0.02;
    const padH = 0.08;
    const padD = 0.16 + (variation > 2 ? 0.04 : 0);

    // Shoulder pad
    this._addPart(parent, _box(padW, padH, padD), _mat(armor), x, y, 0);
    // Shoulder edge accent
    this._addPart(parent, _box(padW + 0.02, 0.02, padD + 0.02), _glow(pc), x, y + padH / 2, 0);
    // SHOULDER SENSOR
    this._addSensor(parent, _box(padW - 0.02, 0.04, 0.03), pc, x, y - 0.02, padD / 2 + 0.01, 'shoulders');
  }

  _buildArm(group, suit, armor, pc, isRight) {
    // Upper arm
    this._addPart(group, _box(0.1, 0.24, 0.1), _mat(suit), 0, -0.14, 0);
    // Elbow
    this._addPart(group, _sphere(0.055, 5), _mat(armor), 0, -0.28, 0);
    // Lower arm
    this._addPart(group, _box(0.09, 0.2, 0.09), _mat(suit), 0, -0.42, 0);
    // Glove
    this._addPart(group, _box(0.1, 0.08, 0.11), _mat(armor), 0, -0.56, 0);
    // Arm neon strip
    this._addPart(group, _box(0.02, 0.18, 0.01), _glow(pc), 0.05, -0.14, 0.05);

    // Gun (right arm only)
    if (isRight) {
      this._buildGun(group, suit, armor, pc);
    }
  }

  _buildGun(armGroup, suit, armor, pc) {
    const gun = new THREE.Group();
    gun.position.set(0, -0.48, 0.12);

    // Gun body — tagged for skin changes
    const gunBodyMat = _mat(0x222233);
    gunBodyMat._isGunPart = 'body';
    this._addPart(gun, _box(0.06, 0.06, 0.28), gunBodyMat, 0, 0, 0);
    // Barrel
    const gunBarrelMat = _mat(0x333344);
    gunBarrelMat._isGunPart = 'barrel';
    this._addPart(gun, _cyl(0.02, 0.12, 6), gunBarrelMat, 0, 0, 0.2);
    // Move barrel to point forward
    gun.children[gun.children.length - 1].rotation.x = Math.PI / 2;
    // Grip
    const gunGripMat = _mat(0x1a1a22);
    gunGripMat._isGunPart = 'grip';
    this._addPart(gun, _box(0.04, 0.08, 0.06), gunGripMat, 0, -0.06, -0.06);
    // Scope / top rail
    const gunDarkMat = _mat(armor);
    gunDarkMat._isGunPart = 'dark';
    this._addPart(gun, _box(0.03, 0.03, 0.14), gunDarkMat, 0, 0.04, 0.02);
    // Muzzle glow
    const muzzleMat = _glow(pc);
    muzzleMat._isGunPart = 'accent';
    this._muzzleGlow = this._addPart(gun, _sphere(0.025, 4), muzzleMat, 0, 0, 0.26);
    this._muzzleGlow.visible = false;
    // Gun neon accents
    const gunAccentMat = _glow(pc);
    gunAccentMat._isGunPart = 'accent';
    this._addPart(gun, _box(0.065, 0.01, 0.2), gunAccentMat, 0, -0.035, 0.02);

    this._gunGroup = gun;
    armGroup.add(gun);
  }

  _buildBackpack(variation, armor, pc, ac) {
    const bp = new THREE.Group();
    bp.position.set(0, 1.15, -0.2);

    const packW = 0.22 + (variation % 2) * 0.04;
    const packH = 0.28;
    const packD = 0.1 + (variation > 3 ? 0.03 : 0);

    // Main pack body
    this._addPart(bp, _box(packW, packH, packD), _mat(armor), 0, 0, 0);
    // Pack accent panel
    this._addPart(bp, _box(packW - 0.04, packH - 0.06, 0.01), _glow(ac), 0, 0, -packD / 2 - 0.005);
    // Top module
    this._addPart(bp, _box(packW - 0.06, 0.05, packD - 0.02), _mat(0x333350), 0, packH / 2 + 0.02, 0);
    // Antenna (variation)
    if (variation % 3 === 0) {
      this._addPart(bp, _cyl(0.01, 0.14, 4), _glow(ac), packW / 2 - 0.03, packH / 2 + 0.1, 0);
    }
    // Side vents
    this._addPart(bp, _box(0.02, 0.1, packD - 0.02), _glow(0x333355), -packW / 2 - 0.01, 0, 0);
    this._addPart(bp, _box(0.02, 0.1, packD - 0.02), _glow(0x333355), packW / 2 + 0.01, 0, 0);

    this._upperBody.add(bp);
  }

  _buildHitZones() {
    // Invisible raycast targets that cover each zone
    const hitMat = new THREE.MeshBasicMaterial({ visible: false });

    // Head zone
    const headHit = new THREE.Mesh(_box(0.3, 0.28, 0.28), hitMat);
    headHit.position.set(0, 1.52, 0);
    headHit.userData.hitZone = 'head';
    this.group.add(headHit);
    this._hitTargets.push(headHit);

    // Torso zone (front)
    const torsoHit = new THREE.Mesh(_box(0.44, 0.38, 0.15), hitMat);
    torsoHit.position.set(0, 1.15, 0.07);
    torsoHit.userData.hitZone = 'torso';
    this.group.add(torsoHit);
    this._hitTargets.push(torsoHit);

    // Back zone
    const backHit = new THREE.Mesh(_box(0.44, 0.38, 0.15), hitMat);
    backHit.position.set(0, 1.15, -0.12);
    backHit.userData.hitZone = 'back';
    this.group.add(backHit);
    this._hitTargets.push(backHit);

    // Shoulder zones
    const lShHit = new THREE.Mesh(_box(0.18, 0.14, 0.2), hitMat);
    lShHit.position.set(-0.32, 1.3, 0);
    lShHit.userData.hitZone = 'shoulders';
    this.group.add(lShHit);
    this._hitTargets.push(lShHit);

    const rShHit = new THREE.Mesh(_box(0.18, 0.14, 0.2), hitMat);
    rShHit.position.set(0.32, 1.3, 0);
    rShHit.userData.hitZone = 'shoulders';
    this.group.add(rShHit);
    this._hitTargets.push(rShHit);

    // Leg zones
    const lLegHit = new THREE.Mesh(_box(0.18, 0.7, 0.18), hitMat);
    lLegHit.position.set(-0.12, 0.45, 0);
    lLegHit.userData.hitZone = 'legs';
    this.group.add(lLegHit);
    this._hitTargets.push(lLegHit);

    const rLegHit = new THREE.Mesh(_box(0.18, 0.7, 0.18), hitMat);
    rLegHit.position.set(0.12, 0.45, 0);
    rLegHit.userData.hitZone = 'legs';
    this.group.add(rLegHit);
    this._hitTargets.push(rLegHit);
  }

  // ═══════════════════════════════════════════
  // DEATH INDICATOR
  // ═══════════════════════════════════════════

  _buildDeathIndicator() {
    this._deathGroup = new THREE.Group();
    this._deathGroup.visible = false;

    const skullMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    skullMat._isDeathIndicator = true;
    const darkMat = new THREE.MeshBasicMaterial({ color: 0x330000 });
    darkMat._isDeathIndicator = true;
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 });
    glowMat._isDeathIndicator = true;

    // Cranium
    this._deathGroup.add(this._makePart(_box(0.3, 0.26, 0.22), skullMat, 0, 0, 0));
    // Left eye socket
    this._deathGroup.add(this._makePart(_box(0.08, 0.08, 0.05), darkMat, -0.07, 0.04, 0.11));
    // Right eye socket
    this._deathGroup.add(this._makePart(_box(0.08, 0.08, 0.05), darkMat, 0.07, 0.04, 0.11));
    // Jaw
    this._deathGroup.add(this._makePart(_box(0.22, 0.08, 0.18), skullMat, 0, -0.15, 0));
    // Teeth
    for (let i = -2; i <= 2; i++) {
      this._deathGroup.add(this._makePart(_box(0.03, 0.04, 0.04), darkMat, i * 0.04, -0.09, 0.1));
    }
    // Glow ring around skull
    const ringSegs = 12;
    const ringR = 0.25;
    for (let i = 0; i < ringSegs; i++) {
      const a1 = (i / ringSegs) * Math.PI * 2;
      const a2 = ((i + 1) / ringSegs) * Math.PI * 2;
      const x1 = Math.cos(a1) * ringR, z1 = Math.sin(a1) * ringR;
      const x2 = Math.cos(a2) * ringR, z2 = Math.sin(a2) * ringR;
      const sdx = x2 - x1, sdz = z2 - z1;
      const len = Math.sqrt(sdx * sdx + sdz * sdz);
      const seg = new THREE.Mesh(_box(len, 0.04, 0.04), glowMat);
      seg.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
      seg.rotation.y = -Math.atan2(sdz, sdx);
      this._deathGroup.add(seg);
    }

    this._deathGroup.position.set(0, 2.1, 0);
    this.group.add(this._deathGroup);
  }

  _makePart(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  }

  _setModelTransparency(opacity) {
    const targets = [this._leftLeg, this._rightLeg, this._upperBody];
    for (const grp of targets) {
      grp.traverse((child) => {
        if (child.isMesh) {
          child.material.transparent = true;
          child.material.opacity = opacity;
          child.material.needsUpdate = true;
        }
      });
    }
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  _addPart(parent, geo, mat, x, y, z) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  _addSensor(parent, geo, color, x, y, z, zone) {
    const mat = _sensor(color);
    mat._isSensor = true;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    parent.add(mesh);

    if (!this._sensorMeshes[zone]) this._sensorMeshes[zone] = [];
    this._sensorMeshes[zone].push({ mesh, originalColor: color, material: mat });
    return mesh;
  }

  // ═══════════════════════════════════════════
  // UPDATE / ANIMATION
  // ═══════════════════════════════════════════

  update(dt) {
    // Walk animation
    this._updateWalkAnim(dt);

    // Invulnerable flash
    if (this._invulnerable) {
      this._invulnTimer += dt * 12;
      const flash = Math.sin(this._invulnTimer) > 0;
      this.group.visible = flash || this._invulnTimer > 20;
    } else {
      this.group.visible = true;
    }

    // Death indicator animation
    if (this._disabled && this._deathGroup && this._deathGroup.visible) {
      this._deathTimer += dt;
      this._deathGroup.rotation.y = this._deathTimer * 2;
      const pulse = 1.0 + Math.sin(this._deathTimer * 4) * 0.15;
      this._deathGroup.scale.set(pulse, pulse, pulse);
      this._deathGroup.position.y = 2.1 + Math.sin(this._deathTimer * 3) * 0.1;
    }

    // Fire muzzle flash
    if (this._fireFlashTimer > 0) {
      this._fireFlashTimer -= dt;
      if (this._muzzleGlow) this._muzzleGlow.visible = this._fireFlashTimer > 0;
    }

    // Hit zone flash decay
    for (const zone in this._flashTimers) {
      if (this._flashTimers[zone] > 0) {
        this._flashTimers[zone] -= dt;
        const sensors = this._sensorMeshes[zone];
        if (sensors) {
          const t = this._flashTimers[zone];
          for (const s of sensors) {
            if (t <= 0) {
              s.material.color.setHex(s.originalColor);
            } else {
              // Flash white then back
              const mix = Math.sin(t * 20) * 0.5 + 0.5;
              s.material.color.lerpColors(
                new THREE.Color(s.originalColor),
                new THREE.Color(0xffffff),
                mix * Math.min(1, t * 4)
              );
            }
          }
        }
      }
    }
  }

  _updateWalkAnim(dt) {
    if (this._disabled) {
      // Slump forward when disabled
      this._upperBody.rotation.x += (0.15 - this._upperBody.rotation.x) * Math.min(1, 6 * dt);
      return;
    }
    this._upperBody.rotation.x *= (1 - 4 * dt);

    const swing = Math.sin(this._walkTimer) * 0.35 * this._walkIntensity;
    const armSwing = Math.sin(this._walkTimer) * 0.25 * this._walkIntensity;

    // Legs swing opposite
    this._leftLeg.rotation.x = swing;
    this._rightLeg.rotation.x = -swing;

    // Arms swing opposite to legs
    this._leftArm.rotation.x = -armSwing;
    this._rightArm.rotation.x = armSwing * 0.6; // Right arm less (holding gun)

    // Slight body lean
    this.group.rotation.z = Math.sin(this._walkTimer) * 0.02 * this._walkIntensity;
  }

  /** Call from BotPlayer with current horizontal speed */
  setWalkSpeed(hSpeed, dt, isSprinting) {
    const isMoving = hSpeed > 0.3;
    if (isMoving) {
      const bobSpeed = isSprinting ? 14 : 10;
      this._walkTimer += dt * bobSpeed;
      this._walkIntensity += (1 - this._walkIntensity) * Math.min(1, 6 * dt);
    } else {
      this._walkIntensity *= Math.max(0, 1 - 4 * dt);
    }
  }

  // ═══════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
  }

  setRotationY(angle) {
    this.group.rotation.y = angle;
  }

  setDisabled(v) {
    this._disabled = v;
    if (v) {
      this._deathTimer = 0;
      this._setModelTransparency(0.25);
      if (this._deathGroup) this._deathGroup.visible = true;
    } else {
      this._setModelTransparency(1.0);
      if (this._deathGroup) this._deathGroup.visible = false;
    }
  }

  setInvulnerable(v) {
    this._invulnerable = v;
    if (!v) {
      this._invulnTimer = 0;
      this.group.visible = true;
    }
  }

  flashHitZone(zone) {
    this._flashTimers[zone] = 0.6;
  }

  showMuzzleFlash() {
    this._fireFlashTimer = 0.08;
  }

  setCrouchScale(scaleY) {
    this.group.scale.y = scaleY;
  }

  /**
   * Change primary color (for team reassignment).
   */
  setTeamColor(primary, accent) {
    this.primaryColor = primary;
    this.accentColor = accent || primary;

    // Derive dark body tints from team primary color
    const col = new THREE.Color(primary);
    const darkBody = new THREE.Color().copy(col).multiplyScalar(0.25);  // very dark tint
    const midBody  = new THREE.Color().copy(col).multiplyScalar(0.38);  // slightly brighter

    // Update all sensor colors
    for (const zone in this._sensorMeshes) {
      for (const s of this._sensorMeshes[zone]) {
        s.originalColor = primary;
        s.material.color.setHex(primary);
      }
    }

    // Update ALL materials on the model to team color (skip gun parts to preserve weapon skins)
    this.group.traverse((child) => {
      if (!child.isMesh) return;
      const mat = child.material;
      if (mat._isDeathIndicator) return; // skip death skull
      if (mat._isGunPart) return;        // skip gun parts (weapon skin)

      if (mat._isSensor) {
        mat.color.setHex(primary);
      } else if (mat.type === 'MeshBasicMaterial') {
        // Glow/accent elements → bright accent
        mat.color.setHex(accent || primary);
      } else if (mat.type === 'MeshLambertMaterial') {
        // Body elements → dark team tint
        // Use dark for darkest parts, mid for lighter body parts
        const lum = mat.color.r + mat.color.g + mat.color.b;
        if (lum < 0.35) {
          mat.color.copy(darkBody);
        } else {
          mat.color.copy(midBody);
        }
      }
    });
  }

  /**
   * Apply a weapon skin to the bot's gun (without touching team body colors).
   * @param {object} skinData — { body, accent, dark, barrel, grip }
   */
  applyWeaponSkin(skinData) {
    if (!skinData || !this._gunGroup) return;
    this._gunGroup.traverse((child) => {
      if (!child.isMesh || !child.material._isGunPart) return;
      const part = child.material._isGunPart;
      if (part === 'body' && skinData.body != null)    child.material.color.setHex(skinData.body);
      if (part === 'barrel' && skinData.barrel != null) child.material.color.setHex(skinData.barrel);
      if (part === 'grip' && skinData.grip != null)    child.material.color.setHex(skinData.grip);
      if (part === 'dark' && skinData.dark != null)    child.material.color.setHex(skinData.dark);
      if (part === 'accent' && skinData.accent != null) child.material.color.setHex(skinData.accent);
    });
  }

  getHitTargets() {
    return this._hitTargets;
  }

  dispose() {
    this.group.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material.dispose) child.material.dispose();
      }
    });
  }
}
