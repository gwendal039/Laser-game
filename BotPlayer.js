import * as THREE from 'three';
import { Config } from './Config.js';
import { PlayerState, BotAIState } from './GameState.js';
import { RunnerModel } from './RunnerModel.js';

const _tempVec = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();

export class BotPlayer {
  constructor(scene, arena, index, difficulty) {
    this.scene = scene;
    this.arena = arena;
    this.collisionWalls = arena.getCollisionWalls();
    this.wallBoxes = arena.getWallBoxes();
    this.index = index;
    this.difficulty = difficulty || 'casual';
    this.diff = Config.difficulty[this.difficulty];

    this.id = 'bot-' + index;
    this.team = 'enemy';
    this.teamId = -1;
    this.botName = Config.bot.names[index % Config.bot.names.length];

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.facingAngle = 0;
    this.targetAngle = 0;

    this.state = PlayerState.ACTIVE;
    this.aiState = BotAIState.PATROL;

    const color = Config.bot.colors[index % Config.bot.colors.length];
    this.color = color;
    this.laserColor = color;
    this.model = new RunnerModel(color, color, index);
    this.scene.add(this.model.group);

    // Physics (identical to Player)
    this.onGround = true;
    this.isCrouching = false;
    this._wantsJump = false;
    this.jumpCooldown = 0;
    this.crouchTimer = 0;
    this._crouchScaleY = 1.8;
    this._targetVelX = 0;
    this._targetVelZ = 0;

    // AI — target any participant
    this.currentTarget = null;     // { id, position, state, ... }
    this.currentTargetId = null;
    this.patrolPauseTimer = 0;
    this.attackTimer = 0;
    this.reactionTimer = this.diff.reactionTime;
    this.canSeeTarget = false;
    this.retreatTimer = 0;
    this.stuckTimer = 0;
    this.lastPosition = this.position.clone();

    // Pathfinding
    this.currentPath = null;
    this.pathIndex = 0;
    this.pathUpdateTimer = 0;

    // Weapon
    this.fireCooldown = 0;
    this.wantsToFire = false;
    this.aimDirection = new THREE.Vector3(0, 0, -1);

    // Stats
    this.score = 0;
    this.kills = 0;
    this.deaths = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;

    this._pickNewPatrolTarget();
  }

  setDifficulty(diff) {
    this.difficulty = diff;
    this.diff = Config.difficulty[diff];
    this.reactionTimer = this.diff.reactionTime;
  }

  setTeamColor(primary, secondary) {
    this.color = primary;
    this.laserColor = secondary || primary;
    this.model.setTeamColor(primary, secondary);
  }

  spawn(spawnPoint) {
    this.position.set(spawnPoint.x, spawnPoint.y || 0, spawnPoint.z);
    this.velocity.set(0, 0, 0);
    this._targetVelX = 0;
    this._targetVelZ = 0;
    this.onGround = true;
    this.isCrouching = false;
    this._wantsJump = false;
    this.jumpCooldown = 0;
    this.crouchTimer = 0;
    this.aiState = BotAIState.PATROL;
    this.reactionTimer = this.diff.reactionTime;
    this.patrolPauseTimer = 0;
    this.stuckTimer = 0;
    this.lastPosition.copy(this.position);
    this.currentPath = null;
    this.pathIndex = 0;
    this.pathUpdateTimer = 0;
    this.currentTarget = null;
    this.currentTargetId = null;
    this._pickNewPatrolTarget();
    this._syncModel();
  }

  /**
   * Main update — takes target from TargetingSystem.
   * @param {number} dt
   * @param {object|null} target — the chosen target participant (or null)
   */
  update(dt, target) {
    this.wantsToFire = false;
    this.currentTarget = target;
    this.currentTargetId = target ? target.id : null;

    if (this.state === PlayerState.DISABLED) {
      this.model.setDisabled(true);
      this.model.update(dt);
      return;
    }

    this.model.setDisabled(false);
    this.model.setInvulnerable(this.state === PlayerState.INVULNERABLE);
    this.model.update(dt);

    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.pathUpdateTimer > 0) this.pathUpdateTimer -= dt;
    if (this.jumpCooldown > 0) this.jumpCooldown -= dt;

    this._targetVelX = 0;
    this._targetVelZ = 0;

    // Check visibility to current target
    if (target) {
      this.canSeeTarget = this._canSeeTarget(target.position);
    } else {
      this.canSeeTarget = false;
    }

    this._updateAI(dt, target);
    this._handleTacticalActions(dt, target);
    this._move(dt);
    this._updateModel(dt);
    this._checkStuck(dt);
    this._syncModel();
  }

  // ═══════════════════════════════════════════
  // AI STATE MACHINE
  // ═══════════════════════════════════════════

  _updateAI(dt, target) {
    if (!target) {
      // No target — patrol
      this.aiState = BotAIState.PATROL;
      this._doPatrol(dt, null, Infinity, false);
      return;
    }

    const dist = this.position.distanceTo(target.position);
    const targetActive = target.state === PlayerState.ACTIVE;

    switch (this.aiState) {
      case BotAIState.PATROL:  this._doPatrol(dt, target, dist, targetActive); break;
      case BotAIState.CHASE:   this._doChase(dt, target, dist, targetActive); break;
      case BotAIState.ATTACK:  this._doAttack(dt, target, dist, targetActive); break;
      case BotAIState.RETREAT: this._doRetreat(dt, target, dist, targetActive); break;
    }
  }

  _doPatrol(dt, target, dist, targetActive) {
    if (target && this.canSeeTarget && targetActive && dist < this.diff.detectionRange) {
      this.reactionTimer -= dt;
      if (this.reactionTimer <= 0) {
        this.aiState = dist < 12 ? BotAIState.ATTACK : BotAIState.CHASE;
        return;
      }
    } else {
      this.reactionTimer = this.diff.reactionTime;
    }

    if (this.patrolPauseTimer > 0) {
      this.patrolPauseTimer -= dt;
      return;
    }

    const speed = Config.player.moveSpeed * this.diff.moveSpeedMul * 0.6;
    const reached = this._followPath(speed);
    if (reached) {
      this.patrolPauseTimer = Config.bot.patrolPauseMin +
        Math.random() * (Config.bot.patrolPauseMax - Config.bot.patrolPauseMin);
      this._pickNewPatrolTarget();
    }
  }

  _doChase(dt, target, dist, targetActive) {
    if (!target || !targetActive) {
      this.aiState = BotAIState.PATROL;
      this._pickNewPatrolTarget();
      return;
    }
    if (dist < 10 && this.canSeeTarget) {
      this.aiState = BotAIState.ATTACK;
      return;
    }
    if (!this.canSeeTarget && dist > this.diff.detectionRange * 1.5) {
      this.aiState = BotAIState.PATROL;
      this._pickNewPatrolTarget();
      return;
    }

    const speed = Config.player.moveSpeed * this.diff.moveSpeedMul;

    if (this.canSeeTarget) {
      const toTarget = _tempVec.set(
        target.position.x - this.position.x, 0,
        target.position.z - this.position.z
      ).normalize();
      this.targetAngle = Math.atan2(-toTarget.x, -toTarget.z);
      this._targetVelX = toTarget.x * speed;
      this._targetVelZ = toTarget.z * speed;
    } else {
      if (this.pathUpdateTimer <= 0) {
        this._calculatePathTo(target.position);
        this.pathUpdateTimer = Config.bot.pathUpdateInterval;
      }
      if (this._followPath(speed)) {
        this.aiState = BotAIState.PATROL;
        this._pickNewPatrolTarget();
      }
    }
  }

  _doAttack(dt, target, dist, targetActive) {
    if (!target || !targetActive) {
      this.aiState = BotAIState.PATROL;
      this._pickNewPatrolTarget();
      return;
    }
    if (!this.canSeeTarget) {
      this.aiState = BotAIState.CHASE;
      this._calculatePathTo(target.position);
      return;
    }
    if (dist > 18) {
      this.aiState = BotAIState.CHASE;
      this._calculatePathTo(target.position);
      return;
    }

    // Face target
    const toTarget = _tempVec.set(
      target.position.x - this.position.x, 0,
      target.position.z - this.position.z
    );
    this.targetAngle = Math.atan2(-toTarget.x, -toTarget.z);

    // Strafe
    const speed = Config.player.moveSpeed * this.diff.moveSpeedMul;
    const strafeDir = Math.sin(Date.now() * 0.002 + this.index * 1.7) > 0 ? 1 : -1;
    const right = new THREE.Vector3(Math.cos(this.facingAngle), 0, -Math.sin(this.facingAngle));
    this._targetVelX = right.x * speed * this.diff.strafeIntensity * strafeDir;
    this._targetVelZ = right.z * speed * this.diff.strafeIntensity * strafeDir;

    // Keep distance
    if (dist < 5) {
      const away = toTarget.clone().normalize().multiplyScalar(-1);
      this._targetVelX += away.x * speed * 0.5;
      this._targetVelZ += away.z * speed * 0.5;
    }

    // Fire
    this.attackTimer -= dt;
    if (this.attackTimer <= 0 && this.fireCooldown <= 0) {
      this._aimAtTarget(target);
      this.wantsToFire = true;
      this.shotsFired++;
      this.fireCooldown = 1 / this.diff.fireRate;
      this.attackTimer = 0.1 + Math.random() * 0.3;
      this.model.showMuzzleFlash();
    }
  }

  _doRetreat(dt, target, dist, targetActive) {
    this.retreatTimer -= dt;
    if (this.retreatTimer <= 0 || dist > 15) {
      this.aiState = (target && this.canSeeTarget && targetActive) ? BotAIState.ATTACK : BotAIState.PATROL;
      if (this.aiState === BotAIState.PATROL) this._pickNewPatrolTarget();
      return;
    }
    if (target) {
      const away = _tempVec.set(
        this.position.x - target.position.x, 0,
        this.position.z - target.position.z
      ).normalize();
      this.targetAngle = Math.atan2(away.x, away.z);
      const speed = Config.player.moveSpeed * this.diff.moveSpeedMul;
      this._targetVelX = away.x * speed;
      this._targetVelZ = away.z * speed;
    }
  }

  // ═══════════════════════════════════════════
  // TACTICAL
  // ═══════════════════════════════════════════

  _handleTacticalActions(dt, target) {
    // Jump
    if (this.jumpCooldown <= 0 && this.onGround && !this.isCrouching) {
      if (this.aiState === BotAIState.ATTACK && Math.random() < this.diff.jumpChance) {
        this._wantsJump = true;
        this.jumpCooldown = 2.5 + Math.random() * 3;
      } else if (this.stuckTimer > 0.4 && this.stuckTimer < 0.8) {
        // Only try one jump to clear small obstacles, don't spam jumps
        this._wantsJump = true;
        this.jumpCooldown = 2.0;
      }
    }

    // Crouch
    if (this.crouchTimer > 0) {
      this.crouchTimer -= dt;
      if (this.crouchTimer <= 0) this.isCrouching = false;
    } else if (!this.isCrouching) {
      if (this.aiState === BotAIState.ATTACK && Math.random() < this.diff.crouchChance) {
        this.isCrouching = true;
        this.crouchTimer = 0.6 + Math.random() * 1.2;
      } else if (this.aiState === BotAIState.RETREAT && Math.random() < this.diff.crouchChance * 1.5) {
        this.isCrouching = true;
        this.crouchTimer = 0.4 + Math.random() * 0.8;
      }
    }
  }

  // ═══════════════════════════════════════════
  // PATHFINDING
  // ═══════════════════════════════════════════

  _followPath(speed) {
    if (!this.currentPath || this.pathIndex >= this.currentPath.length) return true;
    const wp = this.currentPath[this.pathIndex];
    const dx = wp.x - this.position.x;
    const dz = wp.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 1.2) {
      this.pathIndex++;
      return this.pathIndex >= this.currentPath.length;
    }
    const nx = dx / dist;
    const nz = dz / dist;
    this.targetAngle = Math.atan2(-nx, -nz);
    this._targetVelX = nx * speed;
    this._targetVelZ = nz * speed;
    return false;
  }

  _calculatePathTo(target) {
    const start = this.arena.worldToGrid(this.position.x, this.position.z);
    const end = this.arena.worldToGrid(target.x, target.z);
    this.currentPath = this.arena.findPath(start.row, start.col, end.row, end.col);
    this.pathIndex = this.currentPath && this.currentPath.length > 1 ? 1 : 0;
  }

  _pickNewPatrolTarget() {
    const navPoints = this.arena.getNavPoints();
    const farPoints = navPoints.filter((p) => {
      const dx = p.x - this.position.x;
      const dz = p.z - this.position.z;
      return dx * dx + dz * dz > 400;
    });
    const candidates = farPoints.length > 0 ? farPoints : navPoints;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    if (target) this._calculatePathTo({ x: target.x, z: target.z });
  }

  // ═══════════════════════════════════════════
  // COMBAT
  // ═══════════════════════════════════════════

  _aimAtTarget(target) {
    const eyePos = this.getEyePosition();
    const tPos = target.position;
    const targetPt = new THREE.Vector3(tPos.x, tPos.y + Config.player.eyeHeight * 0.75, tPos.z);
    const dir = new THREE.Vector3().subVectors(targetPt, eyePos).normalize();
    const spread = (1 - this.diff.accuracy) * 0.15;
    dir.x += (Math.random() - 0.5) * spread;
    dir.y += (Math.random() - 0.5) * spread * 0.5;
    dir.z += (Math.random() - 0.5) * spread;
    dir.normalize();
    this.aimDirection.copy(dir);
  }

  _canSeeTarget(targetPos) {
    const eyePos = this.getEyePosition();
    const dir = _tempVec.subVectors(targetPos, eyePos).normalize();
    _raycaster.set(eyePos, dir);
    _raycaster.far = eyePos.distanceTo(targetPos);
    return _raycaster.intersectObjects(this.collisionWalls, false).length === 0;
  }

  // ═══════════════════════════════════════════
  // MOVEMENT (mirrors Player.js physics)
  // ═══════════════════════════════════════════

  _move(dt) {
    // Smooth facing
    let angleDiff = this.targetAngle - this.facingAngle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.facingAngle += angleDiff * Math.min(1, 8 * dt);

    let speedMul = 1;
    if (this.isCrouching) speedMul = Config.player.crouchSpeedMultiplier;

    const targetVX = this._targetVelX * speedMul;
    const targetVZ = this._targetVelZ * speedMul;

    const lerpFactor = 1 - Math.exp(-Config.player.acceleration * dt);
    this.velocity.x += (targetVX - this.velocity.x) * lerpFactor;
    this.velocity.z += (targetVZ - this.velocity.z) * lerpFactor;
    if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
    if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;

    if (this._wantsJump && this.onGround && !this.isCrouching) {
      this.velocity.y = Config.player.jumpForce;
      this.onGround = false;
      this._wantsJump = false;
    }

    if (!this.onGround) this.velocity.y -= Config.player.gravity * dt;

    const height = this.isCrouching ? Config.player.crouchHeight : Config.player.height;
    const radius = Config.player.radius;

    this.position.x += this.velocity.x * dt;
    this._resolveH(radius, height);
    this.position.z += this.velocity.z * dt;
    this._resolveH(radius, height);
    this.position.y += this.velocity.y * dt;

    if (this.position.y <= 0) {
      this.position.y = 0; this.velocity.y = 0; this.onGround = true;
    } else {
      this.onGround = false;
      for (const box of this.wallBoxes) {
        if (this.position.x + radius > box.min.x && this.position.x - radius < box.max.x &&
            this.position.z + radius > box.min.z && this.position.z - radius < box.max.z) {
          const bottom = this.position.y, top = this.position.y + height;
          if (bottom < box.max.y && bottom > box.max.y - 0.5 && this.velocity.y <= 0) {
            this.position.y = box.max.y; this.velocity.y = 0; this.onGround = true;
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

  _resolveH(radius, height) {
    for (const box of this.wallBoxes) {
      if (this.position.y >= box.max.y || this.position.y + height <= box.min.y) continue;
      const cx = Math.max(box.min.x, Math.min(this.position.x, box.max.x));
      const cz = Math.max(box.min.z, Math.min(this.position.z, box.max.z));
      const dx = this.position.x - cx, dz = this.position.z - cz;
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

  // ═══════════════════════════════════════════
  // MODEL SYNC
  // ═══════════════════════════════════════════

  _updateModel(dt) {
    const hSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    this.model.setWalkSpeed(hSpeed, dt, false);
  }

  _checkStuck(dt) {
    const moved = this.position.distanceTo(this.lastPosition);
    if (moved < 0.08) {
      this.stuckTimer += dt;
      // First attempt: small nudge after 0.8s
      if (this.stuckTimer > 0.8 && this.stuckTimer < 1.0) {
        this._pickNewPatrolTarget();
        this.aiState = BotAIState.PATROL;
        this.patrolPauseTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        this.position.x += Math.cos(angle) * 1.5;
        this.position.z += Math.sin(angle) * 1.5;
      }
      // Still stuck after 2s → teleport to a valid ground-level nav point
      if (this.stuckTimer > 2.0) {
        const navPoints = this.arena.getNavPoints();
        // Only pick nav points that are far away and at ground level
        const safePoints = navPoints.filter(p => {
          const dx = p.x - this.position.x;
          const dz = p.z - this.position.z;
          return dx * dx + dz * dz > 200;
        });
        const candidates = safePoints.length > 0 ? safePoints : navPoints;
        const tp = candidates[Math.floor(Math.random() * candidates.length)];
        if (tp) {
          this.position.set(tp.x, 0, tp.z);
          this.velocity.set(0, 0, 0);
        }
        this._pickNewPatrolTarget();
        this.aiState = BotAIState.PATROL;
        this.patrolPauseTimer = 0;
        this.stuckTimer = 0;
      }
    } else {
      this.stuckTimer = 0;
    }
    this.lastPosition.copy(this.position);
  }

  _syncModel() {
    this.model.setPosition(this.position.x, this.position.y, this.position.z);
    this.model.setRotationY(this.facingAngle);

    const targetScaleY = this.isCrouching ? 1.2 : 1.8;
    this._crouchScaleY += (targetScaleY - this._crouchScaleY) * Math.min(1, 14 * 0.016);
    this.model.setCrouchScale(this._crouchScaleY);
  }

  // ═══════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════

  getPosition() { return this.position.clone(); }

  getEyePosition() {
    const eyeH = this.isCrouching ? Config.player.crouchEyeHeight : Config.player.eyeHeight;
    return new THREE.Vector3(this.position.x, this.position.y + eyeH, this.position.z);
  }

  getAimDirection() { return this.aimDirection.clone(); }

  onHit(zone) {
    if (this.state === PlayerState.INVULNERABLE || this.state === PlayerState.DISABLED) return false;
    this.state = PlayerState.DISABLED;
    this.velocity.set(0, 0, 0);
    this._targetVelX = 0; this._targetVelZ = 0;
    this.isCrouching = false;
    this.currentPath = null;
    this.retreatTimer = 2 + Math.random() * 2;
    this.deaths++;
    if (zone) this.model.flashHitZone(zone);
    return true;
  }

  setState(state) {
    this.state = state;
    if (state === PlayerState.ACTIVE) {
      this.aiState = BotAIState.PATROL;
      this.reactionTimer = this.diff.reactionTime;
      this.isCrouching = false;
      this.crouchTimer = 0;
      this.currentTarget = null;
      this._pickNewPatrolTarget();
    }
  }

  isActive() { return this.state === PlayerState.ACTIVE || this.state === PlayerState.INVULNERABLE; }
  isInvulnerable() { return this.state === PlayerState.INVULNERABLE; }
  isDisabled() { return this.state === PlayerState.DISABLED; }

  dispose() {
    this.scene.remove(this.model.group);
    this.model.dispose();
  }
}
