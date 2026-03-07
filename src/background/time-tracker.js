import {
  TIME_TRACKING_KEY,
  TIME_TRACKING_ALARM,
  TIME_TRACKING_FLUSH_INTERVAL,
  IDLE_THRESHOLD_SECONDS,
} from '../constants.js';

// ── Module state ────────────────────────────────────────────────────
let currentDomain = null;
let trackingStartTime = null;
let isWindowFocused = true;
let isIdle = false;

// ── Domain extraction ───────────────────────────────────────────────
function extractDomain(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol === 'chrome:' || u.protocol === 'chrome-extension:') return null;
    return u.hostname;
  } catch {
    return null;
  }
}

// ── Tracking helpers ────────────────────────────────────────────────
function startTracking(domain) {
  currentDomain = domain;
  trackingStartTime = domain ? Date.now() : null;
}

function stopTracking() {
  flushElapsed();
  currentDomain = null;
  trackingStartTime = null;
}

function shouldTrack() {
  return isWindowFocused && !isIdle;
}

async function flushElapsed() {
  if (!currentDomain || !trackingStartTime) return;

  const elapsed = Date.now() - trackingStartTime;
  trackingStartTime = Date.now();

  if (elapsed < 1000) return;

  const result = await chrome.storage.local.get(TIME_TRACKING_KEY);
  const data = result[TIME_TRACKING_KEY] || {};
  data[currentDomain] = (data[currentDomain] || 0) + elapsed;
  await chrome.storage.local.set({ [TIME_TRACKING_KEY]: data });
}

// ── Update active tab ───────────────────────────────────────────────
async function updateActiveTab() {
  if (!shouldTrack()) {
    stopTracking();
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const domain = tab ? extractDomain(tab.url) : null;

    if (domain !== currentDomain) {
      await flushElapsed();
      startTracking(domain);
    }
  } catch {
    stopTracking();
  }
}

// ── Restore state on service worker restart ─────────────────────────
async function restoreState() {
  try {
    const state = await chrome.idle.queryState(IDLE_THRESHOLD_SECONDS);
    isIdle = state !== 'active';

    const win = await chrome.windows.getLastFocused();
    isWindowFocused = win.focused;
  } catch {
    isWindowFocused = false;
    isIdle = false;
  }

  await updateActiveTab();
}

// ── Init ────────────────────────────────────────────────────────────
export function initTimeTracker() {
  chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);

  // Tab switched
  chrome.tabs.onActivated.addListener(() => updateActiveTab());

  // In-tab navigation
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.url) updateActiveTab();
  });

  // Chrome window focus changed
  chrome.windows.onFocusChanged.addListener((windowId) => {
    isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
    updateActiveTab();
  });

  // Idle state changed
  chrome.idle.onStateChanged.addListener((state) => {
    isIdle = state !== 'active';
    updateActiveTab();
  });

  // Periodic flush alarm
  chrome.alarms.create(TIME_TRACKING_ALARM, {
    periodInMinutes: TIME_TRACKING_FLUSH_INTERVAL,
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === TIME_TRACKING_ALARM) {
      flushElapsed();
    }
  });

  // Message handlers
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_TIME_TRACKING_DATA') {
      flushElapsed().then(() => {
        chrome.storage.local.get(TIME_TRACKING_KEY, (result) => {
          sendResponse({ success: true, data: result[TIME_TRACKING_KEY] || {} });
        });
      });
      return true;
    }

    if (message.type === 'CLEAR_TIME_TRACKING_DATA') {
      stopTracking();
      chrome.storage.local.remove(TIME_TRACKING_KEY, () => {
        startTracking(currentDomain);
        sendResponse({ success: true });
      });
      return true;
    }
  });

  // Restore state on startup
  restoreState();
}
