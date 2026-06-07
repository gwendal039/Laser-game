import { Config } from './Config.js';
import { MatchState } from './GameState.js';

export class MatchManager {
  constructor() {
    this.state = MatchState.WAITING;
    this._default = Config.match.defaultDuration || 180;
    this.timeRemaining = this._default;
    this.duration = this._default;
    this.isTraining = false;
    this.elapsed = 0;
    this.onMatchEndCallback = null;
  }

  start(duration) {
    this.duration = (duration != null) ? duration : this._default;
    this.isTraining = this.duration === 0;
    this.timeRemaining = this.isTraining ? Infinity : this.duration;
    this.elapsed = 0;
    this.state = MatchState.RUNNING;
  }

  update(dt) {
    if (this.state !== MatchState.RUNNING) return;

    this.elapsed += dt;

    if (this.isTraining) return;

    this.timeRemaining -= dt;

    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.state = MatchState.ENDED;
      if (this.onMatchEndCallback) {
        this.onMatchEndCallback();
      }
    }
  }

  isRunning() {
    return this.state === MatchState.RUNNING;
  }

  isEnded() {
    return this.state === MatchState.ENDED;
  }

  isWaiting() {
    return this.state === MatchState.WAITING;
  }

  getTimeRemaining() {
    if (this.isTraining) return Infinity;
    return Math.max(0, this.timeRemaining);
  }

  getFormattedTime() {
    if (this.isTraining) {
      const t = Math.floor(this.elapsed);
      const min = Math.floor(t / 60);
      const sec = t % 60;
      return `${min}:${sec.toString().padStart(2, '0')}`;
    }
    const t = Math.ceil(this.getTimeRemaining());
    const min = Math.floor(t / 60);
    const sec = t % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  onMatchEnd(callback) {
    this.onMatchEndCallback = callback;
  }

  reset() {
    this.state = MatchState.WAITING;
    this.timeRemaining = this._default;
    this.elapsed = 0;
    this.isTraining = false;
  }
}
