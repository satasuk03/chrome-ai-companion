import { BUBBLE_TIMEOUT } from './constants.js';

let bubbleEl = null;
let bubbleContentEl = null;
let bubbleVisible = false;
let bubbleTimeout = null;
let typewriterCancel = null;
let isChatVisible = () => false;
let getPosition = () => ({ x: 0, y: 0 });
let onSpeakStart = null;
let onSpeakEnd = null;

export function initBubble(elements, deps) {
  bubbleEl = elements.bubble;
  bubbleContentEl = elements.bubbleContent;
  isChatVisible = deps.isChatVisible;
  getPosition = deps.getPosition;
  onSpeakStart = deps.onSpeakStart || null;
  onSpeakEnd = deps.onSpeakEnd || null;
}

export function showBubble() {
  if (isChatVisible()) return;
  bubbleVisible = true;
  bubbleEl.classList.add('visible');
  updateBubblePosition();
}

export function hideBubble() {
  bubbleVisible = false;
  bubbleEl.classList.remove('visible');
  if (bubbleTimeout) {
    clearTimeout(bubbleTimeout);
    bubbleTimeout = null;
  }
  if (typewriterCancel) {
    typewriterCancel();
    typewriterCancel = null;
    if (onSpeakEnd) onSpeakEnd();
  }
}

export function isBubbleVisible() {
  return bubbleVisible;
}

export function setBubbleText(text) {
  if (typewriterCancel) {
    typewriterCancel();
    typewriterCancel = null;
    if (onSpeakEnd) onSpeakEnd();
  }
  bubbleContentEl.textContent = text;
  showBubble();
  scheduleBubbleHide();
}

export function setBubbleTextAnimated(text, speed) {
  if (typewriterCancel) {
    typewriterCancel();
    typewriterCancel = null;
    if (onSpeakEnd) onSpeakEnd();
  }
  speed = speed || 30;
  bubbleContentEl.textContent = '';
  showBubble();
  if (onSpeakStart) onSpeakStart();

  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      bubbleContentEl.textContent += text[i];
      i++;
    } else {
      clearInterval(interval);
      if (onSpeakEnd) onSpeakEnd();
      scheduleBubbleHide();
    }
  }, speed);

  typewriterCancel = () => clearInterval(interval);
}

function scheduleBubbleHide() {
  if (bubbleTimeout) clearTimeout(bubbleTimeout);
  bubbleTimeout = setTimeout(hideBubble, BUBBLE_TIMEOUT);
}

export function updateBubblePosition() {
  const pos = getPosition();
  const flipY = pos.y < 180;
  const flipX = pos.x > window.innerWidth - 300;

  bubbleEl.classList.toggle('flip-y', flipY);
  bubbleEl.classList.toggle('flip-x', flipX);
}
