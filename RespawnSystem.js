import { Config } from './Config.js';
import { PlayerState } from './GameState.js';

class RespawnEntry {
  constructor(entity, callback) {
    this.entity = entity;
    this.timer = Config.respawn.disableDuration;
    this.callback = callback;
    this.phase = PlayerState.DISABLED;
  }
}

export class RespawnSystem {
  constructor(spawnPoints) {
    this.spawnPoints = spawnPoints;
    this.entries = [];
  }

  startRespawn(entity, callback) {
    this.entries.push(new RespawnEntry(entity, callback));
  }

  update(dt) {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i];
      entry.timer -= dt;

      if (entry.timer <= 0 && entry.phase === PlayerState.DISABLED) {
        entry.phase = PlayerState.INVULNERABLE;
        entry.timer = Config.respawn.invulnerabilityDuration;
        entry.callback('respawn');
      } else if (entry.timer <= 0 && entry.phase === PlayerState.INVULNERABLE) {
        entry.callback('active');
        this.entries.splice(i, 1);
      }
    }
  }

  getSpawnPoint(team) {
    const points = this.spawnPoints[team] || this.spawnPoints.default;
    if (!points || points.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }
    return points[Math.floor(Math.random() * points.length)];
  }

  isRespawning(entity) {
    return this.entries.some((e) => e.entity === entity);
  }
}
