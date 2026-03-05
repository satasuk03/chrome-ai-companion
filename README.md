<div align="center">
  <img src="assets/idle.webp" alt="Riko" width="160" />
  <h1>Riko Chrome Companion</h1>
  <p><strong>Every tab is better with company.</strong></p>
  <p>Meet Riko — your Chrome bestie!</p>

  ![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue)
  ![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Pending_Review-orange)
</div>

## Demo

<div align="center">
  <img src="demos/demo.gif" alt="Chrome Companion demo" width="600" />
</div>

## Features

- **Draggable companion** — drag Riko anywhere on the page, position persists across sites
- **Chat panel** — click Riko to open a retro-styled chat powered by OpenAI, Anthropic, or Gemini
- **Speech bubble** — typewriter animation with speaking sprite cycling
- **Chat commands** — `/summarize`, `/set-emotion`, `/clear`, `/settings`, `/help`
- **Social Detox Assistant** — keep nagging you to take a break from social media.
- **Fully Customizable** — customize Riko's personality, app settings, and behavior to your liking.
- 🚧 **Emotion system** 
- 🚧 **Customizable Companion** - bring your own appearance!


<div align="center">
  <img src="demos/social-detox.webp" alt="Social Detox Assistant" width="300" />
</div>

## Getting Started

```bash
npm install && npm run build
```

1. Go to `chrome://extensions` → enable **Developer mode**
2. Click **Load unpacked** → select the project root
3. Open any website — Riko appears in the bottom-right corner

For development with auto-rebuild: `npm run dev`

## Chat Commands

| Command | Description |
|---|---|
| `/summarize` | Summarize the current webpage via LLM |
| `/set-emotion <name>` | Change sprite (`neutral`, `happy`, `blush`, `angry`) |
| `/clear` | Clear chat history and conversation context |
| `/settings` | Open extension settings |
| `/help` | List available commands |

## LLM Providers

Configure via the extension settings page (right-click extension icon → Options):

| Provider | Default Model |
|---|---|
| OpenAI | `gpt-5-nano-2025-08-07` |
| Anthropic | `claude-sonnet-4-20250514` |
| Google Gemini | `gemini-3-flash-preview` |

## Tech Stack

- **Manifest V3** — content scripts, service worker, storage API
- **Shadow DOM (closed)** — full CSS isolation
- **Pointer Events** — drag with `setPointerCapture`
- **esbuild** — sub-10ms bundling, zero config
- **No frameworks** — plain JS, no runtime dependencies
