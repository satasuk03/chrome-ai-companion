import { EMOTIONS } from './constants.js';
import { setEmotion } from './emotions.js';
import { hideBubble } from './bubble.js';

let chatPanel = null;
let chatMessages = null;
let chatInput = null;
let chatVisible = false;
let getPosition = () => ({ x: 0, y: 0 });

export function initChat(elements, deps) {
  chatPanel = elements.panel;
  chatMessages = elements.messages;
  chatInput = elements.input;
  getPosition = deps.getPosition;

  elements.closeBtn.addEventListener('click', closeChat);
  elements.sendBtn.addEventListener('click', handleSendMessage);

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
  if (!text) return;

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

  // Regular message
  addMessage(text, 'user');

  // Placeholder companion response
  setTimeout(() => {
    addMessage("I heard you! LLM integration coming soon.", 'companion');
  }, 500);
}
