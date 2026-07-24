import { Client, GatewayIntentBits, REST, Routes, Collection, Events } from 'discord.js';
import { Config } from './config';

// Managers
import { EmbedEngine } from './managers/EmbedEngine';
import { DeepLinkBuilder } from './managers/DeepLinkBuilder';
import { ProfileManager } from './managers/ProfileManager';
import { RoleManager } from './managers/RoleManager';
import { ReputationEngine } from './managers/ReputationEngine';
import { NotificationManager } from './managers/NotificationManager';
import { TicketManager } from './managers/TicketManager';
import { AuthManager } from './managers/AuthManager';
import { TranslationManager } from './managers/TranslationManager';
import { PermissionManager } from './managers/PermissionManager';
import { AdminManager } from './managers/AdminManager';
import { AnalyticsManager } from './managers/AnalyticsManager';
import { AuditLogger } from './managers/AuditLogger';
import { StatsCollector } from './managers/StatsCollector';
import { VoiceManager } from './managers/VoiceManager';

// Providers
import { TonProvider } from './providers/TonProvider';
import { BaseProvider } from './providers/BaseProvider';

// Commands & Events
import { commands } from './commands';
import { Command } from './commands/Command';
import { registerEvents } from './events';

import { startApiServer } from './api/server';

/**
 * ╔══════════════════════════════════════════════════╗
 *   Nova Gateway Bot — The heart of NovaCont on Discord
 * ╚══════════════════════════════════════════════════╝
 */
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║         Nova Gateway Bot — Starting...          ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // ─── Initialize Discord Client ────────────────────────────
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });

  // ─── Initialize All Modules ───────────────────────────────
  console.log('[Boot] Initializing modules...');

  const embedEngine = new EmbedEngine();
  const deepLinkBuilder = new DeepLinkBuilder();
  const profileManager = new ProfileManager();
  const roleManager = new RoleManager();
  const reputationEngine = new ReputationEngine();
  const ticketManager = new TicketManager();
  const translationManager = new TranslationManager();
  const permissionManager = new PermissionManager();
  const adminManager = new AdminManager(embedEngine);
  const analyticsManager = new AnalyticsManager();
  const auditLogger = new AuditLogger();
  const voiceManager = new VoiceManager();

  // Providers (chain-specific data fetchers)
  const tonProvider = new TonProvider();
  const baseProvider = new BaseProvider();

  // Stats Collector (bridges providers → reputation engine)
  const statsCollector = new StatsCollector(tonProvider, baseProvider, reputationEngine, roleManager, client);

  // Notification Manager (needs client reference)
  const notificationManager = new NotificationManager(client, embedEngine);

  // Auth Manager (needs role manager)
  const authManager = new AuthManager(roleManager);

  // Start Express API Server on port 3000
  startApiServer(3000, statsCollector, profileManager);

  console.log('[Boot] All 16 modules initialized successfully!');
  console.log('  ├── EmbedEngine');
  console.log('  ├── DeepLinkBuilder');
  console.log('  ├── ProfileManager');
  console.log('  ├── RoleManager');
  console.log('  ├── ReputationEngine');
  console.log('  ├── NotificationManager');
  console.log('  ├── TicketManager');
  console.log('  ├── AuthManager');
  console.log('  ├── TranslationManager');
  console.log('  ├── PermissionManager');
  console.log('  ├── AdminManager');
  console.log('  ├── AnalyticsManager');
  console.log('  ├── AuditLogger');
  console.log('  ├── StatsCollector');
  console.log('  ├── VoiceManager');
  console.log('  ├── TonProvider');
  console.log('  └── BaseProvider');

  // ─── Register Commands ────────────────────────────────────
  const commandMap = new Collection<string, Command>();
  for (const cmd of commands) {
    commandMap.set(cmd.data.name, cmd);
  }

  // ─── Handle Interactions ──────────────────────────────────
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandMap.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      console.error(`[Command Error] /${interaction.commandName}:`, err);
      const reply = { content: 'An error occurred while processing this command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  });

  // ─── Register Events ─────────────────────────────────────
  registerEvents(client, authManager, auditLogger, voiceManager);

  // ─── On Ready ─────────────────────────────────────────────
  client.once(Events.ClientReady, async (readyClient) => {
    console.log('');
    console.log(`[Ready] Logged in as: ${readyClient.user.tag}`);
    console.log(`[Ready] Serving ${readyClient.guilds.cache.size} guild(s)`);

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(Config.DISCORD_TOKEN);
    const commandData = commands.map(c => c.data.toJSON());

    try {
      console.log(`[Commands] Clearing old global commands to prevent duplicates...`);
      await rest.put(
        Routes.applicationCommands(readyClient.user.id),
        { body: [] },
      );

      console.log(`[Commands] Registering ${commandData.length} slash command(s) to Guild ${Config.GUILD_ID}...`);
      await rest.put(
        Routes.applicationGuildCommands(readyClient.user.id, Config.GUILD_ID),
        { body: commandData },
      );
      console.log('[Commands] All slash commands registered successfully!');
    } catch (err) {
      console.error('[Commands] Failed to register commands:', err);
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║    Gateway Modules Loaded Successfully          ║');
    console.log('║    Nova Gateway Bot is ONLINE and READY!        ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
  });

  // ─── Login ────────────────────────────────────────────────
  if (!Config.DISCORD_TOKEN) {
    console.error('[Fatal] DISCORD_TOKEN is not set in .env file!');
    process.exit(1);
  }

  await client.login(Config.DISCORD_TOKEN);
}

// Run
main().catch((err) => {
  console.error('[Fatal] Failed to start Nova Gateway:', err);
  process.exit(1);
});
