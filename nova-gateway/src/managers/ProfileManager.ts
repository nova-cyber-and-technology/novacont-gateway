import { User } from '@prisma/client';
import prisma from '../database/client';

/**
 * ProfileManager — Links Discord accounts to wallets and manages user profiles.
 */
export class ProfileManager {

  /** Find or create a user by Discord ID */
  async getOrCreate(discordId: string, username?: string, avatarUrl?: string) {
    return prisma.user.upsert({
      where: { discordId },
      update: { username, avatarUrl },
      create: { discordId, username, avatarUrl },
      include: { stats: true },
    });
  }

  /** Link a TON wallet to a Discord user */
  async linkTonWallet(discordId: string, walletAddress: string): Promise<User> {
    try {
      return await prisma.user.upsert({
        where: { discordId },
        update: { tonWallet: walletAddress },
        create: {
          discordId,
          tonWallet: walletAddress,
          stats: { create: {} }
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('WALLET_ALREADY_LINKED');
      }
      throw error;
    }
  }

  /** Link a Base (EVM) wallet to a Discord user */
  async linkBaseWallet(discordId: string, walletAddress: string): Promise<User> {
    try {
      return await prisma.user.upsert({
        where: { discordId },
        update: { baseWallet: walletAddress },
        create: {
          discordId,
          baseWallet: walletAddress,
          stats: { create: {} }
        },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('WALLET_ALREADY_LINKED');
      }
      throw error;
    }
  }

  /** Get a user's full profile with stats */
  async getProfile(discordId: string) {
    return prisma.user.findUnique({
      where: { discordId },
      include: { stats: true },
    });
  }

  /** Find a user by their TON wallet address */
  async findByTonWallet(tonAddress: string) {
    return prisma.user.findFirst({
      where: { tonWallet: tonAddress },
      include: { stats: true },
    });
  }

  /** Find a user by their Base wallet address */
  async findByBaseWallet(baseAddress: string) {
    return prisma.user.findFirst({
      where: { baseWallet: baseAddress },
      include: { stats: true },
    });
  }

  /** Ensure the user has a stats record */
  async ensureStats(userId: string) {
    return prisma.userStats.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }
}
