const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function chat(apiKey, model, messages, systemPrompt, maxTokens) {
  const endpoint = `${BASE_URL}/${model}:generateContent`;

  // Convert normalized messages to Gemini format
  const contents = messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: maxTokens || 10240,
      temperature: 0.7,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `Gemini API error: ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
