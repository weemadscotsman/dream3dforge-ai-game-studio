import { localRouter } from "./localLLMRouter";
import { assetPipeline } from "./localAssetGenerator";
import { codeGenerator } from "./openSourceCompiler";
import { modelOptimizer } from "./modelOptimizer";
import { setupWizard } from "../setup/wizard";
import { privacyGuard } from "../features/privacyGuarantee";

export class SovereigntyService {
    private static instance: SovereigntyService;

    private constructor() { }

    static getInstance(): SovereigntyService {
        if (!SovereigntyService.instance) {
            SovereigntyService.instance = new SovereigntyService();
        }
        return SovereigntyService.instance;
    }

    /**
     * Complete local-only generation pipeline
     */
    async generateUniversalLocal(prompt: string, onStatus?: (status: string) => void) {
        if (onStatus) onStatus("Initializing Sovereign Stack...");

        // 1. Hardware Check & Optimization
        await modelOptimizer.prepareModelsForHardware();

        // 2. Blueprint Generation (Multi-model Orchestration)
        if (onStatus) onStatus("Orchestrating design models...");
        const blueprint = await localRouter.generateBlueprint(prompt);

        // 3. Asset Generation
        if (onStatus) onStatus("Generating local 3D assets...");
        const assets = await assetPipeline.generateCompleteAssets(blueprint);

        // 4. Code Generation & Optimization
        if (onStatus) onStatus("Compiling optimized game code...");
        const gameBuild = await codeGenerator.generateOptimizedGame({
            ...blueprint,
            assets
        });

        return {
            blueprint,
            assets,
            gameBuild,
            privacyReport: await privacyGuard.generatePrivacyReport()
        };
    }

    async runSetupWizard() {
        return await setupWizard.guidedSetup();
    }
}

export const sovereignty = SovereigntyService.getInstance();
