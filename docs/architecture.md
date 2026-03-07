# Architecture Overview

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Browser (every webpage)                                │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Shadow DOM (closed)                              │  │
│  │                                                   │  │
│  │  ┌───────────┐  ┌──────────┐  ┌────────────────┐  │  │
│  │  │ Companion │  │  Speech  │  │   Chat Panel   │  │  │
│  │  │  Sprite   │  │  Bubble  │  │                │  │  │
│  │  │           │  │          │  │  Messages      │  │  │
│  │  │  drag.js  │  │ bubble.js│  │  Input + Send  │  │  │
│  │  │  emotions │  │          │  │  Commands      │  │  │
│  │  └───────────┘  └──────────┘  └────────────────┘  │  │
│  │                                                   │  │
│  │  styles.js (CSS)    storage.js (position)         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  content.js (entry point, bootstraps everything)        │
│  messages.js (chrome.runtime.onMessage listener)        │
└────────────────────┬────────────────────────────────────┘
                     │ chrome.runtime.sendMessage
                     │
┌────────────────────▼────────────────────────────────────┐
│  Service Worker (background)                            │
│                                                         │
│  service-worker.js                                      │
│    ├── onMessage handler (CHAT_REQUEST, TEST_CONNECTION) │
│    ├── llm.js (router)                                  │
│    │     ├── providers/openai.js                        │
│    │     ├── providers/anthropic.js                     │
│    │     └── providers/gemini.js                        │
│    └── time-tracker.js (website time tracking)          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Options UI (extension popup)                           │
│                                                         │
│  options/options.html + options.js + options.css         │
│  options/help.html                                      │
└─────────────────────────────────────────────────────────┘
```

## Entry Points

| Entry | Bundled Output | Role |
|---|---|---|
| `src/content.js` | `dist/content.js` | Content script — injected on every page |
| `src/background/service-worker.js` | `dist/background.js` | Background service worker — LLM routing |
| `options/options.js` | `dist/options.js` | Settings UI logic |

## Content Script Modules

All modules export an `init()` function that receives dependencies via parameter objects to avoid circular imports. `content.js` bootstraps everything inside a closed Shadow DOM.

| Module | Responsibility |
|---|---|
| `content.js` | Creates Shadow DOM host, builds DOM elements, wires all modules together |
| `emotions.js` | Sprite switching, idle shuffle, hover reactions, speaking animation |
| `bubble.js` | Speech bubble show/hide, typewriter animation, auto-dismiss timer |
| `chat.js` | Chat panel UI, conversation history, LLM requests, slash commands, animated responses |
| `drag.js` | Pointer-event drag with `setPointerCapture`, viewport clamping, position tracking |
| `storage.js` | Position persistence via `chrome.storage.local` |
| `settings.js` | Load/save user settings (provider, model, API key, system prompt) |
| `messages.js` | `chrome.runtime.onMessage` listener for external control (SET_EMOTION, SET_BUBBLE_TEXT, etc.) |
| `styles.js` | All Shadow DOM CSS as a template literal |
| `constants.js` | Shared config — emotions map, timing values, provider configs, defaults |

## Background Service Worker

Handles LLM API routing and website time tracking. Receives messages from the content script and options page.

```
chrome.runtime.onMessage
  ├── CHAT_REQUEST → llm.chat()
  │     ├── openai.chat(apiKey, model, messages, systemPrompt)
  │     ├── anthropic.chat(apiKey, model, messages, systemPrompt)
  │     └── gemini.chat(apiKey, model, messages, systemPrompt)
  ├── GET_TIME_TRACKING_DATA → return stored time data
  └── CLEAR_TIME_TRACKING_DATA → reset stored time data
```

All providers implement the same interface: `chat(apiKey, model, messages, systemPrompt) → { success, text } | { success, error }`

### Time Tracker (`time-tracker.js`)

Tracks active browsing time per domain. Only counts time when Chrome is focused AND the tab is active — switching apps or going idle stops the counter.

**Event listeners:** `chrome.tabs.onActivated`, `chrome.tabs.onUpdated`, `chrome.windows.onFocusChanged`, `chrome.idle.onStateChanged`, `chrome.alarms` (30s periodic flush).

**On service worker restart:** re-queries idle state, focused window, and active tab to resume tracking seamlessly.

**Storage:** flushes elapsed milliseconds to `chrome.storage.local` under `time_tracking_data` as `{ domain: totalMs }`.

## Communication Flow

```
User types message
  → chat.js adds to conversationHistory
  → chrome.runtime.sendMessage({ type: 'CHAT_REQUEST', messages })
  → service-worker.js receives message
  → llm.js routes to provider adapter
  → provider makes fetch() to external API
  → response sent back via sendResponse()
  → chat.js receives response
  → addMessageAnimated() types out text with speaking sprite
```

## Sprite System

```
Idle state:
  scheduleIdleShuffle() cycles neutral ↔ idle every 10-15s

Hover:
  pointerenter → happy
  pointerleave → restore previous

Speaking (during typewriter):
  startSpeakingAnim() → neutral ↔ random(speak-1, speak-2) at 150ms
  stopSpeakingAnim()  → neutral, resume idle shuffle

Explicit emotion:
  setEmotion('blush') → overrides idle until cleared
```

### Sprite Assets

| Sprite | File | Usage |
|---|---|---|
| neutral | `assets/neutral.webp` | Default, idle rotation |
| idle | `assets/idle.webp` | Idle rotation |
| happy | `assets/happy.webp` | Hover reaction |
| blush | `assets/blush.webp` | Explicit emotion |
| angry | `assets/angry.webp` | Explicit emotion |
| speak-1 | `assets/speak-1.webp` | Speaking animation frame |
| speak-2 | `assets/speak-2.webp` | Speaking animation frame |

## Storage Schema

All data stored in `chrome.storage.local`:

| Key | Shape | Purpose |
|---|---|---|
| `companion_position` | `{ x: number, y: number }` | Last dragged position |
| `companion_settings` | `{ provider, model, apiKey, summarizeMaxChars, systemPrompt }` | User preferences |
| `time_tracking_data` | `{ [domain: string]: number }` | Accumulated browsing time per domain (ms) |

## Chat Commands

| Command | Handler |
|---|---|
| `/summarize` | Extracts page text, sends to LLM for summary |
| `/clear` | Resets conversation history and chat UI |
| `/settings` | Opens extension options page |
| `/help` | Lists available commands |

## CSS Isolation

All UI lives inside a **closed Shadow DOM** attached to a host `<div>` injected into `document.body`. Styles are defined in `styles.js` as a template literal and injected as a `<style>` element inside the shadow root. No styles leak in or out.

A `MutationObserver` watches `document.body` and re-appends the host element if removed (SPA resilience).

## Build Pipeline

```
esbuild (3 parallel bundles)
  src/content.js              → dist/content.js
  src/background/service-worker.js → dist/background.js
  options/options.js          → dist/options.js
```

No frameworks, no runtime dependencies. Only `esbuild` as a dev dependency.
