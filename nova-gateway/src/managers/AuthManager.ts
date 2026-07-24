import prisma from '../database/client';
import { RoleManager } from './RoleManager';
import { GuildMember } from 'discord.js';

/**
 * AuthManager — Handles new user verification flow.
 * 
 * Flow:
 * 1. User joins server → gets "Unverified" role
 * 2. User links wallet via /linkwallet
 * 3. Bot verifies wallet ownership
 * 4. "Verified" role granted, "Unverified" removed
 */
export class AuthManager {
  private roleManager: RoleManager;

  constructor(roleManager: RoleManager) {
    this.roleManager = roleManager;
  }

  /** Handle a new member joining — assign Unverified role */
  async onMemberJoin(member: GuildMember): Promise<void> {
    await this.roleManager.assignUnverified(member);
  }

  /** Verify a user after they link a wallet */
  async verifyUser(client: any, discordId: string): Promise<boolean> {
    // Update database
    await prisma.user.updateMany({
      where: { discordId },
      data: { isVerified: true, verifiedAt: new Date() },
    });

    // Update Discord roles
    await this.roleManager.verify(client, discordId);

    // Send Verification DM
    try {
      const user = await client.users.fetch(discordId);
      if (user) {
        await user.send(
          "🎉 **Verification completed!**\n\n" +
          "Welcome to NovaCont.\n\n" +
          "Your Marketplace and Community access has been unlocked."
        );
      }
    } catch (dmErr) {
      console.log(`[AuthManager] Could not send verification DM to ${discordId} (DMs might be closed).`);
    }

    return true;
  }

  /** Check if a user is verified */
  async isVerified(discordId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { discordId } });
    return user?.isVerified ?? false;
  }
}
