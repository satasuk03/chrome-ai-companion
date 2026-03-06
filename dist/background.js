(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

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

  // src/settings.js
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(SETTINGS_KEY, (result) => {
        resolve({ ...SETTINGS_DEFAULTS, ...result[SETTINGS_KEY] });
      });
    });
  }

  // src/background/providers/openai.js
  var openai_exports = {};
  __export(openai_exports, {
    chat: () => chat
  });
  var ENDPOINT = "https://api.openai.com/v1/chat/completions";
  async function chat(apiKey, model, messages, systemPrompt, maxTokens) {
    const body = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: maxTokens || 10240,
      temperature: 0.7
    };
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI API error: ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }

  // src/background/providers/anthropic.js
  var anthropic_exports = {};
  __export(anthropic_exports, {
    chat: () => chat2
  });
  var ENDPOINT2 = "https://api.anthropic.com/v1/messages";
  async function chat2(apiKey, model, messages, systemPrompt, maxTokens) {
    const body = {
      model,
      system: systemPrompt,
      messages,
      max_tokens: maxTokens || 10240,
      temperature: 0.7
    };
    const response = await fetch(ENDPOINT2, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Anthropic API error: ${response.status}`);
    }
    const data = await response.json();
    return data.content[0].text;
  }

  // src/background/providers/gemini.js
  var gemini_exports = {};
  __export(gemini_exports, {
    chat: () => chat3
  });
  var BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
  async function chat3(apiKey, model, messages, systemPrompt, maxTokens) {
    const endpoint = `${BASE_URL}/${model}:generateContent`;
    const contents = messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));
    const body = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens || 10240,
        temperature: 0.7
      }
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err.error?.message || `Gemini API error: ${response.status}`;
      throw new Error(msg);
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  // src/background/llm.js
  var adapters = { openai: openai_exports, anthropic: anthropic_exports, gemini: gemini_exports };
  async function chat4(provider, apiKey, model, messages, systemPrompt, maxTokens) {
    const adapter = adapters[provider];
    if (!adapter) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    return adapter.chat(apiKey, model, messages, systemPrompt, maxTokens);
  }

  // src/background/service-worker.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "CHAT_REQUEST") {
      handleChat(message).then(sendResponse).catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }
    if (message.type === "OPEN_SETTINGS") {
      chrome.runtime.openOptionsPage();
      sendResponse({ success: true });
      return false;
    }
    if (message.type === "OPEN_HELP") {
      chrome.tabs.create({ url: chrome.runtime.getURL("options/help.html") });
      sendResponse({ success: true });
      return false;
    }
    if (message.type === "TEST_CONNECTION") {
      handleTestConnection(message).then(sendResponse).catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }
  });
  async function handleChat({ messages }) {
    const settings = await loadSettings();
    if (!settings.apiKey) {
      throw new Error("API key not configured. Type /settings to open settings.");
    }
    const provider = settings.provider;
    const providerConfig = PROVIDERS[provider];
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    const model = settings.model || providerConfig.defaultModel;
    const maxTokens = settings.maxTokens || 10240;
    const text = await chat4(provider, settings.apiKey, model, messages, settings.systemPrompt, maxTokens);
    return { success: true, text };
  }
  async function handleTestConnection({ provider, apiKey, model }) {
    const providerConfig = PROVIDERS[provider];
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    const testModel = model || providerConfig.defaultModel;
    const testMessages = [{ role: "user", content: 'Say "Connection successful!" in one short sentence.' }];
    const text = await chat4(provider, apiKey, testModel, testMessages, "You are a test assistant.");
    return { success: true, text };
  }
})();
