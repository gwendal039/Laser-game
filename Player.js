import * as THREE from 'three';
import { Config } from './Config.js';
import { PlayerState } from './GameState.js';

export class Player {
  constructor(camera, inputManager, settings) {
    this.camera = camera;
    this.input = inputManager;
    this.settings = settings;

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = true;

    this.isCrouching = false;
    this.isSprinting = false;
    this.isAiming = false;
    this.currentFOV = settings.get('fov');
    this.currentEyeHeight = Config.player.eyeHeight;

    this.state = PlayerState.ACTIVE;
    this.id = 'player';
    this.team = 'player';

    // Head bob
    this._bobTimer = 0;
    this._bobIntensity = 0;
    this._landingDip = 0;
    this._wasInAir = false;

    // Camera shake
    this._shakeTimer = 0;
    this._shakeIntensity = 0;

    // Stats
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.deaths = 0;

    this._moveDir = new THREE.Vector3();
    this._forward = new THREE.Vector3();
    this._right = new THREE.Vector3();

    // Immediate per-event mouse look
    inputManager.onMouseMove((dx, dy) => {
      if (this.state === PlayerState.DISABLED) return;
      let sens = this.settings.get('sensitivity');
      if (inputManager.isAimDown()) {
        sens *= this.settings.get('aimSensitivityMultiplier');
      }
      this.yaw -= dx * sens;
      const invertMul = this.settings.get('invertY') ? -1 : 1;
      this.pitch -= dy * sens * invertMul;
      this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
    });
  }

  spawn(spawnPoint) {
    this.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = true;
    this.isCrouching = false;
    this.isSprinting = false;
    this.isAiming = false;
    this.currentFOV = this.settings.get('fov');
    this.currentEyeHeight = Config.player.eyeHeight;
    this._bobTimer = 0;
    this._bobIntensity = 0;
    this._landingDip = 0;
    this._shakeTimer = 0;
  }

  update(dt, wallBoxes) {
    if (this.state === PlayerState.DISABLED) {
      this._updateCamera(dt);
      return;
    }

    this._handleCrouch();
    this._handleSprint();
    this._handleAim(dt);
    this._handleMovement(dt, wallBoxes);
    this._handleHeadBob(dt);
    this._updateCamera(dt);
  }

  _handleCrouch() {
    this.isCrouching = this.input.isCrouch();
    if (this.isCrouching) this.isSprinting = false;
  }

  _handleSprint() {
    const wantsSprint = this.input.isSprint() && !this.isCrouching && !this.isAiming;
    const movingFwd = this.input.isForward() && !this.input.isBackward();
    this.isSprinting = wantsSprint && movingFwd;
  }

  _handleAim(dt) {
    this.isAiming = this.input.isAimDown();
    if (this.isAiming) this.isSprinting = false;

    const baseFov = this.settings.get('fov');
    const aimFov = this.settings.get('aimFov');
    const sprintFov = baseFov + 8;

    let targetFOV = baseFov;
    if (this.isAiming) targetFOV = aimFov;
    else if (this.isSprinting) targetFOV = sprintFov;

    this.currentFOV += (targetFOV - this.currentFOV) * Math.min(1, 35 * dt);
    this.camera.fov = this.currentFOV;
    this.camera.updateProjectionMatrix();
  }

  _handleMovement(dt, wallBoxes) {
    const cfg = Config.player;

    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    this._moveDir.set(0, 0, 0);
    if (this.input.isForward())  this._moveDir.add(this._forward);
    if (this.input.isBackward()) this._moveDir.sub(this._forward);
    if (this.input.isLeft())     this._moveDir.sub(this._right);
    if (this.input.isRight())    this._moveDir.add(this._right);

    if (this._moveDir.lengthSq() > 0) this._moveDir.normalize();

    let speed = cfg.moveSpeed;
    if (this.isCrouching) speed *= cfg.crouchSpeedMultiplier;
    else if (this.isSprinting) speed *= cfg.sprintMultiplier;
    if (this.isAiming) speed *= 0.88;

    const targetVelX = this._moveDir.x * speed;
    const targetVelZ = this._moveDir.z * speed;

    const accel = this.onGround ? cfg.acceleration : cfg.acceleration * cfg.airControl;
    const lerpFactor = 1 - Math.exp(-accel * dt);
    this.velocity.x += (targetVelX - this.velocity.x) * lerpFactor;
    this.velocity.z += (targetVelZ - this.velocity.z) * lerpFactor;

    if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
    if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;

    if (this.input.isJump() && this.onGround && !this.isCrouching) {
      this.velocity.y = cfg.jumpForce;
      this.onGround = false;
    }

    if (!this.onGround) {
      this.velocity.y -= cfg.gravity * dt;
    }

    this._moveWithCollision(dt, wallBoxes);
  }

  _handleHeadBob(dt) {
    if (!this.settings.get('headBob')) {
      this._bobIntensity = 0;
      return;
    }

    const hSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    const isMoving = hSpeed > 0.5 && this.onGround;

    if (isMoving) {
      const bobSpeed = this.isSprinting ? 14 : (this.isCrouching ? 6 : 10);
      this._bobTimer += dt * bobSpeed;
      this._bobIntensity += (1 - this._bobIntensity) * Math.min(1, 8 * dt);
    } else {
      this._bobIntensity *= Math.max(0, 1 - 6 * dt);
    }

    if (!this.onGround) {
      this._wasInAir = true;
    } else if (this._wasInAir) {
      this._wasInAir = false;
      this._landingDip = 0.15;
    }
    if (this._landingDip > 0) {
      this._landingDip *= Math.max(0, 1 - 12 * dt);
      if (this._landingDip < 0.002) this._landingDip = 0;
    }
  }

  _moveWithCollision(dt, wallBoxes) {
    const radius = Config.player.radius;
    const height = this.isCrouching ? Config.player.crouchHeight : Config.player.height;

    this.position.x += this.velocity.x * dt;
    this._resolveHorizontal(wallBoxes, radius, height);

    this.position.z += this.velocity.z * dt;
    this._resolveHorizontal(wallBoxes, radius, height);

    this.position.y += this.velocity.y * dt;

    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
      for (const box of wallBoxes) {
        if (
          this.position.x + radius > box.min.x &&
          this.position.x - radius < box.max.x &&
          this.position.z + radius > box.min.z &&
          this.position.z - radius < box.max.z
        ) {
          const bottom = this.position.y;
          const top = this.position.y + height;
          if (bottom < box.max.y && bottom > box.max.y - 0.5 && this.velocity.y <= 0) {
            this.position.y = box.max.y;
            this.velocity.y = 0;
            this.onGround = true;
          } else if (top > box.min.y && top < box.min.y + 0.5 && this.velocity.y > 0) {
            this.velocity.y = 0;
          }
        }
      }
    }

    const bound = Config.arena.width / 2 - radius - 0.3;
    this.position.x = Math.max(-bound, Math.min(bound, this.position.x));
    this.position.z = Math.max(-bound, Math.min(bound, this.position.z));
  }

  _resolveHorizontal(wallBoxes, radius, height) {
    for (const box of wallBoxes) {
      if (this.position.y >= box.max.y || this.position.y + height <= box.min.y) continue;

      const closestX = Math.max(box.min.x, Math.min(this.position.x, box.max.x));
      const closestZ = Math.max(box.min.z, Math.min(this.position.z, box.max.z));

      const dx = this.position.x - closestX;
      const dz = this.position.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist > 0.001) {
          const overlap = radius - dist;
          this.position.x += (dx / dist) * overlap;
          this.position.z += (dz / dist) * overlap;
        } else {
          this.position.x += radius * 1.1;
        }
      }
    }
  }

  _updateCamera(dt) {
    const targetEyeH = this.isCrouching ? Config.player.crouchEyeHeight : Config.player.eyeHeight;
    this.currentEyeHeight += (targetEyeH - this.currentEyeHeight) * Math.min(1, 24 * dt);

    const bobY = Math.sin(this._bobTimer) * 0.03 * this._bobIntensity;
    const bobX = Math.cos(this._bobTimer * 0.5) * 0.015 * this._bobIntensity;
    const landDip = -this._landingDip;

    let shakeX = 0, shakeY = 0;
    if (this._shakeTimer > 0) {
      this._shakeTimer -= dt;
      shakeX = (Math.random() - 0.5) * this._shakeIntensity * this._shakeTimer;
      shakeY = (Math.random() - 0.5) * this._shakeIntensity * this._shakeTimer;
    }

    this.camera.position.set(
      this.position.x + bobX + shakeX,
      this.position.y + this.currentEyeHeight + bobY + landDip + shakeY,
      this.position.z
    );

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  applyDamageShake() {
    if (!this.settings.get('screenShake')) return;
    this._shakeTimer = 0.25;
    this._shakeIntensity = 0.4;
  }

  getPosition() { return this.position.clone(); }

  getEyePosition() {
    return new THREE.Vector3(this.position.x, this.position.y + this.currentEyeHeight, this.position.z);
  }

  getDirection() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyQuaternion(this.camera.quaternion);
    return dir.normalize();
  }

  setState(state) { this.state = state; }
  isActive() { return this.state === PlayerState.ACTIVE || this.state === PlayerState.INVULNERABLE; }
  isInvulnerable() { return this.state === PlayerState.INVULNERABLE; }
  isDisabled() { return this.state === PlayerState.DISABLED; }
}
