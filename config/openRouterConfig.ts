/**
 * OpenRouter Configuration - HARDCODED
 * All API calls routed through OpenRouter
 */

// HARDCODED OPENROUTER API KEY
export const OPENROUTER_API_KEY = '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';

// Model for Images/Assets (Gemini 3 Flash Preview)
export const IMAGE_MODEL = 'google/gemini-3-flash-preview';

// Model for Video Generation (GLM 4.6V)
export const VIDEO_MODEL = 'z-ai/glm-4.6v';

// Model for Game Code Generation (Gemini 3 Flash Preview - good for coding)
export const CODE_MODEL = 'google/gemini-3-flash-preview';

// OpenRouter Base URL
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Helper to make OpenRouter requests
export const makeOpenRouterRequest = async (model: string, messages: any[], temperature = 0.7, maxTokens = 4096) => {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': window.location.href,
      'X-Title': 'CANN.ON.AI 3DREAMFORGE'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter Error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
};

export default {
  OPENROUTER_API_KEY,
  IMAGE_MODEL,
  VIDEO_MODEL,
  CODE_MODEL,
  OPENROUTER_BASE_URL,
  makeOpenRouterRequest
};
