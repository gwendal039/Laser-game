// ═══════════════════════════════════════════════════
// PROGRESSION MANAGER — XP/Credits calculation, post-match rewards
// ═══════════════════════════════════════════════════

export class ProgressionManager {
  constructor(profileManager, missionManager, achievementManager) {
    this.profile = profileManager;
    this.missions = missionManager;
    this.achievements = achievementManager;
  }

  // Called at match end — calculates all rewards and returns summary
  processMatchEnd(matchData) {
    const rewards = this._calculateRewards(matchData);

    // Update stats first
    this.profile.updateStatsFromMatch(matchData);

    // Progress missions
    const completedMissions = this.missions.progressFromMatch(matchData);

    // Add mission rewards
    for (const cm of completedMissions) {
      rewards.missionXP += cm.mission.xp;
      rewards.missionCredits += cm.mission.credits;
      rewards.completedMissions.push(cm.mission);
    }

    // Check achievements
    const newAchievements = this.achievements.checkAfterMatch(matchData);
    for (const ach of newAchievements) {
      rewards.achievementXP += ach.reward.xp;
      rewards.achievementCredits += ach.reward.credits;
      rewards.newAchievements.push(ach);
    }

    // Calculate totals
    rewards.totalXP = rewards.baseXP + rewards.bonusXP + rewards.missionXP + rewards.achievementXP;
    rewards.totalCredits = rewards.baseCredits + rewards.bonusCredits + rewards.missionCredits + rewards.achievementCredits;

    // Apply rewards
    const oldLevel = this.profile.level;
    const oldRank = this.profile.rank;
    const levelsGained = this.profile.addXP(rewards.totalXP);
    this.profile.addCredits(rewards.totalCredits);
    const newRank = this.profile.rank;

    rewards.levelsGained = levelsGained;
    rewards.oldLevel = oldLevel;
    rewards.newLevel = this.profile.level;
    rewards.currentXP = this.profile.xp;
    rewards.xpToNext = this.profile.xpToNextLevel;
    rewards.rankUp = oldRank.name !== newRank.name ? newRank : null;
    rewards.rank = newRank;

    return rewards;
  }

  _calculateRewards(matchData) {
    const rewards = {
      // Base rewards
      baseXP: 0,
      baseCredits: 0,
      bonusXP: 0,
      bonusCredits: 0,
      missionXP: 0,
      missionCredits: 0,
      achievementXP: 0,
      achievementCredits: 0,
      totalXP: 0,
      totalCredits: 0,
      // Breakdown
      breakdown: [],
      completedMissions: [],
      newAchievements: [],
      levelsGained: [],
      rankUp: null,
    };

    // ── Participation ──
    rewards.baseXP += 30;
    rewards.baseCredits += 10;
    rewards.breakdown.push({ label: 'Participation', xp: 30, credits: 10 });

    // ── Score-based XP ──
    const scoreXP = Math.floor((matchData.score || 0) * 0.15);
    const scoreCredits = Math.floor((matchData.score || 0) * 0.05);
    if (scoreXP > 0) {
      rewards.baseXP += scoreXP;
      rewards.baseCredits += scoreCredits;
      rewards.breakdown.push({ label: `Score (${matchData.score})`, xp: scoreXP, credits: scoreCredits });
    }

    // ── Kill bonus ──
    const killXP = (matchData.kills || 0) * 8;
    const killCredits = (matchData.kills || 0) * 3;
    if (killXP > 0) {
      rewards.baseXP += killXP;
      rewards.baseCredits += killCredits;
      rewards.breakdown.push({ label: `Kills (${matchData.kills})`, xp: killXP, credits: killCredits });
    }

    // ── Win bonus ──
    if (matchData.won) {
      rewards.bonusXP += 80;
      rewards.bonusCredits += 30;
      rewards.breakdown.push({ label: 'Victoire', xp: 80, credits: 30 });
    }

    // ── Position bonus (top 3) ──
    if (matchData.position <= 3 && !matchData.won) {
      const posXP = [0, 0, 40, 20][matchData.position] || 0;
      const posCredits = [0, 0, 15, 8][matchData.position] || 0;
      if (posXP > 0) {
        rewards.bonusXP += posXP;
        rewards.bonusCredits += posCredits;
        rewards.breakdown.push({ label: `Top ${matchData.position}`, xp: posXP, credits: posCredits });
      }
    }

    // ── Accuracy bonus ──
    if (matchData.accuracy >= 40) {
      const accXP = Math.floor(matchData.accuracy * 0.8);
      rewards.bonusXP += accXP;
      rewards.breakdown.push({ label: `Précision (${matchData.accuracy}%)`, xp: accXP, credits: 0 });
    }

    // ── Headshot bonus ──
    if (matchData.headshots > 0) {
      const hsXP = matchData.headshots * 12;
      rewards.bonusXP += hsXP;
      rewards.breakdown.push({ label: `Headshots (${matchData.headshots})`, xp: hsXP, credits: 0 });
    }

    return rewards;
  }
}
