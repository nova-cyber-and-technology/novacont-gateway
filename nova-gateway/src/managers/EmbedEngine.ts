import { EmbedBuilder } from 'discord.js';
import { Config } from '../config';

/**
 * EmbedEngine — Creates all embeds in a unified, branded style.
 * Every embed in the server goes through this module.
 */
export class EmbedEngine {

  /** Standard branded embed with NovaCont styling */
  create(title: string, description: string, color?: number): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(color ?? Config.BRAND.COLOR)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: Config.BRAND.NAME });
  }

  /** Welcome embed shown when a user joins the server */
  welcome(username: string, avatarUrl?: string): EmbedBuilder {
    return this.create(
      'Welcome to NovaCont!',
      `Hey **${username}**, welcome to the official NovaCont community!\n\nTo get started, link your wallet using \`/linkwallet\` and unlock full access to the ecosystem.`
    ).setThumbnail(avatarUrl ?? null);
  }

  /** Rules embed for the rules channel */
  rules(): EmbedBuilder {
    return this.create(
      'Server Rules',
      '1. Be respectful to all members.\n2. No scamming or fraudulent activity.\n3. No spam or self-promotion.\n4. Keep conversations in the appropriate channels.\n5. Follow Discord ToS at all times.\n\nViolations may result in a warning, mute, or permanent ban.'
    ).setColor(Config.BRAND.WARNING);
  }

  /** Profile card embed */
  profile(data: {
    username: string;
    avatarUrl?: string;
    tier: string;
    tonWallet?: string | null;
    baseWallet?: string | null;
    totalCompleted: number;
    totalVolumeUsd: number;
    reputationScore: number;
    completionRate: number;
  }): EmbedBuilder {
    const embed = this.create(
      `${data.username}'s Profile`,
      `**Reputation Tier:** ${data.tier}`
    )
      .setThumbnail(data.avatarUrl ?? null)
      .addFields(
        { name: 'TON Wallet', value: data.tonWallet ? `\`${data.tonWallet}\`` : 'Not linked', inline: true },
        { name: 'Base Wallet', value: data.baseWallet ? `\`${data.baseWallet}\`` : 'Not linked', inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: 'Completed Deals', value: `${data.totalCompleted}`, inline: true },
        { name: 'Total Volume', value: `$${data.totalVolumeUsd.toLocaleString()}`, inline: true },
        { name: 'Completion Rate', value: `${(data.completionRate * 100).toFixed(1)}%`, inline: true },
        { name: 'Reputation Score', value: `${data.reputationScore.toFixed(0)} pts`, inline: true },
      );
    return embed;
  }

  /** Escrow preview embed */
  escrowPreview(data: {
    network: 'TON' | 'BASE';
    amountUsd: number;
    description: string;
    providerTag: string;
    deepLink: string;
  }): EmbedBuilder {
    return this.create(
      'Escrow Preview',
      `A new escrow is being prepared on **${data.network}**.`
    )
      .addFields(
        { name: 'Provider', value: data.providerTag, inline: true },
        { name: 'Amount', value: `$${data.amountUsd} USD`, inline: true },
        { name: 'Network', value: data.network, inline: true },
        { name: 'Description', value: data.description },
      );
  }

  /** Success embed */
  success(title: string, description: string): EmbedBuilder {
    return this.create(title, description, Config.BRAND.SUCCESS);
  }

  /** Error embed */
  error(title: string, description: string): EmbedBuilder {
    return this.create(title, description, Config.BRAND.DANGER);
  }

  /** Warning embed */
  warning(title: string, description: string): EmbedBuilder {
    return this.create(title, description, Config.BRAND.WARNING);
  }

  /** Announcement embed */
  announcement(title: string, body: string): EmbedBuilder {
    return this.create(`📢 ${title}`, body)
      .setColor(Config.BRAND.COLOR);
  }

  /** FAQ embed */
  faq(entries: { q: string; a: string }[]): EmbedBuilder {
    const embed = this.create('Frequently Asked Questions', 'Here are some common questions:');
    for (const entry of entries) {
      embed.addFields({ name: `❓ ${entry.q}`, value: entry.a });
    }
    return embed;
  }
}
