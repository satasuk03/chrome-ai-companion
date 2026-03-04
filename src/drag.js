import { COMPANION_SIZE } from './constants.js';
import { savePosition } from './storage.js';
import { isBubbleVisible, updateBubblePosition } from './bubble.js';
import { isChatVisible, toggleChat, updateChatPosition } from './chat.js';

let container = null;
let characterImg = null;
let posX = 0;
let posY = 0;
let isDragging = false;
let hasDragged = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

export function initDrag(containerEl, imgEl, initialPos) {
  container = containerEl;
  characterImg = imgEl;
  posX = initialPos.x;
  posY = initialPos.y;

  characterImg.addEventListener('pointerdown', onPointerDown);
}

export function getPosition() {
  return { x: posX, y: posY };
}

export function setPosition(x, y) {
  posX = x;
  posY = y;
  container.style.transform = `translate(${posX}px, ${posY}px)`;
}

export function clampToViewport() {
  const maxX = window.innerWidth - COMPANION_SIZE;
  const maxY = window.innerHeight - COMPANION_SIZE;
  posX = Math.max(0, Math.min(posX, maxX));
  posY = Math.max(0, Math.min(posY, maxY));
  container.style.transform = `translate(${posX}px, ${posY}px)`;
}

function onPointerDown(e) {
  e.preventDefault();
  isDragging = true;
  hasDragged = false;

  const rect = container.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;

  characterImg.setPointerCapture(e.pointerId);
  characterImg.addEventListener('pointermove', onPointerMove);
  characterImg.addEventListener('pointerup', onPointerUp);
  characterImg.addEventListener('pointercancel', onPointerUp);
}

function onPointerMove(e) {
  if (!isDragging) return;
  hasDragged = true;

  let newX = e.clientX - dragOffsetX;
  let newY = e.clientY - dragOffsetY;

  const maxX = window.innerWidth - COMPANION_SIZE;
  const maxY = window.innerHeight - COMPANION_SIZE;
  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));

  posX = newX;
  posY = newY;
  container.style.transform = `translate(${posX}px, ${posY}px)`;

  if (isBubbleVisible()) updateBubblePosition();
  if (isChatVisible()) updateChatPosition();
}

function onPointerUp(e) {
  if (!isDragging) return;
  isDragging = false;

  characterImg.releasePointerCapture(e.pointerId);
  characterImg.removeEventListener('pointermove', onPointerMove);
  characterImg.removeEventListener('pointerup', onPointerUp);
  characterImg.removeEventListener('pointercancel', onPointerUp);

  savePosition(posX, posY);

  if (!hasDragged) {
    toggleChat();
  }
}
