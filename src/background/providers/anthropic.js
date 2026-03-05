const ENDPOINT = 'https://api.anthropic.com/v1/messages';

export async function chat(apiKey, model, messages, systemPrompt, maxTokens) {
  const body = {
    model,
    system: systemPrompt,
    messages,
    max_tokens: maxTokens || 10240,
    temperature: 0.7,
  };

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}
