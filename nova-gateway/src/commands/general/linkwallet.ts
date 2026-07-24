import { ChatInputCommandInteraction, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { Command } from '../Command';
import { DeepLinkBuilder } from '../../managers/DeepLinkBuilder';
import { EmbedEngine } from '../../managers/EmbedEngine';
import { ProfileManager } from '../../managers/ProfileManager';
import { AuthManager } from '../../managers/AuthManager';
import { RoleManager } from '../../managers/RoleManager';

export const LinkWalletCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('linkwallet')
    .setDescription('Connect your TON or Base wallet to NovaCont.')
    .addStringOption(option => 
      option.setName('network')
        .setDescription('Which network wallet do you want to link?')
        .setRequired(true)
        .addChoices(
          { name: 'TON (NovaCont Lite)', value: 'TON' },
          { name: 'Base (NovaCont)', value: 'BASE' }
        )
    )
    .addStringOption(option => 
      option.setName('address')
        .setDescription('(Optional) Directly enter your wallet address to link it immediately.')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const network = interaction.options.getString('network', true) as 'TON' | 'BASE';
    const address = interaction.options.getString('address', false);
    
    const deepLinkBuilder = new DeepLinkBuilder();
    const embedEngine = new EmbedEngine();
    const profileManager = new ProfileManager();
    const roleManager = new RoleManager();
    const authManager = new AuthManager(roleManager);

    // If user provided the address directly, link it instantly!
    if (address) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      
      // Regex Validation
      if (network === 'BASE' && !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        await interaction.editReply({
          embeds: [embedEngine.error('Invalid Format', 'Base wallet address must start with `0x` and be exactly 42 characters long.')]
        });
        return;
      }

      if (network === 'TON' && !/^(EQ|UQ)[a-zA-Z0-9_-]{46}$/.test(address)) {
        await interaction.editReply({
          embeds: [embedEngine.error('Invalid Format', 'TON wallet address must start with `EQ` or `UQ` and be exactly 48 characters long.')]
        });
        return;
      }

      try {
        if (network === 'TON') {
          await profileManager.linkTonWallet(interaction.user.id, address);
        } else {
          await profileManager.linkBaseWallet(interaction.user.id, address);
        }

        // Trigger role verification
        await authManager.verifyUser(interaction.client, interaction.user.id);

        const successEmbed = embedEngine.success(
          'Wallet Linked Successfully!',
          `Your **${network}** wallet (\`${address}\`) has been linked to your Discord account.\nYou are now ready to use \`/escrow\` and build your reputation!`
        );
        await interaction.editReply({ embeds: [successEmbed] });
      } catch (error: any) {
        if (error.message === 'WALLET_ALREADY_LINKED') {
          await interaction.editReply({
            embeds: [embedEngine.error('Already Linked', `The wallet address \`${address}\` is already linked to another user's Discord account. Wallets act as unique identities and cannot be shared.`)]
          });
        } else {
          await interaction.editReply({
            embeds: [embedEngine.error('Error', 'An unexpected error occurred while linking your wallet.')]
          });
        }
      }
      return;
    }

    // Otherwise, generate the URL button
    const url = deepLinkBuilder.walletConnect(network);

    const embed = embedEngine.create(
      'Link Your Wallet',
      `Click the button below to link your **${network}** wallet to your Discord account.\nThis will verify your profile and allow you to build reputation.`,
      0x0098EA
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Connect ${network} Wallet`)
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  },
};
