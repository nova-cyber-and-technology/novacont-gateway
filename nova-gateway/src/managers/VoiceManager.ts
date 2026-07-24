import { VoiceState, ChannelType, CategoryChannel } from 'discord.js';
import { Config } from '../config';

export class VoiceManager {
  // Store the IDs of dynamically created temporary channels
  private activeTempChannels: Set<string> = new Set();

  constructor() {
    console.log('[VoiceManager] Initialized.');
  }

  /**
   * Handle the voice state update event from Discord.
   * Triggered whenever a user joins, leaves, or moves voice channels.
   */
  public async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const member = newState.member;
    if (!member) return;

    // --- JOIN LOGIC ---
    // User joined a channel (newState.channelId is not null, and they either joined fresh or moved)
    if (newState.channelId && newState.channelId !== oldState.channelId) {
      const generatorChannels = [
        Config.VOICE.GEN_LOUNGE,
        Config.VOICE.GEN_MARKETPLACE,
        Config.VOICE.GEN_COMMUNITY,
        Config.VOICE.GEN_DEVELOPMENT,
      ];

      if (generatorChannels.includes(newState.channelId)) {
        await this.handleGeneratorJoin(newState);
      }
    }

    // --- LEAVE LOGIC ---
    // User left a channel (oldState.channelId is not null, and they either left completely or moved)
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      if (this.activeTempChannels.has(oldState.channelId)) {
        await this.handleTempChannelLeave(oldState);
      }
    }
  }

  /**
   * Creates a new temporary voice channel and moves the user into it.
   */
  private async handleGeneratorJoin(state: VoiceState): Promise<void> {
    const member = state.member;
    const guild = state.guild;
    const generatorChannel = state.channel;

    if (!member || !guild || !generatorChannel) return;

    try {
      // Determine the category where the generator channel is located
      const parentId = generatorChannel.parentId;

      // Create the new temporary voice channel
      const newChannelName = `🎧 ${member.user.username}'s Room`;
      
      const newChannel = await guild.channels.create({
        name: newChannelName,
        type: ChannelType.GuildVoice,
        parent: parentId,
        // Inherit permissions from category by default
      });

      // Track the new channel
      this.activeTempChannels.add(newChannel.id);
      console.log(`[VoiceManager] Created temp channel '${newChannelName}' (${newChannel.id}) for ${member.user.tag}`);

      // Move the member to the newly created channel
      await member.voice.setChannel(newChannel);

    } catch (error) {
      console.error(`[VoiceManager] Error creating temporary voice channel for ${member.user.tag}:`, error);
      
      // Attempt to disconnect them if creation fails, so they don't get stuck in the generator
      try {
        await member.voice.disconnect('Temporary channel creation failed');
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  }

  /**
   * Checks if a temporary channel is empty, and deletes it if so.
   */
  private async handleTempChannelLeave(state: VoiceState): Promise<void> {
    const channel = state.channel;
    
    // If the channel was already deleted or isn't accessible, just remove it from tracking
    if (!channel) {
      this.activeTempChannels.delete(state.channelId!);
      return;
    }

    try {
      // If the channel is empty, delete it
      if (channel.members.size === 0) {
        const channelId = channel.id;
        const channelName = channel.name;
        
        await channel.delete('Temporary channel empty');
        this.activeTempChannels.delete(channelId);
        
        console.log(`[VoiceManager] Deleted empty temp channel '${channelName}' (${channelId})`);
      }
    } catch (error) {
      console.error(`[VoiceManager] Error deleting empty temporary voice channel ${channel.id}:`, error);
    }
  }
}
