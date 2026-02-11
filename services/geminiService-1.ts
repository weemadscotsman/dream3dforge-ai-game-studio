import { GoogleGenAI } from "@google/genai";
import { ModelType, ImageSize, RenderStyle, VideoModel, AdvancedConfig } from "../types";

// Helper to convert Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data url prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to convert Base64 URL back to Blob (for Image-to-Image chaining)
export const base64ToBlob = async (base64Url: string): Promise<Blob> => {
  const res = await fetch(base64Url);
  return await res.blob();
};

interface GenerateOptions {
  prompt: string;
  sourceImage?: Blob | null;
  model: ModelType;
  style: RenderStyle;
  imageSize?: ImageSize;
  aspectRatio?: string;
  advancedConfig?: AdvancedConfig;
  runtimeSeed?: number; // Specific seed to use for this run
  // New Animation params
  assetType?: 'STATIC' | 'ANIMATION';
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
  assetType = 'STATIC',
  animationAction
}: GenerateOptions): Promise<string> => {
  
  let client: GoogleGenAI;
  const win = window as any;

  // Key Selection for Pro/Paid models
  if (model === ModelType.NANO_BANANA_PRO) {
    if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
        }
        // Always re-init client after key selection to ensure freshness
        client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
        client = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
    }
  } else {
      client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  const parts: any[] = [];
  const hasSource = !!sourceImage;

  if (sourceImage) {
    const base64Data = await blobToBase64(sourceImage);
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: sourceImage.type || 'image/png',
      },
    });
  }

  // --- TOKEN OPTIMIZED STYLE ENFORCEMENT ---
  let styleKeywords = "";
  if (style === RenderStyle.PRE_RENDERED_3D) {
      styleKeywords = "High-fi 3D render, isometric, clay material, ambient occlusion, soft lighting, Blender/UE5 style, 4k, PBR";
  } else {
      styleKeywords = "2D vector sprite, flat, clean thick outlines, cel-shaded, vibrant, sticker art, mobile game quality";
  }

  // If source image exists but no prompt, use a generic description trigger
  const effectivePrompt = prompt.trim() || (hasSource ? "this character" : "Game asset");

  // --- COMPRESSED PROMPT CONSTRUCTION ---
  let enhancedPrompt = "";
  let finalSystemInstruction = "";
  let finalAspectRatio = aspectRatio;

  if (assetType === 'ANIMATION') {
      // Force widescreen for sheets if 1:1 was selected
      if (finalAspectRatio === '1:1') finalAspectRatio = '16:9';

      const action = animationAction || "Walk Cycle";
      
      // OPTIMIZED IDENTITY LOCK (Telegraphic Style for Token Reduction)
      const identityBlock = hasSource 
        ? `[ID-LOCK] SOURCE IS TRUTH. ANIMATE EXACT CHAR. NO REDESIGN. MATCH STYLE/COLORS. Action: ${action}.`
        : `[CREATE] Design char: "${effectivePrompt}". Action: ${action}.`;

      enhancedPrompt = `
      Sprite Sheet. Action: ${action}.
      ${identityBlock}
      Style: ${styleKeywords}.
      Reqs: White BG, 6-8 frames, identical char details, no crop.
      `;

      finalSystemInstruction = hasSource 
        ? "Expert Game Animator. Source image = exact character reference. Animate action. Output clean sprite sheet on white. ID LOCK ACTIVE."
        : "Expert Game Animator. Create character. Animate smooth action. Clean sheet.";

  } else {
      // STATIC ASSET LOGIC
      const identityBlock = hasSource
        ? `[ID-LOCK] Render Source as ${style === RenderStyle.PRE_RENDERED_3D ? 'High-Fi 3D' : 'Clean 2D Vector'}. KEEP ID.`
        : `Create: ${effectivePrompt}.`;

      enhancedPrompt = `
      Game Asset.
      ${identityBlock}
      Style: ${styleKeywords}.
      Reqs: Isolated on White (#FFFFFF). Production ready.
      `;
      
      finalSystemInstruction = "Game Asset Gen. Output clean, isolated assets on white. Maintain identity if source provided.";
  }

  parts.push({ text: enhancedPrompt });

  // Base Config
  const config: any = {
    imageConfig: {
        aspectRatio: finalAspectRatio,
    },
    systemInstruction: finalSystemInstruction
  };

  if (model === ModelType.NANO_BANANA_PRO) {
    config.imageConfig.imageSize = imageSize;
  }

  // Inject Advanced Config if present
  if (advancedConfig) {
    config.temperature = advancedConfig.temperature;
    config.topP = advancedConfig.topP;
    config.topK = advancedConfig.topK;
    
    // Use runtime seed if provided, otherwise fallback to config seed
    if (runtimeSeed !== undefined) {
        config.seed = runtimeSeed;
    } else if (advancedConfig.seed > 0) {
        config.seed = advancedConfig.seed;
    }

    if (advancedConfig.systemInstruction) {
        // Append user override to our strict instruction
        config.systemInstruction = finalSystemInstruction + " " + advancedConfig.systemInstruction;
    }
  }

  try {
    const response = await client.models.generateContent({
      model: model, // Defaults to 'gemini-2.5-flash-image' (Nano Banana) or Pro
      contents: { parts: parts },
      config: config,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

// --- Video Generation (Veo) ---

interface VideoGenerateOptions {
  prompt: string;
  sourceImage?: Blob | null;
  model: VideoModel;
  aspectRatio?: string;
}

export const generateVeoVideo = async ({
    prompt,
    sourceImage,
    model,
    aspectRatio = "16:9"
}: VideoGenerateOptions): Promise<string> => {
    
    // FIX 1: Sanitize Aspect Ratio
    // Veo only supports 16:9 and 9:16. 1:1 causes 400 Invalid Argument.
    let safeAspectRatio = aspectRatio;
    const validRatios = ['16:9', '9:16'];
    if (!validRatios.includes(safeAspectRatio)) {
        console.warn(`Veo aspect ratio correction: ${aspectRatio} -> 16:9`);
        safeAspectRatio = '16:9';
    }

    const win = window as any;
    
    // Helper to perform the request, allowing for a retry if auth fails
    const performRequest = async (forceAuth = false) => {
        // FIX 2: Stronger Auth Check
        if (win.aistudio) {
            // Check if we need to force selection or if no key is selected
            if (forceAuth || !(await win.aistudio.hasSelectedApiKey())) {
                await win.aistudio.openSelectKey();
            }
        }

        // Always re-init client to grab the latest process.env.API_KEY injected by the platform
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
        // Check for 403 Permission Denied or 400/404 indicating key issues or "caller does not have permission"
        const errMsg = error.toString().toLowerCase();
        if (errMsg.includes("permission") || errMsg.includes("403") || errMsg.includes("not found")) {
            console.log("Triggering re-auth for Veo (403/Permission)...");
            // Retry with forced key selection
            operation = await performRequest(true);
        } else {
            throw error;
        }
    }

    // Polling logic
    // We create a new client just to be safe for polling, using the env key
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await client.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation completed but no URI returned.");

    // FIX 3: Download content immediately to prevent empty file/link rot
    try {
        const downloadUrl = `${videoUri}&key=${process.env.API_KEY}`;
        const res = await fetch(downloadUrl);
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        
        const blob = await res.blob();
        const base64 = await blobToBase64(blob);
        
        // Return Data URL so it is fully contained and works with download attributes
        return `data:video/mp4;base64,${base64}`;
    } catch (e) {
        console.error("Failed to download video content:", e);
        throw new Error("Video generated successfully, but failed to download/process the file bytes.");
    }
};