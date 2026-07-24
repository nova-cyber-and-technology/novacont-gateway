import prisma from '../database/client';

/**
 * TonProvider — Fetches and processes escrow data from the NovaCont Lite (TON) platform.
 * Receives webhook notifications from the Netlify notify function and updates user stats.
 */
export class TonProvider {

  /** Process a webhook event from NovaCont Lite */
  async processEvent(event: {
    action: string;
    clientWallet?: string;
    providerWallet?: string;
    amountUsd?: number;
    description?: string;
    escrowId?: string;
  }): Promise<void> {
    console.log(`[TonProvider] Processing event: ${event.action}`);

    switch (event.action) {
      case 'CreateEscrow':
        await this.onEscrowCreated(event.clientWallet, event.providerWallet, event.amountUsd);
        break;
      case 'ReleaseEscrow':
        await this.onEscrowCompleted(event.clientWallet, event.providerWallet, event.amountUsd);
        break;
      case 'ResolveDispute':
        await this.onDisputeResolved(event.clientWallet, event.providerWallet);
        break;
    }
  }

  /** When a new escrow is created, increment the escrow count */
  private async onEscrowCreated(clientWallet?: string, providerWallet?: string, amountUsd?: number): Promise<void> {
    if (clientWallet) {
      const user = await prisma.user.findFirst({ where: { tonWallet: clientWallet } });
      if (user) {
        await prisma.userStats.upsert({
          where: { userId: user.id },
          update: {
            tonEscrowCount: { increment: 1 },
            totalEscrows: { increment: 1 },
          },
          create: {
            userId: user.id,
            tonEscrowCount: 1,
            totalEscrows: 1,
          },
        });
      }
    }
  }

  /** When an escrow is completed, update completed count and volume */
  private async onEscrowCompleted(clientWallet?: string, providerWallet?: string, amountUsd?: number): Promise<void> {
    const volume = amountUsd ?? 0;

    // Update provider stats
    if (providerWallet) {
      const provider = await prisma.user.findFirst({ where: { tonWallet: providerWallet } });
      if (provider) {
        await prisma.userStats.upsert({
          where: { userId: provider.id },
          update: {
            tonCompletedCount: { increment: 1 },
            totalCompleted: { increment: 1 },
            tonTotalVolumeUsd: { increment: volume },
            totalVolumeUsd: { increment: volume },
          },
          create: {
            userId: provider.id,
            tonCompletedCount: 1,
            totalCompleted: 1,
            tonTotalVolumeUsd: volume,
            totalVolumeUsd: volume,
          },
        });
      }
    }

    // Update client stats
    if (clientWallet) {
      const client = await prisma.user.findFirst({ where: { tonWallet: clientWallet } });
      if (client) {
        await prisma.userStats.upsert({
          where: { userId: client.id },
          update: {
            tonCompletedCount: { increment: 1 },
            totalCompleted: { increment: 1 },
            tonTotalVolumeUsd: { increment: volume },
            totalVolumeUsd: { increment: volume },
          },
          create: {
            userId: client.id,
            tonCompletedCount: 1,
            totalCompleted: 1,
            tonTotalVolumeUsd: volume,
            totalVolumeUsd: volume,
          },
        });
      }
    }
  }

  /** When a dispute is resolved */
  private async onDisputeResolved(clientWallet?: string, providerWallet?: string): Promise<void> {
    for (const wallet of [clientWallet, providerWallet]) {
      if (wallet) {
        const user = await prisma.user.findFirst({ where: { tonWallet: wallet } });
        if (user) {
          await prisma.userStats.upsert({
            where: { userId: user.id },
            update: {
              tonDisputeCount: { increment: 1 },
              totalDisputes: { increment: 1 },
            },
            create: {
              userId: user.id,
              tonDisputeCount: 1,
              totalDisputes: 1,
            },
          });
        }
      }
    }
  }
}
