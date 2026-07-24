import { ChatInputCommandInteraction, SlashCommandBuilder, MessageFlags } from 'discord.js';
import { Command } from '../Command';

/**
 * /ping — Simple test command to verify the bot is online.
 */
export const PingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the Gateway Bot is alive.'),

  async execute(interaction: ChatInputCommandInteraction) {
    const latency = Date.now() - interaction.createdTimestamp;
    await interaction.reply({
      content: `Gateway is online! Latency: **${latency}ms** | API: **${interaction.client.ws.ping}ms**`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
