import prisma from '../database/client';

/**
 * AnalyticsManager — Collects and stores platform-wide statistics.
 */
export class AnalyticsManager {

  /** Take a daily snapshot of platform stats */
  async takeSnapshot(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await prisma.user.count();
    const totalVerified = await prisma.user.count({ where: { isVerified: true } });

    const statsAggregate = await prisma.userStats.aggregate({
      _sum: {
        totalEscrows: true,
        totalVolumeUsd: true,
      },
    });

    await prisma.analyticsSnapshot.upsert({
      where: { date: today },
      update: {
        totalUsers,
        totalVerified,
        totalEscrows: statsAggregate._sum.totalEscrows ?? 0,
        totalVolumeUsd: statsAggregate._sum.totalVolumeUsd ?? 0,
      },
      create: {
        date: today,
        totalUsers,
        totalVerified,
        totalEscrows: statsAggregate._sum.totalEscrows ?? 0,
        totalVolumeUsd: statsAggregate._sum.totalVolumeUsd ?? 0,
      },
    });
  }

  /** Get latest platform stats */
  async getLatest() {
    return prisma.analyticsSnapshot.findFirst({
      orderBy: { date: 'desc' },
    });
  }

  /** Get stats for the last N days */
  async getHistory(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return prisma.analyticsSnapshot.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
    });
  }
}
