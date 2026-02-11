// Native implementation to avoid 'ollama' package dependency issues in browser
export interface LocalModelConfig {
    host: string;
    model: string;
    temperature?: number;
    systemPrompt?: string;
}

export class LocalModelService {
    private host: string;

    constructor(host: string = 'http://localhost:11434') {
        this.host = host;
    }

    /**
     * Update the host address
     */
    setHost(host: string) {
        this.host = host;
    }

    /**
     * Internal request carrier
     */
    private async request(endpoint: string, body: any) {
        const baseUrl = this.host.replace(/\/$/, '');

        // Try to detect if it's Ollama or OpenAI-compatible (LM Studio)
        const isStandardOllama = !baseUrl.includes('/v1');
        const url = isStandardOllama ? `${baseUrl}/api/${endpoint}` : `${baseUrl}/${endpoint}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Local AI API Error (${response.status}): ${text}`);
            }

            return await response.json();
        } catch (error) {
            console.error("Local AI Request Failed:", error);
            throw error;
        }
    }

    /**
     * Generate text completion
     */
    async generateText(prompt: string, config: Partial<LocalModelConfig> = {}): Promise<string> {
        const response = await this.request('generate', {
            model: config.model || 'llama3',
            prompt: prompt,
            system: config.systemPrompt,
            stream: false,
            options: {
                temperature: config.temperature || 0.7,
            }
        });
        return response.response;
    }

    /**
     * Generate JSON output
     * Tries to force JSON mode if supported, or parses text
     */
    async generateJSON(prompt: string, config: Partial<LocalModelConfig> = {}): Promise<any> {
        try {
            const response = await this.request('generate', {
                model: config.model || 'llama3',
                prompt: prompt,
                system: config.systemPrompt ? config.systemPrompt + "\nOutput strictly valid JSON." : "You are a JSON generator. Output strictly valid JSON.",
                format: 'json', // Force JSON mode in Ollama
                stream: false,
                options: {
                    temperature: config.temperature || 0.7,
                }
            });

            // If format: 'json' works, response.response should be parseable
            return JSON.parse(response.response);
        } catch (error) {
            console.warn("JSON Gen failed or parse error, attempting fallback...", error);

            // Fallback: Try standard text generation and extraction
            const textHTML = await this.generateText(prompt + "\n\nOUTPUT ONLY RAW JSON.", config);

            try {
                // Try naive parse
                return JSON.parse(textHTML);
            } catch (_e) {
                // Use a relaxed extractor
                const match = textHTML.match(/\{[\s\S]*\}$/);
                if (match) {
                    try {
                        return JSON.parse(match[0]);
                    } catch (e2: any) {
                        throw new Error("Extracted text was not valid JSON: " + e2.message);
                    }
                }
                throw new Error("Could not find JSON in response.");
            }
        }
    }

    /**
     * Adapter to match Google GenAI's generateContent signature
     * allowing for easier swap-in
     */
    async generateContent(params: {
        model: string,
        contents: any, // simplified
        config?: any
    }) {
        // Extract prompt from Google's complex content structure
        let promptText = "";
        if (typeof params.contents === 'string') {
            promptText = params.contents;
        } else if (Array.isArray(params.contents)) {
            // Handle array of parts
            promptText = params.contents.map(c => c.parts?.map((p: any) => p.text).join('') || '').join('\n');
        } else {
            // Fallback
            promptText = JSON.stringify(params.contents);
        }

        const isJson = params.config?.responseMimeType === 'application/json';

        const result = isJson
            ? await this.generateJSON(promptText, { model: params.model })
            : await this.generateText(promptText, { model: params.model });

        // Return structure matching Google's response.text() pattern
        return {
            text: typeof result === 'string' ? result : JSON.stringify(result)
        };
    }
}

// Singleton instance
export const localAI = new LocalModelService();
