import { Command } from './Command';
import { PingCommand } from './general/ping';
import { LinkWalletCommand } from './general/linkwallet';
import { ProfileCommand } from './general/profile';
import { EscrowCommand } from './general/escrow';
import { setupRolesCommand } from './admin/setuproles';
import { LeaderboardCommand } from './general/leaderboard';
import { AnalyticsCommand } from './admin/analytics';
import { AdminCommand } from './admin/admin';

/**
 * Central registry of all slash commands.
 * Add new commands here as they are created.
 */
export const commands: Command[] = [
  PingCommand,
  LinkWalletCommand,
  ProfileCommand,
  EscrowCommand,
  setupRolesCommand,
  LeaderboardCommand,
  AnalyticsCommand,
  AdminCommand,
];
