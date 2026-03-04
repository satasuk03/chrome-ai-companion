import { COMPANION_SIZE } from './constants.js';

export const SHADOW_CSS = `
  :host {
    font-family: 'Courier New', monospace !important;
    font-size: 14px !important;
    line-height: 1.4 !important;
    color: #2c2c2c !important;
  }

  * {
    box-sizing: border-box;
  }

  .companion-container {
    position: fixed;
    pointer-events: auto;
    user-select: none;
    -webkit-user-select: none;
    will-change: transform;
  }

  /* ── Character sprite ── */
  @keyframes breathe {
    0%   { transform: translateY(0); }
    50%  { transform: translateY(4px); }
    100% { transform: translateY(0); }
  }

  .character {
    width: ${COMPANION_SIZE}px;
    height: ${COMPANION_SIZE}px;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    cursor: grab;
    transition: filter 0.15s ease;
    display: block;
    animation: breathe 3s ease-in-out infinite;
  }

  .character:active {
    cursor: grabbing;
    animation-play-state: paused;
  }

  .character:hover {
    filter: brightness(1.05);
  }

  /* ── Speech bubble ── */
  .bubble {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    min-width: 160px;
    max-width: 260px;
    padding: 10px 14px;
    background: #fefae0;
    border: 3px solid #5c4033;
    border-radius: 4px;
    box-shadow: 4px 4px 0px #5c4033;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #2c2c2c;
    opacity: 0;
    transform: scale(0.9) translateY(8px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
    visibility: hidden;
  }

  .bubble.visible {
    opacity: 1;
    transform: scale(1) translateY(0);
    pointer-events: auto;
    visibility: visible;
  }

  .bubble.flip-y {
    bottom: auto;
    top: calc(100% + 8px);
  }

  .bubble.flip-x {
    right: auto;
    left: 0;
  }

  .bubble-content {
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .bubble-tail {
    position: absolute;
    bottom: -10px;
    right: 24px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 10px solid #5c4033;
  }

  .bubble-tail::after {
    content: '';
    position: absolute;
    bottom: 3px;
    left: -6px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid #fefae0;
  }

  .bubble.flip-y .bubble-tail {
    bottom: auto;
    top: -10px;
    border-top: none;
    border-bottom: 10px solid #5c4033;
  }

  .bubble.flip-y .bubble-tail::after {
    bottom: auto;
    top: 3px;
    border-top: none;
    border-bottom: 8px solid #fefae0;
  }

  .bubble.flip-x .bubble-tail {
    right: auto;
    left: 24px;
  }

  /* ── Chat panel ── */
  .chat-panel {
    position: absolute;
    bottom: 0;
    right: calc(100% + 12px);
    width: 320px;
    height: 420px;
    background: #fefae0;
    border: 3px solid #5c4033;
    border-radius: 4px;
    box-shadow: 4px 4px 0px #5c4033;
    display: flex;
    flex-direction: column;
    opacity: 0;
    transform: scale(0.9) translateX(8px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: none;
    visibility: hidden;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #2c2c2c;
  }

  .chat-panel.visible {
    opacity: 1;
    transform: scale(1) translateX(0);
    pointer-events: auto;
    visibility: visible;
  }

  .chat-panel.flip-x {
    right: auto;
    left: calc(100% + 12px);
    transform: scale(0.9) translateX(-8px);
  }

  .chat-panel.flip-x.visible {
    transform: scale(1) translateX(0);
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-bottom: 2px solid #5c4033;
    background: #d4a373;
    border-radius: 1px 1px 0 0;
    flex-shrink: 0;
  }

  .chat-title {
    font-weight: bold;
    font-size: 14px;
    color: #2c2c2c;
  }

  .chat-close {
    background: none;
    border: 2px solid #5c4033;
    border-radius: 2px;
    color: #5c4033;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    padding: 2px 6px;
    line-height: 1;
    transition: background 0.1s ease;
  }

  .chat-close:hover {
    background: #5c4033;
    color: #fefae0;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chat-messages::-webkit-scrollbar {
    width: 6px;
  }

  .chat-messages::-webkit-scrollbar-track {
    background: #fefae0;
  }

  .chat-messages::-webkit-scrollbar-thumb {
    background: #d4a373;
    border-radius: 3px;
  }

  .chat-msg {
    max-width: 85%;
    padding: 8px 10px;
    border-radius: 4px;
    line-height: 1.4;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .chat-msg.user {
    align-self: flex-end;
    background: #d4a373;
    border: 2px solid #5c4033;
    color: #2c2c2c;
  }

  .chat-msg.companion {
    align-self: flex-start;
    background: #fff8dc;
    border: 2px solid #5c4033;
    color: #2c2c2c;
  }

  .chat-msg.system {
    align-self: center;
    background: none;
    border: none;
    color: #8a7560;
    font-size: 11px;
    font-style: italic;
    padding: 4px 8px;
    max-width: 100%;
    text-align: center;
  }

  .chat-input-area {
    display: flex;
    padding: 8px;
    border-top: 2px solid #5c4033;
    gap: 6px;
    flex-shrink: 0;
  }

  .chat-input {
    flex: 1;
    padding: 8px 10px;
    border: 2px solid #5c4033;
    border-radius: 2px;
    background: #fffdf0;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    color: #2c2c2c;
    outline: none;
  }

  .chat-input:focus {
    border-color: #d4a373;
    box-shadow: 0 0 0 1px #d4a373;
  }

  .chat-input::placeholder {
    color: #a89070;
  }

  .chat-send {
    padding: 8px 12px;
    background: #d4a373;
    border: 2px solid #5c4033;
    border-radius: 2px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    font-weight: bold;
    color: #2c2c2c;
    cursor: pointer;
    transition: background 0.1s ease;
    flex-shrink: 0;
  }

  .chat-send:hover {
    background: #5c4033;
    color: #fefae0;
  }
`;
