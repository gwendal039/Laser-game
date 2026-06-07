// ═══════════════════════════════════════════════════
// ACHIEVEMENT MANAGER — Achievements system
// ═══════════════════════════════════════════════════

const ACHIEVEMENTS = [
  { id: 'first_beam',    name: 'First Beam',      desc: 'Réussir son premier hit',                         icon: '🔫', reward: { xp: 50, credits: 25 } },
  { id: 'first_win',     name: 'First Win',       desc: 'Gagner son premier match',                        icon: '🏆', reward: { xp: 100, credits: 50 } },
  { id: 'back_hunter',   name: 'Back Hunter',     desc: 'Toucher 25 fois dans le dos',                     icon: '🗡️', reward: { xp: 200, credits: 100 } },
  { id: 'precision',     name: 'Precision Mode',  desc: 'Finir une partie avec au moins 50% de précision', icon: '🎯', reward: { xp: 250, credits: 120 } },
  { id: 'untouchable',   name: 'Untouchable',     desc: 'Gagner une partie sans être désactivé',           icon: '🛡️', reward: { xp: 400, credits: 200 } },
  { id: 'bot_breaker',   name: 'Bot Breaker',     desc: 'Faire 100 désactivations au total',               icon: '💀', reward: { xp: 300, credits: 150 } },
  { id: 'elite_hunter',  name: 'Elite Hunter',    desc: 'Désactiver 25 bots Elite',                        icon: '⚔️', reward: { xp: 500, credits: 250 } },
  { id: 'laser_storm',   name: 'Laser Storm',     desc: 'Faire 5 kills en un seul match',                  icon: '⚡', reward: { xp: 200, credits: 100 } },
  { id: 'arena_master',  name: 'Arena Master',    desc: 'Gagner 25 matchs',                                icon: '👑', reward: { xp: 600, credits: 300 } },
  { id: 'headshot_king', name: 'Headshot King',   desc: 'Réussir 50 headshots au total',                   icon: '💥', reward: { xp: 350, credits: 175 } },
  { id: 'play_100',      name: 'Dedicated',       desc: 'Jouer 100 matchs',                                icon: '⭐', reward: { xp: 500, credits: 250 } },
  { id: 'score_50k',     name: 'Score Legend',     desc: 'Accumuler 50 000 points au total',                icon: '🏅', reward: { xp: 400, credits: 200 } },
];

export class AchievementManager {
  constructor(profileManager) {
    this.profile = profileManager;
    this.ALL = ACHIEVEMENTS;
  }

  // Check after each match — returns newly unlocked achievements
  checkAfterMatch(matchData) {
    const unlocked = [];
    const stats = this.profile.stats;

    const checks = [
      { id: 'first_beam',    cond: stats.kills >= 1 },
      { id: 'first_win',     cond: stats.wins >= 1 },
      { id: 'back_hunter',   cond: stats.backHits >= 25 },
      { id: 'precision',     cond: matchData.accuracy >= 50 },
      { id: 'untouchable',   cond: matchData.won && matchData.deaths === 0 },
      { id: 'bot_breaker',   cond: stats.kills >= 100 },
      { id: 'elite_hunter',  cond: (matchData.eliteKills || 0) + (stats.eliteKills || 0) >= 25 },
      { id: 'laser_storm',   cond: matchData.kills >= 5 },
      { id: 'arena_master',  cond: stats.wins >= 25 },
      { id: 'headshot_king', cond: stats.headshots >= 50 },
      { id: 'play_100',      cond: stats.matchesPlayed >= 100 },
      { id: 'score_50k',     cond: stats.totalScore >= 50000 },
    ];

    for (const check of checks) {
      if (check.cond && !this.profile.hasAchievement(check.id)) {
        const ach = ACHIEVEMENTS.find(a => a.id === check.id);
        if (ach && this.profile.unlockAchievement(check.id)) {
          unlocked.push(ach);
        }
      }
    }

    return unlocked;
  }

  getAll() {
    return ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: this.profile.hasAchievement(a.id),
      date: this.profile.achievements[a.id]?.date || null,
    }));
  }

  getUnlockedCount() {
    return ACHIEVEMENTS.filter(a => this.profile.hasAchievement(a.id)).length;
  }
}
