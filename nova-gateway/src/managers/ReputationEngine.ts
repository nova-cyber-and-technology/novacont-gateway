import prisma from '../database/client';

/**
 * ReputationEngine — Calculates user trust scores from aggregated stats.
 * It never fetches data from chains directly; it only processes data from StatsCollector.
 */

// Weights for the reputation formula
const WEIGHTS = {
  COMPLETED_DEAL: 10,        // Points per completed deal
  VOLUME_PER_100_USD: 2,     // Points per $100 volume
  UNIQUE_COUNTERPARTY: 5,    // Points per unique counterparty
  DISPUTE_PENALTY: -25,      // Penalty per dispute
  ACCOUNT_AGE_PER_DAY: 0.1,  // Points per day since registration
  COMPLETION_RATE_BONUS: 50, // Bonus if completion rate > 95%
};

// Tier thresholds
const TIERS = [
  { name: 'Super Nova', min: 10000 },
  { name: 'Legend', min: 5000 },
  { name: 'Elite', min: 2000 },
  { name: 'Expert', min: 500 },
  { name: 'Trusted', min: 100 },
  { name: 'Verified', min: 0 },
];

export class ReputationEngine {

  /** Calculate and update a user's reputation score */
  async recalculate(userId: string): Promise<{ score: number; tier: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true },
    });

    if (!user || !user.stats) {
      return { score: 0, tier: 'Unverified' };
    }

    const stats = user.stats;
    const accountAgeDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    let score = 0;

    // Completed deals
    score += stats.totalCompleted * WEIGHTS.COMPLETED_DEAL;

    // Volume
    score += (stats.totalVolumeUsd / 100) * WEIGHTS.VOLUME_PER_100_USD;

    // Unique counterparties
    score += stats.uniqueCounterparties * WEIGHTS.UNIQUE_COUNTERPARTY;

    // Dispute penalty
    score += stats.totalDisputes * WEIGHTS.DISPUTE_PENALTY;

    // Account age bonus
    score += accountAgeDays * WEIGHTS.ACCOUNT_AGE_PER_DAY;

    // Completion rate bonus
    if (stats.completionRate > 0.95 && stats.totalCompleted >= 5) {
      score += WEIGHTS.COMPLETION_RATE_BONUS;
    }

    // Floor at 0
    score = Math.max(0, Math.round(score));

    // Determine tier
    const tier = this.getTier(score);

    // Persist
    await prisma.user.update({
      where: { id: userId },
      data: { reputationScore: score, reputationTier: tier },
    });

    return { score, tier };
  }

  /** Determine the tier for a given score */
  getTier(score: number): string {
    for (const tier of TIERS) {
      if (score >= tier.min) return tier.name;
    }
    return 'Unverified';
  }

  /** Get all tier definitions (for display purposes) */
  getTierDefinitions() {
    return TIERS;
  }
}
