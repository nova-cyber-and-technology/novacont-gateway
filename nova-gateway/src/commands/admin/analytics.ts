import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../Command';
import prisma from '../../database/client';
import { Config } from '../../config';

export const AnalyticsCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('analytics')
    .setDescription('Displays platform-wide statistics (Admin Only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true }); // Make the reply visible only to the admin executing it

    try {
      const totalUsers = await prisma.user.count();
      const totalVerified = await prisma.user.count({ where: { isVerified: true } });

      const statsAggregate = await prisma.userStats.aggregate({
        _sum: {
          totalEscrows: true,
          totalVolumeUsd: true,
        },
      });

      const totalEscrows = statsAggregate._sum.totalEscrows || 0;
      const totalVolumeUsd = statsAggregate._sum.totalVolumeUsd || 0;

      const embed = new EmbedBuilder()
        .setTitle('📈 NovaCont Platform Analytics')
        .setDescription('Real-time overview of platform activity and volume.')
        .setColor(Config.BRAND.COLOR)
        .addFields(
          { name: 'Total Users', value: `${totalUsers}`, inline: true },
          { name: 'Verified Users', value: `${totalVerified}`, inline: true },
          { name: '\u200B', value: '\u200B', inline: true }, // Spacer
          { name: 'Total Contracts', value: `${totalEscrows}`, inline: true },
          { name: 'Total Volume', value: `$${totalVolumeUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, inline: true },
          { name: '\u200B', value: '\u200B', inline: true } // Spacer
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[AnalyticsCommand] Error:', err);
      await interaction.editReply('❌ Failed to fetch platform analytics.');
    }
  }
};
