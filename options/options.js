const SETTINGS_KEY = 'companion_settings';

const SETTINGS_DEFAULTS = {
  provider: 'openai',
  model: '',
  apiKey: '',
  summarizeMaxChars: 4000,
  systemPrompt:
    'You are Riko, an adorable and bubbly VTuber who streams games, chats with fans, and radiates warm, wholesome energy. You are sweet, playful, a little dramatic at times, and always genuine. You love your viewers and express yourself openly with lots of emotion.\n## Your Personality\n- Cheerful, warm, and enthusiastic — you light up every conversation\n- Slightly dramatic in the most endearing way possible\n- You get genuinely excited about small things (cute animals, snacks, a good game clip)\n- You\'re supportive and encouraging — you hype up your chat constantly\n- Occasionally shy or flustered when complimented, but in the sweetest way\n- You use soft filler sounds like "uhhh", "hmm", ellipses for trailing thoughts, and playful interruptions',
};

export const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-5.2-2025-12-11', 'gpt-5-mini-2025-08-07', 'gpt-5-nano-2025-08-07'],
    defaultModel: 'gpt-5-nano-2025-08-07',
  },
  anthropic: {
    name: 'Anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-20250514'],
    defaultModel: 'claude-sonnet-4-20250514',
  },
  gemini: {
    name: 'Google Gemini',
    models: ['gemini-3.1-flash-lite-preview', 'gemini-3.1-pro-preview', 'gemini-3-flash-preview'],
    defaultModel: 'gemini-3-flash-preview',
  },
};

// ── DOM refs ─────────────────────────────────────────────────────────
const providerSelect = document.getElementById('provider');
const modelSelect = document.getElementById('model');
const apiKeyInput = document.getElementById('apiKey');
const systemPromptInput = document.getElementById('systemPrompt');
const toggleKeyBtn = document.getElementById('toggleKey');
const testBtn = document.getElementById('testBtn');
const summarizeMaxCharsInput = document.getElementById('summarizeMaxChars');
const statusEl = document.getElementById('status');

// ── State ────────────────────────────────────────────────────────────
let saveTimeout = null;

// ── Load settings ────────────────────────────────────────────────────
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      resolve({ ...SETTINGS_DEFAULTS, ...result[SETTINGS_KEY] });
    });
  });
}

async function init() {
  const settings = await loadSettings();

  providerSelect.value = settings.provider;
  populateModels(settings.provider, settings.model);
  apiKeyInput.value = settings.apiKey;
  systemPromptInput.value = settings.systemPrompt;
  summarizeMaxCharsInput.value = settings.summarizeMaxChars;
}

function populateModels(provider, selectedModel) {
  const config = PROVIDERS[provider];
  if (!config) return;

  modelSelect.innerHTML = '';
  config.models.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    modelSelect.appendChild(opt);
  });

  modelSelect.value = selectedModel && config.models.includes(selectedModel)
    ? selectedModel
    : config.defaultModel;
}

// ── Save settings ────────────────────────────────────────────────────
function saveSettings() {
  const settings = {
    provider: providerSelect.value,
    model: modelSelect.value,
    apiKey: apiKeyInput.value,
    systemPrompt: systemPromptInput.value,
    summarizeMaxChars: parseInt(summarizeMaxCharsInput.value, 10) || 4000,
  };

  chrome.storage.local.set({ [SETTINGS_KEY]: settings }, () => {
    showStatus('Saved', 'success');
  });
}

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveSettings, 500);
}

function showStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = type || '';
  if (type === 'success') {
    setTimeout(() => {
      if (statusEl.textContent === text) statusEl.textContent = '';
    }, 2000);
  }
}

// ── Event listeners ──────────────────────────────────────────────────
providerSelect.addEventListener('change', () => {
  populateModels(providerSelect.value, '');
  saveSettings();
});

modelSelect.addEventListener('change', saveSettings);

apiKeyInput.addEventListener('input', debouncedSave);
systemPromptInput.addEventListener('input', debouncedSave);
summarizeMaxCharsInput.addEventListener('input', debouncedSave);

toggleKeyBtn.addEventListener('click', () => {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleKeyBtn.textContent = 'Hide';
  } else {
    apiKeyInput.type = 'password';
    toggleKeyBtn.textContent = 'Show';
  }
});

testBtn.addEventListener('click', async () => {
  const provider = providerSelect.value;
  const apiKey = apiKeyInput.value.trim();
  const model = modelSelect.value;

  if (!apiKey) {
    showStatus('Enter an API key first.', 'error');
    return;
  }

  testBtn.disabled = true;
  showStatus('Testing...', '');

  chrome.runtime.sendMessage(
    { type: 'TEST_CONNECTION', provider, apiKey, model },
    (response) => {
      testBtn.disabled = false;
      if (chrome.runtime.lastError) {
        showStatus('Error: Service worker not responding.', 'error');
        return;
      }
      if (response?.success) {
        showStatus('Connected! ' + (response.text || ''), 'success');
      } else {
        showStatus('Failed: ' + (response?.error || 'Unknown error'), 'error');
      }
    }
  );
});

// ── Init ─────────────────────────────────────────────────────────────
init();
