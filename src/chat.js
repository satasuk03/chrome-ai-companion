import { EMOTIONS } from './constants.js';
import { setEmotion, startSpeakingAnim, stopSpeakingAnim } from './emotions.js';
import { hideBubble } from './bubble.js';
import { loadSettings } from './settings.js';

let chatPanel = null;
let chatMessages = null;
let chatInput = null;
let chatVisible = false;
let getPosition = () => ({ x: 0, y: 0 });

// Conversation history for LLM context
let conversationHistory = [];
let isWaitingForResponse = false;
let activeChatTypewriterCancel = null;

export function initChat(elements, deps) {
  chatPanel = elements.panel;
  chatMessages = elements.messages;
  chatInput = elements.input;
  getPosition = deps.getPosition;

  elements.closeBtn.addEventListener('click', closeChat);
  elements.sendBtn.addEventListener('click', handleSendMessage);

  elements.settingsBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
  });

  elements.helpBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_HELP' });
  });

  chatInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') handleSendMessage();
  });
  chatInput.addEventListener('keyup', (e) => e.stopPropagation());
  chatInput.addEventListener('keypress', (e) => e.stopPropagation());
}

export function isChatVisible() {
  return chatVisible;
}

export function toggleChat() {
  if (chatVisible) {
    closeChat();
  } else {
    openChat();
  }
}

export function openChat() {
  chatVisible = true;
  hideBubble();
  updateChatPosition();
  chatPanel.classList.add('visible');
  chatInput.focus();
}

export function closeChat() {
  chatVisible = false;
  chatPanel.classList.remove('visible');
  if (activeChatTypewriterCancel) {
    activeChatTypewriterCancel();
  }
}

export function updateChatPosition() {
  const pos = getPosition();
  const flipX = pos.x < 340;
  chatPanel.classList.toggle('flip-x', flipX);
}

function addMessage(text, sender) {
  const msg = document.createElement('div');
  msg.className = 'chat-msg ' + sender;
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msg;
}

function addMessageAnimated(text, sender, speed) {
  speed = speed || 30;
  const msg = document.createElement('div');
  msg.className = 'chat-msg ' + sender;
  msg.textContent = '';
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  startSpeakingAnim();
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      msg.textContent += text[i];
      i++;
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
      clearInterval(interval);
      stopSpeakingAnim();
      activeChatTypewriterCancel = null;
    }
  }, speed);

  activeChatTypewriterCancel = () => {
    clearInterval(interval);
    msg.textContent = text; // show full text on cancel
    stopSpeakingAnim();
    activeChatTypewriterCancel = null;
  };

  return msg;
}

function addTypingIndicator() {
  const msg = document.createElement('div');
  msg.className = 'chat-msg companion typing';
  msg.textContent = '...';
  msg.dataset.typing = 'true';
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return msg;
}

function removeTypingIndicator() {
  const typing = chatMessages.querySelector('[data-typing="true"]');
  if (typing) typing.remove();
}

function getConversationHistory() {
  return [...conversationHistory];
}

// ── Chat commands ────────────────────────────────────────────────────
const COMMANDS = {
  '/set-emotion': {
    usage: '/set-emotion <neutral|happy|blush|angry>',
    description: 'Change the companion emotion',
    handler(args) {
      const emotion = args[0];
      if (!emotion || !EMOTIONS[emotion]) {
        const available = Object.keys(EMOTIONS).join(', ');
        addMessage(`Unknown emotion. Available: ${available}`, 'system');
        return;
      }
      setEmotion(emotion);
      addMessage(`Emotion set to ${emotion}`, 'system');
    },
  },
  '/clear': {
    usage: '/clear',
    description: 'Clear chat history and conversation context',
    handler() {
      conversationHistory = [];
      chatMessages.innerHTML = '';
      addMessage('Chat cleared.', 'system');
    },
  },
  '/settings': {
    usage: '/settings',
    description: 'Open companion settings',
    handler() {
      chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
      addMessage('Opening settings...', 'system');
    },
  },
  '/summarize': {
    usage: '/summarize',
    description: 'Summarize the current webpage',
    async handler() {
      const settings = await loadSettings();
      const maxChars = settings.summarizeMaxChars || 4000;
      const pageText = document.body.innerText.slice(0, maxChars);
      const prompt = `Summarize this webpage in 2-3 short sentences. Be concise.\n\n${pageText}`;

      conversationHistory.push({ role: 'user', content: prompt });
      isWaitingForResponse = true;
      chatInput.disabled = true;
      addTypingIndicator();

      chrome.runtime.sendMessage(
        { type: 'CHAT_REQUEST', messages: getConversationHistory() },
        (response) => {
          removeTypingIndicator();
          isWaitingForResponse = false;
          chatInput.disabled = false;
          chatInput.focus();

          if (chrome.runtime.lastError) {
            addMessage('Error: Could not reach companion service.', 'system');
            return;
          }
          if (response?.success) {
            conversationHistory.push({ role: 'assistant', content: response.text });
            addMessageAnimated(response.text, 'companion');
          } else {
            addMessage(`Error: ${response?.error || 'No response from LLM.'}`, 'system');
          }
        }
      );
    },
  },
  '/help': {
    usage: '/help',
    description: 'Show available commands',
    handler() {
      const lines = Object.entries(COMMANDS)
        .map(([, info]) => `${info.usage} — ${info.description}`)
        .join('\n');
      addMessage(lines, 'system');
    },
  },
};

function handleSendMessage() {
  const text = chatInput.value.trim();
  if (!text || isWaitingForResponse) return;

  chatInput.value = '';

  // Check for commands
  if (text.startsWith('/')) {
    const parts = text.split(/\s+/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    addMessage(text, 'user');

    const cmd = COMMANDS[cmdName];
    if (cmd) {
      cmd.handler(args);
    } else {
      addMessage(`Unknown command: ${cmdName}. Type /help for available commands.`, 'system');
    }
    return;
  }

  // Regular message — send to LLM
  addMessage(text, 'user');
  conversationHistory.push({ role: 'user', content: text });

  isWaitingForResponse = true;
  chatInput.disabled = true;
  addTypingIndicator();

  chrome.runtime.sendMessage(
    { type: 'CHAT_REQUEST', messages: getConversationHistory() },
    (response) => {
      removeTypingIndicator();
      isWaitingForResponse = false;
      chatInput.disabled = false;
      chatInput.focus();

      if (chrome.runtime.lastError) {
        addMessage('Error: Could not reach companion service.', 'system');
        return;
      }

      if (response?.success) {
        conversationHistory.push({ role: 'assistant', content: response.text });
        addMessage(response.text, 'companion');
      } else {
        addMessage(`Error: ${response?.error || 'No response from LLM.'}`, 'system');
      }
    }
  );
}
