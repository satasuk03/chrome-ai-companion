import { SETTINGS_KEY, SETTINGS_DEFAULTS, PROVIDERS } from '../src/constants.js';

// ── DOM refs ─────────────────────────────────────────────────────────
const providerSelect = document.getElementById('provider');
const modelSelect = document.getElementById('model');
const apiKeyInput = document.getElementById('apiKey');
const systemPromptInput = document.getElementById('systemPrompt');
const toggleKeyBtn = document.getElementById('toggleKey');
const testBtn = document.getElementById('testBtn');
const maxTokensInput = document.getElementById('maxTokens');
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
  maxTokensInput.value = settings.maxTokens;
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
    maxTokens: parseInt(maxTokensInput.value, 10) || 10240,
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
maxTokensInput.addEventListener('input', debouncedSave);
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

// ── Time Tracking ───────────────────────────────────────────────────
const timeStatsEl = document.getElementById('timeStats');
const refreshTimeBtn = document.getElementById('refreshTimeBtn');
const clearTimeBtn = document.getElementById('clearTimeBtn');

function formatDuration(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return '<1m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function loadTimeData() {
  chrome.runtime.sendMessage({ type: 'GET_TIME_TRACKING_DATA' }, (response) => {
    if (chrome.runtime.lastError || !response?.success) {
      timeStatsEl.textContent = 'Could not load data.';
      return;
    }

    const data = response.data;
    const entries = Object.entries(data).filter(([d]) => d && d !== 'null').sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      timeStatsEl.textContent = 'No data yet. Browse some sites!';
      return;
    }

    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
    const header = table.insertRow();
    header.innerHTML = '<th style="text-align:left;padding:4px 8px;border-bottom:2px solid #d4a373;">Site</th><th style="text-align:right;padding:4px 8px;border-bottom:2px solid #d4a373;">Time</th>';

    for (const [domain, ms] of entries) {
      const row = table.insertRow();
      row.innerHTML = `<td style="padding:4px 8px;border-bottom:1px solid #e8d5b7;">${domain}</td><td style="text-align:right;padding:4px 8px;border-bottom:1px solid #e8d5b7;">${formatDuration(ms)}</td>`;
    }

    timeStatsEl.innerHTML = '';
    timeStatsEl.appendChild(table);
  });
}

refreshTimeBtn.addEventListener('click', loadTimeData);

clearTimeBtn.addEventListener('click', () => {
  if (!confirm('Clear all time tracking data?')) return;
  chrome.runtime.sendMessage({ type: 'CLEAR_TIME_TRACKING_DATA' }, () => {
    loadTimeData();
  });
});

// ── Init ─────────────────────────────────────────────────────────────
init();
loadTimeData();
