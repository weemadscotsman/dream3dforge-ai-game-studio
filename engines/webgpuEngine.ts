import { localRouter } from "../services/localLLMRouter";

export class WebGPUFirstEngine {
    async compileToWebGPU(threeJSCode: string): Promise<string> {
        console.log("[WebGPUEngine] Converting Three.js to WebGPU...");
        // Convert Three.js to WebGPU for 2-5x performance
        return await localRouter.routeToModel('code', `
      Convert this Three.js code to WebGPU:
      ${threeJSCode}
      
      Use:
      - @webgpu/glslang for shaders
      - GPU compute for physics
      - Render bundles for static content
      - Texture compression (BC7)
      
      Return optimized code ONLY.
    `);
    }
}

export class BevyWASMCompiler {
    async compileToBevy(blueprint: any): Promise<string> {
        console.log("[BevyCompiler] Generating Rust/Bevy code...");
        // Generate Rust code for Bevy ECS
        const rustCode = await localRouter.routeToModel('code', `
      Create Bevy ECS game with:
      - Components: ${blueprint.entities}
      - Systems: ${blueprint.mechanics}
      - Assets: ${blueprint.assets}
      
      Output Rust code ONLY.
    `);

        return rustCode;
    }
}

export const webgpuEngine = new WebGPUFirstEngine();
export const bevyCompiler = new BevyWASMCompiler();
