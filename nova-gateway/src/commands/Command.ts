import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

/**
 * Base interface for all slash commands.
 */
export interface Command {
  data: any;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}
