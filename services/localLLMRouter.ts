import { localAI } from "./localModelService";

export interface LocalModelConfig {
    name: string;
    size: number; // GB
    vRAM: number; // Minimum VRAM
    capabilities: ('reasoning' | 'code' | 'design')[];
}

export const LOCAL_MODELS: LocalModelConfig[] = [
    {
        name: 'Qwen2.5-Coder-32B-Instruct',
        size: 18.2,
        vRAM: 24,
        capabilities: ['code', 'reasoning'],
        // Specialized for code, beats GPT-4 on HumanEval
    },
    {
        name: 'Llama-3.2-11B-Vision-Instruct',
        size: 6.5,
        vRAM: 8,
        capabilities: ['design', 'reasoning'],
        // Multimodal, understands game design docs + images
    },
    {
        name: 'Phi-3-mini-128k-instruct',
        size: 1.4,
        vRAM: 4,
        capabilities: ['reasoning'],
        // Fast, efficient for prototyping
    },
    {
        name: 'DeepSeek-Coder-V2-Lite',
        size: 29,
        vRAM: 32,
        capabilities: ['code', 'reasoning', 'design'],
        // State-of-the-art code generation
    }
];

export type TaskType = 'reasoning' | 'code' | 'design';

class LocalLLMOrchestrator {

    async routeToModel(task: TaskType, prompt: string): Promise<string> {
        // Find a model that supports the capability
        const model = LOCAL_MODELS.find(m => m.capabilities.includes(task))?.name || 'phi3:mini';

        console.log(`[LocalOrchestrator] Routing ${task} task to ${model}`);

        // Use localAI to generate content
        const response = await localAI.generateContent({
            model: model,
            contents: prompt
        });

        return response.text || "";
    }

    async generateBlueprint(prompt: string): Promise<any> {
        // Step 1: Design reasoning with specialized model
        const design = await this.routeToModel('design', `
      As a game designer, analyze: "${prompt}"
      
      Generate structured analysis:
      1. Core gameplay loop
      2. Target audience and ESRB rating
      3. Technical constraints
      4. Monetization viability
    `);

        // Step 2: Mechanics specification
        const mechanics = await this.routeToModel('reasoning', `
      Based on design: ${design}
      
      Specify exact mechanics:
      - Input mappings
      - Physics parameters
      - Progression systems
      - Save/load requirements
    `);

        // Step 3: Architecture planning
        const architecture = await this.routeToModel('code', `
      Design technical architecture for:
      ${mechanics}
      
      Output:
      - Three.js component structure
      - Shader requirements
      - Audio system design
      - Performance budget
    `);

        return { design, mechanics, architecture };
    }
}

export const localRouter = new LocalLLMOrchestrator();
