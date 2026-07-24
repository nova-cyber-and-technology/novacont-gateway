import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../Command';
import { EmbedEngine } from '../../managers/EmbedEngine';
import { Config } from '../../config';

export const AdminCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin utilities for server management')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('announce')
        .setDescription('Send a quick branded announcement to a channel')
        .addChannelOption(option => option.setName('channel').setDescription('Target channel').setRequired(true))
        .addStringOption(option => option.setName('title').setDescription('Title').setRequired(true))
        .addStringOption(option => option.setName('message').setDescription('Message body').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('embed')
        .setDescription('Advanced Embed Builder for custom messages')
        .addChannelOption(option => option.setName('channel').setDescription('Target channel').setRequired(true))
        .addStringOption(option => option.setName('description').setDescription('Main text of the embed').setRequired(true))
        .addStringOption(option => option.setName('title').setDescription('Title of the embed').setRequired(false))
        .addStringOption(option => option.setName('color').setDescription('Hex color (e.g., #FF0000)').setRequired(false))
        .addAttachmentOption(option => option.setName('image').setDescription('Upload a large image for the bottom').setRequired(false))
        .addAttachmentOption(option => option.setName('thumbnail').setDescription('Upload a small logo for the top right').setRequired(false))
        .addStringOption(option => option.setName('footer').setDescription('Footer text at the very bottom').setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Bulk delete messages in the current channel')
        .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('syncperms')
        .setDescription('Automatically grants View/Post permissions to all NovaCont roles on a channel or category')
        .addChannelOption(option => option.setName('target').setDescription('The channel or category to update').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('sync-unverified')
        .setDescription('Finds users with no roles and assigns them the Unverified role (useful if bot was offline)')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'announce') {
      const targetChannel = interaction.options.getChannel('channel') as TextChannel;
      const title = interaction.options.getString('title', true);
      const message = interaction.options.getString('message', true);

      if (!targetChannel || !targetChannel.send) {
        await interaction.reply({ content: '❌ Invalid channel selected. Must be a text channel.', ephemeral: true });
        return;
      }

      const embedEngine = new EmbedEngine();
      const embed = embedEngine.announcement(title, message);

      try {
        await targetChannel.send({ embeds: [embed] });
        await interaction.reply({ content: `✅ Announcement successfully sent to <#${targetChannel.id}>`, ephemeral: true });
      } catch (err) {
        console.error('[AdminCommand] Failed to send announcement:', err);
        await interaction.reply({ content: '❌ Failed to send the announcement. Check my permissions in that channel.', ephemeral: true });
      }
    } else if (subcommand === 'embed') {
      const targetChannel = interaction.options.getChannel('channel') as TextChannel;
      const description = interaction.options.getString('description', true);
      const title = interaction.options.getString('title');
      const color = interaction.options.getString('color');
      const image = interaction.options.getAttachment('image');
      const thumbnail = interaction.options.getAttachment('thumbnail');
      const footer = interaction.options.getString('footer');

      if (!targetChannel || !targetChannel.send) {
        await interaction.reply({ content: '❌ Invalid channel selected. Must be a text channel.', ephemeral: true });
        return;
      }

      // Convert hex color to number if provided, otherwise fallback to brand color
      let resolvedColor: number = Config.BRAND.COLOR;
      if (color && /^#[0-9A-F]{6}$/i.test(color)) {
        resolvedColor = parseInt(color.replace('#', ''), 16);
      }

      const customEmbed = new EmbedBuilder()
        .setDescription(description)
        .setColor(resolvedColor)
        .setTimestamp();

      if (title) customEmbed.setTitle(title);
      if (image) customEmbed.setImage(image.url);
      if (thumbnail) customEmbed.setThumbnail(thumbnail.url);
      if (footer) customEmbed.setFooter({ text: footer });

      try {
        await targetChannel.send({ embeds: [customEmbed] });
        await interaction.reply({ content: `✅ Advanced Embed successfully sent to <#${targetChannel.id}>`, ephemeral: true });
      } catch (err) {
        console.error('[AdminCommand] Failed to send advanced embed:', err);
        await interaction.reply({ content: '❌ Failed to send the embed. Check my permissions or URL validity.', ephemeral: true });
      }
    } else if (subcommand === 'clear') {
      const amount = interaction.options.getInteger('amount', true);
      const channel = interaction.channel as TextChannel;

      if (!channel || !channel.bulkDelete) {
        await interaction.reply({ content: '❌ This command can only be used in text channels.', ephemeral: true });
        return;
      }

      try {
        await interaction.deferReply({ ephemeral: true });
        const deleted = await channel.bulkDelete(amount, true); // true = filter out messages older than 14 days
        await interaction.editReply({ content: `🧹 Successfully deleted **${deleted.size}** messages.` });
      } catch (err) {
        console.error('[AdminCommand] Failed to clear messages:', err);
        if (interaction.deferred) {
          await interaction.editReply({ content: '❌ Failed to delete messages. I might be missing the Manage Messages permission, or the messages are older than 14 days.' });
        } else {
          await interaction.reply({ content: '❌ Failed to delete messages.', ephemeral: true });
        }
      }
    } else if (subcommand === 'syncperms') {
      const targetChannel = interaction.options.getChannel('target', true) as TextChannel;
      
      if (!interaction.guild) return;

      await interaction.deferReply({ ephemeral: true });

      const TIER_ROLES = ['Verified', 'Trusted', 'Expert', 'Elite', 'Legend', 'Super Nova'];
      const MILESTONE_ROLES = ['First Escrow', '10 Escrows', '50 Escrows', '100 Escrows', '500 Escrows', '1000+ Escrows'];
      const VOLUME_ROLES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
      const SPECIAL_ROLES = ['OG', 'Early Supporter', 'Nova Booster'];

      const allRolesToSync = [...TIER_ROLES, ...MILESTONE_ROLES, ...VOLUME_ROLES, ...SPECIAL_ROLES];
      let syncedCount = 0;

      try {
        for (const roleName of allRolesToSync) {
          const role = interaction.guild.roles.cache.find(r => r.name === roleName);
          if (role) {
            await targetChannel.permissionOverwrites.edit(role.id, {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true,
            });
            syncedCount++;
          }
        }
        await interaction.editReply({ content: `✅ **Success!** Automatically granted \`ViewChannel\` and \`SendMessages\` permissions to **${syncedCount}** standard NovaCont roles for <#${targetChannel.id}>.` });
      } catch (err) {
        console.error('[AdminCommand] Failed to sync perms:', err);
        await interaction.editReply({ content: `❌ **Failed!** I couldn't update permissions. Please ensure my role is higher than the roles I'm trying to edit, and that I have the 'Manage Roles' permission in that channel/category.` });
      }
    } else if (subcommand === 'sync-unverified') {
      if (!interaction.guild) return;
      await interaction.deferReply({ ephemeral: true });

      try {
        const unverifiedRole = interaction.guild.roles.cache.find(r => r.name === 'Unverified');
        if (!unverifiedRole) {
          await interaction.editReply({ content: '❌ "Unverified" role not found on the server.' });
          return;
        }

        // Fetch all members to ensure cache is up to date
        const members = await interaction.guild.members.fetch();
        let fixedCount = 0;

        for (const [id, member] of members) {
          if (member.user.bot) continue; // Skip bots

          // member.roles.cache always includes the @everyone role, so size 1 means no custom roles.
          if (member.roles.cache.size === 1) {
            await member.roles.add(unverifiedRole);
            fixedCount++;
          }
        }

        await interaction.editReply({ content: `✅ **Scan complete!** Found **${fixedCount}** invisible users who had no roles, and assigned them the \`Unverified\` role so they can see the verification channels.` });
      } catch (err) {
        console.error('[AdminCommand] Error in sync-unverified:', err);
        await interaction.editReply({ content: '❌ Failed to scan and fix members. Check my permissions.' });
      }
    }
  }
};
