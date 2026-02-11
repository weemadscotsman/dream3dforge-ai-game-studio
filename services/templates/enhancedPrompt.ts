/**
 * ENHANCED PROTOTYPE PROMPT v3.0
 * 
 * The key insight: Give the AI a WORKING game to modify, not a blank canvas.
 * This dramatically improves output quality and playability.
 */

import { UserPreferences, GeneratedGame, GameEngine } from "../../types";
import { getSkeletonForGenre } from "./gameSkeletons";

// Engine import snippets
const ENGINE_IMPORTS: Record<string, string> = {
  [GameEngine.ThreeJS]: `
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
`,
  [GameEngine.P5JS]: `
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<script>
`,
  [GameEngine.BabylonJS]: `
<script src="https://cdn.babylonjs.com/babylon.js"></script>
<script>
`,
  [GameEngine.KaboomJS]: `
<script type="module">
import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";
`
};

/**
 * Build the enhanced prototype prompt
 */
export function buildEnhancedPrototypePrompt(
  blueprint: GeneratedGame,
  prefs: UserPreferences,
  audioContextStr: string,
  gpuRules: string
): string {

  // Get the appropriate skeleton
  const skeleton = getSkeletonForGenre(prefs.genre);

  // Calculate difficulty modifiers
  const d = prefs.difficulty || 5;
  const spawnMult = (0.5 + (d - 1) * 0.15).toFixed(2);
  const speedMult = (0.6 + (d - 1) * 0.1).toFixed(2);
  const damageMult = (0.5 + (d - 1) * 0.17).toFixed(2);

  return `
You are an Expert Game Programmer for Dream3DForge. Your task is to CREATE A COMPLETE, PLAYABLE GAME.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: YOU WILL BE GIVEN A WORKING GAME SKELETON
═══════════════════════════════════════════════════════════════════════════════

Below is a COMPLETE, WORKING game template. Your job is to CUSTOMIZE it to match the specifications.

**DO NOT:**
- Remove working systems (input, game loop, death handling, telemetry)
- Remove the <script type="importmap"> or Three.js imports
- Break the fundamental structure
- Add placeholder code like "// TODO" or "..."
- Create a game from scratch - USE THE SKELETON

**DO:**
- Replace %%TITLE%% with the actual title
- Replace %%SEED%% with the actual seed
- Replace %%CONTROLS%% with actual control instructions
- Modify visual style (colors, shapes, materials) to match the theme
- Adjust gameplay values (speeds, damage, spawn rates) to match specs
- Add game-specific entities as described in the blueprint
- Customize the HUD to show relevant stats

═══════════════════════════════════════════════════════════════════════════════
GAME SPECIFICATION
═══════════════════════════════════════════════════════════════════════════════

Title: ${blueprint.title}
Summary: ${blueprint.summary}
Genre: ${prefs.genre}
Primary Mechanic: ${(blueprint as any).primaryMechanic || 'See coreMechanics'}
Visual Style: ${prefs.visualStyle}
Atmosphere: ${prefs.atmosphere}

Mechanics: ${JSON.stringify((blueprint as any).coreMechanics, null, 2)}
Entities: ${JSON.stringify((blueprint as any).entities, null, 2)}
Controls: ${JSON.stringify((blueprint as any).controls, null, 2)}
UI Layout: ${JSON.stringify((blueprint as any).uiLayout, null, 2)}
Gameplay Rules: ${JSON.stringify((blueprint as any).gameplayRules, null, 2)}

Seed: "${prefs.seed}"
Difficulty: ${d}/10 (${d <= 2 ? 'Chill' : d <= 4 ? 'Easy' : d <= 6 ? 'Normal' : d <= 8 ? 'Hard' : 'Nightmare'})

═══════════════════════════════════════════════════════════════════════════════
DIFFICULTY MODIFIERS (APPLY THESE!)
═══════════════════════════════════════════════════════════════════════════════

In the State object, set these base values:
- Spawn rate multiplier: ${spawnMult}
- Enemy speed multiplier: ${speedMult}
- Damage multiplier: ${damageMult}

Example: If base spawn interval is 2.0, use: 2.0 / ${spawnMult} = ${(2.0 / parseFloat(spawnMult)).toFixed(2)}s

═══════════════════════════════════════════════════════════════════════════════
VISUAL STYLE CUSTOMIZATION
═══════════════════════════════════════════════════════════════════════════════

${getVisualStyleInstructions(prefs.visualStyle)}

═══════════════════════════════════════════════════════════════════════════════
AUDIO INTEGRATION
═══════════════════════════════════════════════════════════════════════════════

${audioContextStr}

═══════════════════════════════════════════════════════════════════════════════
GPU CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

${gpuRules}

═══════════════════════════════════════════════════════════════════════════════
REQUIRED ENGINE IMPORTS (DO NOT REMOVE)
═══════════════════════════════════════════════════════════════════════════════

Your game MUST include the ${prefs.gameEngine} library. Use this exact import:

${ENGINE_IMPORTS[prefs.gameEngine] || ENGINE_IMPORTS['threejs']}

⚠️ WARNING: If the skeleton already has imports, KEEP THEM. Do not remove the <script type="importmap">.

═══════════════════════════════════════════════════════════════════════════════
WORKING GAME SKELETON - CUSTOMIZE THIS
═══════════════════════════════════════════════════════════════════════════════

The skeleton below is a COMPLETE, WORKING game. Modify it to match the specs above.

\`\`\`html
${skeleton}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
CUSTOMIZATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before outputting, verify:

[ ] %%TITLE%% replaced with: "${blueprint.title}"
[ ] %%SEED%% replaced with: "${prefs.seed}"
[ ] %%CONTROLS%% replaced with actual controls from blueprint
[ ] Colors match ${prefs.visualStyle} style (see color palette above)
[ ] Player entity matches blueprint.entities[0] if specified
[ ] Enemy types match blueprint.entities descriptions
[ ] HUD shows elements from blueprint.uiLayout
[ ] Difficulty modifiers applied (spawn: ${spawnMult}x, speed: ${speedMult}x)
[ ] Game loop runs without errors
[ ] Death screen shows and restart works
[ ] Touch controls still function (don't remove TouchControls checks)

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Output ONLY valid JSON with BOTH fields:
{
  "html": "THE COMPLETE MODIFIED HTML FILE WITH ${prefs.gameEngine} IMPORTS",
  "instructions": "Clear control instructions based on: ${(blueprint as any).controls?.scheme || 'Keyboard'} - ${(blueprint as any).controls?.mappings?.map((m: any) => m.input + ': ' + m.action).join(', ') || 'Arrow keys to move, Space to jump/action'}"
}

REQUIRED FIELDS:
- "html": Must contain the complete game code including ${prefs.gameEngine} library imports
- "instructions": MUST describe the actual controls players use

IMPORTANT: The "html" value must be the COMPLETE HTML file, not a diff or partial.
The game MUST work when pasted into an iframe. No external dependencies except CDN imports.

CRITICAL INSTRUCTIONS:
1. DO NOT start your response with "Here is the code" or "I apologize".
2. DO NOT output markdown code blocks (e.g. \`\`\`json).
3. DO NOT output any text before the opening brace {.
4. DO NOT output any text after the closing brace }.
5. OUTPUT RAW JSON ONLY.
`;
}

/**
 * Get visual style-specific color instructions
 */
function getVisualStyleInstructions(style: string): string {
  const styles: Record<string, string> = {
    'Minimalist / Abstract': `
COLOR PALETTE:
- Background: #0a0a0a (near black)
- Primary: #ffffff (white)
- Accent: #00ff88 (mint green)
- Danger: #ff3366 (red-pink)

STYLE: Clean geometric shapes, no textures, high contrast
Use: Simple BoxGeometry, SphereGeometry
Materials: MeshBasicMaterial with flat colors`,

    'Low Poly / Flat Shaded': `
COLOR PALETTE:
- Background: #1a1a2e (dark blue)
- Primary: #4ecdc4 (teal)
- Secondary: #ff6b6b (coral)
- Ground: #2d3436 (dark gray)

STYLE: Flat shaded polygons, no smooth normals
Use: flatShading: true on materials
Geometry: Low-poly shapes, visible facets`,

    'Cyberpunk / Neon': `
COLOR PALETTE:
- Background: #0a0020 (deep purple-black)
- Primary: #00ffff (cyan)
- Secondary: #ff00ff (magenta)
- Accent: #ffff00 (yellow)
- Grid: #00ff00 (green)

STYLE: Glowing neon, dark backgrounds, grid floors
Use: emissive materials with emissiveIntensity: 1.5+
Add: Bloom-like glow via emissive, grid textures on floors`,

    'Retro / Voxel': `
COLOR PALETTE (8-BIT MARIO STYLE):
- Sky: #5c94fc (classic blue)
- Ground/Brick: #c84c0c (brown-orange)
- Ground Dark: #a02800 (dark brown)
- Pipe: #00a800 (bright green)
- Pipe Dark: #008000 (dark green)
- Question Block: #ffa044 (gold)
- Player: #ff0000 (red) + #fca044 (skin tone)
- Enemy (Goomba): #c84c0c
- Enemy (Koopa): #00a800
- Coin: #ffd700 (gold)
- Cloud: #fcfcfc (white)

STYLE: Chunky pixels, limited palette (NES-style 54 colors max)
Use: Canvas 2D with pixelated rendering
No anti-aliasing, sharp edges, 16x16 tile grid
Font: Monospace, ALL CAPS for HUD`,

    'Noir / High Contrast': `
COLOR PALETTE:
- Background: #000000 (pure black)
- Primary: #ffffff (white)
- Accent: #ff0000 (red only for danger)
- Shadow: #1a1a1a

STYLE: High contrast black and white, dramatic shadows
Use: Strong directional lighting, deep shadows
Minimal color, mostly grayscale`,

    'Toon / Cel Shaded': `
COLOR PALETTE:
- Background: #87ceeb (sky blue)
- Primary: #ff6b6b (warm red)
- Secondary: #4ecdc4 (teal)
- Outline: #2d3436 (dark outline)

STYLE: Cartoon-like, bold outlines, flat colors
Use: MeshToonMaterial if available, else sharp lighting
Bold, saturated colors`
  };

  return styles[style] || styles['Cyberpunk / Neon'];
}

/**
 * Validation prompt to check generated code
 */
export function buildValidationPrompt(html: string): string {
  return `
Analyze this game code for critical issues. Return JSON only.

CODE:
\`\`\`html
${html.substring(0, 15000)}
\`\`\`

CHECK FOR:
1. Does it have a working game loop (requestAnimationFrame)?
2. Does it have player input handling?
3. Does it have a death/restart mechanism?
4. Does it import Three.js or another engine correctly?
5. Does it have the telemetry postMessage?
6. Are there any obvious syntax errors?

OUTPUT (JSON):
{
  "valid": true/false,
  "issues": ["list of critical issues"],
  "suggestions": ["optional improvements"]
}
`;
}
