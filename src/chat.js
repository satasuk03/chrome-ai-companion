import { EMOTIONS } from './constants.js';
import { startSpeakingAnim, stopSpeakingAnim } from './emotions.js';
import { hideBubble } from './bubble.js';
import { loadSettings } from './settings.js';
import { initAutocomplete } from './autocomplete.js';
import { parseEmote } from './emote-parser.js';

let chatPanel = null;
let chatMessages = null;
let chatInput = null;
let chatVisible = false;
let getPosition = () => ({ x: 0, y: 0 });
let autocomplete = null;

// Conversation history for LLM context
let conversationHistory = [];
let isWaitingForResponse = false;
let activeChatTypewriterCancel = null;

function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return '<1m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

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

  // Autocomplete for / commands
  const inputArea = chatInput.closest('.chat-input-area');
  autocomplete = initAutocomplete(chatInput, inputArea, COMMANDS);

  chatInput.addEventListener('input', () => autocomplete.update());
  chatInput.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (autocomplete.handleKey(e)) return;
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

function addMessageAnimated(text, sender, speed, emotion) {
  speed = speed || 30;
  const msg = document.createElement('div');
  msg.className = 'chat-msg ' + sender;
  msg.textContent = '';
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  startSpeakingAnim(emotion);
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
            const parsed = parseEmote(response.text);
            conversationHistory.push({ role: 'assistant', content: parsed.text });
            addMessageAnimated(parsed.text, 'companion', undefined, parsed.emotion);
          } else {
            addMessage(`Error: ${response?.error || 'No response from LLM.'}`, 'system');
          }
        }
      );
    },
  },
  '/stats': {
    usage: '/stats',
    description: 'Show your top browsing stats (roasted by Riko if LLM is connected)',
    async handler() {
      addTypingIndicator();
      isWaitingForResponse = true;
      chatInput.disabled = true;

      chrome.runtime.sendMessage({ type: 'GET_TIME_TRACKING_DATA' }, async (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          removeTypingIndicator();
          isWaitingForResponse = false;
          chatInput.disabled = false;
          addMessage('Could not load time tracking data.', 'system');
          return;
        }

        const data = response.data;
        const entries = Object.entries(data).filter(([d]) => d && d !== 'null').sort((a, b) => b[1] - a[1]);

        if (entries.length === 0) {
          removeTypingIndicator();
          isWaitingForResponse = false;
          chatInput.disabled = false;
          addMessage('No browsing data yet. Keep browsing!', 'system');
          return;
        }

        removeTypingIndicator();

        // Always show top 5 stats with percentages
        const top5 = entries.slice(0, 5);
        const totalMs = top5.reduce((sum, [, ms]) => sum + ms, 0);
        addMessage("--Your Internet Stats--")
        for (const [domain, ms] of top5) {
          const pct = Math.round((ms / totalMs) * 100);
          addMessage(`${domain} ${pct}% (${formatDuration(ms)})`);
        }

        // If LLM is available, send top 10 for roasting
        const settings = await loadSettings();
        if (!settings.apiKey) {
          isWaitingForResponse = false;
          chatInput.disabled = false;
          return;
        }

        addTypingIndicator();

        const top10 = entries.slice(0, 10);
        const statsText = top10.map(([domain, ms]) => {
          const mins = Math.round(ms / 60000);
          return `${domain} — ${mins < 1 ? '<1' : mins} min`;
        }).join('\n');

        const prompt = `This is time I spent on websites sorted by time\nFeel free to roast me\n${statsText}`;
        conversationHistory.push({ role: 'user', content: prompt });

        chrome.runtime.sendMessage(
          { type: 'CHAT_REQUEST', messages: getConversationHistory() },
          (resp) => {
            removeTypingIndicator();
            isWaitingForResponse = false;
            chatInput.disabled = false;
            chatInput.focus();

            if (chrome.runtime.lastError) {
              addMessage('Error: Could not reach companion service.', 'system');
              return;
            }
            if (resp?.success) {
              const parsed = parseEmote(resp.text);
              conversationHistory.push({ role: 'assistant', content: parsed.text });
              addMessageAnimated(parsed.text, 'companion', undefined, parsed.emotion);
            } else {
              addMessage(`Error: ${resp?.error || 'No response from LLM.'}`, 'system');
            }
          }
        );
      });
    },
  },
  '/help': {
    usage: '/help',
    description: 'Show available commands',
    handler() {
      Object.entries(COMMANDS)
        .forEach(([, info]) => addMessage(`${info.usage} — ${info.description}`, 'system'));

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
        const parsed = parseEmote(response.text);
        conversationHistory.push({ role: 'assistant', content: parsed.text });
        addMessageAnimated(parsed.text, 'companion', undefined, parsed.emotion);
      } else {
        addMessage(`Error: ${response?.error || 'No response from LLM.'}`, 'system');
      }
    }
  );
}
