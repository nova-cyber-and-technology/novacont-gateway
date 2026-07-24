import dotenv from 'dotenv';
dotenv.config();

export const Config = {
  // Discord
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  GUILD_ID: process.env.GUILD_ID || '',

  // Channel IDs
  CHANNELS: {
    LIVE_FEED: process.env.CHANNEL_LIVE_FEED || '',
    ANNOUNCEMENTS: process.env.CHANNEL_ANNOUNCEMENTS || '',
    SUPPORT: process.env.CHANNEL_SUPPORT || '',
    VERIFICATION: process.env.CHANNEL_VERIFICATION || '',
    AUDIT_LOG: process.env.CHANNEL_AUDIT_LOG || '',
  },

  // Dynamic Voice Channels (Generator Channels)
  VOICE: {
    GEN_LOUNGE: process.env.VOICE_GEN_LOUNGE || '',
    GEN_MARKETPLACE: process.env.VOICE_GEN_MARKETPLACE || '',
    GEN_COMMUNITY: process.env.VOICE_GEN_COMMUNITY || '',
    GEN_DEVELOPMENT: process.env.VOICE_GEN_DEVELOPMENT || '',
  },

  // NovaCont Lite (TON)
  NOVACONT_LITE: {
    URL: process.env.NOVACONT_LITE_URL || 'https://lite.novacont.tech/',
    CONTRACT: process.env.NOVACONT_LITE_CONTRACT || '',
    NETWORK: process.env.TON_NETWORK || 'mainnet',
  },

  // NovaCont (Base)
  NOVACONT: {
    URL: process.env.NOVACONT_URL || 'https://www.novacont.tech',
    RPC_URL: process.env.BASE_RPC_URL || '',
  },

  // Webhook
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '',

  // Bot branding
  BRAND: {
    NAME: 'NovaCont Gateway',
    COLOR: 0x0098EA,       // Primary blue
    SUCCESS: 0x10B981,     // Green
    WARNING: 0xF59E0B,     // Yellow
    DANGER: 0xEF4444,      // Red
    ICON_URL: '',          // Will be set from bot avatar
  },
} as const;
