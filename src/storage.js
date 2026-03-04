import { STORAGE_KEY, COMPANION_SIZE } from './constants.js';

export async function loadPosition() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const pos = result[STORAGE_KEY];
      if (pos && pos.x >= 0 && pos.y >= 0) {
        const x = Math.min(pos.x, window.innerWidth - COMPANION_SIZE);
        const y = Math.min(pos.y, window.innerHeight - COMPANION_SIZE);
        resolve({ x: Math.max(0, x), y: Math.max(0, y) });
      } else {
        resolve({
          x: window.innerWidth - COMPANION_SIZE - 20,
          y: window.innerHeight - COMPANION_SIZE - 20,
        });
      }
    });
  });
}

export function savePosition(x, y) {
  chrome.storage.local.set({ [STORAGE_KEY]: { x, y } });
}
