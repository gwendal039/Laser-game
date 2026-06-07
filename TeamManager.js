import { Config } from './Config.js';

/**
 * TeamManager — assigns participants to teams, tracks team scores,
 * and provides team queries (isAlly, getTeamColor, etc.)
 */
export class TeamManager {
  constructor() {
    // playerId → teamIndex (0, 1, 2, 3)
    this._assignments = new Map();
    this._teamCount = 0;
    this._active = false;
  }

  get active() { return this._active; }
  get teamCount() { return this._teamCount; }

  /**
   * Create balanced teams for all participant IDs.
   * @param {string[]} participantIds
   * @param {number} teamCount — 2, 3, or 4
   */
  createTeams(participantIds, teamCount) {
    this._active = true;
    this._teamCount = Math.min(teamCount, Config.teams.colors.length);
    this._assignments.clear();

    // Shuffle participants for fairness
    const shuffled = [...participantIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Round-robin assignment
    shuffled.forEach((id, i) => {
      this._assignments.set(id, i % this._teamCount);
    });
  }

  /**
   * Create random team structure for Quick Match.
   * @param {string[]} participantIds
   * @returns {number} team count
   */
  createRandomTeams(participantIds) {
    const n = participantIds.length;
    let teamCount;
    if (n <= 3)      teamCount = 2;
    else if (n <= 6) teamCount = Math.random() < 0.6 ? 2 : 3;
    else             teamCount = Math.random() < 0.4 ? 2 : (Math.random() < 0.6 ? 3 : 4);

    this.createTeams(participantIds, teamCount);
    return teamCount;
  }

  deactivate() {
    this._active = false;
    this._assignments.clear();
    this._teamCount = 0;
  }

  getTeam(playerId) {
    return this._assignments.get(playerId) ?? -1;
  }

  isAlly(id1, id2) {
    if (!this._active) return false;
    const t1 = this._assignments.get(id1);
    const t2 = this._assignments.get(id2);
    return t1 !== undefined && t1 === t2;
  }

  getTeamConfig(teamIndex) {
    return Config.teams.colors[teamIndex] || Config.teams.colors[0];
  }

  getTeamColor(playerId) {
    const t = this.getTeam(playerId);
    if (t < 0) return null;
    return this.getTeamConfig(t);
  }

  getTeamName(teamIndex) {
    return this.getTeamConfig(teamIndex).name;
  }

  getTeamPrimary(teamIndex) {
    return this.getTeamConfig(teamIndex).primary;
  }

  /**
   * Get team scores by summing individual participant scores.
   * @param {object} scoring – Scoring instance
   * @returns {{ teamIndex, name, score, css }[]}
   */
  getTeamScores(scoring) {
    const scores = [];
    for (let t = 0; t < this._teamCount; t++) {
      const cfg = this.getTeamConfig(t);
      let total = 0;
      for (const [id, team] of this._assignments) {
        if (team === t) total += scoring.getScore(id);
      }
      scores.push({ teamIndex: t, name: cfg.name, score: total, css: cfg.css });
    }
    scores.sort((a, b) => b.score - a.score);
    return scores;
  }

  /**
   * Get all member IDs of a team.
   */
  getTeamMembers(teamIndex) {
    const members = [];
    for (const [id, t] of this._assignments) {
      if (t === teamIndex) members.push(id);
    }
    return members;
  }

  /**
   * Get the laser color for a participant.
   */
  getLaserColor(playerId) {
    if (!this._active) return null;
    const t = this.getTeam(playerId);
    if (t < 0) return null;
    return this.getTeamConfig(t).secondary;
  }
}
