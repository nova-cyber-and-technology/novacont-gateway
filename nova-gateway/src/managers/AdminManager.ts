import { EmbedEngine } from './EmbedEngine';

/**
 * AdminManager — Provides admin-only utilities for server management.
 */
export class AdminManager {
  private embeds: EmbedEngine;

  constructor(embeds: EmbedEngine) {
    this.embeds = embeds;
  }

  /** Create a custom announcement embed */
  createAnnouncement(title: string, body: string) {
    return this.embeds.announcement(title, body);
  }

  /** Create a custom embed from raw data */
  createCustomEmbed(title: string, description: string, color?: number) {
    return this.embeds.create(title, description, color);
  }

  /** Check if a Discord user has admin permissions (by role name) */
  isAdmin(memberRoles: string[]): boolean {
    const adminRoles = ['Admin', 'Moderator', 'Owner'];
    return memberRoles.some(r => adminRoles.includes(r));
  }
}
