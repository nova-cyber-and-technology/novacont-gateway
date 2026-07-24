import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../Command';
import { ProfileManager } from '../../managers/ProfileManager';
import { EmbedEngine } from '../../managers/EmbedEngine';

export const ProfileCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your or someone else\'s NovaCont profile and reputation.')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to look up')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    const profileManager = new ProfileManager();
    const embedEngine = new EmbedEngine();

    // Defer reply since we hit the database
    await interaction.deferReply();

    const profile = await profileManager.getProfile(targetUser.id);

    if (!profile) {
      await interaction.editReply({
        embeds: [
          embedEngine.error('Profile Not Found', `**${targetUser.username}** has not linked their wallet to NovaCont yet.`)
        ]
      });
      return;
    }

    const stats = profile.stats || {
      totalCompleted: 0,
      totalVolumeUsd: 0,
      completionRate: 0,
    };

    const embed = embedEngine.profile({
      username: profile.username || targetUser.username,
      avatarUrl: profile.avatarUrl || targetUser.displayAvatarURL(),
      tier: profile.reputationTier,
      tonWallet: profile.tonWallet,
      baseWallet: profile.baseWallet,
      totalCompleted: stats.totalCompleted,
      totalVolumeUsd: stats.totalVolumeUsd,
      reputationScore: profile.reputationScore,
      completionRate: stats.totalCompleted > 0 ? 1.0 : 0.0, // Placeholder calculation
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
