import { localRouter } from "./localLLMRouter";

export interface GameBuild {
    code: string;
    optimized: boolean;
    runtime: 'threejs' | 'webgpu' | 'wasm';
}

class LocalCodeGenerator {

    async generateOptimizedGame(blueprint: any): Promise<GameBuild> {
        console.log("[CodeGenerator] Generating raw Three.js code...");
        // Phase 1: Generate raw Three.js code
        const rawCode = await localRouter.routeToModel('code', `
      Create Three.js game with:
      - Mechanics: ${blueprint.mechanics}
      - Architecture: ${blueprint.architecture}
      - Performance target: 60fps on integrated graphics
      
      Output ONLY the code block.
    `);

        // Phase 2: Static analysis and optimization
        const optimized = await this.optimizeCode(rawCode, {
            minify: true,
            treeShake: true,
            webGPU: true,
            wasm: false
        });

        return {
            code: optimized,
            optimized: true,
            runtime: 'threejs'
        };
    }

    private async optimizeCode(code: string, _options: any): Promise<string> {
        console.log("[CodeGenerator] Applying local AI optimizations...");
        // Use local AI to optimize code
        return await localRouter.routeToModel('code', `
      Optimize this Three.js game for web performance:
      ${code}
      
      Apply:
      1. Instanced rendering for repeated meshes
      2. Texture atlasing
      3. LOD system
      4. Frustum culling
      5. WebWorker for physics if needed
      
      Return optimized code ONLY.
    `);
    }
}

export const codeGenerator = new LocalCodeGenerator();
