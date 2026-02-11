/**
 * API Keys Configuration
 * 
 * SECURE MODE: Keys loaded from environment variables
 * Create a .env file in project root with your keys:
 * 
 * VITE_OPENROUTER_API_KEY=your_key_here
 * VITE_GEMINI_API_KEY=your_key_here
 * VITE_KIMI_API_KEY=your_key_here
 */

// Load from environment (Vite exposes env vars prefixed with VITE_)
const getEnvKey = (key: string): string => {
  // @ts-ignore - import.meta.env is Vite-specific
  return import.meta.env?.[key] || '';
};

export const USE_HARDCODED_KEYS = false;

// API Keys from environment
export const OPENROUTER_API_KEY = getEnvKey('VITE_OPENROUTER_API_KEY');
export const GEMINI_API_KEY = getEnvKey('VITE_GEMINI_API_KEY');
export const KIMI_API_KEY = getEnvKey('VITE_KIMI_API_KEY');

// Validation
export const hasValidKeys = (): boolean => {
  return !!(OPENROUTER_API_KEY || GEMINI_API_KEY || KIMI_API_KEY);
};

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
