import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, Colors } from 'discord.js';
import { Command } from '../Command';

const TIER_ROLES = ['Verified', 'Trusted', 'Expert', 'Elite', 'Legend', 'Super Nova'];
const MILESTONE_ROLES = ['First Escrow', '10 Escrows', '50 Escrows', '100 Escrows', '500 Escrows', '1000+ Escrows'];
const VOLUME_ROLES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
const SPECIAL_ROLES = ['OG', 'Early Supporter'];

export const setupRolesCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('setup-roles')
    .setDescription('Creates all required NovaCont roles in the server (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    await interaction.reply({ content: '⏳ Setting up NovaCont roles... Please wait.', ephemeral: true });

    const allRoles = [...TIER_ROLES, ...MILESTONE_ROLES, ...VOLUME_ROLES, ...SPECIAL_ROLES];
    let createdCount = 0;
    let existingCount = 0;

    for (const roleName of allRoles) {
      const existing = interaction.guild.roles.cache.find(r => r.name === roleName);
      if (existing) {
        existingCount++;
      } else {
        await interaction.guild.roles.create({
          name: roleName,
          reason: 'Auto-created by NovaCont Gateway for reputation system',
          color: Colors.Blue,
        });
        createdCount++;
      }
    }

    await interaction.editReply(`✅ Setup complete!\n**Created:** ${createdCount} roles\n**Already Existed:** ${existingCount} roles`);
  }
};
