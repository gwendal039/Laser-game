export class Scoring {
  constructor() {
    this.scores = {};
    this.stats = {};
    this.hitLog = [];
  }

  registerPlayer(id) {
    this.scores[id] = 0;
    this.stats[id] = {
      kills: 0,
      deaths: 0,
      headshots: 0,
      shotsFired: 0,
      shotsHit: 0,
      zones: { head: 0, torso: 0, back: 0, shoulders: 0, legs: 0 },
      bestZone: null,
      bestPoints: 0,
    };
  }

  addScore(shooterId, targetId, zone, points) {
    if (this.scores[shooterId] === undefined) this.registerPlayer(shooterId);
    this.scores[shooterId] += points;

    const st = this.stats[shooterId];
    if (st) {
      st.kills++;
      st.shotsHit++;
      if (zone === 'head') st.headshots++;
      if (st.zones[zone] !== undefined) st.zones[zone]++;
      if (points > st.bestPoints) {
        st.bestPoints = points;
        st.bestZone = zone;
      }
    }

    // Record death for target
    const tst = this.stats[targetId];
    if (tst) tst.deaths++;

    this.hitLog.push({
      shooter: shooterId,
      target: targetId,
      zone,
      points,
      time: Date.now(),
    });
  }

  getScore(id) {
    return this.scores[id] || 0;
  }

  getStats(id) {
    return this.stats[id] || null;
  }

  getAllScores() {
    return { ...this.scores };
  }

  getRecentHits(count = 5) {
    return this.hitLog.slice(-count);
  }

  /**
   * Full leaderboard sorted by score.
   * @param {object} nameMap — { id: displayName }
   * @returns {{ id, name, score, kills, deaths, accuracy }[]}
   */
  getLeaderboard(nameMap) {
    return Object.entries(this.scores)
      .map(([id, score]) => {
        const st = this.stats[id] || {};
        const acc = st.shotsFired > 0 ? Math.round((st.shotsHit / st.shotsFired) * 100) : 0;
        return {
          id,
          name: (nameMap && nameMap[id]) || id,
          score,
          kills: st.kills || 0,
          deaths: st.deaths || 0,
          headshots: st.headshots || 0,
          accuracy: acc,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  reset() {
    for (const id in this.scores) {
      this.scores[id] = 0;
    }
    for (const id in this.stats) {
      const st = this.stats[id];
      st.kills = 0; st.deaths = 0; st.headshots = 0;
      st.shotsFired = 0; st.shotsHit = 0; st.bestPoints = 0; st.bestZone = null;
      for (const z in st.zones) st.zones[z] = 0;
    }
    this.hitLog.length = 0;
  }
}
