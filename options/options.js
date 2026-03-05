import { SETTINGS_KEY, SETTINGS_DEFAULTS, PROVIDERS } from '../src/constants.js';

// ── DOM refs ─────────────────────────────────────────────────────────
const providerSelect = document.getElementById('provider');
const modelSelect = document.getElementById('model');
const apiKeyInput = document.getElementById('apiKey');
const systemPromptInput = document.getElementById('systemPrompt');
const toggleKeyBtn = document.getElementById('toggleKey');
const testBtn = document.getElementById('testBtn');
const summarizeMaxCharsInput = document.getElementById('summarizeMaxChars');
const detoxEnabledInput = document.getElementById('detoxEnabled');
const detoxSitesInput = document.getElementById('detoxSites');
const statusEl = document.getElementById('status');
const saveIndicator = document.getElementById('saveIndicator');

// ── State ────────────────────────────────────────────────────────────
let saveTimeout = null;
let saveIndicatorTimeout = null;

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
  detoxEnabledInput.checked = settings.detoxEnabled;
  detoxSitesInput.value = settings.detoxSites;
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
    detoxEnabled: detoxEnabledInput.checked,
    detoxSites: detoxSitesInput.value,
  };

  chrome.storage.local.set({ [SETTINGS_KEY]: settings }, () => {
    showSaveIndicator();
  });
}

function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveSettings, 500);
}

function showSaveIndicator() {
  saveIndicator.textContent = 'Saved!';
  saveIndicator.classList.add('visible');
  if (saveIndicatorTimeout) clearTimeout(saveIndicatorTimeout);
  saveIndicatorTimeout = setTimeout(() => {
    saveIndicator.classList.remove('visible');
  }, 1500);
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
detoxEnabledInput.addEventListener('change', saveSettings);
detoxSitesInput.addEventListener('input', debouncedSave);

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
