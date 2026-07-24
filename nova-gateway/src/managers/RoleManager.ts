import { Guild, GuildMember, Role } from 'discord.js';

/**
 * RoleManager — Automatically assigns and removes roles based on user reputation and stats.
 */

// Role tier thresholds (reputation score based)
const TIER_ROLES: Record<string, number> = {
  'Verified': 0,
  'Trusted': 100,
  'Expert': 500,
  'Elite': 2000,
  'Legend': 5000,
  'Super Nova': 10000,
};

// Milestone roles (escrow count based)
const MILESTONE_ROLES: Record<string, number> = {
  'First Escrow': 1,
  '10 Escrows': 10,
  '50 Escrows': 50,
  '100 Escrows': 100,
  '500 Escrows': 500,
  '1000+ Escrows': 1000,
};

// Volume tier roles (total USD volume based)
const VOLUME_ROLES: Record<string, number> = {
  'Bronze': 100,
  'Silver': 1000,
  'Gold': 5000,
  'Platinum': 25000,
  'Diamond': 100000,
};

export class RoleManager {

  /** Sync a member's roles based on their reputation score, escrow count, and volume */
  async syncRoles(
    member: GuildMember,
    reputationScore: number,
    totalEscrows: number,
    totalVolumeUsd: number
  ): Promise<string[]> {
    const guild = member.guild;
    const addedRoles: string[] = [];

    // Sync tier roles
    const targetTier = this.getHighestTier(reputationScore);
    if (targetTier) {
      const role = guild.roles.cache.find(r => r.name === targetTier);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        addedRoles.push(targetTier);
      }
    }

    // Sync milestone roles
    for (const [roleName, threshold] of Object.entries(MILESTONE_ROLES)) {
      if (totalEscrows >= threshold) {
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (role && !member.roles.cache.has(role.id)) {
          await member.roles.add(role);
          addedRoles.push(roleName);
        }
      }
    }

    // Sync volume roles
    const targetVolumeTier = this.getHighestVolumeTier(totalVolumeUsd);
    if (targetVolumeTier) {
      const role = guild.roles.cache.find(r => r.name === targetVolumeTier);
      if (role && !member.roles.cache.has(role.id)) {
        await member.roles.add(role);
        addedRoles.push(targetVolumeTier);
      }
    }

    return addedRoles;
  }

  /** Assign the Verified role and remove Unverified */
  async verify(client: any, discordId: string): Promise<boolean> {
    const guildId = process.env.GUILD_ID;
    if (!guildId) return false;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return false;
    
    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) return false;

    const verifiedRole = guild.roles.cache.find((r: Role) => r.name === 'Verified');
    const unverifiedRole = guild.roles.cache.find((r: Role) => r.name === 'Unverified');

    if (verifiedRole) {
      await member.roles.add(verifiedRole);
    }
    if (unverifiedRole && member.roles.cache.has(unverifiedRole.id)) {
      await member.roles.remove(unverifiedRole);
    }

    // Now that they are verified, assign OG/Early Supporter if they are eligible based on the current member count.
    await this.assignOGRoles(member);

    return true;
  }

  /** Assign the Unverified role to a new member */
  async assignUnverified(member: GuildMember): Promise<void> {
    const role = member.guild.roles.cache.find(r => r.name === 'Unverified');
    if (role) {
      await member.roles.add(role);
    }
  }

  /** Assign OG and Early Supporter roles based on member count */
  async assignOGRoles(member: GuildMember): Promise<void> {
    try {
      // Refresh the guild member count just to be safe
      const guild = await member.guild.fetch();
      const count = guild.memberCount;

      if (count <= 10) {
        const ogRole = guild.roles.cache.find(r => r.name === 'OG');
        if (ogRole && !member.roles.cache.has(ogRole.id)) {
          await member.roles.add(ogRole);
        }
      }

      if (count <= 100) {
        const earlySupporterRole = guild.roles.cache.find(r => r.name === 'Early Supporter');
        if (earlySupporterRole && !member.roles.cache.has(earlySupporterRole.id)) {
          await member.roles.add(earlySupporterRole);
        }
      }
    } catch (e) {
      console.error('[RoleManager] Failed to assign OG/Early Supporter roles:', e);
    }
  }

  /** Determine the highest reputation tier for a given score */
  private getHighestTier(score: number): string | null {
    let highest: string | null = null;
    for (const [name, threshold] of Object.entries(TIER_ROLES)) {
      if (score >= threshold) highest = name;
    }
    return highest;
  }

  /** Determine the highest volume tier */
  private getHighestVolumeTier(volume: number): string | null {
    let highest: string | null = null;
    for (const [name, threshold] of Object.entries(VOLUME_ROLES)) {
      if (volume >= threshold) highest = name;
    }
    return highest;
  }
}
