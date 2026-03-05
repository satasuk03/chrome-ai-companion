import {
  SETTINGS_KEY,
  SETTINGS_DEFAULTS,
  DETOX_INTERVAL_MIN,
  DETOX_INTERVAL_MAX,
  DETOX_MESSAGES,
} from './constants.js';

let setBubbleTextAnimated = null;
let isChatVisible = () => false;
let nagTimer = null;
let lastMessageIndex = -1;

export function initDetox(deps) {
  setBubbleTextAnimated = deps.setBubbleTextAnimated;
  isChatVisible = deps.isChatVisible;

  loadSettings().then(evaluate);

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[SETTINGS_KEY]) {
      const settings = { ...SETTINGS_DEFAULTS, ...changes[SETTINGS_KEY].newValue };
      evaluate(settings);
    }
  });
}

async function loadSettings() {
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
  return sitesText.split('\n').some((domain) => {
    const d = domain.trim().toLowerCase();
    return d && hostname.includes(d);
  });
}

function scheduleNag() {
  const delay =
    DETOX_INTERVAL_MIN + Math.random() * (DETOX_INTERVAL_MAX - DETOX_INTERVAL_MIN);
  nagTimer = setTimeout(() => {
    if (!isChatVisible()) {
      setBubbleTextAnimated(pickMessage());
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
