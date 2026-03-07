import { PROVIDERS } from '../constants.js';
import { loadSettings } from '../settings.js';
import { chat } from './llm.js';
import { initTimeTracker } from './time-tracker.js';

initTimeTracker();

// ── Message listener (must be registered synchronously at top level) ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHAT_REQUEST') {
    handleChat(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // keep channel open for async response
  }

  if (message.type === 'OPEN_SETTINGS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'OPEN_HELP') {
    chrome.tabs.create({ url: chrome.runtime.getURL('options/help.html') });
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'TEST_CONNECTION') {
    handleTestConnection(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function handleChat({ messages }) {
  const settings = await loadSettings();

  if (!settings.apiKey) {
    throw new Error('API key not configured. Type /settings to open settings.');
  }

  const provider = settings.provider;
  const providerConfig = PROVIDERS[provider];
  if (!providerConfig) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const model = settings.model || providerConfig.defaultModel;
  const maxTokens = settings.maxTokens || 10240;
  const text = await chat(provider, settings.apiKey, model, messages, settings.systemPrompt, maxTokens);

  return { success: true, text };
}

async function handleTestConnection({ provider, apiKey, model }) {
  const providerConfig = PROVIDERS[provider];
  if (!providerConfig) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const testModel = model || providerConfig.defaultModel;
  const testMessages = [{ role: 'user', content: 'Say "Connection successful!" in one short sentence.' }];

  const text = await chat(provider, apiKey, testModel, testMessages, 'You are a test assistant.');
  return { success: true, text };
}
