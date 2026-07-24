import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../Command';
import prisma from '../../database/client';
import { Config } from '../../config';

export const LeaderboardCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Displays the Top 50 most reputable users on NovaCont'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      // Fetch top 50 users based on reputation score
      const topUsers = await prisma.user.findMany({
        orderBy: { reputationScore: 'desc' },
        take: 50,
      });

      if (topUsers.length === 0) {
        await interaction.editReply('No users found on the leaderboard yet.');
        return;
      }

      // Since an embed can't hold 50 fields gracefully or its description might exceed 4096 chars,
      // we will format them compactly in chunks. We'll put 10 users per page if we were doing pagination,
      // but for simplicity we will format a single long text if it fits, or break it into fields.
      
      let description = '';
      for (let i = 0; i < topUsers.length; i++) {
        const u = topUsers[i];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎗️';
        description += `**${i + 1}.** ${medal} <@${u.discordId}> — **${u.reputationScore} PTS** (${u.reputationTier})\n`;
      }

      // Discord embed descriptions have a limit of 4096 characters. 
      // 50 users * ~60 chars = ~3000 chars, so it should fit nicely in one embed description.

      const embed = new EmbedBuilder()
        .setTitle('🏆 NovaCont Global Leaderboard (Top 50)')
        .setDescription(description)
        .setColor(Config.BRAND.COLOR)
        .setFooter({ text: 'Ranks are based on Reputation Score' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[LeaderboardCommand] Error:', err);
      await interaction.editReply('❌ Failed to fetch the leaderboard.');
    }
  }
};
