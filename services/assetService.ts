
import { GoogleGenAI } from "@google/genai";
import { ModelType, ImageSize, RenderStyle, VideoModel, AdvancedConfig, AssetGenerationMode, ImageProvider } from "../types";
import { blobToBase64 } from "./utils/fileUtils";
import { removeWhiteBackground } from "./utils/imageProcessing";
import { generateGeminiImage } from "./geminiImageService";
import { GEMINI_API_KEY } from "../config/apiKeys";

interface GenerateOptions {
  prompt: string;
  sourceImage?: File | null;
  model: ModelType;
  provider: ImageProvider;
  style: RenderStyle;
  imageSize?: ImageSize;
  aspectRatio?: string;
  advancedConfig?: AdvancedConfig;
  runtimeSeed?: number;
  assetMode?: AssetGenerationMode;
  animationAction?: string;
}

// Hardcoded Gemini API Key from config
const HARDCODED_GEMINI_KEY = GEMINI_API_KEY;

// --- Image Generation ---

export const generateGameAsset = async ({
  prompt,
  sourceImage,
  model,
  provider = ImageProvider.GEMINI,
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

  // --- GEMINI IMAGE GENERATION (Primary) ---
  if (provider === ImageProvider.GEMINI) {
    const seed = (advancedConfig?.seed && advancedConfig.seed > 0) 
      ? advancedConfig.seed 
      : (runtimeSeed || Math.floor(Math.random() * 2147483647));
    
    try {
      const imageUrl = await generateGeminiImage({
        prompt: enhancedPrompt,
        seed,
        removeBg: assetMode !== AssetGenerationMode.TEXTURE
      });
      
      return imageUrl;
    } catch (error: any) {
      console.error("[AssetService] Gemini Image Generation Error:", error);
      throw new Error(`Image generation failed: ${error.message}`);
    }
  }

  // --- GOOGLE GENAI SDK (for image editing with source) ---
  if (!HARDCODED_GEMINI_KEY) {
      throw new Error("No Gemini API key configured. Please check config/apiKeys.ts");
  }

  const client = new GoogleGenAI({ apiKey: HARDCODED_GEMINI_KEY });

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

  if (advancedConfig) {
    if (runtimeSeed !== undefined) config.seed = runtimeSeed;
    else if (advancedConfig.seed > 0) config.seed = advancedConfig.seed;
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
        
        if (assetMode !== AssetGenerationMode.TEXTURE) {
            console.log("Applying Auto-Background Removal...");
            try {
                return await removeWhiteBackground(rawBase64, 40);
            } catch (bgErr) {
                console.warn("Background removal failed, returning raw image.", bgErr);
                return rawBase64;
            }
        }
        return rawBase64;
      }
    }
    throw new Error("No image data found in response");

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
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
    if (!HARDCODED_GEMINI_KEY) {
        throw new Error("No Gemini API key configured for video generation");
    }

    let safeAspectRatio = aspectRatio;
    const validRatios = ['16:9', '9:16'];
    if (!validRatios.includes(safeAspectRatio)) safeAspectRatio = '16:9';

    const client = new GoogleGenAI({ apiKey: HARDCODED_GEMINI_KEY });
    
    const videoConfig: any = {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: safeAspectRatio,
    };

    let operation;
    try {
        if (sourceImage) {
            const base64Data = await blobToBase64(sourceImage);
            operation = await client.models.generateVideos({
                model: model,
                prompt: prompt,
                image: {
                    imageBytes: base64Data,
                    mimeType: sourceImage.type || 'image/png'
                },
                config: videoConfig
            });
        } else {
            operation = await client.models.generateVideos({
                model: model,
                prompt: prompt,
                config: videoConfig
            });
        }
    } catch (error: any) {
        console.error("Veo Generation Failed:", error);
        throw error;
    }

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await client.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation completed but no URI returned.");

    try {
        const downloadUrl = `${videoUri}&key=${HARDCODED_GEMINI_KEY}`;
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
