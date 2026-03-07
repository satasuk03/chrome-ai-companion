<div align="center">
  <img src="assets/riko-sprites.gif" alt="Riko" width="160" />
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

## Install (TL;DR)

*REQUIRES: LLM API KEY PROVIDER

1. [Download the release](release/riko-chrome-companion.zip)
2. Unzip file
2. Go to `chrome://extensions` → enable **Developer mode**
3. Click **Load unpacked** → select the unzipped folder
4. Done! Riko appears on every page

## Features

- **Draggable companion** — drag Riko anywhere on the page, position persists across sites
- **Chat panel** — click Riko to open a retro-styled chat powered by OpenAI, Anthropic, or Gemini
- **Speech bubble** — typewriter animation with speaking sprite cycling
- **Chat commands** — `/summarize`, `/clear`, `/settings`, `/help`
- **Social Detox Assistant** — keep nagging you to take a break from social media.
- **Fully Customizable** — customize Riko's personality, app settings, and behavior to your liking.
- **Emotion system**  - express emotion based on response
- **Time Tracking** — see how long you spend on each site; pauses when Chrome loses focus or you go idle
- 🚧 **Ollama Local Model Support** - Incoming

<div align="center">
  <img src="demos/social-detox.webp" alt="Social Detox Assistant" width="300" />
</div>

## Build from Source

```bash
npm install && npm run build
```

1. Go to `chrome://extensions` → enable **Developer mode**
2. Click **Load unpacked** → select the project root
3. Open any website — Riko appears in the bottom-right corner

For development with auto-rebuild: `npm run dev`

To create a release zip: `npm run release`

## Chat Commands

| Command | Description |
|---|---|
| `/summarize` | Summarize the current webpage via LLM |
| `/clear` | Clear chat history and conversation context |
| `/settings` | Open extension settings |
| `/help` | List available commands |

## Supported LLM Providers

Configure via the extension settings page (right-click extension icon → Options):

| Provider | Default Model |
|---|---|
| OpenAI | `gpt-5-nano-2025-08-07` |
| Anthropic | `claude-sonnet-4-20250514` |
| Google Gemini | `gemini-3-flash-preview` |
| Ollama | 🚧 WORK IN PROGRESS 🚧 |

## Note

I'm working on porting this project into MacOS and Windows with Godot!