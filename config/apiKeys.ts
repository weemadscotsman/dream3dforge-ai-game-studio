/**
 * API Keys Configuration
 * 
 * HARDCODED MODE: All keys are embedded for seamless operation
 * 
 * Providers:
 * - OpenRouter: Code generation (google/gemini-3-flash-preview:free)
 * - Gemini: Image generation (gemini-2.0-flash-exp-image-generation)
 * - Gemini: Video generation (veo-2.0-generate-preview)
 */

// HARDCODED KEYS - Production Mode
export const USE_HARDCODED_KEYS = true;

// Legacy export for backward compatibility
export const HARDCODED_KEYS = {
  openrouter: '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',
  gemini: 'AIzaSyCYvV1QVQ--fLOSlNRAQA9oqFoouuxgUhE'
};

// OpenRouter Configuration
export const OPENROUTER_API_KEY = HARDCODED_KEYS.openrouter;

// Gemini Configuration (for images & video)
export const GEMINI_API_KEY = HARDCODED_KEYS.gemini;

// Model Configuration
export const MODELS = {
  // Code generation via OpenRouter
  code: {
    provider: 'openrouter',
    model: 'google/gemini-3-flash-preview:free',
    contextWindow: 128000,
    temperature: 0.3
  },
  
  // Image generation via Gemini
  image: {
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp-image-generation',
    temperature: 1.0
  },
  
  // Video generation via Gemini
  video: {
    provider: 'gemini',
    model: 'veo-2.0-generate-preview',
    resolution: '1080p'
  }
};

// Legacy exports for backward compatibility
export const OPENROUTER_MODELS = {
  code: MODELS.code.model,
  image: MODELS.image.model,
  video: MODELS.video.model
};

// API Key retrieval
export const getAPIKey = (provider: 'openrouter' | 'gemini' | string): string => {
  if (USE_HARDCODED_KEYS) {
    switch (provider) {
      case 'openrouter':
        return OPENROUTER_API_KEY;
      case 'gemini':
        return GEMINI_API_KEY;
      default:
        return HARDCODED_KEYS[provider] || '';
    }
  }
  return localStorage.getItem(`api_key_${provider}`) || '';
};

// Check if API keys are configured
export const hasAPIKeys = (): boolean => {
  return !!OPENROUTER_API_KEY && !!GEMINI_API_KEY;
};

// Get model configuration
export const getModelConfig = (type: 'code' | 'image' | 'video') => {
  return MODELS[type];
};
