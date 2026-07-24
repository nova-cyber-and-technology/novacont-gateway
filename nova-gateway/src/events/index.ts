import { Client, Events, GuildMember } from 'discord.js';
import { AuthManager } from '../managers/AuthManager';
import { AuditLogger } from '../managers/AuditLogger';
import { VoiceManager } from '../managers/VoiceManager';

/**
 * Register all Discord event handlers.
 */
export function registerEvents(
  client: Client,
  authManager: AuthManager,
  auditLogger: AuditLogger,
  voiceManager: VoiceManager,
): void {

  // When a member's voice state changes (join/leave/move channels)
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    try {
      await voiceManager.handleVoiceStateUpdate(oldState, newState);
    } catch (err) {
      console.error('[Event] Error handling VoiceStateUpdate:', err);
    }
  });

  // When a new member joins
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    console.log(`[Event] New member joined: ${member.user.tag}`);
    try {
      await authManager.onMemberJoin(member);
      await auditLogger.log('MEMBER_JOINED', { tag: member.user.tag }, undefined, undefined, member.guild.id);
      
      // Send Welcome DM
      try {
        await member.send(
          "👋 **Welcome to NovaCont!**\n\n" +
          "You currently have limited access because your wallet has not been verified.\n\n" +
          "Use\n`/linkwallet`\nin the server to unlock the complete ecosystem.\n\n" +
          "**Supported Networks:**\n" +
          "• Base\n" +
          "• TON"
        );
      } catch (dmErr) {
        console.log(`[Event] Could not send welcome DM to ${member.user.tag} (DMs might be closed).`);
      }
      
    } catch (err) {
      console.error('[Event] Error handling GuildMemberAdd:', err);
    }
  });

  // When a member leaves
  client.on(Events.GuildMemberRemove, async (member) => {
    console.log(`[Event] Member left: ${member.user.tag}`);
    try {
      await auditLogger.log('MEMBER_LEFT', { tag: member.user.tag }, undefined, undefined, member.guild.id);
    } catch (err) {
      console.error('[Event] Error handling GuildMemberRemove:', err);
    }
  });

  // When a member's data changes (e.g., boosting)
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
      // Check if they just got the Discord Booster role
      const oldHasBooster = oldMember.roles.cache.some(r => r.tags?.premiumSubscriberRole);
      const newHasBooster = newMember.roles.cache.some(r => r.tags?.premiumSubscriberRole);

      if (!oldHasBooster && newHasBooster) {
        console.log(`[Event] Member started boosting (Discord Role Added): ${newMember.user.tag}`);
        const boosterRole = newMember.guild.roles.cache.find(r => r.name === 'Nova Booster');
        
        if (boosterRole && !newMember.roles.cache.has(boosterRole.id)) {
          await newMember.roles.add(boosterRole);
          console.log(`[Event] Assigned 'Nova Booster' role to ${newMember.user.tag}`);
        }
      }
    } catch (err) {
      console.error('[Event] Error handling GuildMemberUpdate:', err);
    }
  });
}
