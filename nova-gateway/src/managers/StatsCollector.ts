import { TonProvider } from '../providers/TonProvider';
import { BaseProvider } from '../providers/BaseProvider';
import { ReputationEngine } from './ReputationEngine';
import { RoleManager } from './RoleManager';
import prisma from '../database/client';
import { Client } from 'discord.js';
import { Config } from '../config';

/**
 * StatsCollector — Aggregates data from all Network Providers.
 * It never calculates reputation itself; it delegates to ReputationEngine after updating stats.
 */
export class StatsCollector {
  private tonProvider: TonProvider;
  private baseProvider: BaseProvider;
  private reputationEngine: ReputationEngine;
  private roleManager: RoleManager;
  private client: Client;

  constructor(
    tonProvider: TonProvider, 
    baseProvider: BaseProvider, 
    reputationEngine: ReputationEngine,
    roleManager: RoleManager,
    client: Client
  ) {
    this.tonProvider = tonProvider;
    this.baseProvider = baseProvider;
    this.reputationEngine = reputationEngine;
    this.roleManager = roleManager;
    this.client = client;
  }

  /** Process an incoming event and route to the correct provider */
  async processEvent(network: 'TON' | 'BASE', event: {
    action: string;
    clientWallet?: string;
    providerWallet?: string;
    amountUsd?: number;
    description?: string;
    escrowId?: string;
  }): Promise<void> {
    if (network === 'TON') {
      await this.tonProvider.processEvent(event);
    } else {
      await this.baseProvider.processEvent(event);
    }

    // After updating stats, recalculate reputation for involved users
    await this.recalculateForWallets(network, event.clientWallet, event.providerWallet);
  }

  /** Recalculate reputation for users associated with given wallets */
  private async recalculateForWallets(network: 'TON' | 'BASE', clientWallet?: string, providerWallet?: string): Promise<void> {
    for (const wallet of [clientWallet, providerWallet]) {
      if (!wallet) continue;
      const user = network === 'TON'
        ? await prisma.user.findFirst({ where: { tonWallet: wallet }, include: { stats: true } })
        : await prisma.user.findFirst({ where: { baseWallet: wallet }, include: { stats: true } });

      if (user && user.stats) {
        const { score, tier } = await this.reputationEngine.recalculate(user.id);
        
        // Refetch user to get updated stats just in case
        const updatedUser = await prisma.user.findUnique({ where: { id: user.id }, include: { stats: true } });
        if (!updatedUser || !updatedUser.stats) continue;

        try {
          const guild = this.client.guilds.cache.get(Config.GUILD_ID);
          if (guild) {
            const member = await guild.members.fetch(user.discordId).catch(() => null);
            if (member) {
              const addedRoles = await this.roleManager.syncRoles(
                member,
                updatedUser.reputationScore,
                updatedUser.stats.totalEscrows,
                updatedUser.stats.totalVolumeUsd
              );
              if (addedRoles.length > 0) {
                console.log(`[StatsCollector] Synced roles for ${user.discordId}: ${addedRoles.join(', ')}`);
              }
            }
          }
        } catch (e) {
          console.error('[StatsCollector] Failed to sync roles:', e);
        }
      }
    }
  }
}
