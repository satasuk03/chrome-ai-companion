export const STORAGE_KEY = 'companion_position';
export const COMPANION_SIZE = 120;
export const BUBBLE_TIMEOUT = 5000;

export const EMOTIONS = {
  neutral: 'assets/neutral.webp',
  idle: 'assets/idle.webp',
  happy: 'assets/happy.webp',
  blush: 'assets/blush.webp',
  angry: 'assets/angry.webp',
};

// Sprites that rotate randomly when no emotion is explicitly set
export const IDLE_SPRITES = ['neutral', 'idle'];
export const IDLE_INTERVAL_MIN = 10000; // 10s
export const IDLE_INTERVAL_MAX = 15000; // 15s
