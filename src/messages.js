import { setEmotion } from './emotions.js';
import { setBubbleText, setBubbleTextAnimated } from './bubble.js';

export function attachMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'SET_EMOTION':
        setEmotion(message.emotion);
        sendResponse({ success: true });
        break;
      case 'SET_BUBBLE_TEXT':
        setBubbleText(message.text);
        sendResponse({ success: true });
        break;
      case 'SET_BUBBLE_TEXT_ANIMATED':
        setBubbleTextAnimated(message.text, message.speed);
        sendResponse({ success: true });
        break;
      case 'SET_EMOTION_AND_TEXT':
        setEmotion(message.emotion);
        setBubbleTextAnimated(message.text);
        sendResponse({ success: true });
        break;
    }
  });
}
