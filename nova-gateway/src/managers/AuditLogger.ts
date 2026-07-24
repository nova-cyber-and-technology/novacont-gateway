import prisma from '../database/client';

/**
 * AuditLogger — Records all important events for accountability and transparency.
 */
export class AuditLogger {

  /** Log an event */
  async log(action: string, details?: Record<string, unknown>, userId?: string, channelId?: string, guildId?: string): Promise<void> {
    await prisma.auditLog.create({
      data: {
        action,
        details: details ? JSON.stringify(details) : null,
        userId: userId ?? null,
        channelId: channelId ?? null,
        guildId: guildId ?? null,
      },
    });
  }

  /** Shortcut: Wallet linked */
  async walletLinked(userId: string, network: string, address: string): Promise<void> {
    await this.log('WALLET_LINKED', { network, address }, userId);
  }

  /** Shortcut: Role changed */
  async roleChanged(userId: string, role: string, action: 'added' | 'removed'): Promise<void> {
    await this.log('ROLE_CHANGED', { role, action }, userId);
  }

  /** Shortcut: Ticket opened */
  async ticketOpened(userId: string, subject: string): Promise<void> {
    await this.log('TICKET_OPENED', { subject }, userId);
  }

  /** Shortcut: Escrow link created */
  async escrowLinkCreated(userId: string, network: string, amount: number): Promise<void> {
    await this.log('ESCROW_LINK_CREATED', { network, amount }, userId);
  }

  /** Shortcut: Admin action */
  async adminAction(adminId: string, action: string, details?: Record<string, unknown>): Promise<void> {
    await this.log('ADMIN_ACTION', { adminAction: action, ...details }, adminId);
  }

  /** Get recent logs */
  async getRecent(limit: number = 50) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    });
  }
}
