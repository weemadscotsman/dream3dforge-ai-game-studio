import { VisualStyle, Atmosphere, EnvironmentType } from '../../types';

/**
 * VISUAL PRESETS
 * One-click visual themes that set multiple parameters at once.
 * Makes it easy for users who know what "vibe" they want but can't articulate settings.
 */

export interface VisualPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  preview: {
    gradient: string;
    accent: string;
  };
  settings: {
    visualStyle: VisualStyle;
    atmosphere: Atmosphere;
    environment?: EnvironmentType;
  };
  // Color hints for the AI
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  shaderHints: string[];
}

export const VISUAL_PRESETS: VisualPreset[] = [
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    description: 'Dark backgrounds, electric colors, bloom everywhere',
    icon: '🌆',
    preview: {
      gradient: 'from-purple-900 via-pink-800 to-cyan-900',
      accent: '#ff00ff'
    },
    settings: {
      visualStyle: VisualStyle.Cyberpunk,
      atmosphere: Atmosphere.Neon
    },
    colorPalette: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      accent: '#ff6600',
      background: '#0a0014'
    },
    shaderHints: ['bloom', 'chromatic aberration', 'scanlines', 'glow']
  },
  {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    description: 'Pixel-perfect, CRT vibes, classic game colors',
    icon: '👾',
    preview: {
      gradient: 'from-green-900 via-black to-green-900',
      accent: '#00ff00'
    },
    settings: {
      visualStyle: VisualStyle.Retro,
      atmosphere: Atmosphere.Dark
    },
    colorPalette: {
      primary: '#00ff00',
      secondary: '#ff0000',
      accent: '#ffff00',
      background: '#000000'
    },
    shaderHints: ['pixelation', 'CRT curve', 'scanlines', 'color banding']
  },
  {
    id: 'minimalist-mono',
    name: 'Minimalist Mono',
    description: 'Clean lines, two colors, maximum readability',
    icon: '⬜',
    preview: {
      gradient: 'from-zinc-900 to-zinc-800',
      accent: '#ffffff'
    },
    settings: {
      visualStyle: VisualStyle.Minimalist,
      atmosphere: Atmosphere.Dark
    },
    colorPalette: {
      primary: '#ffffff',
      secondary: '#888888',
      accent: '#ffffff',
      background: '#111111'
    },
    shaderHints: ['flat shading', 'hard edges', 'no textures', 'high contrast']
  },
  {
    id: 'low-poly-nature',
    name: 'Low Poly Nature',
    description: 'Flat shaded, earthy tones, geometric beauty',
    icon: '🌲',
    preview: {
      gradient: 'from-green-800 via-emerald-700 to-teal-800',
      accent: '#4ade80'
    },
    settings: {
      visualStyle: VisualStyle.LowPoly,
      atmosphere: Atmosphere.Sunny
    },
    colorPalette: {
      primary: '#22c55e',
      secondary: '#84cc16',
      accent: '#eab308',
      background: '#86efac'
    },
    shaderHints: ['flat shading', 'vertex colors', 'no textures', 'soft shadows']
  },
  {
    id: 'noir-shadow',
    name: 'Noir Shadow',
    description: 'High contrast, dramatic shadows, black and white',
    icon: '🎬',
    preview: {
      gradient: 'from-black via-zinc-900 to-black',
      accent: '#ffffff'
    },
    settings: {
      visualStyle: VisualStyle.Noir,
      atmosphere: Atmosphere.Dark
    },
    colorPalette: {
      primary: '#ffffff',
      secondary: '#666666',
      accent: '#ff0000',
      background: '#000000'
    },
    shaderHints: ['hard shadows', 'rim lighting', 'film grain', 'vignette']
  },
  {
    id: 'toon-cel',
    name: 'Toon Cel-Shaded',
    description: 'Bold outlines, flat colors, cartoon style',
    icon: '🎨',
    preview: {
      gradient: 'from-blue-500 via-purple-500 to-pink-500',
      accent: '#fbbf24'
    },
    settings: {
      visualStyle: VisualStyle.Toon,
      atmosphere: Atmosphere.Sunny
    },
    colorPalette: {
      primary: '#3b82f6',
      secondary: '#ec4899',
      accent: '#fbbf24',
      background: '#e0f2fe'
    },
    shaderHints: ['cel shading', 'outline', 'flat colors', 'specular bands']
  },
  {
    id: 'void-space',
    name: 'Void Space',
    description: 'Deep black, distant stars, cosmic isolation',
    icon: '🌌',
    preview: {
      gradient: 'from-black via-indigo-950 to-black',
      accent: '#818cf8'
    },
    settings: {
      visualStyle: VisualStyle.Minimalist,
      atmosphere: Atmosphere.Space,
      environment: EnvironmentType.Space
    },
    colorPalette: {
      primary: '#818cf8',
      secondary: '#6366f1',
      accent: '#f472b6',
      background: '#030712'
    },
    shaderHints: ['star field', 'nebula fog', 'glow', 'subtle bloom']
  },
  {
    id: 'horror-fog',
    name: 'Horror Fog',
    description: 'Limited visibility, oppressive atmosphere, dread',
    icon: '👻',
    preview: {
      gradient: 'from-zinc-900 via-red-950 to-zinc-900',
      accent: '#7f1d1d'
    },
    settings: {
      visualStyle: VisualStyle.Noir,
      atmosphere: Atmosphere.Foggy
    },
    colorPalette: {
      primary: '#991b1b',
      secondary: '#78716c',
      accent: '#fef3c7',
      background: '#1c1917'
    },
    shaderHints: ['heavy fog', 'volumetric light', 'noise grain', 'desaturation']
  }
];

/**
 * Get preset by ID
 */
export function getPresetById(id: string): VisualPreset | undefined {
  return VISUAL_PRESETS.find(p => p.id === id);
}

/**
 * Apply preset to user preferences (partial update)
 */
export function applyPreset(preset: VisualPreset): {
  visualStyle: VisualStyle;
  atmosphere: Atmosphere;
  environment?: EnvironmentType;
} {
  return preset.settings;
}
