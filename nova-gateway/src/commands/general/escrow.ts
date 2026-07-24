import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../Command';
import { ProfileManager } from '../../managers/ProfileManager';
import { DeepLinkBuilder } from '../../managers/DeepLinkBuilder';
import { EmbedEngine } from '../../managers/EmbedEngine';

export const EscrowCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('escrow')
    .setDescription('Start a secure escrow transaction with another user.')
    .addUserOption(option => 
      option.setName('provider')
        .setDescription('The user who will provide the service')
        .setRequired(true)
    )
    .addNumberOption(option => 
      option.setName('amount')
        .setDescription('Amount in USD')
        .setRequired(true)
        .setMinValue(0.01)
    )
    .addStringOption(option => 
      option.setName('network')
        .setDescription('Which network to use')
        .setRequired(true)
        .addChoices(
          { name: 'TON (NovaCont Lite)', value: 'TON' },
          { name: 'Base (NovaCont)', value: 'BASE' }
        )
    )
    .addStringOption(option => 
      option.setName('description')
        .setDescription('Brief description of the work')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const providerUser = interaction.options.getUser('provider', true);
    const amount = interaction.options.getNumber('amount', true);
    const network = interaction.options.getString('network', true) as 'TON' | 'BASE';
    const description = interaction.options.getString('description', true);

    const profileManager = new ProfileManager();
    const deepLinkBuilder = new DeepLinkBuilder();
    const embedEngine = new EmbedEngine();

    await interaction.deferReply();

    // Prevent self-escrow logic error
    if (providerUser.id === interaction.user.id) {
      await interaction.editReply({
        embeds: [embedEngine.error('Self Escrow Blocked', 'You cannot create an escrow contract with yourself.')]
      });
      return;
    }

    // Check if provider has the required wallet linked
    const providerProfile = await profileManager.getProfile(providerUser.id);
    const providerWallet = network === 'TON' ? providerProfile?.tonWallet : providerProfile?.baseWallet;

    if (!providerWallet) {
      await interaction.editReply({
        embeds: [
          embedEngine.error(
            'Provider Wallet Not Linked', 
            `${providerUser} has not linked their **${network}** wallet yet.\nThey need to run \`/linkwallet\` first.`
          )
        ]
      });
      return;
    }

    // Generate Deep Link
    const link = network === 'TON'
      ? deepLinkBuilder.escrowTon({ provider: providerWallet, amount: amount.toString(), description })
      : deepLinkBuilder.escrowBase({ provider: providerWallet, amount: amount.toString(), description });

    const embed = embedEngine.escrowPreview({
      network,
      amountUsd: amount,
      description,
      providerTag: `<@${providerUser.id}>`,
      deepLink: link
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Pay $${amount} on ${network}`)
        .setStyle(ButtonStyle.Link)
        .setURL(link)
    );

    await interaction.editReply({
      content: `Hey ${providerUser}, <@${interaction.user.id}> wants to start an escrow with you!`,
      embeds: [embed],
      components: [row]
    });
  },
};
