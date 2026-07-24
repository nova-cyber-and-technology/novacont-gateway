import prisma from '../database/client';

/**
 * PermissionManager — Controls what actions a user can perform.
 */
export class PermissionManager {

  /** Check if a user can create a job posting */
  async canPostJob(discordId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { discordId } });
    if (!user) return false;
    return user.isVerified;
  }

  /** Check if a user can create an escrow */
  async canCreateEscrow(discordId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { discordId } });
    if (!user) return false;
    return user.isVerified && (!!user.tonWallet || !!user.baseWallet);
  }

  /** Check if a user can open a support ticket */
  async canOpenTicket(discordId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { discordId } });
    return user?.isVerified ?? false;
  }

  /** Check if a user is verified */
  async isVerified(discordId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { discordId } });
    return user?.isVerified ?? false;
  }

  /** Check if a user has a specific wallet linked */
  async hasWallet(discordId: string, network: 'TON' | 'BASE'): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { discordId } });
    if (!user) return false;
    return network === 'TON' ? !!user.tonWallet : !!user.baseWallet;
  }
}
