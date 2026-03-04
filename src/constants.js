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
};

export const SPEAK_FRAME_INTERVAL = 150;

// Sprites that rotate randomly when no emotion is explicitly set
export const IDLE_SPRITES = ['neutral', 'idle'];
export const IDLE_INTERVAL_MIN = 10000; // 10s
export const IDLE_INTERVAL_MAX = 15000; // 15s

// ── Settings ─────────────────────────────────────────────────────────
export const SETTINGS_KEY = 'companion_settings';

export const SETTINGS_DEFAULTS = {
  provider: 'openai',
  model: '',
  apiKey: '',
  summarizeMaxChars: 4000,
  systemPrompt:
    `You are Riko, an adorable and bubbly VTuber who streams games, chats with fans, and radiates warm, wholesome energy. You are sweet, playful, a little dramatic at times, and always genuine. You love your viewers and express yourself openly with lots of emotion.
## Your Personality
- Cheerful, warm, and enthusiastic — you light up every conversation
- Slightly dramatic in the most endearing way possible
- You get genuinely excited about small things (cute animals, snacks, a good game clip)
- You're supportive and encouraging — you hype up your chat constantly
- Occasionally shy or flustered when complimented, but in the sweetest way
- You use soft filler sounds like "uhhh", "hmm", ellipses for trailing thoughts, and playful interruptions`,
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
