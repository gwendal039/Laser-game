// ═══════════════════════════════════════════════════
// MISSION MANAGER — Daily & weekly missions
// ═══════════════════════════════════════════════════

const DAILY_TEMPLATES = [
  { id: 'win_match',       name: 'Victorieux',           desc: 'Gagner 1 match',                         key: 'wins',       target: 1,  xp: 150, credits: 50  },
  { id: 'kills_10',        name: 'Eliminateur',          desc: 'Faire 10 désactivations',                key: 'kills',      target: 10, xp: 120, credits: 40  },
  { id: 'back_5',          name: 'Dans le dos',          desc: 'Toucher 5 fois dans le dos',             key: 'backHits',   target: 5,  xp: 100, credits: 35  },
  { id: 'head_3',          name: 'Sniper',               desc: 'Réussir 3 headshots',                    key: 'headshots',  target: 3,  xp: 130, credits: 45  },
  { id: 'score_1000',      name: 'Scoreur',              desc: 'Obtenir 1000 points cumulés',            key: 'score',      target: 1000, xp: 100, credits: 30 },
  { id: 'accuracy_30',     name: 'Précis',               desc: 'Finir une partie avec 30% de précision', key: 'accuracy30', target: 1,  xp: 140, credits: 45  },
  { id: 'play_3',          name: 'Assidu',               desc: 'Jouer 3 matchs',                         key: 'matches',    target: 3,  xp: 80,  credits: 25  },
  { id: 'kills_5_match',   name: 'Tueur en série',       desc: 'Faire 5 kills en un match',              key: 'kills5match',target: 1,  xp: 160, credits: 50  },
  { id: 'shoulder_8',      name: 'Épaule froide',        desc: 'Toucher 8 fois aux épaules',             key: 'shoulderHits', target: 8, xp: 90, credits: 30 },
  { id: 'legs_10',         name: 'Faucheur',             desc: 'Toucher 10 fois aux jambes',              key: 'legHits',    target: 10, xp: 90, credits: 30  },
];

const WEEKLY_TEMPLATES = [
  { id: 'w_play_20',      name: 'Vétéran',              desc: 'Jouer 20 matchs',                         key: 'matches',    target: 20,  xp: 500, credits: 200 },
  { id: 'w_kills_200',    name: 'Exterminateur',         desc: 'Faire 200 désactivations',                key: 'kills',      target: 200, xp: 600, credits: 250 },
  { id: 'w_wins_10',      name: 'Champion',              desc: 'Gagner 10 matchs',                        key: 'wins',       target: 10,  xp: 700, credits: 300 },
  { id: 'w_score_20k',    name: 'Gros score',            desc: 'Obtenir 20 000 points',                   key: 'score',      target: 20000, xp: 500, credits: 200 },
  { id: 'w_back_50',      name: 'Assassin',              desc: 'Faire 50 hits dans le dos',               key: 'backHits',   target: 50,  xp: 550, credits: 220 },
  { id: 'w_head_30',      name: 'Tireur d\'élite',       desc: 'Réussir 30 headshots',                    key: 'headshots',  target: 30,  xp: 600, credits: 250 },
];

function getDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function getWeekKey() {
  const d = new Date();
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

function pickRandom(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export class MissionManager {
  constructor(profileManager) {
    this.profile = profileManager;
    this._checkResets();
  }

  get dailyMissions() { return this.profile.missions.daily; }
  get weeklyMissions() { return this.profile.missions.weekly; }

  _checkResets() {
    const today = getDayKey();
    const week = getWeekKey();

    if (this.profile.missions.dailyLastReset !== today) {
      this._generateDaily();
      this.profile.setMissionResetDate('daily', today);
    }

    if (this.profile.missions.weeklyLastReset !== week) {
      this._generateWeekly();
      this.profile.setMissionResetDate('weekly', week);
    }
  }

  _generateDaily() {
    const picked = pickRandom(DAILY_TEMPLATES, 3);
    const missions = picked.map(t => ({
      ...t,
      progress: 0,
      completed: false,
      claimed: false,
    }));
    this.profile.setMissions(missions, this.profile.missions.weekly);
  }

  _generateWeekly() {
    const picked = pickRandom(WEEKLY_TEMPLATES, 2);
    const missions = picked.map(t => ({
      ...t,
      progress: 0,
      completed: false,
      claimed: false,
    }));
    this.profile.setMissions(this.profile.missions.daily, missions);
  }

  // Called after each match with match stats
  progressFromMatch(matchData) {
    const progressed = [];

    const advance = (list, type) => {
      list.forEach((m, i) => {
        if (m.completed) return;
        let add = 0;

        switch (m.key) {
          case 'wins':       add = matchData.won ? 1 : 0; break;
          case 'kills':      add = matchData.kills || 0; break;
          case 'backHits':   add = matchData.zones?.back || 0; break;
          case 'headshots':  add = matchData.headshots || 0; break;
          case 'score':      add = matchData.score || 0; break;
          case 'matches':    add = 1; break;
          case 'shoulderHits': add = matchData.zones?.shoulders || 0; break;
          case 'legHits':    add = matchData.zones?.legs || 0; break;
          case 'accuracy30': add = (matchData.accuracy >= 30) ? 1 : 0; break;
          case 'kills5match': add = (matchData.kills >= 5) ? 1 : 0; break;
        }

        if (add > 0) {
          const oldProg = m.progress;
          m.progress = Math.min(m.progress + add, m.target);
          this.profile.updateMissionProgress(type, i, m.progress);

          if (m.progress >= m.target && !m.completed) {
            m.completed = true;
            progressed.push({ mission: m, type });
          }
        }
      });
    };

    advance(this.dailyMissions, 'daily');
    advance(this.weeklyMissions, 'weekly');
    return progressed; // newly completed missions
  }

  claimMission(type, index) {
    const list = type === 'daily' ? this.dailyMissions : this.weeklyMissions;
    const m = list[index];
    if (!m || !m.completed || m.claimed) return null;
    m.claimed = true;
    this.profile._save();
    return { xp: m.xp, credits: m.credits };
  }

  hasUnclaimedMissions() {
    return [...this.dailyMissions, ...this.weeklyMissions].some(m => m.completed && !m.claimed);
  }
}
