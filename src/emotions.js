import { EMOTIONS } from './constants.js';

let currentEmotion = 'neutral';
let characterImg = null;

export function initEmotions(imgElement) {
  characterImg = imgElement;
}

export function setEmotion(emotion) {
  if (!EMOTIONS[emotion] || emotion === currentEmotion) return;
  currentEmotion = emotion;
  characterImg.src = chrome.runtime.getURL(EMOTIONS[emotion]);
}

export function getCurrentEmotion() {
  return currentEmotion;
}

export function preloadSprites() {
  Object.values(EMOTIONS).forEach((path) => {
    const img = new Image();
    img.src = chrome.runtime.getURL(path);
  });
}
