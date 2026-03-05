import * as openai from './providers/openai.js';
import * as anthropic from './providers/anthropic.js';
import * as gemini from './providers/gemini.js';

const adapters = { openai, anthropic, gemini };

export async function chat(provider, apiKey, model, messages, systemPrompt, maxTokens) {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  return adapter.chat(apiKey, model, messages, systemPrompt, maxTokens);
}
