// ═══════════════════════════════════════════════════
// WEAPON MODEL — First-person weapon rendering
// Separate scene overlay for clean depth handling
// ═══════════════════════════════════════════════════

import * as THREE from 'three';

export class WeaponModel {
  constructor(camera) {
    this.mainCamera = camera;

    // Separate scene for weapon (rendered on top)
    this.scene = new THREE.Scene();

    // Weapon camera copies main camera rotation
    this.camera = new THREE.PerspectiveCamera(
      camera.fov, camera.aspect, 0.01, 10
    );
    this.scene.add(this.camera);

    // Weapon group (child of weapon camera)
    this.group = new THREE.Group();
    this.camera.add(this.group);

    // State
    this._recoilTimer = 0;
    this._recoilIntensity = 0;
    this._swayTimer = 0;
    this._bobTimer = 0;
    this._isAiming = false;
    this._aimTransition = 0;
    this._sprintTransition = 0;
    this._isSprinting = false;
    this._visible = false;

    // Positions
    this._hipPos = new THREE.Vector3(0.22, -0.18, -0.38);
    this._aimPos = new THREE.Vector3(0.0, -0.12, -0.32);
    this._sprintPos = new THREE.Vector3(0.28, -0.22, -0.30);
    this._currentPos = this._hipPos.clone();

    // Rotations
    this._hipRot = new THREE.Euler(-0.02, 0.08, 0.02);
    this._aimRot = new THREE.Euler(0, 0, 0);
    this._sprintRot = new THREE.Euler(-0.3, 0.4, -0.15);
    this._currentRot = new THREE.Euler().copy(this._hipRot);

    this._buildWeapon();
    this._addLighting();
  }

  _buildWeapon() {
    // ── Materials ──
    const bodyMat = new THREE.MeshLambertMaterial({
      color: 0x3a3a52,
    });

    const accentMat = new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
    });

    const darkMat = new THREE.MeshLambertMaterial({
      color: 0x22223a,
    });

    const barrelMat = new THREE.MeshLambertMaterial({
      color: 0x4a4a62,
    });

    const gripMat = new THREE.MeshLambertMaterial({
      color: 0x282840,
    });

    // Store materials for skin changes
    this._accentMat = accentMat;
    this._bodyMat = bodyMat;
    this._darkMat = darkMat;
    this._barrelMat = barrelMat;
    this._gripMat = gripMat;

    // ── Main Body ──
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.05, 0.28),
      bodyMat
    );
    body.position.set(0, 0, 0);
    this.group.add(body);

    // ── Top Rail ──
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.006, 0.16),
      darkMat
    );
    rail.position.set(0, 0.028, -0.02);
    this.group.add(rail);

    // ── Barrel ──
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.014, 0.18, 8),
      barrelMat
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.005, -0.22);
    this.group.add(barrel);

    // ── Barrel Tip (muzzle) ──
    const muzzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.012, 0.025, 8),
      darkMat
    );
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.005, -0.32);
    this.group.add(muzzle);

    // ── Muzzle Glow Ring ──
    const muzzleGlow = new THREE.Mesh(
      new THREE.RingGeometry(0.012, 0.018, 8),
      accentMat
    );
    muzzleGlow.position.set(0, 0.005, -0.335);
    this.group.add(muzzleGlow);
    this._muzzleGlow = muzzleGlow;

    // ── Side Accent Lines (neon strips) ──
    const stripGeo = new THREE.BoxGeometry(0.002, 0.008, 0.14);

    const stripL = new THREE.Mesh(stripGeo, accentMat);
    stripL.position.set(-0.024, 0.01, -0.02);
    this.group.add(stripL);

    const stripR = new THREE.Mesh(stripGeo, accentMat);
    stripR.position.set(0.024, 0.01, -0.02);
    this.group.add(stripR);

    // ── Top Accent Strip ──
    const topStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.002, 0.06),
      accentMat
    );
    topStrip.position.set(0, 0.032, -0.06);
    this.group.add(topStrip);

    // ── Rear Sight ──
    const rearSight = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.015, 0.006),
      darkMat
    );
    rearSight.position.set(0, 0.036, 0.06);
    this.group.add(rearSight);

    // ── Front Sight ──
    const frontSight = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.018, 0.004),
      accentMat
    );
    frontSight.position.set(0, 0.038, -0.1);
    this.group.add(frontSight);

    // ── Grip ──
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.08, 0.035),
      gripMat
    );
    grip.position.set(0, -0.055, 0.04);
    grip.rotation.x = 0.2;
    this.group.add(grip);

    // ── Trigger Guard ──
    const triggerGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.003, 0.04),
      darkMat
    );
    triggerGuard.position.set(0, -0.02, 0.015);
    this.group.add(triggerGuard);

    // ── Magazine ──
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.055, 0.035),
      gripMat
    );
    mag.position.set(0, -0.048, -0.04);
    mag.rotation.x = -0.05;
    this.group.add(mag);

    // ── Magazine Accent ──
    const magAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.027, 0.003, 0.037),
      accentMat
    );
    magAccent.position.set(0, -0.022, -0.04);
    this.group.add(magAccent);

    // ── Stock/Rear ──
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.06),
      bodyMat
    );
    stock.position.set(0, -0.005, 0.16);
    this.group.add(stock);

    // ── Stock Accent ──
    const stockAccent = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.003, 0.04),
      accentMat
    );
    stockAccent.position.set(0, 0.016, 0.16);
    this.group.add(stockAccent);

    // Apply default position
    this.group.position.copy(this._hipPos);
    this.group.rotation.copy(this._hipRot);
  }

  _addLighting() {
    // Ambient for base visibility
    const ambient = new THREE.AmbientLight(0x334455, 0.6);
    this.scene.add(ambient);

    // Key light from top-right
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(1, 2, 0.5);
    this.scene.add(keyLight);

    // Rim light from left
    const rimLight = new THREE.DirectionalLight(0x00ccff, 0.3);
    rimLight.position.set(-1, 0.5, -0.5);
    this.scene.add(rimLight);

    // Cyan fill from below
    const fillLight = new THREE.DirectionalLight(0x00ffcc, 0.15);
    fillLight.position.set(0, -1, 0);
    this.scene.add(fillLight);
  }

  // ═══════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════

  show() {
    this._visible = true;
    this.group.visible = true;
  }

  hide() {
    this._visible = false;
    this.group.visible = false;
  }

  fire() {
    this._recoilTimer = 0.1;
    this._recoilIntensity = 0.8;
  }

  setAiming(aiming) {
    this._isAiming = aiming;
  }

  setSprinting(sprinting) {
    this._isSprinting = sprinting;
  }

  setLaserColor(hexColor) {
    // Accept CSS hex string or three.js color int
    if (typeof hexColor === 'string') {
      this._accentMat.color.set(hexColor);
    } else {
      this._accentMat.color.setHex(hexColor);
    }
  }

  applySkin(skin) {
    if (!skin) return;
    this._bodyMat.color.setHex(skin.body);
    this._accentMat.color.setHex(skin.accent);
    this._darkMat.color.setHex(skin.dark);
    this._barrelMat.color.setHex(skin.barrel);
    this._gripMat.color.setHex(skin.grip);

    // Add emissive glow for rarer skins
    const rarityKey = skin.rarity ? skin.rarity.key : 'common';
    const rarityGlow = {
      common: 0, uncommon: 0, rare: 0.08,
      epic: 0.15, legendary: 0.25, mythic: 0.4, unobtainable: 0.6
    };
    const intensity = rarityGlow[rarityKey] || 0;
    this._bodyMat.emissive = new THREE.Color(skin.body);
    this._bodyMat.emissiveIntensity = intensity;
    this._barrelMat.emissive = new THREE.Color(skin.barrel);
    this._barrelMat.emissiveIntensity = intensity;
    this._gripMat.emissive = new THREE.Color(skin.grip);
    this._gripMat.emissiveIntensity = intensity * 0.5;

    // Store rarity for animated effects
    this._skinRarity = rarityKey;
    this._skinAccentHex = skin.accent;
  }

  onResize() {
    this.camera.aspect = this.mainCamera.aspect;
    this.camera.updateProjectionMatrix();
  }

  // ═══════════════════════════════════════════
  // UPDATE
  // ═══════════════════════════════════════════

  update(dt, playerVelocity, isMoving, onGround) {
    if (!this._visible) return;

    // Sync camera
    this.camera.fov = this.mainCamera.fov;
    this.camera.aspect = this.mainCamera.aspect;
    this.camera.updateProjectionMatrix();
    this.camera.quaternion.copy(this.mainCamera.quaternion);

    // ── Aim transition (snappy) ──
    const aimTarget = this._isAiming ? 1 : 0;
    this._aimTransition += (aimTarget - this._aimTransition) * Math.min(1, 22 * dt);

    // ── Sprint transition (snappy) ──
    const sprintTarget = (this._isSprinting && !this._isAiming) ? 1 : 0;
    this._sprintTransition += (sprintTarget - this._sprintTransition) * Math.min(1, 16 * dt);

    // ── Target position/rotation ──
    const targetPos = new THREE.Vector3();
    const targetRot = new THREE.Euler();

    // Blend hip → aim → sprint
    targetPos.lerpVectors(this._hipPos, this._aimPos, this._aimTransition);
    if (this._sprintTransition > 0.01) {
      targetPos.lerp(this._sprintPos, this._sprintTransition);
    }

    // Rotation blend
    targetRot.x = THREE.MathUtils.lerp(this._hipRot.x, this._aimRot.x, this._aimTransition);
    targetRot.y = THREE.MathUtils.lerp(this._hipRot.y, this._aimRot.y, this._aimTransition);
    targetRot.z = THREE.MathUtils.lerp(this._hipRot.z, this._aimRot.z, this._aimTransition);
    if (this._sprintTransition > 0.01) {
      targetRot.x = THREE.MathUtils.lerp(targetRot.x, this._sprintRot.x, this._sprintTransition);
      targetRot.y = THREE.MathUtils.lerp(targetRot.y, this._sprintRot.y, this._sprintTransition);
      targetRot.z = THREE.MathUtils.lerp(targetRot.z, this._sprintRot.z, this._sprintTransition);
    }

    // ── Idle sway (subtle) ──
    this._swayTimer += dt;
    const swayAmount = (1 - this._aimTransition * 0.9) * 0.0015;
    targetPos.x += Math.sin(this._swayTimer * 1.2) * swayAmount;
    targetPos.y += Math.sin(this._swayTimer * 0.8 + 0.5) * swayAmount * 0.5;

    // ── Movement bob (subtle) ──
    if (isMoving && onGround) {
      const bobSpeed = this._isSprinting ? 14 : 10;
      this._bobTimer += dt * bobSpeed;
      const bobIntensity = (1 - this._aimTransition * 0.8) * 0.004;
      targetPos.x += Math.cos(this._bobTimer * 0.5) * bobIntensity;
      targetPos.y += Math.abs(Math.sin(this._bobTimer)) * bobIntensity * 1.2;
      targetRot.z += Math.cos(this._bobTimer * 0.5) * 0.004 * (1 - this._aimTransition);
    }

    // ── Recoil (punchy but fast recovery) ──
    if (this._recoilTimer > 0) {
      this._recoilTimer -= dt;
      const recoilProgress = this._recoilTimer / 0.1;
      const recoilCurve = Math.sin(recoilProgress * Math.PI);
      const recoilScale = recoilCurve * this._recoilIntensity;

      targetPos.z += recoilScale * 0.02;
      targetPos.y += recoilScale * 0.008;
      targetRot.x -= recoilScale * 0.04;

      this._recoilIntensity *= (1 - 8 * dt);
    }

    // ── Apply with smoothing (snappy) ──
    const smooth = Math.min(1, 28 * dt);
    this._currentPos.lerp(targetPos, smooth);
    this._currentRot.x += (targetRot.x - this._currentRot.x) * smooth;
    this._currentRot.y += (targetRot.y - this._currentRot.y) * smooth;
    this._currentRot.z += (targetRot.z - this._currentRot.z) * smooth;

    this.group.position.copy(this._currentPos);
    this.group.rotation.copy(this._currentRot);

    // ── Muzzle glow pulse ──
    if (this._muzzleGlow) {
      const pulse = 0.6 + Math.sin(this._swayTimer * 3) * 0.4;
      this._muzzleGlow.material.opacity = pulse;
    }

    // ── Skin glow animation for legendary+ ──
    if (this._skinRarity && this._skinAccentHex) {
      const glowAnims = { legendary: 1.5, mythic: 2.5, unobtainable: 4.0 };
      const glowSpeed = glowAnims[this._skinRarity];
      if (glowSpeed) {
        const p = 0.7 + Math.sin(this._swayTimer * glowSpeed) * 0.3;
        this._bodyMat.emissiveIntensity = p * (this._skinRarity === 'unobtainable' ? 0.6 : this._skinRarity === 'mythic' ? 0.4 : 0.25);
      }
    }
  }

  // ═══════════════════════════════════════════
  // RENDER (called from main loop)
  // ═══════════════════════════════════════════

  render(renderer) {
    if (!this._visible) return;

    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(this.scene, this.camera);
    renderer.autoClear = prevAutoClear;
  }

  // ═══════════════════════════════════════════
  // DISPOSE
  // ═══════════════════════════════════════════

  dispose() {
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
