import { GoogleGenAI } from "@google/genai";
import { OPENROUTER_API_KEY, CODE_MODEL, makeOpenRouterRequest } from "../config/openRouterConfig";
import { GEMINI_API_KEY } from "../config/apiKeys";

// --- CONFIGURATION ---
// Use hardcoded keys from config files
const HARDCODED_GEMINI_KEY = GEMINI_API_KEY;

export interface AIProvider {
  generateContent(config: any): Promise<{ text: string | undefined }>;
}

export type ProviderType = 'OPENROUTER' | 'GEMINI';

// --- OPENROUTER PROVIDER (Primary) ---
class OpenRouterProvider implements AIProvider {
  private defaultModel: string;

  constructor(model: string) {
    this.defaultModel = model;
  }

  async generateContent(config: any): Promise<{ text: string | undefined }> {
    // Use model from config if provided, otherwise use default
    const model = config.model || this.defaultModel;
    console.log(`[OpenRouterProvider] Using model: ${model}`);

    // Convert Gemini-style config to OpenRouter format
    let userPrompt = "";
    
    if (typeof config.contents === 'string') {
        userPrompt = config.contents;
    } else if (typeof config.contents === 'object') {
        if (config.contents.parts) {
             userPrompt = config.contents.parts
                .filter((p: any) => p.text)
                .map((p: any) => p.text)
                .join("\n");
        } else if (Array.isArray(config.contents)) {
             userPrompt = JSON.stringify(config.contents);
        }
    }

    let systemInstruction = "You are an expert game developer and software architect. Output clean, valid code.";
    
    if (config.config?.systemInstruction) {
        systemInstruction = config.config.systemInstruction;
    }

    if (config.config?.responseSchema) {
        systemInstruction += "\n\nCRITICAL: You MUST output STRICT VALID JSON matching the following schema. Do NOT use markdown code blocks. Just return the raw JSON string.\n\nSCHEMA:\n" + JSON.stringify(config.config.responseSchema, null, 2);
    }

    const messages = [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
    ];

    try {
        const result = await makeOpenRouterRequest(
            model,
            messages,
            config.config?.temperature ?? 0.3,
            config.config?.maxOutputTokens ?? 4096
        );
        
        return { text: result };
    } catch (e: any) {
        console.error("[OpenRouterProvider] Request failed", e);
        throw e;
    }
  }
}

// --- GEMINI PROVIDER (Fallback) ---
class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateContent(config: any) {
    return this.client.models.generateContent(config);
  }
}

// --- INITIALIZATION ---

let activeProvider: AIProvider;
let activeType: ProviderType = 'OPENROUTER'; // Default to OpenRouter

// Initialize with OpenRouter
if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== 'YOUR_OPENROUTER_KEY_HERE') {
    console.log("%c[System] Booting with OpenRouter API (Gemini 3 Flash)", "color: #0aff00; font-weight: bold;");
    activeProvider = new OpenRouterProvider(CODE_MODEL);
    activeType = 'OPENROUTER';
} else if (HARDCODED_GEMINI_KEY) {
    console.warn("[System] OpenRouter key missing. Fallback to Google Gemini API");
    activeProvider = new GeminiProvider(HARDCODED_GEMINI_KEY);
    activeType = 'GEMINI';
} else {
    console.warn("[System] NO API KEYS FOUND.");
}

export const switchAIProvider = (type: ProviderType) => {
    console.log(`[AI Config] Switching provider to: ${type}`);
    if (type === 'OPENROUTER') {
        if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'YOUR_OPENROUTER_KEY_HERE') {
            throw new Error("OpenRouter API Key not configured.");
        }
        activeProvider = new OpenRouterProvider(CODE_MODEL);
        activeType = 'OPENROUTER';
    } else {
        if (!HARDCODED_GEMINI_KEY) throw new Error("Gemini API Key not configured.");
        activeProvider = new GeminiProvider(HARDCODED_GEMINI_KEY);
        activeType = 'GEMINI';
    }
    return activeType;
};

export const getAIClient = (): AIProvider => {
  return activeProvider;
};

export const getActiveProviderType = (): ProviderType => {
    return activeType;
};
