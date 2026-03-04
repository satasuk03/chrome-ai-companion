import { BUBBLE_TIMEOUT } from './constants.js';

let bubbleEl = null;
let bubbleContentEl = null;
let bubbleVisible = false;
let bubbleTimeout = null;
let typewriterCancel = null;
let isChatVisible = () => false;
let getPosition = () => ({ x: 0, y: 0 });

export function initBubble(elements, deps) {
  bubbleEl = elements.bubble;
  bubbleContentEl = elements.bubbleContent;
  isChatVisible = deps.isChatVisible;
  getPosition = deps.getPosition;
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
  }
}

export function isBubbleVisible() {
  return bubbleVisible;
}

export function setBubbleText(text) {
  if (typewriterCancel) {
    typewriterCancel();
    typewriterCancel = null;
  }
  bubbleContentEl.textContent = text;
  showBubble();
  scheduleBubbleHide();
}

export function setBubbleTextAnimated(text, speed) {
  if (typewriterCancel) {
    typewriterCancel();
    typewriterCancel = null;
  }
  speed = speed || 30;
  bubbleContentEl.textContent = '';
  showBubble();

  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      bubbleContentEl.textContent += text[i];
      i++;
    } else {
      clearInterval(interval);
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
