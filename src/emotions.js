import { EMOTIONS, IDLE_SPRITES, IDLE_INTERVAL_MIN, IDLE_INTERVAL_MAX, SPEAK_FRAME_INTERVAL } from './constants.js';

let currentEmotion = 'neutral';
let characterImg = null;
let idleTimer = null;
let isHovered = false;
let emotionOverride = null; // set by explicit setEmotion (non-idle)
let speakingInterval = null;

export function initEmotions(imgElement) {
  characterImg = imgElement;

  // Hover → happy
  characterImg.addEventListener('pointerenter', () => {
    isHovered = true;
    setSpriteUrl('happy');
  });

  characterImg.addEventListener('pointerleave', () => {
    isHovered = false;
    // Restore: explicit override takes priority, otherwise current idle sprite
    setSpriteUrl(emotionOverride || currentEmotion);
  });

  // Start idle shuffle
  scheduleIdleShuffle();
}

function setSpriteUrl(emotion) {
  characterImg.src = chrome.runtime.getURL(EMOTIONS[emotion]);
}

function randomIdleDelay() {
  return IDLE_INTERVAL_MIN + Math.random() * (IDLE_INTERVAL_MAX - IDLE_INTERVAL_MIN);
}

function scheduleIdleShuffle() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    // Only shuffle if no explicit emotion override
    if (!emotionOverride) {
      const next = IDLE_SPRITES[Math.floor(Math.random() * IDLE_SPRITES.length)];
      currentEmotion = next;
      if (!isHovered) {
        setSpriteUrl(next);
      }
    }
    scheduleIdleShuffle();
  }, randomIdleDelay());
}

export function setEmotion(emotion) {
  if (!EMOTIONS[emotion]) return;

  // If setting to an idle sprite, clear override and let shuffle take over
  if (IDLE_SPRITES.includes(emotion)) {
    emotionOverride = null;
    currentEmotion = emotion;
    if (!isHovered) setSpriteUrl(emotion);
    return;
  }

  // Explicit non-idle emotion — pause idle shuffle visuals
  emotionOverride = emotion;
  currentEmotion = emotion;
  if (!isHovered) setSpriteUrl(emotion);
}

export function clearEmotionOverride() {
  emotionOverride = null;
}

export function getCurrentEmotion() {
  return currentEmotion;
}

export function startSpeakingAnim() {
  if (speakingInterval) return;
  // Pause idle shuffle
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
  let isNeutralFrame = true;
  const speakSprites = ['speak1', 'speak2'];
  speakingInterval = setInterval(() => {
    if (isNeutralFrame) {
      setSpriteUrl('neutral');
    } else {
      setSpriteUrl(speakSprites[Math.floor(Math.random() * speakSprites.length)]);
    }
    isNeutralFrame = !isNeutralFrame;
  }, SPEAK_FRAME_INTERVAL);
}

export function stopSpeakingAnim() {
  if (!speakingInterval) return;
  clearInterval(speakingInterval);
  speakingInterval = null;
  setSpriteUrl('neutral');
  emotionOverride = null;
  scheduleIdleShuffle();
}

export function preloadSprites() {
  Object.values(EMOTIONS).forEach((path) => {
    const img = new Image();
    img.src = chrome.runtime.getURL(path);
  });
}
