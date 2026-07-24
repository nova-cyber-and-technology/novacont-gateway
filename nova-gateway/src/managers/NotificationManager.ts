import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { Config } from '../config';
import { EmbedEngine } from './EmbedEngine';

/**
 * NotificationManager — Sends live notifications to designated Discord channels.
 */
export class NotificationManager {
  private client: Client;
  private embeds: EmbedEngine;

  constructor(client: Client, embeds: EmbedEngine) {
    this.client = client;
    this.embeds = embeds;
  }

  /** Send a notification embed to the live feed channel */
  async sendLiveFeed(embed: EmbedBuilder): Promise<void> {
    await this.sendToChannel(Config.CHANNELS.LIVE_FEED, embed);
  }

  /** Notify: New escrow created */
  async escrowCreated(network: string, amountUsd: number, description: string): Promise<void> {
    const embed = this.embeds.create(
      'New Escrow Created',
      `A new escrow contract has been initiated on **${network}**.`
    )
      .addFields(
        { name: 'Amount', value: `$${amountUsd} USD`, inline: true },
        { name: 'Network', value: network, inline: true },
        { name: 'Description', value: description },
      )
      .setColor(Config.BRAND.COLOR);
    await this.sendLiveFeed(embed);
  }

  /** Notify: Work delivered */
  async workDelivered(network: string, escrowId: string, description: string): Promise<void> {
    const embed = this.embeds.create(
      'Work Delivered',
      `A provider has submitted their work for review.`
    )
      .addFields(
        { name: 'Escrow', value: `#${escrowId}`, inline: true },
        { name: 'Network', value: network, inline: true },
        { name: 'Description', value: description },
      )
      .setColor(Config.BRAND.WARNING);
    await this.sendLiveFeed(embed);
  }

  /** Notify: Funds released */
  async fundsReleased(network: string, amountUsd: number, description: string): Promise<void> {
    const embed = this.embeds.success(
      'Funds Released!',
      `A deal has been completed successfully!`
    )
      .addFields(
        { name: 'Amount', value: `$${amountUsd} USD`, inline: true },
        { name: 'Network', value: network, inline: true },
        { name: 'Description', value: description },
      );
    await this.sendLiveFeed(embed);
  }

  /** Notify: Announcement */
  async announce(title: string, body: string): Promise<void> {
    const embed = this.embeds.announcement(title, body);
    await this.sendToChannel(Config.CHANNELS.ANNOUNCEMENTS, embed);
  }

  /** Generic channel sender */
  private async sendToChannel(channelId: string, embed: EmbedBuilder): Promise<void> {
    if (!channelId) return;
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (channel && channel.isTextBased()) {
        await (channel as TextChannel).send({ embeds: [embed] });
      }
    } catch (err) {
      console.error(`[NotificationManager] Failed to send to channel ${channelId}:`, err);
    }
  }
}
