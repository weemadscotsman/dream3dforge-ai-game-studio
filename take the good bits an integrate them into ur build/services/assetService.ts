
import { GoogleGenAI } from "@google/genai";
import { ModelType, ImageSize, RenderStyle, VideoModel, AdvancedConfig, AssetGenerationMode } from "../types";
import { blobToBase64 } from "./utils/fileUtils";
import { removeWhiteBackground } from "./utils/imageProcessing";

interface GenerateOptions {
  prompt: string;
  sourceImage?: File | null;
  model: ModelType;
  // Provider removed - strictly Gemini now
  style: RenderStyle;
  imageSize?: ImageSize;
  aspectRatio?: string;
  advancedConfig?: AdvancedConfig;
  runtimeSeed?: number;
  assetMode?: AssetGenerationMode;
  animationAction?: string;
}

// --- Image Generation ---

export const generateGameAsset = async ({
  prompt,
  sourceImage,
  model,
  style,
  imageSize = ImageSize.SIZE_1K,
  aspectRatio = "1:1",
  advancedConfig,
  runtimeSeed,
  assetMode = AssetGenerationMode.SPRITE,
  animationAction
}: GenerateOptions): Promise<string> => {
  
  // 1. STYLE & PROMPT ENGINEERING
  let styleKeywords = "";
  if (style === RenderStyle.PRE_RENDERED_3D) {
      styleKeywords = "High-fi 3D render, isometric, clay material, ambient occlusion, soft lighting, Blender/UE5 style, 4k, PBR";
  } else {
      styleKeywords = "2D vector sprite, flat, clean thick outlines, cel-shaded, vibrant, sticker art, mobile game quality";
  }

  const effectivePrompt = prompt.trim() || (sourceImage ? "this character" : "Game asset");
  const bgRequirement = "ISOLATED ON PURE WHITE BACKGROUND (#FFFFFF). NO SHADOWS. NO GRADIENTS.";
  let enhancedPrompt = "";
  
  if (assetMode === AssetGenerationMode.SHEET) {
      enhancedPrompt = `Sprite Sheet: ${animationAction}. ${effectivePrompt}. Style: ${styleKeywords}. ${bgRequirement} Grid layout.`;
  } else if (assetMode === AssetGenerationMode.TEXTURE) {
      enhancedPrompt = `Seamless Texture. ${effectivePrompt}. Top-down pattern. PBR ready.`;
  } else {
      enhancedPrompt = `Game Asset: ${effectivePrompt}. Style: ${styleKeywords}. ${bgRequirement}`;
  }

  // --- PROCESSING HELPER ---
  const processResult = async (rawBase64: string): Promise<string> => {
       if (assetMode !== AssetGenerationMode.TEXTURE) {
            console.log("Applying Auto-Background Removal...");
            try {
                // Using higher tolerance to catch compression artifacts
                return await removeWhiteBackground(rawBase64, 60);
            } catch (bgErr) {
                console.warn("Background removal failed, returning raw image.", bgErr);
                return rawBase64;
            }
        }
        return rawBase64;
  };

  // --- GOOGLE GEMINI LOGIC (Strict) ---

  let client: GoogleGenAI;
  const win = window as any;

  if (model === ModelType.NANO_BANANA_PRO) {
    if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
        }
        client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
        client = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
    }
  } else {
      client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  const parts: any[] = [];
  if (sourceImage) {
    const base64Data = await blobToBase64(sourceImage);
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: sourceImage.type || 'image/png',
      },
    });
  }

  parts.push({ text: enhancedPrompt });

  const config: any = {
    imageConfig: { aspectRatio: aspectRatio },
    systemInstruction: "Game Asset Gen. Output clean, isolated assets on solid white #FFFFFF."
  };

  if (model === ModelType.NANO_BANANA_PRO) {
    config.imageConfig.imageSize = imageSize;
  }

  // Advanced Config Injection
  if (advancedConfig) {
    if (runtimeSeed !== undefined) config.seed = runtimeSeed;
    else if (advancedConfig.seed > 0) config.seed = advancedConfig.seed;
    
    // Inject Bleeding Edge params if present
    if (advancedConfig.temperature) config.temperature = advancedConfig.temperature;
    if (advancedConfig.topP) config.topP = advancedConfig.topP;
    if (advancedConfig.topK) config.topK = advancedConfig.topK;
    if (advancedConfig.systemInstruction) config.systemInstruction += " " + advancedConfig.systemInstruction;
  }

  try {
    const response = await client.models.generateContent({
      model: model, 
      contents: { parts: parts },
      config: config,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const rawBase64 = `data:image/png;base64,${part.inlineData.data}`;
        return await processResult(rawBase64);
      }
    }
    throw new Error("No image data found in response");

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    
    if (error.message?.includes("429") || error.toString().includes("RESOURCE_EXHAUSTED")) {
        console.warn("Google Image Quota Exceeded.");
        throw new Error("Google Quota Exceeded (429). Please try again later.");
    }
    throw error;
  }
};

// --- Video Generation (Veo) ---
interface VideoGenerateOptions {
  prompt: string;
  sourceImage?: File | null;
  model: VideoModel;
  aspectRatio?: string;
}

export const generateVeoVideo = async ({
    prompt,
    sourceImage,
    model,
    aspectRatio = "16:9"
}: VideoGenerateOptions): Promise<string> => {
    let safeAspectRatio = aspectRatio;
    const validRatios = ['16:9', '9:16'];
    if (!validRatios.includes(safeAspectRatio)) safeAspectRatio = '16:9';

    const win = window as any;
    
    const performRequest = async (forceAuth = false) => {
        if (win.aistudio) {
            if (forceAuth || !(await win.aistudio.hasSelectedApiKey())) {
                await win.aistudio.openSelectKey();
            }
        }
        const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const videoConfig: any = {
            numberOfVideos: 1,
            resolution: '1080p',
            aspectRatio: safeAspectRatio,
        };

        if (sourceImage) {
            const base64Data = await blobToBase64(sourceImage);
            return await client.models.generateVideos({
                model: model,
                prompt: prompt,
                image: {
                    imageBytes: base64Data,
                    mimeType: sourceImage.type || 'image/png'
                },
                config: videoConfig
            });
        } else {
            return await client.models.generateVideos({
                model: model,
                prompt: prompt,
                config: videoConfig
            });
        }
    };

    let operation;
    try {
        operation = await performRequest(false);
    } catch (error: any) {
        console.error("Veo Initial Attempt Failed:", error);
        const errMsg = error.toString().toLowerCase();
        if (errMsg.includes("permission") || errMsg.includes("403") || errMsg.includes("not found")) {
            console.log("Triggering re-auth for Veo...");
            operation = await performRequest(true);
        } else {
            throw error;
        }
    }

    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await client.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation completed but no URI returned.");

    try {
        const downloadUrl = `${videoUri}&key=${process.env.API_KEY}`;
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        const blob = await res.blob();
        const base64 = await blobToBase64(blob);
        return `data:video/mp4;base64,${base64}`;
    } catch (e) {
        console.error("Failed to download video content:", e);
        throw new Error("Video generated successfully, but failed to download/process the file bytes.");
    }
};
