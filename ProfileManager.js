// ═══════════════════════════════════════════════════
// PROFILE MANAGER — Player profile, stats, localStorage
// ═══════════════════════════════════════════════════

const STORAGE_KEY = 'laser_arena_profile';

const RANKS = [
  { name: 'Rookie Runner',   minLevel: 1,  icon: '🔰' },
  { name: 'Laser Scout',     minLevel: 5,  icon: '🎯' },
  { name: 'Neon Fighter',    minLevel: 10, icon: '⚡' },
  { name: 'Arena Hunter',    minLevel: 15, icon: '🏹' },
  { name: 'Pulse Striker',   minLevel: 20, icon: '💥' },
  { name: 'Beam Master',     minLevel: 30, icon: '🔥' },
  { name: 'Shadow Runner',   minLevel: 40, icon: '👤' },
  { name: 'Neon Predator',   minLevel: 55, icon: '🐉' },
  { name: 'Arena Legend',    minLevel: 70, icon: '⭐' },
  { name: 'Laser King',      minLevel: 100, icon: '👑' },
];

function xpForLevel(level) {
  // Exponential curve: each level needs more XP
  return Math.floor(200 + (level - 1) * 80 + Math.pow(level, 1.6) * 10);
}

function defaultProfile() {
  return {
    name: 'Player',
    level: 1,
    xp: 0,
    totalXp: 0,
    credits: 0,
    stats: {
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      totalScore: 0,
      kills: 0,
      deaths: 0,
      shotsFired: 0,
      shotsHit: 0,
      bestScore: 0,
      bestStreak: 0,
      headshots: 0,
      torsoHits: 0,
      backHits: 0,
      shoulderHits: 0,
      legHits: 0,
      totalPlayTime: 0, // seconds
    },
    matchHistory: [], // last 20 matches
    achievements: {},
    cosmetics: {
      owned: ['laser_cyan', 'crosshair_default', 'crosshair_color_green', 'impact_default'],
      equipped: {
        laserColor: 'laser_cyan',
        crosshairStyle: 'crosshair_default',
        crosshairColor: 'crosshair_color_green',
        impactEffect: 'impact_default',
      },
    },
    missions: {
      daily: [],
      weekly: [],
      dailyLastReset: null,
      weeklyLastReset: null,
    },
    created: Date.now(),
    lastPlayed: Date.now(),
  };
}

export class ProfileManager {
  constructor() {
    this.profile = this._load();
    this.RANKS = RANKS;
  }

  // ── GETTERS ──
  get name() { return this.profile.name; }
  get level() { return this.profile.level; }
  get xp() { return this.profile.xp; }
  get totalXp() { return this.profile.totalXp; }
  get credits() { return this.profile.credits; }
  get stats() { return this.profile.stats; }
  get matchHistory() { return this.profile.matchHistory; }
  get cosmetics() { return this.profile.cosmetics; }
  get missions() { return this.profile.missions; }
  get achievements() { return this.profile.achievements; }

  get xpToNextLevel() { return xpForLevel(this.profile.level); }
  get xpProgress() { return this.profile.xp / this.xpToNextLevel; }

  get rank() {
    let rank = RANKS[0];
    for (const r of RANKS) {
      if (this.profile.level >= r.minLevel) rank = r;
    }
    return rank;
  }

  get nextRank() {
    const current = this.rank;
    const idx = RANKS.indexOf(current);
    return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  }

  // ── XP & LEVELING ──
  addXP(amount) {
    this.profile.xp += amount;
    this.profile.totalXp += amount;
    const levelsGained = [];
    while (this.profile.xp >= this.xpToNextLevel) {
      this.profile.xp -= this.xpToNextLevel;
      this.profile.level++;
      levelsGained.push(this.profile.level);
    }
    this._save();
    return levelsGained;
  }

  addCredits(amount) {
    this.profile.credits += amount;
    this._save();
  }

  spendCredits(amount) {
    if (this.profile.credits < amount) return false;
    this.profile.credits -= amount;
    this._save();
    return true;
  }

  // ── STATS ──
  updateStatsFromMatch(matchData) {
    const s = this.profile.stats;
    s.matchesPlayed++;
    if (matchData.won) s.wins++;
    else s.losses++;
    s.totalScore += matchData.score || 0;
    s.kills += matchData.kills || 0;
    s.deaths += matchData.deaths || 0;
    s.shotsFired += matchData.shotsFired || 0;
    s.shotsHit += matchData.shotsHit || 0;
    s.headshots += matchData.headshots || 0;
    s.torsoHits += matchData.zones?.torso || 0;
    s.backHits += matchData.zones?.back || 0;
    s.shoulderHits += matchData.zones?.shoulders || 0;
    s.legHits += matchData.zones?.legs || 0;
    s.totalPlayTime += matchData.playTime || 0;
    if (matchData.score > s.bestScore) s.bestScore = matchData.score;
    if ((matchData.bestStreak || 0) > s.bestStreak) s.bestStreak = matchData.bestStreak;

    // Match history (keep last 20)
    this.profile.matchHistory.unshift({
      mode: matchData.mode,
      score: matchData.score,
      kills: matchData.kills,
      deaths: matchData.deaths,
      won: matchData.won,
      position: matchData.position,
      accuracy: matchData.accuracy,
      date: Date.now(),
    });
    if (this.profile.matchHistory.length > 20) this.profile.matchHistory.length = 20;

    this.profile.lastPlayed = Date.now();
    this._save();
  }

  // ── COSMETICS ──
  ownCosmetic(id) {
    if (!this.profile.cosmetics.owned.includes(id)) {
      this.profile.cosmetics.owned.push(id);
      this._save();
    }
  }

  equipCosmetic(slot, id) {
    this.profile.cosmetics.equipped[slot] = id;
    this._save();
  }

  ownsCosmetic(id) {
    return this.profile.cosmetics.owned.includes(id);
  }

  // ── ACHIEVEMENTS ──
  unlockAchievement(id) {
    if (!this.profile.achievements[id]) {
      this.profile.achievements[id] = { unlocked: true, date: Date.now() };
      this._save();
      return true;
    }
    return false;
  }

  hasAchievement(id) {
    return !!this.profile.achievements[id]?.unlocked;
  }

  // ── MISSIONS ──
  setMissions(daily, weekly) {
    this.profile.missions.daily = daily;
    this.profile.missions.weekly = weekly;
    this._save();
  }

  updateMissionProgress(type, index, progress) {
    const list = type === 'daily' ? this.profile.missions.daily : this.profile.missions.weekly;
    if (list[index]) {
      list[index].progress = Math.min(progress, list[index].target);
      if (list[index].progress >= list[index].target && !list[index].completed) {
        list[index].completed = true;
      }
      this._save();
    }
  }

  setMissionResetDate(type, date) {
    if (type === 'daily') this.profile.missions.dailyLastReset = date;
    else this.profile.missions.weeklyLastReset = date;
    this._save();
  }

  // ── PROFILE ──
  setName(name) {
    this.profile.name = name;
    this._save();
  }

  reset() {
    this.profile = defaultProfile();
    this._save();
  }

  // ── PERSISTENCE ──
  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch (e) { /* quota exceeded — ignore */ }
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        // Merge with defaults to handle schema upgrades
        const merged = defaultProfile();
        Object.assign(merged, saved);
        Object.assign(merged.stats, { ...defaultProfile().stats, ...saved.stats });
        Object.assign(merged.cosmetics, { ...defaultProfile().cosmetics, ...saved.cosmetics });
        Object.assign(merged.cosmetics.equipped, { ...defaultProfile().cosmetics.equipped, ...saved.cosmetics?.equipped });
        merged.missions = saved.missions || defaultProfile().missions;
        merged.achievements = saved.achievements || {};
        return merged;
      }
    } catch (e) { /* corrupt data — start fresh */ }
    return defaultProfile();
  }
}
