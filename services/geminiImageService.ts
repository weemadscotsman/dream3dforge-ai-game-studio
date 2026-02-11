/**
 * Gemini Image Generation Service
 * Uses Google Gemini API directly for image generation
 * Model: gemini-2.5-flash-image
 */

import { removeWhiteBackground } from './utils/imageProcessing';
import { getAPIKey } from '../config/apiKeys';

interface GenerateImageOptions {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
  removeBg?: boolean;
}

/**
 * Generate image using Gemini 2.0 Flash Experimental Image Generation
 */
export const generateGeminiImage = async (options: GenerateImageOptions): Promise<string> => {
  const { prompt, seed, removeBg = true } = options;

  console.log('[GeminiImage] Generating with gemini-2.5-flash-image...');

  const GEMINI_API_KEY = getAPIKey('gemini');
  
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            temperature: 1.0,
            seed: seed || Math.floor(Math.random() * 2147483647),
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GeminiImage] API Error:', response.status, errorText);
      throw new Error(`Gemini Image API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Extract image from response
    for (const candidate of data.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          const rawBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          
          if (removeBg) {
            console.log('[GeminiImage] Applying background removal...');
            try {
              return await removeWhiteBackground(rawBase64, 60);
            } catch (bgErr) {
              console.warn('[GeminiImage] BG removal failed, returning raw:', bgErr);
              return rawBase64;
            }
          }
          return rawBase64;
        }
      }
    }

    throw new Error('No image data found in Gemini response');

  } catch (error: any) {
    console.error('[GeminiImage] Generation failed:', error);
    throw error;
  }
};

/**
 * Batch generate images with consistent style
 */
export const generateImageBatch = async (
  basePrompt: string,
  actions: string[],
  options: Omit<GenerateImageOptions, 'prompt'> = {}
): Promise<Array<{ action: string; imageUrl: string }>> => {
  const results: Array<{ action: string; imageUrl: string }> = [];
  
  for (const action of actions) {
    const prompt = `${basePrompt} - ${action}`;
    try {
      const imageUrl = await generateGeminiImage({
        ...options,
        prompt,
        seed: options.seed // Keep consistent seed for style
      });
      results.push({ action, imageUrl });
    } catch (e) {
      console.error(`[GeminiImage] Failed for action ${action}:`, e);
      throw e;
    }
  }
  
  return results;
};

export default {
  generateGeminiImage,
  generateImageBatch
};
