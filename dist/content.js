(() => {
  // src/constants.js
  var STORAGE_KEY = "companion_position";
  var COMPANION_SIZE = 120;
  var BUBBLE_TIMEOUT = 5e3;
  var EMOTIONS = {
    neutral: "assets/neutral.webp",
    idle: "assets/idle.webp",
    happy: "assets/happy.webp",
    blush: "assets/blush.webp",
    angry: "assets/angry.webp",
    speak1: "assets/speak-1.webp",
    speak2: "assets/speak-2.webp",
    "not-happy": "assets/not-happy.webp",
    "angry-2": "assets/angry-2.webp",
    surprised: "assets/surprised.webp",
    suspicious: "assets/suspicious.webp",
    humming: "assets/humming.webp",
    lol: "assets/lol.webp",
    cool: "assets/cool.webp"
  };
  var SPEAK_FRAME_INTERVAL = 150;
  var IDLE_SPRITES = ["neutral", "idle", "humming"];
  var IDLE_INTERVAL_MIN = 1e4;
  var IDLE_INTERVAL_MAX = 15e3;
  var DETOX_INTERVAL_MIN = 1e4;
  var DETOX_INTERVAL_MAX = 15e3;
  var DETOX_MESSAGES = [
    "Uhhh... didn't you say you were gonna be productive today?",
    "Hmm hmm~ is this really what we're doing right now...?",
    "H-hey! I'm not judging buuut... okay maybe a little...",
    "Waaah, you're still here?! Time flies when you're not being productive~",
    "Psst... your future self is NOT gonna thank you for this...",
    "Ehehe~ another scroll, another dream delayed~",
    "I believe in you! ...But like, maybe believe in yourself somewhere else?",
    "Riko is watching... and Riko is disappointed... just a teensy bit...",
    "Ohhh no no no, we are NOT doing this again today!!",
    "You know what's more fun than this? Literally anything productive~",
    "Uhhh... I'm starting to think you forgot about your goals...",
    "Hey hey~! Remember that thing you were supposed to do? Yeah... that thing...",
    "Every second here is a second you can't get back... just saying~!",
    "I'm gonna keep bugging you until you leave, you know that right~?"
  ];
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

  // src/styles.js
  var SHADOW_CSS = `
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

  /* \u2500\u2500 Character sprite \u2500\u2500 */
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

  /* \u2500\u2500 Speech bubble \u2500\u2500 */
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

  /* \u2500\u2500 Chat panel \u2500\u2500 */
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

  .chat-header-actions {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .chat-header-btn {
    background: none;
    border: 2px solid #5c4033;
    border-radius: 2px;
    color: #5c4033;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    padding: 2px 6px;
    line-height: 1;
    transition: background 0.1s ease;
  }

  .chat-header-btn:hover {
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

  @keyframes typing-dots {
    0%, 20%  { opacity: 0.3; }
    50%      { opacity: 1; }
    80%, 100% { opacity: 0.3; }
  }

  .chat-msg {
    max-width: 85%;
    padding: 8px 10px;
    border-radius: 4px;
    line-height: 1.4;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .chat-msg.typing {
    animation: typing-dots 1.2s ease-in-out infinite;
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
    position: relative;
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

  /* \u2500\u2500 Command suggestions dropdown \u2500\u2500 */
  .cmd-suggestions {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: #fefae0;
    border: 2px solid #5c4033;
    border-bottom: none;
    border-radius: 3px 3px 0 0;
    max-height: 180px;
    overflow-y: auto;
    z-index: 10;
  }

  .cmd-suggestion {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 6px 10px;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #2c2c2c;
  }

  .cmd-suggestion:hover,
  .cmd-suggestion.active {
    background: #d4a373;
  }

  .cmd-suggestion-name {
    font-weight: bold;
    white-space: nowrap;
  }

  .cmd-suggestion-desc {
    color: #8a7560;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cmd-suggestion.active .cmd-suggestion-desc {
    color: #5c4033;
  }
`;

  // src/storage.js
  async function loadPosition() {
    return new Promise((resolve) => {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const pos = result[STORAGE_KEY];
        if (pos && pos.x >= 0 && pos.y >= 0) {
          const x = Math.min(pos.x, window.innerWidth - COMPANION_SIZE);
          const y = Math.min(pos.y, window.innerHeight - COMPANION_SIZE);
          resolve({ x: Math.max(0, x), y: Math.max(0, y) });
        } else {
          resolve({
            x: window.innerWidth - COMPANION_SIZE - 20,
            y: window.innerHeight - COMPANION_SIZE - 20
          });
        }
      });
    });
  }
  function savePosition(x, y) {
    chrome.storage.local.set({ [STORAGE_KEY]: { x, y } });
  }

  // src/emotions.js
  var currentEmotion = "neutral";
  var characterImg = null;
  var idleTimer = null;
  var isHovered = false;
  var emotionOverride = null;
  var speakingInterval = null;
  function initEmotions(imgElement) {
    characterImg = imgElement;
    characterImg.addEventListener("pointerenter", () => {
      isHovered = true;
      setSpriteUrl("happy");
    });
    characterImg.addEventListener("pointerleave", () => {
      isHovered = false;
      setSpriteUrl(emotionOverride || currentEmotion);
    });
    scheduleIdleShuffle();
  }
  function setSpriteUrl(emotion) {
    try {
      characterImg.src = chrome.runtime.getURL(EMOTIONS[emotion]);
    } catch {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      if (speakingInterval) {
        clearInterval(speakingInterval);
        speakingInterval = null;
      }
    }
  }
  function randomIdleDelay() {
    return IDLE_INTERVAL_MIN + Math.random() * (IDLE_INTERVAL_MAX - IDLE_INTERVAL_MIN);
  }
  function scheduleIdleShuffle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!emotionOverride) {
        const next = IDLE_SPRITES[Math.floor(Math.random() * IDLE_SPRITES.length)];
        currentEmotion = next;
        if (!isHovered) {
          setSpriteUrl(next);
        }
      }
      scheduleIdleShuffle();
    }, randomIdleDelay());
  }
  function setEmotion(emotion) {
    if (!EMOTIONS[emotion]) return;
    if (IDLE_SPRITES.includes(emotion)) {
      emotionOverride = null;
      currentEmotion = emotion;
      if (!isHovered) setSpriteUrl(emotion);
      return;
    }
    emotionOverride = emotion;
    currentEmotion = emotion;
    if (!isHovered) setSpriteUrl(emotion);
  }
  var emoteHoldTimer = null;
  function startSpeakingAnim(emotion) {
    if (speakingInterval) return;
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    const hasEmote = emotion && EMOTIONS[emotion];
    if (hasEmote) {
      setSpriteUrl(emotion);
      emoteHoldTimer = setTimeout(() => {
        emoteHoldTimer = null;
        beginSpeakCycle();
      }, 500);
    } else {
      beginSpeakCycle();
    }
  }
  function beginSpeakCycle() {
    let isNeutralFrame = true;
    const speakSprites = ["speak1", "speak2"];
    speakingInterval = setInterval(() => {
      if (isNeutralFrame) {
        setSpriteUrl("neutral");
      } else {
        setSpriteUrl(speakSprites[Math.floor(Math.random() * speakSprites.length)]);
      }
      isNeutralFrame = !isNeutralFrame;
    }, SPEAK_FRAME_INTERVAL);
  }
  function stopSpeakingAnim() {
    if (emoteHoldTimer) {
      clearTimeout(emoteHoldTimer);
      emoteHoldTimer = null;
    }
    if (speakingInterval) {
      clearInterval(speakingInterval);
      speakingInterval = null;
    }
    setSpriteUrl("neutral");
    emotionOverride = null;
    scheduleIdleShuffle();
  }
  function preloadSprites() {
    Object.values(EMOTIONS).forEach((path) => {
      const img = new Image();
      img.src = chrome.runtime.getURL(path);
    });
  }

  // src/bubble.js
  var bubbleEl = null;
  var bubbleContentEl = null;
  var bubbleVisible = false;
  var bubbleTimeout = null;
  var typewriterCancel = null;
  var isChatVisible = () => false;
  var getPosition = () => ({ x: 0, y: 0 });
  var onSpeakStart = null;
  var onSpeakEnd = null;
  function initBubble(elements, deps) {
    bubbleEl = elements.bubble;
    bubbleContentEl = elements.bubbleContent;
    isChatVisible = deps.isChatVisible;
    getPosition = deps.getPosition;
    onSpeakStart = deps.onSpeakStart || null;
    onSpeakEnd = deps.onSpeakEnd || null;
  }
  function showBubble() {
    if (isChatVisible()) return;
    bubbleVisible = true;
    bubbleEl.classList.add("visible");
    updateBubblePosition();
  }
  function hideBubble() {
    bubbleVisible = false;
    bubbleEl.classList.remove("visible");
    if (bubbleTimeout) {
      clearTimeout(bubbleTimeout);
      bubbleTimeout = null;
    }
    if (typewriterCancel) {
      typewriterCancel();
      typewriterCancel = null;
      if (onSpeakEnd) onSpeakEnd();
    }
  }
  function isBubbleVisible() {
    return bubbleVisible;
  }
  function setBubbleText(text) {
    if (typewriterCancel) {
      typewriterCancel();
      typewriterCancel = null;
      if (onSpeakEnd) onSpeakEnd();
    }
    bubbleContentEl.textContent = text;
    showBubble();
    scheduleBubbleHide();
  }
  function setBubbleTextAnimated(text, speed) {
    if (typewriterCancel) {
      typewriterCancel();
      typewriterCancel = null;
      if (onSpeakEnd) onSpeakEnd();
    }
    speed = speed || 30;
    bubbleContentEl.textContent = "";
    showBubble();
    if (onSpeakStart) onSpeakStart();
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        bubbleContentEl.textContent += text[i];
        i++;
      } else {
        clearInterval(interval);
        if (onSpeakEnd) onSpeakEnd();
        scheduleBubbleHide();
      }
    }, speed);
    typewriterCancel = () => clearInterval(interval);
  }
  function scheduleBubbleHide() {
    if (bubbleTimeout) clearTimeout(bubbleTimeout);
    bubbleTimeout = setTimeout(hideBubble, BUBBLE_TIMEOUT);
  }
  function updateBubblePosition() {
    const pos = getPosition();
    const flipY = pos.y < 180;
    const flipX = pos.x > window.innerWidth - 300;
    bubbleEl.classList.toggle("flip-y", flipY);
    bubbleEl.classList.toggle("flip-x", flipX);
  }

  // src/settings.js
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(SETTINGS_KEY, (result) => {
        resolve({ ...SETTINGS_DEFAULTS, ...result[SETTINGS_KEY] });
      });
    });
  }

  // src/autocomplete.js
  function initAutocomplete(inputEl, containerEl, commands) {
    const dropdown = document.createElement("div");
    dropdown.className = "cmd-suggestions";
    containerEl.appendChild(dropdown);
    let entries = Object.entries(commands).map(([name, info]) => ({
      name,
      description: info.description
    }));
    let filtered = [];
    let activeIndex = -1;
    function render() {
      dropdown.innerHTML = "";
      if (filtered.length === 0) {
        dropdown.style.display = "none";
        return;
      }
      dropdown.style.display = "";
      filtered.forEach((cmd, i) => {
        const item = document.createElement("div");
        item.className = "cmd-suggestion" + (i === activeIndex ? " active" : "");
        const nameSpan = document.createElement("span");
        nameSpan.className = "cmd-suggestion-name";
        nameSpan.textContent = cmd.name;
        const descSpan = document.createElement("span");
        descSpan.className = "cmd-suggestion-desc";
        descSpan.textContent = cmd.description;
        item.appendChild(nameSpan);
        item.appendChild(descSpan);
        item.addEventListener("mousedown", (e) => {
          e.preventDefault();
          accept(i);
        });
        dropdown.appendChild(item);
      });
    }
    function accept(index) {
      const cmd = filtered[index];
      if (!cmd) return;
      inputEl.value = cmd.name + " ";
      hide();
      inputEl.focus();
    }
    function hide() {
      filtered = [];
      activeIndex = -1;
      dropdown.style.display = "none";
      dropdown.innerHTML = "";
    }
    function update() {
      const val = inputEl.value;
      if (!val.startsWith("/")) {
        hide();
        return;
      }
      const prefix = val.split(/\s/)[0].toLowerCase();
      if (val.includes(" ")) {
        hide();
        return;
      }
      filtered = entries.filter((cmd) => cmd.name.startsWith(prefix));
      activeIndex = filtered.length > 0 ? 0 : -1;
      render();
    }
    function handleKey(e) {
      if (filtered.length === 0) return false;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % filtered.length;
        render();
        return true;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
        render();
        return true;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        if (activeIndex >= 0) {
          e.preventDefault();
          accept(activeIndex);
          return true;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        hide();
        return true;
      }
      return false;
    }
    dropdown.style.display = "none";
    return { update, hide, handleKey };
  }

  // src/emote-parser.js
  function parseEmote(text) {
    const match = text.match(/^<emote:([a-z0-9-]+)>\s*/i);
    if (match) {
      return { emotion: match[1], text: text.slice(match[0].length) };
    }
    return { emotion: null, text };
  }

  // src/chat.js
  var chatPanel = null;
  var chatMessages = null;
  var chatInput = null;
  var chatVisible = false;
  var getPosition2 = () => ({ x: 0, y: 0 });
  var autocomplete = null;
  var conversationHistory = [];
  var isWaitingForResponse = false;
  var activeChatTypewriterCancel = null;
  function formatDuration(ms) {
    const totalMinutes = Math.floor(ms / 6e4);
    if (totalMinutes < 1) return "<1m";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  function initChat(elements, deps) {
    chatPanel = elements.panel;
    chatMessages = elements.messages;
    chatInput = elements.input;
    getPosition2 = deps.getPosition;
    elements.closeBtn.addEventListener("click", closeChat);
    elements.sendBtn.addEventListener("click", handleSendMessage);
    elements.settingsBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_SETTINGS" });
    });
    elements.helpBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_HELP" });
    });
    const inputArea = chatInput.closest(".chat-input-area");
    autocomplete = initAutocomplete(chatInput, inputArea, COMMANDS);
    chatInput.addEventListener("input", () => autocomplete.update());
    chatInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (autocomplete.handleKey(e)) return;
      if (e.key === "Enter") handleSendMessage();
    });
    chatInput.addEventListener("keyup", (e) => e.stopPropagation());
    chatInput.addEventListener("keypress", (e) => e.stopPropagation());
  }
  function isChatVisible2() {
    return chatVisible;
  }
  function toggleChat() {
    if (chatVisible) {
      closeChat();
    } else {
      openChat();
    }
  }
  function openChat() {
    chatVisible = true;
    hideBubble();
    updateChatPosition();
    chatPanel.classList.add("visible");
    chatInput.focus();
  }
  function closeChat() {
    chatVisible = false;
    chatPanel.classList.remove("visible");
    if (activeChatTypewriterCancel) {
      activeChatTypewriterCancel();
    }
  }
  function updateChatPosition() {
    const pos = getPosition2();
    const flipX = pos.x < 340;
    chatPanel.classList.toggle("flip-x", flipX);
  }
  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = "chat-msg " + sender;
    msg.textContent = text;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
  }
  function addMessageAnimated(text, sender, speed, emotion) {
    speed = speed || 30;
    const msg = document.createElement("div");
    msg.className = "chat-msg " + sender;
    msg.textContent = "";
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    startSpeakingAnim(emotion);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        msg.textContent += text[i];
        i++;
        chatMessages.scrollTop = chatMessages.scrollHeight;
      } else {
        clearInterval(interval);
        stopSpeakingAnim();
        activeChatTypewriterCancel = null;
      }
    }, speed);
    activeChatTypewriterCancel = () => {
      clearInterval(interval);
      msg.textContent = text;
      stopSpeakingAnim();
      activeChatTypewriterCancel = null;
    };
    return msg;
  }
  function addTypingIndicator() {
    const msg = document.createElement("div");
    msg.className = "chat-msg companion typing";
    msg.textContent = "...";
    msg.dataset.typing = "true";
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msg;
  }
  function removeTypingIndicator() {
    const typing = chatMessages.querySelector('[data-typing="true"]');
    if (typing) typing.remove();
  }
  function getConversationHistory() {
    return [...conversationHistory];
  }
  var COMMANDS = {
    "/clear": {
      usage: "/clear",
      description: "Clear chat history and conversation context",
      handler() {
        conversationHistory = [];
        chatMessages.innerHTML = "";
        addMessage("Chat cleared.", "system");
      }
    },
    "/settings": {
      usage: "/settings",
      description: "Open companion settings",
      handler() {
        chrome.runtime.sendMessage({ type: "OPEN_SETTINGS" });
        addMessage("Opening settings...", "system");
      }
    },
    "/summarize": {
      usage: "/summarize",
      description: "Summarize the current webpage",
      async handler() {
        const settings = await loadSettings();
        const maxChars = settings.summarizeMaxChars || 4e3;
        const pageText = document.body.innerText.slice(0, maxChars);
        const prompt = `Summarize this webpage in 2-3 short sentences. Be concise.

${pageText}`;
        conversationHistory.push({ role: "user", content: prompt });
        isWaitingForResponse = true;
        chatInput.disabled = true;
        addTypingIndicator();
        chrome.runtime.sendMessage(
          { type: "CHAT_REQUEST", messages: getConversationHistory() },
          (response) => {
            removeTypingIndicator();
            isWaitingForResponse = false;
            chatInput.disabled = false;
            chatInput.focus();
            if (chrome.runtime.lastError) {
              addMessage("Error: Could not reach companion service.", "system");
              return;
            }
            if (response?.success) {
              const parsed = parseEmote(response.text);
              conversationHistory.push({ role: "assistant", content: parsed.text });
              addMessageAnimated(parsed.text, "companion", void 0, parsed.emotion);
            } else {
              addMessage(`Error: ${response?.error || "No response from LLM."}`, "system");
            }
          }
        );
      }
    },
    "/stats": {
      usage: "/stats",
      description: "Show your top browsing stats (with cute facts from Riko if LLM is connected)",
      async handler() {
        addTypingIndicator();
        isWaitingForResponse = true;
        chatInput.disabled = true;
        chrome.runtime.sendMessage({ type: "GET_TIME_TRACKING_DATA" }, async (response) => {
          if (chrome.runtime.lastError || !response?.success) {
            removeTypingIndicator();
            isWaitingForResponse = false;
            chatInput.disabled = false;
            addMessage("Could not load time tracking data.", "system");
            return;
          }
          const data = response.data;
          const entries = Object.entries(data).filter(([d]) => d && d !== "null").sort((a, b) => b[1] - a[1]);
          if (entries.length === 0) {
            removeTypingIndicator();
            isWaitingForResponse = false;
            chatInput.disabled = false;
            addMessage("No browsing data yet. Keep browsing!", "system");
            return;
          }
          removeTypingIndicator();
          const top5 = entries.slice(0, 5);
          const totalMs = top5.reduce((sum, [, ms]) => sum + ms, 0);
          addMessage("--Your Internet Stats--");
          for (const [domain, ms] of top5) {
            const pct = Math.round(ms / totalMs * 100);
            addMessage(`${domain} ${pct}% (${formatDuration(ms)})`);
          }
          const settings = await loadSettings();
          if (!settings.apiKey) {
            isWaitingForResponse = false;
            chatInput.disabled = false;
            return;
          }
          addTypingIndicator();
          const top10 = entries.slice(0, 10);
          const statsText = top10.map(([domain, ms]) => {
            const mins = Math.round(ms / 6e4);
            return `${domain} \u2014 ${mins < 1 ? "<1" : mins} min`;
          }).join("\n");
          const prompt = `This is time I spent on websites sorted by time
Share a cute fun fact about yourself related to my browsing habits, be sweet and supportive!
${statsText}`;
          conversationHistory.push({ role: "user", content: prompt });
          chrome.runtime.sendMessage(
            { type: "CHAT_REQUEST", messages: getConversationHistory() },
            (resp) => {
              removeTypingIndicator();
              isWaitingForResponse = false;
              chatInput.disabled = false;
              chatInput.focus();
              if (chrome.runtime.lastError) {
                addMessage("Error: Could not reach companion service.", "system");
                return;
              }
              if (resp?.success) {
                const parsed = parseEmote(resp.text);
                conversationHistory.push({ role: "assistant", content: parsed.text });
                addMessageAnimated(parsed.text, "companion", void 0, parsed.emotion);
              } else {
                addMessage(`Error: ${resp?.error || "No response from LLM."}`, "system");
              }
            }
          );
        });
      }
    },
    "/help": {
      usage: "/help",
      description: "Show available commands",
      handler() {
        Object.entries(COMMANDS).forEach(([, info]) => addMessage(`${info.usage} \u2014 ${info.description}`, "system"));
      }
    }
  };
  function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text || isWaitingForResponse) return;
    chatInput.value = "";
    if (text.startsWith("/")) {
      const parts = text.split(/\s+/);
      const cmdName = parts[0].toLowerCase();
      const args = parts.slice(1);
      addMessage(text, "user");
      const cmd = COMMANDS[cmdName];
      if (cmd) {
        cmd.handler(args);
      } else {
        addMessage(`Unknown command: ${cmdName}. Type /help for available commands.`, "system");
      }
      return;
    }
    addMessage(text, "user");
    conversationHistory.push({ role: "user", content: text });
    isWaitingForResponse = true;
    chatInput.disabled = true;
    addTypingIndicator();
    chrome.runtime.sendMessage(
      { type: "CHAT_REQUEST", messages: getConversationHistory() },
      (response) => {
        removeTypingIndicator();
        isWaitingForResponse = false;
        chatInput.disabled = false;
        chatInput.focus();
        if (chrome.runtime.lastError) {
          addMessage("Error: Could not reach companion service.", "system");
          return;
        }
        if (response?.success) {
          const parsed = parseEmote(response.text);
          conversationHistory.push({ role: "assistant", content: parsed.text });
          addMessageAnimated(parsed.text, "companion", void 0, parsed.emotion);
        } else {
          addMessage(`Error: ${response?.error || "No response from LLM."}`, "system");
        }
      }
    );
  }

  // src/drag.js
  var container = null;
  var characterImg2 = null;
  var posX = 0;
  var posY = 0;
  var isDragging = false;
  var hasDragged = false;
  var dragOffsetX = 0;
  var dragOffsetY = 0;
  function initDrag(containerEl, imgEl, initialPos) {
    container = containerEl;
    characterImg2 = imgEl;
    posX = initialPos.x;
    posY = initialPos.y;
    characterImg2.addEventListener("pointerdown", onPointerDown);
  }
  function getPosition3() {
    return { x: posX, y: posY };
  }
  function setPosition(x, y) {
    posX = x;
    posY = y;
    container.style.transform = `translate(${posX}px, ${posY}px)`;
  }
  function clampToViewport() {
    const maxX = window.innerWidth - COMPANION_SIZE;
    const maxY = window.innerHeight - COMPANION_SIZE;
    posX = Math.max(0, Math.min(posX, maxX));
    posY = Math.max(0, Math.min(posY, maxY));
    container.style.transform = `translate(${posX}px, ${posY}px)`;
  }
  function onPointerDown(e) {
    e.preventDefault();
    isDragging = true;
    hasDragged = false;
    const rect = container.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    characterImg2.setPointerCapture(e.pointerId);
    characterImg2.addEventListener("pointermove", onPointerMove);
    characterImg2.addEventListener("pointerup", onPointerUp);
    characterImg2.addEventListener("pointercancel", onPointerUp);
  }
  function onPointerMove(e) {
    if (!isDragging) return;
    hasDragged = true;
    let newX = e.clientX - dragOffsetX;
    let newY = e.clientY - dragOffsetY;
    const maxX = window.innerWidth - COMPANION_SIZE;
    const maxY = window.innerHeight - COMPANION_SIZE;
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    posX = newX;
    posY = newY;
    container.style.transform = `translate(${posX}px, ${posY}px)`;
    if (isBubbleVisible()) updateBubblePosition();
    if (isChatVisible2()) updateChatPosition();
  }
  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
    characterImg2.releasePointerCapture(e.pointerId);
    characterImg2.removeEventListener("pointermove", onPointerMove);
    characterImg2.removeEventListener("pointerup", onPointerUp);
    characterImg2.removeEventListener("pointercancel", onPointerUp);
    savePosition(posX, posY);
    if (!hasDragged) {
      toggleChat();
    }
  }

  // src/messages.js
  function attachMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "SET_EMOTION":
          setEmotion(message.emotion);
          sendResponse({ success: true });
          break;
        case "SET_BUBBLE_TEXT":
          setBubbleText(message.text);
          sendResponse({ success: true });
          break;
        case "SET_BUBBLE_TEXT_ANIMATED": {
          const parsed = parseEmote(message.text);
          if (parsed.emotion) setEmotion(parsed.emotion);
          setBubbleTextAnimated(parsed.text, message.speed);
          sendResponse({ success: true });
          break;
        }
        case "SET_EMOTION_AND_TEXT":
          setEmotion(message.emotion);
          setBubbleTextAnimated(message.text);
          sendResponse({ success: true });
          break;
      }
    });
  }

  // src/detox.js
  var setBubbleTextAnimated2 = null;
  var isChatVisible3 = () => false;
  var nagTimer = null;
  var lastMessageIndex = -1;
  function initDetox(deps) {
    setBubbleTextAnimated2 = deps.setBubbleTextAnimated;
    isChatVisible3 = deps.isChatVisible;
    loadSettings2().then(evaluate);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[SETTINGS_KEY]) {
        const settings = { ...SETTINGS_DEFAULTS, ...changes[SETTINGS_KEY].newValue };
        evaluate(settings);
      }
    });
  }
  async function loadSettings2() {
    return new Promise((resolve) => {
      chrome.storage.local.get(SETTINGS_KEY, (result) => {
        resolve({ ...SETTINGS_DEFAULTS, ...result[SETTINGS_KEY] });
      });
    });
  }
  function evaluate(settings) {
    stopNagging();
    if (settings.detoxEnabled && isGreylistedSite(settings.detoxSites)) {
      scheduleNag();
    }
  }
  function isGreylistedSite(sitesText) {
    if (!sitesText) return false;
    const hostname = window.location.hostname;
    return sitesText.split("\n").some((domain) => {
      const d = domain.trim().toLowerCase();
      return d && hostname.includes(d);
    });
  }
  function scheduleNag() {
    const delay = DETOX_INTERVAL_MIN + Math.random() * (DETOX_INTERVAL_MAX - DETOX_INTERVAL_MIN);
    nagTimer = setTimeout(() => {
      if (!isChatVisible3()) {
        setBubbleTextAnimated2(pickMessage());
      }
      scheduleNag();
    }, delay);
  }
  function stopNagging() {
    if (nagTimer) {
      clearTimeout(nagTimer);
      nagTimer = null;
    }
  }
  function pickMessage() {
    let index;
    do {
      index = Math.floor(Math.random() * DETOX_MESSAGES.length);
    } while (index === lastMessageIndex && DETOX_MESSAGES.length > 1);
    lastMessageIndex = index;
    return DETOX_MESSAGES[index];
  }

  // src/content.js
  (function() {
    if (document.getElementById("chrome-companion-host")) return;
    async function initCompanion(shadow2) {
      const style = document.createElement("style");
      style.textContent = SHADOW_CSS;
      shadow2.appendChild(style);
      const container2 = document.createElement("div");
      container2.className = "companion-container";
      const bubbleEl2 = document.createElement("div");
      bubbleEl2.className = "bubble";
      const bubbleContentEl2 = document.createElement("div");
      bubbleContentEl2.className = "bubble-content";
      const bubbleTailEl = document.createElement("div");
      bubbleTailEl.className = "bubble-tail";
      bubbleEl2.appendChild(bubbleContentEl2);
      bubbleEl2.appendChild(bubbleTailEl);
      const chatPanelEl = document.createElement("div");
      chatPanelEl.className = "chat-panel";
      const chatHeader = document.createElement("div");
      chatHeader.className = "chat-header";
      const chatTitle = document.createElement("span");
      chatTitle.className = "chat-title";
      chatTitle.textContent = "Chat";
      const chatHeaderActions = document.createElement("div");
      chatHeaderActions.className = "chat-header-actions";
      const chatSettingsBtn = document.createElement("button");
      chatSettingsBtn.className = "chat-header-btn";
      chatSettingsBtn.textContent = "\u2699";
      chatSettingsBtn.title = "Settings";
      const chatHelpBtn = document.createElement("button");
      chatHelpBtn.className = "chat-header-btn";
      chatHelpBtn.textContent = "?";
      chatHelpBtn.title = "Help";
      const chatCloseBtn = document.createElement("button");
      chatCloseBtn.className = "chat-header-btn";
      chatCloseBtn.textContent = "X";
      chatCloseBtn.title = "Close";
      chatHeaderActions.appendChild(chatSettingsBtn);
      chatHeaderActions.appendChild(chatHelpBtn);
      chatHeaderActions.appendChild(chatCloseBtn);
      chatHeader.appendChild(chatTitle);
      chatHeader.appendChild(chatHeaderActions);
      const chatMessagesEl = document.createElement("div");
      chatMessagesEl.className = "chat-messages";
      const chatInputArea = document.createElement("div");
      chatInputArea.className = "chat-input-area";
      const chatInputEl = document.createElement("input");
      chatInputEl.className = "chat-input";
      chatInputEl.type = "text";
      chatInputEl.placeholder = "Type a message...";
      const chatSendBtn = document.createElement("button");
      chatSendBtn.className = "chat-send";
      chatSendBtn.textContent = "Send";
      chatInputArea.appendChild(chatInputEl);
      chatInputArea.appendChild(chatSendBtn);
      chatPanelEl.appendChild(chatHeader);
      chatPanelEl.appendChild(chatMessagesEl);
      chatPanelEl.appendChild(chatInputArea);
      const characterImg3 = document.createElement("img");
      characterImg3.className = "character";
      characterImg3.src = chrome.runtime.getURL(EMOTIONS.neutral);
      characterImg3.alt = "Companion";
      characterImg3.draggable = false;
      container2.appendChild(bubbleEl2);
      container2.appendChild(chatPanelEl);
      container2.appendChild(characterImg3);
      shadow2.appendChild(container2);
      const pos = await loadPosition();
      initEmotions(characterImg3);
      initBubble(
        { bubble: bubbleEl2, bubbleContent: bubbleContentEl2 },
        { isChatVisible: isChatVisible2, getPosition: getPosition3, onSpeakStart: startSpeakingAnim, onSpeakEnd: stopSpeakingAnim }
      );
      initChat(
        {
          panel: chatPanelEl,
          messages: chatMessagesEl,
          input: chatInputEl,
          closeBtn: chatCloseBtn,
          settingsBtn: chatSettingsBtn,
          helpBtn: chatHelpBtn,
          sendBtn: chatSendBtn
        },
        { getPosition: getPosition3 }
      );
      initDrag(container2, characterImg3, pos);
      setPosition(pos.x, pos.y);
      preloadSprites();
      attachMessageListeners();
      initDetox({ setBubbleTextAnimated, isChatVisible: isChatVisible2 });
      window.addEventListener("resize", clampToViewport);
      const WELCOME_MESSAGES = [
        "Hiii~! Click me, click me! Let's chat!",
        "Ohhh, a new page! Hehe~ come say hi!",
        "Psst... hey! I'm right here~ wanna talk?",
        "Yaaay, you're here! I missed you~!",
        "Hmm hmm~ just hanging out... click me if you wanna chat!",
        "Oh! Oh! Hi hi hi! I was waiting for you~!",
        "Ehehe~ don't mind me, just vibing... unless you wanna talk?",
        "Waaah, this page looks cool! ...Anyway, come chat with me!",
        "Hey hey~! Riko is here and ready to talk!",
        "Uhhh... is anyone there? Click me, I get lonely~!"
      ];
      const welcomeMsg = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
      setTimeout(() => {
        setBubbleTextAnimated(welcomeMsg);
      }, 500);
    }
    const host = document.createElement("div");
    host.id = "chrome-companion-host";
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "closed" });
    const observer = new MutationObserver(() => {
      if (!document.getElementById("chrome-companion-host")) {
        document.body.appendChild(host);
      }
    });
    observer.observe(document.body, { childList: true });
    initCompanion(shadow);
  })();
})();
