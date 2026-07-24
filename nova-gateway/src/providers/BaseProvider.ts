import prisma from '../database/client';

/**
 * BaseProvider — Fetches and processes escrow data from the NovaCont (Base/EVM) platform.
 * In the future, this will listen to on-chain events via ethers.js or viem.
 * For now, it processes webhook events similar to TonProvider.
 */
export class BaseProvider {

  /** Process a webhook event from NovaCont (Base) */
  async processEvent(event: {
    action: string;
    clientWallet?: string;
    providerWallet?: string;
    amountUsd?: number;
    description?: string;
    escrowId?: string;
  }): Promise<void> {
    console.log(`[BaseProvider] Processing event: ${event.action}`);

    switch (event.action) {
      case 'CreateEscrow':
        await this.onEscrowCreated(event.clientWallet, event.amountUsd);
        break;
      case 'ReleaseEscrow':
        await this.onEscrowCompleted(event.clientWallet, event.providerWallet, event.amountUsd);
        break;
      case 'ResolveDispute':
        await this.onDisputeResolved(event.clientWallet, event.providerWallet);
        break;
    }
  }

  private async onEscrowCreated(clientWallet?: string, amountUsd?: number): Promise<void> {
    if (clientWallet) {
      const user = await prisma.user.findFirst({ where: { baseWallet: clientWallet } });
      if (user) {
        await prisma.userStats.upsert({
          where: { userId: user.id },
          update: {
            baseEscrowCount: { increment: 1 },
            totalEscrows: { increment: 1 },
          },
          create: {
            userId: user.id,
            baseEscrowCount: 1,
            totalEscrows: 1,
          },
        });
      }
    }
  }

  private async onEscrowCompleted(clientWallet?: string, providerWallet?: string, amountUsd?: number): Promise<void> {
    const volume = amountUsd ?? 0;

    for (const wallet of [clientWallet, providerWallet]) {
      if (wallet) {
        const user = await prisma.user.findFirst({ where: { baseWallet: wallet } });
        if (user) {
          await prisma.userStats.upsert({
            where: { userId: user.id },
            update: {
              baseCompletedCount: { increment: 1 },
              totalCompleted: { increment: 1 },
              baseTotalVolumeUsd: { increment: volume },
              totalVolumeUsd: { increment: volume },
            },
            create: {
              userId: user.id,
              baseCompletedCount: 1,
              totalCompleted: 1,
              baseTotalVolumeUsd: volume,
              totalVolumeUsd: volume,
            },
          });
        }
      }
    }
  }

  private async onDisputeResolved(clientWallet?: string, providerWallet?: string): Promise<void> {
    for (const wallet of [clientWallet, providerWallet]) {
      if (wallet) {
        const user = await prisma.user.findFirst({ where: { baseWallet: wallet } });
        if (user) {
          await prisma.userStats.upsert({
            where: { userId: user.id },
            update: {
              baseDisputeCount: { increment: 1 },
              totalDisputes: { increment: 1 },
            },
            create: {
              userId: user.id,
              baseDisputeCount: 1,
              totalDisputes: 1,
            },
          });
        }
      }
    }
  }
}
