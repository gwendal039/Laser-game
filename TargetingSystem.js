import * as THREE from 'three';
import { PlayerState } from './GameState.js';

const _ray = new THREE.Raycaster();
const _dir = new THREE.Vector3();

/**
 * TargetingSystem — decides which participant each bot should target.
 * Scores candidates by distance, angle, threat, score-lead, and visibility.
 * Shared across all bots; call decayThreats() once per frame.
 */
export class TargetingSystem {
  constructor() {
    // botId → Map(sourceId → threatLevel)
    this._threats = new Map();
    // botId → { targetId, lockTimer }
    this._locks = new Map();
  }

  /** Register that `sourceId` threatened `targetId` (e.g. shot at them). */
  registerThreat(targetId, sourceId, amount) {
    if (!this._threats.has(targetId)) this._threats.set(targetId, new Map());
    const m = this._threats.get(targetId);
    m.set(sourceId, Math.min((m.get(sourceId) || 0) + amount, 30));
  }

  /** Decay all threat levels over time. Call once per frame. */
  decayThreats(dt) {
    for (const [, threats] of this._threats) {
      for (const [srcId, level] of threats) {
        const next = level - dt * 3;
        if (next <= 0) threats.delete(srcId);
        else threats.set(srcId, next);
      }
    }
  }

  /**
   * Evaluate all valid targets for a bot and return sorted candidates.
   * @param {object} bot – the bot choosing a target
   * @param {object[]} participants – all participants (player + bots)
   * @param {object|null} teamManager – null for FFA
   * @param {THREE.Mesh[]} collisionWalls – for line-of-sight raycasts
   * @returns {{ target, score, distance, visible }[]}
   */
  evaluate(bot, participants, teamManager, collisionWalls) {
    const candidates = [];
    const bp = bot.position;

    for (const p of participants) {
      if (p.id === bot.id) continue;
      if (p.state !== PlayerState.ACTIVE) continue;
      if (teamManager && teamManager.isAlly(bot.id, p.id)) continue;

      const dx = p.position.x - bp.x;
      const dz = p.position.z - bp.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Hard range cap — ignore very far targets
      if (dist > bot.diff.detectionRange * 1.6) continue;

      let score = 0;

      // 1) Distance — closer = higher (0–30)
      score += Math.max(0, 30 * (1 - dist / (bot.diff.detectionRange * 1.4)));

      // 2) Angle — targets in front get bonus (0–15)
      const angleToTarget = Math.atan2(-dx, -dz);
      let ad = angleToTarget - bot.facingAngle;
      while (ad > Math.PI)  ad -= Math.PI * 2;
      while (ad < -Math.PI) ad += Math.PI * 2;
      score += Math.max(0, 15 * (1 - Math.abs(ad) / Math.PI));

      // 3) Threat — they recently shot at us (0–25)
      const threats = this._threats.get(bot.id);
      if (threats && threats.has(p.id)) {
        score += Math.min(25, threats.get(p.id) * 3);
      }

      // 4) Score lead — slight preference for leaders (0–8)
      if (p.score > 200) score += Math.min(8, p.score / 150);

      // 5) Visibility — line-of-sight bonus (0–20)
      const eyePos = bot.getEyePosition();
      const targetCenter = new THREE.Vector3(
        p.position.x, p.position.y + 2.0, p.position.z
      );
      _dir.subVectors(targetCenter, eyePos).normalize();
      _ray.set(eyePos, _dir);
      _ray.far = dist + 1;
      const visible = _ray.intersectObjects(collisionWalls, false).length === 0;
      if (visible) score += 20;

      // 6) Aggressiveness factor
      score *= (0.5 + bot.diff.aggressiveness * 0.5);

      candidates.push({ target: p, score, distance: dist, visible });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates;
  }

  /**
   * Get the best target for a bot, with a lock timer to prevent rapid switching.
   */
  getBestTarget(bot, participants, teamManager, collisionWalls) {
    const lock = this._locks.get(bot.id);

    // If we have a locked target, check if it's still valid
    if (lock && lock.lockTimer > 0) {
      const existing = participants.find(
        (p) => p.id === lock.targetId && p.state === PlayerState.ACTIVE
      );
      if (existing) {
        // Check if teammate now (team could change)
        if (!teamManager || !teamManager.isAlly(bot.id, existing.id)) {
          const dx = existing.position.x - bot.position.x;
          const dz = existing.position.z - bot.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < bot.diff.detectionRange * 1.6) {
            return existing;
          }
        }
      }
    }

    // Evaluate fresh targets
    const candidates = this.evaluate(bot, participants, teamManager, collisionWalls);
    if (candidates.length === 0) return null;

    const best = candidates[0];
    // Lock this target based on bot's target switch rate (higher = shorter lock)
    const lockDuration = 1.5 + (1 - bot.diff.targetSwitchRate) * 3;
    this._locks.set(bot.id, { targetId: best.target.id, lockTimer: lockDuration });

    return best.target;
  }

  /** Update lock timers. Call once per frame. */
  updateLocks(dt) {
    for (const [id, lock] of this._locks) {
      lock.lockTimer -= dt;
      if (lock.lockTimer <= 0) this._locks.delete(id);
    }
  }

  reset() {
    this._threats.clear();
    this._locks.clear();
  }
}
