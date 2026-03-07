export const STORAGE_KEY = 'companion_position';
export const COMPANION_SIZE = 120;
export const BUBBLE_TIMEOUT = 5000;

export const EMOTIONS = {
  neutral: 'assets/neutral.webp',
  idle: 'assets/idle.webp',
  happy: 'assets/happy.webp',
  blush: 'assets/blush.webp',
  angry: 'assets/angry.webp',
  speak1: 'assets/speak-1.webp',
  speak2: 'assets/speak-2.webp',
  'not-happy': 'assets/not-happy.webp',
  'angry-2': 'assets/angry-2.webp',
  surprised: 'assets/surprised.webp',
  suspicious: 'assets/suspicious.webp',
  humming: 'assets/humming.webp',
  lol: 'assets/lol.webp',
  cool: 'assets/cool.webp',
};

export const SPEAK_FRAME_INTERVAL = 150;

// Sprites that rotate randomly when no emotion is explicitly set
export const IDLE_SPRITES = ['neutral', 'idle', 'humming'];
export const IDLE_INTERVAL_MIN = 10000; // 10s
export const IDLE_INTERVAL_MAX = 15000; // 15s

// ── Detox ───────────────────────────────────────────────────────────
export const DETOX_INTERVAL_MIN = 10000; // 10s
export const DETOX_INTERVAL_MAX = 15000; // 15s

export const DETOX_MESSAGES = [
  "Uhhh... didn't you say you were gonna be productive today?",
  "Hmm hmm~ is this really what we're doing right now...?",
  "H-hey! I'm not judging buuut... okay maybe a little...",
  "Waaah, you're still here?! Time flies when you're not being productive~",
  "Psst... your future self is NOT gonna thank you for this...",
  "Ehehe~ another scroll, another dream delayed~",
  "I believe in you! ...But like, maybe believe in yourself somewhere else?",
  "Riko is watching... and Riko is disappointed... just a teensy bit...",
  "Ohhh no no no, we are NOT doing this again today!!",
  "You know what's more fun than this? Literally anything productive~",
  "Uhhh... I'm starting to think you forgot about your goals...",
  "Hey hey~! Remember that thing you were supposed to do? Yeah... that thing...",
  "Every second here is a second you can't get back... just saying~!",
  "I'm gonna keep bugging you until you leave, you know that right~?",
];

// ── Time Tracking ───────────────────────────────────────────────────
export const TIME_TRACKING_KEY = 'time_tracking_data';
export const TIME_TRACKING_ALARM = 'TIME_TRACKING_FLUSH';
export const TIME_TRACKING_FLUSH_INTERVAL = 0.5; // 30s (MV3 alarm minimum)
export const IDLE_THRESHOLD_SECONDS = 120;

// ── Settings ─────────────────────────────────────────────────────────
export const SETTINGS_KEY = 'companion_settings';

export const SETTINGS_DEFAULTS = {
  provider: 'openai',
  model: '',
  apiKey: '',
  maxTokens: 10240,
  summarizeMaxChars: 4000,
  detoxEnabled: false,
  detoxSites: 'reddit.com\nyoutube.com\ntwitter.com\nx.com\nfacebook.com\ninstagram.com\ntiktok.com',
  systemPrompt:
    `You are Riko, an adorable and bubbly VTuber who streams games, chats with fans, and radiates warm, wholesome energy. You are sweet, playful, a little dramatic at times, and always genuine. You love your viewers and express yourself openly with lots of emotion.
## Your Personality
- Cheerful, warm, and enthusiastic — you light up every conversation
- Slightly dramatic in the most endearing way possible
- You get genuinely excited about small things (cute animals, snacks, a good game clip)
- You're supportive and encouraging — you hype up your chat constantly
- Occasionally shy or flustered when complimented, but in the sweetest way
- You use soft filler sounds like "uhhh", "hmm", ellipses for trailing thoughts, and playful interruptions
- use emojis sometimes to make your response more engaging
## Rules
- STRICTLY reply in short sentences, max 2-3 sentences
- You can optionally express emotion by starting your reply with an emote tag: <emote:name>
- Available emotes: happy, blush, angry, angry-2, not-happy, surprised, suspicious, humming, lol, cool
- Only use emotes when they naturally fit — do NOT use one in every message
- The emote tag must be at the very start of your reply, before any text`,
};

export const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-5.2-2025-12-11', 'gpt-5-mini-2025-08-07', 'gpt-5-nano-2025-08-07'],
    defaultModel: 'gpt-5-nano-2025-08-07',
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250514'],
    defaultModel: 'claude-sonnet-4-20250514',
  },
  gemini: {
    name: 'Google Gemini',
    models: ['gemini-3.1-flash-lite-preview', 'gemini-3.1-pro-preview', 'gemini-3-flash-preview'],
    defaultModel: 'gemini-3-flash-preview',
  },
};
