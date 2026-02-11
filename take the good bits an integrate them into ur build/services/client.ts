
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURATION ---
// STRICTLY ENFORCED KIMI API KEY
const KIMI_API_KEY = "sk-kimi-6MdJ9jp64HeJOrsxg6KiV0IYy19tN7sl7o1SR1FH3FQnMAuQP3WdLp0dUcO7LwzG";
const GEMINI_API_KEY = process.env.API_KEY;

export interface AIProvider {
  generateContent(config: any): Promise<{ text: string | undefined }>;
}

export type ProviderType = 'KIMI' | 'GEMINI';

// --- KIMI (MOONSHOT) PROVIDER ---
class KimiProvider implements AIProvider {
  private apiKey: string;
  private baseUrl = "https://api.moonshot.cn/v1/chat/completions"; 

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(config: any): Promise<{ text: string | undefined }> {
    console.log("[KimiProvider] Processing request...");

    // 1. Adapter: Convert Gemini-style 'contents' to OpenAI/Kimi 'messages'
    let userPrompt = "";
    
    // Handle string content
    if (typeof config.contents === 'string') {
        userPrompt = config.contents;
    } 
    // Handle object/array content (Gemini Parts)
    else if (typeof config.contents === 'object') {
        if (config.contents.parts) {
             // Extract text parts, ignore images (Kimi is text/code only)
             userPrompt = config.contents.parts
                .filter((p: any) => p.text)
                .map((p: any) => p.text)
                .join("\n");
        } else if (Array.isArray(config.contents)) {
             userPrompt = JSON.stringify(config.contents);
        }
    }

    // 2. Adapter: Extract System Instructions and Schema
    let systemInstruction = "You are an expert game developer and software architect. Output clean, valid code.";
    
    if (config.config?.systemInstruction) {
        systemInstruction = config.config.systemInstruction;
    }

    // Schema enforcement for Kimi (since it doesn't support Gemini's native schema object)
    if (config.config?.responseSchema) {
        systemInstruction += "\n\nCRITICAL: You MUST output STRICT VALID JSON matching the following schema. Do NOT use markdown code blocks (```json). Just return the raw JSON string.\n\nSCHEMA:\n" + JSON.stringify(config.config.responseSchema, null, 2);
    }

    // 3. Construct Kimi Request
    // We map whatever model is requested to Moonshot's 128k model for maximum context
    const payload = {
        model: "moonshot-v1-128k", 
        messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
        ],
        temperature: config.config?.temperature ?? 0.3,
        top_p: config.config?.topP ?? 1.0, 
        // Map maxOutputTokens to max_tokens, default to 4096 for code generation
        max_tokens: config.config?.maxOutputTokens ?? 4096, 
        stream: false 
    };

    try {
        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[KimiProvider] API Error:", response.status, errorText);
            throw new Error(`Kimi API Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const resultText = data.choices?.[0]?.message?.content || "";
        
        return { text: resultText };

    } catch (e: any) {
        console.error("[KimiProvider] Request failed", e);
        throw e;
    }
  }
}

// --- GEMINI PROVIDER (Fallback/Assets Only) ---
class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string | undefined) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateContent(config: any) {
    return this.client.models.generateContent(config);
  }
}

// --- INITIALIZATION ---

let activeProvider: AIProvider;
let activeType: ProviderType = 'KIMI'; // Default strictly to Kimi

// Initialize
if (KIMI_API_KEY) {
    console.log("%c[System] Booting with KIMI CODE API (Key Configured)", "color: #0aff00; font-weight: bold;");
    activeProvider = new KimiProvider(KIMI_API_KEY);
    activeType = 'KIMI';
} else if (GEMINI_API_KEY) {
    console.warn("[System] Kimi Key missing. Fallback to Google Gemini API");
    activeProvider = new GeminiProvider(GEMINI_API_KEY);
    activeType = 'GEMINI';
} else {
    console.warn("[System] NO API KEYS FOUND.");
}

export const switchAIProvider = (type: ProviderType) => {
    console.log(`[AI Config] Switching provider to: ${type}`);
    if (type === 'KIMI') {
        if (!KIMI_API_KEY) throw new Error("Kimi API Key not configured.");
        activeProvider = new KimiProvider(KIMI_API_KEY);
        activeType = 'KIMI';
    } else {
        if (!GEMINI_API_KEY) throw new Error("Gemini API Key not configured.");
        activeProvider = new GeminiProvider(GEMINI_API_KEY);
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
