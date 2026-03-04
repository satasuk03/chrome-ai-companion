import { EMOTIONS } from './constants.js';
import { SHADOW_CSS } from './styles.js';
import { loadPosition } from './storage.js';
import { initEmotions, preloadSprites } from './emotions.js';
import { initBubble, setBubbleTextAnimated } from './bubble.js';
import { initChat, isChatVisible } from './chat.js';
import { initDrag, getPosition, setPosition, clampToViewport } from './drag.js';
import { attachMessageListeners } from './messages.js';

(function () {
  // Guard against double-injection
  if (document.getElementById('chrome-companion-host')) return;

  async function initCompanion(shadow) {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = SHADOW_CSS;
    shadow.appendChild(style);

    // Build DOM
    const container = document.createElement('div');
    container.className = 'companion-container';

    // Speech bubble
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'bubble';

    const bubbleContentEl = document.createElement('div');
    bubbleContentEl.className = 'bubble-content';

    const bubbleTailEl = document.createElement('div');
    bubbleTailEl.className = 'bubble-tail';

    bubbleEl.appendChild(bubbleContentEl);
    bubbleEl.appendChild(bubbleTailEl);

    // Chat panel
    const chatPanelEl = document.createElement('div');
    chatPanelEl.className = 'chat-panel';

    const chatHeader = document.createElement('div');
    chatHeader.className = 'chat-header';

    const chatTitle = document.createElement('span');
    chatTitle.className = 'chat-title';
    chatTitle.textContent = 'Chat';

    const chatCloseBtn = document.createElement('button');
    chatCloseBtn.className = 'chat-close';
    chatCloseBtn.textContent = 'X';

    chatHeader.appendChild(chatTitle);
    chatHeader.appendChild(chatCloseBtn);

    const chatMessagesEl = document.createElement('div');
    chatMessagesEl.className = 'chat-messages';

    const chatInputArea = document.createElement('div');
    chatInputArea.className = 'chat-input-area';

    const chatInputEl = document.createElement('input');
    chatInputEl.className = 'chat-input';
    chatInputEl.type = 'text';
    chatInputEl.placeholder = 'Type a message...';

    const chatSendBtn = document.createElement('button');
    chatSendBtn.className = 'chat-send';
    chatSendBtn.textContent = 'Send';

    chatInputArea.appendChild(chatInputEl);
    chatInputArea.appendChild(chatSendBtn);

    chatPanelEl.appendChild(chatHeader);
    chatPanelEl.appendChild(chatMessagesEl);
    chatPanelEl.appendChild(chatInputArea);

    // Character image
    const characterImg = document.createElement('img');
    characterImg.className = 'character';
    characterImg.src = chrome.runtime.getURL(EMOTIONS.neutral);
    characterImg.alt = 'Companion';
    characterImg.draggable = false;

    // Assemble
    container.appendChild(bubbleEl);
    container.appendChild(chatPanelEl);
    container.appendChild(characterImg);
    shadow.appendChild(container);

    // Load position
    const pos = await loadPosition();

    // Initialize modules
    initEmotions(characterImg);

    initBubble(
      { bubble: bubbleEl, bubbleContent: bubbleContentEl },
      { isChatVisible, getPosition }
    );

    initChat(
      {
        panel: chatPanelEl,
        messages: chatMessagesEl,
        input: chatInputEl,
        closeBtn: chatCloseBtn,
        sendBtn: chatSendBtn,
      },
      { getPosition }
    );

    initDrag(container, characterImg, pos);
    setPosition(pos.x, pos.y);

    // Preload sprites
    preloadSprites();

    // External message listeners
    attachMessageListeners();

    // Viewport resize handler
    window.addEventListener('resize', clampToViewport);

    // Welcome bubble
    setTimeout(() => {
      setBubbleTextAnimated('Hello! Click me to chat!');
    }, 500);
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────
  const host = document.createElement('div');
  host.id = 'chrome-companion-host';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  // SPA resilience
  const observer = new MutationObserver(() => {
    if (!document.getElementById('chrome-companion-host')) {
      document.body.appendChild(host);
    }
  });
  observer.observe(document.body, { childList: true });

  initCompanion(shadow);
})();
