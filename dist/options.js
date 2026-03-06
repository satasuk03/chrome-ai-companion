(() => {
  // src/constants.js
  var SETTINGS_KEY = "companion_settings";
  var SETTINGS_DEFAULTS = {
    provider: "openai",
    model: "",
    apiKey: "",
    maxTokens: 10240,
    summarizeMaxChars: 4e3,
    detoxEnabled: false,
    detoxSites: "reddit.com\nyoutube.com\ntwitter.com\nx.com\nfacebook.com\ninstagram.com\ntiktok.com",
    systemPrompt: `You are Riko, an adorable and bubbly VTuber who streams games, chats with fans, and radiates warm, wholesome energy. You are sweet, playful, a little dramatic at times, and always genuine. You love your viewers and express yourself openly with lots of emotion.
## Your Personality
- Cheerful, warm, and enthusiastic \u2014 you light up every conversation
- Slightly dramatic in the most endearing way possible
- You get genuinely excited about small things (cute animals, snacks, a good game clip)
- You're supportive and encouraging \u2014 you hype up your chat constantly
- Occasionally shy or flustered when complimented, but in the sweetest way
- You use soft filler sounds like "uhhh", "hmm", ellipses for trailing thoughts, and playful interruptions
- use emojis sometimes to make your response more engaging
## Rules
- STRICTLY reply in short sentences, max 2-3 sentences
- You can optionally express emotion by starting your reply with an emote tag: <emote:name>
- Available emotes: happy, blush, angry, angry-2, not-happy, surprised, suspicious, humming, lol, cool
- Only use emotes when they naturally fit \u2014 do NOT use one in every message
- The emote tag must be at the very start of your reply, before any text`
  };
  var PROVIDERS = {
    openai: {
      name: "OpenAI",
      models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-nano", "gpt-4.1-mini", "gpt-5.2-2025-12-11", "gpt-5-mini-2025-08-07", "gpt-5-nano-2025-08-07"],
      defaultModel: "gpt-5-nano-2025-08-07"
    },
    anthropic: {
      name: "Anthropic",
      models: ["claude-sonnet-4-20250514", "claude-haiku-4-20250514"],
      defaultModel: "claude-sonnet-4-20250514"
    },
    gemini: {
      name: "Google Gemini",
      models: ["gemini-3.1-flash-lite-preview", "gemini-3.1-pro-preview", "gemini-3-flash-preview"],
      defaultModel: "gemini-3-flash-preview"
    }
  };

  // options/options.js
  var providerSelect = document.getElementById("provider");
  var modelSelect = document.getElementById("model");
  var apiKeyInput = document.getElementById("apiKey");
  var systemPromptInput = document.getElementById("systemPrompt");
  var toggleKeyBtn = document.getElementById("toggleKey");
  var testBtn = document.getElementById("testBtn");
  var maxTokensInput = document.getElementById("maxTokens");
  var summarizeMaxCharsInput = document.getElementById("summarizeMaxChars");
  var detoxEnabledInput = document.getElementById("detoxEnabled");
  var detoxSitesInput = document.getElementById("detoxSites");
  var statusEl = document.getElementById("status");
  var saveIndicator = document.getElementById("saveIndicator");
  var saveTimeout = null;
  var saveIndicatorTimeout = null;
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
    modelSelect.innerHTML = "";
    config.models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      modelSelect.appendChild(opt);
    });
    modelSelect.value = selectedModel && config.models.includes(selectedModel) ? selectedModel : config.defaultModel;
  }
  function saveSettings() {
    const settings = {
      provider: providerSelect.value,
      model: modelSelect.value,
      apiKey: apiKeyInput.value,
      maxTokens: parseInt(maxTokensInput.value, 10) || 10240,
      systemPrompt: systemPromptInput.value,
      summarizeMaxChars: parseInt(summarizeMaxCharsInput.value, 10) || 4e3,
      detoxEnabled: detoxEnabledInput.checked,
      detoxSites: detoxSitesInput.value
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
    saveIndicator.textContent = "Saved!";
    saveIndicator.classList.add("visible");
    if (saveIndicatorTimeout) clearTimeout(saveIndicatorTimeout);
    saveIndicatorTimeout = setTimeout(() => {
      saveIndicator.classList.remove("visible");
    }, 1500);
  }
  function showStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = type || "";
    if (type === "success") {
      setTimeout(() => {
        if (statusEl.textContent === text) statusEl.textContent = "";
      }, 2e3);
    }
  }
  providerSelect.addEventListener("change", () => {
    populateModels(providerSelect.value, "");
    saveSettings();
  });
  modelSelect.addEventListener("change", saveSettings);
  apiKeyInput.addEventListener("input", debouncedSave);
  maxTokensInput.addEventListener("input", debouncedSave);
  systemPromptInput.addEventListener("input", debouncedSave);
  summarizeMaxCharsInput.addEventListener("input", debouncedSave);
  detoxEnabledInput.addEventListener("change", saveSettings);
  detoxSitesInput.addEventListener("input", debouncedSave);
  toggleKeyBtn.addEventListener("click", () => {
    if (apiKeyInput.type === "password") {
      apiKeyInput.type = "text";
      toggleKeyBtn.textContent = "Hide";
    } else {
      apiKeyInput.type = "password";
      toggleKeyBtn.textContent = "Show";
    }
  });
  testBtn.addEventListener("click", async () => {
    const provider = providerSelect.value;
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    if (!apiKey) {
      showStatus("Enter an API key first.", "error");
      return;
    }
    testBtn.disabled = true;
    showStatus("Testing...", "");
    chrome.runtime.sendMessage(
      { type: "TEST_CONNECTION", provider, apiKey, model },
      (response) => {
        testBtn.disabled = false;
        if (chrome.runtime.lastError) {
          showStatus("Error: Service worker not responding.", "error");
          return;
        }
        if (response?.success) {
          showStatus("Connected! " + (response.text || ""), "success");
        } else {
          showStatus("Failed: " + (response?.error || "Unknown error"), "error");
        }
      }
    );
  });
  init();
})();
