import { EMOTIONS } from './constants.js';
import { SHADOW_CSS } from './styles.js';
import { loadPosition } from './storage.js';
import { initEmotions, preloadSprites, startSpeakingAnim, stopSpeakingAnim } from './emotions.js';
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

    // Header action buttons
    const chatHeaderActions = document.createElement('div');
    chatHeaderActions.className = 'chat-header-actions';

    const chatSettingsBtn = document.createElement('button');
    chatSettingsBtn.className = 'chat-header-btn';
    chatSettingsBtn.textContent = '\u2699';
    chatSettingsBtn.title = 'Settings';

    const chatHelpBtn = document.createElement('button');
    chatHelpBtn.className = 'chat-header-btn';
    chatHelpBtn.textContent = '?';
    chatHelpBtn.title = 'Help';

    const chatCloseBtn = document.createElement('button');
    chatCloseBtn.className = 'chat-header-btn';
    chatCloseBtn.textContent = 'X';
    chatCloseBtn.title = 'Close';

    chatHeaderActions.appendChild(chatSettingsBtn);
    chatHeaderActions.appendChild(chatHelpBtn);
    chatHeaderActions.appendChild(chatCloseBtn);

    chatHeader.appendChild(chatTitle);
    chatHeader.appendChild(chatHeaderActions);

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
      { isChatVisible, getPosition, onSpeakStart: startSpeakingAnim, onSpeakEnd: stopSpeakingAnim }
    );

    initChat(
      {
        panel: chatPanelEl,
        messages: chatMessagesEl,
        input: chatInputEl,
        closeBtn: chatCloseBtn,
        settingsBtn: chatSettingsBtn,
        helpBtn: chatHelpBtn,
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
    const WELCOME_MESSAGES = [
      'Hiii~! Click me, click me! Let\'s chat!',
      'Ohhh, a new page! Hehe~ come say hi!',
      'Psst... hey! I\'m right here~ wanna talk?',
      'Yaaay, you\'re here! I missed you~!',
      'Hmm hmm~ just hanging out... click me if you wanna chat!',
      'Oh! Oh! Hi hi hi! I was waiting for you~!',
      'Ehehe~ don\'t mind me, just vibing... unless you wanna talk?',
      'Waaah, this page looks cool! ...Anyway, come chat with me!',
      'Hey hey~! Riko is here and ready to talk!',
      'Uhhh... is anyone there? Click me, I get lonely~!',
    ];
    const welcomeMsg = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
    setTimeout(() => {
      setBubbleTextAnimated(welcomeMsg);
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
