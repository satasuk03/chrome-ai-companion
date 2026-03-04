# Privacy Policy

**Chrome Companion** (Riko) is a browser extension that displays a pixel-art companion character on every webpage. This policy explains what data the extension accesses and how it is handled.

## Data Collection

Chrome Companion does **not** collect, store, or transmit any personal data. There are no analytics, tracking, or telemetry of any kind.

## Data Storage

The extension stores the following locally on your device using `chrome.storage.local`:

- **Companion position** — where you last dragged the character on screen
- **Settings** — your chosen LLM provider, model, API key, and system prompt

This data never leaves your browser and is not accessible to any external service.

## LLM API Communication

When you use the chat feature or `/summarize` command, the extension sends your messages (and page text for summarization) directly to the LLM provider you configured:

- **OpenAI** — `api.openai.com`
- **Anthropic** — `api.anthropic.com`
- **Google Gemini** — `generativelanguage.googleapis.com`

These requests are made using **your own API key**. The extension acts as a pass-through — no data is routed through any intermediary server. Conversation history is held in memory only and is cleared on page navigation.

Refer to each provider's privacy policy for how they handle API requests:
- [OpenAI Privacy Policy](https://openai.com/privacy)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- [Google Privacy Policy](https://policies.google.com/privacy)

## Host Permissions

The extension requires `<all_urls>` permission because the companion character is injected as a content script on every webpage. This is core to the extension's functionality — it does not read, modify, or exfiltrate page content unless you explicitly use the `/summarize` command.

## Third-Party Services

No third-party services are used beyond the LLM providers listed above, and only when you initiate a chat or command.

## Changes

If this policy is updated, changes will be reflected in this file in the project repository.

## Contact

For questions or concerns, open an issue on the [GitHub repository](https://github.com).
