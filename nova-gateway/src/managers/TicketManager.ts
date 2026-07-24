import prisma from '../database/client';

/**
 * TicketManager — Manages support tickets in the Discord server.
 */
export class TicketManager {

  /** Create a new support ticket */
  async create(discordId: string, subject: string, channelId?: string) {
    const user = await prisma.user.findUnique({ where: { discordId } });
    return prisma.ticket.create({
      data: {
        discordId,
        userId: user?.id,
        subject,
        channelId,
        status: 'open',
      },
    });
  }

  /** Close a ticket */
  async close(ticketId: string, closedBy: string) {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'closed', closedBy, closedAt: new Date() },
    });
  }

  /** Archive a ticket */
  async archive(ticketId: string) {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'archived' },
    });
  }

  /** Get open tickets */
  async getOpen() {
    return prisma.ticket.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Get all tickets for a user */
  async getByUser(discordId: string) {
    return prisma.ticket.findMany({
      where: { discordId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
