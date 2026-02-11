
import { UserPreferences, GeneratedGame, GameAudio, GameEngine, PhysicsEngine, GeneratedAsset } from "../types";

/**
 * PROMPT REGISTRY
 * Centralized storage for all System Instructions and Prompts.
 * Allows for easy A/B testing and updates without touching logic code.
 */

const ENGINE_SPECS: Record<string, string> = {
  [GameEngine.ThreeJS]: `
    FRAMEWORK: Three.js (Standard WebGL)
    IMPORTS: 
      import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
      import { PointerLockControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js';
      import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
    BOILERPLATE: 
      1. Create Scene, Camera, WebGLRenderer.
      2. Set renderer.setSize(window.innerWidth, window.innerHeight).
      3. Append renderer.domElement to document.body.
      4. SETUP LIGHTS: AmbientLight(0xffffff, 0.6) + DirectionalLight(0xffffff, 1) at (10, 20, 10).
      5. SETUP GROUND: PlaneGeometry(100, 100) with GridHelper(100, 100).
    CONTROLS:
      - Use PointerLockControls for FPS.
      - Use OrbitControls for Orbital/Sim.
  `,
  [GameEngine.ThreeJS_WebGPU]: `
    FRAMEWORK: Three.js (WebGPU - Experimental)
    IMPORTS: 
       import * as THREE from 'https://unpkg.com/three@0.167.0/build/three.module.js';
       import WebGPURenderer from 'https://unpkg.com/three@0.167.0/examples/jsm/renderers/webgpu/WebGPURenderer.js';
       import { PointerLockControls } from 'https://unpkg.com/three@0.167.0/examples/jsm/controls/PointerLockControls.js';
    BOILERPLATE: 
       const renderer = new WebGPURenderer({ antialias: true });
       await renderer.init();
    IMPORTANT: Do NOT use legacy materials if possible, use MeshStandardMaterialNode or standard materials compatible with WebGPU.
  `,
  [GameEngine.P5JS]: `
    FRAMEWORK: p5.js (Creative Coding)
    IMPORTS: None (Global Mode via CDN)
    INJECTION: You MUST include this script tag in the HTML head: <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.js"></script>
    BOILERPLATE: 
       function setup() { createCanvas(windowWidth, windowHeight, WEBGL); ... }
       function draw() { ... }
       function windowResized() { resizeCanvas(windowWidth, windowHeight); }
    NOTE: Use 'WEBGL' mode in createCanvas for 3D requirements. Use p5's immediate mode geometry (box, sphere) or loadModel.
  `,
  [GameEngine.BabylonJS]: `
    FRAMEWORK: Babylon.js
    IMPORTS: None (Global via CDN)
    INJECTION: <script src="https://cdn.babylonjs.com/babylon.js"></script><script src="https://cdn.babylonjs.com/loaders/babylonjs.loaders.min.js"></script>
    BOILERPLATE:
       const canvas = document.getElementById("renderCanvas"); // Create this canvas
       const engine = new BABYLON.Engine(canvas, true);
       const createScene = function() { ... return scene; };
       const scene = createScene();
       engine.runRenderLoop(function () { scene.render(); });
  `,
  [GameEngine.KaboomJS]: `
    FRAMEWORK: Kaboom.js
    IMPORTS: import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";
    BOILERPLATE:
       kaboom({ background: [0,0,0] });
       // Define scenes and go('main');
    NOTE: This is a 2D engine. If the user asked for 3D, simulate it or create a 2.5D pseudo-3D style.
  `,
  [GameEngine.RawWebGL]: `
    FRAMEWORK: Raw WebGL API (No Engine)
    IMPORTS: None.
    BOILERPLATE: 
       const gl = canvas.getContext("webgl");
       // You must write the vertex and fragment shaders as string variables.
       // You must handle buffer creation, linking, and the draw loop manually.
    WARNING: Keep it simple. A colored cube or basic terrain is sufficient given the complexity.
  `
};

const PHYSICS_SPECS: Record<string, string> = {
  [PhysicsEngine.None]: "PHYSICS: Simple AABB collision or distance checks only. No heavy physics library.",
  [PhysicsEngine.Cannon]: `
    PHYSICS: Cannon.js
    IMPORTS: import * as CANNON from 'https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js';
    INSTRUCTIONS:
      1. Create a physics world: const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
      2. For every Three.js mesh, create a corresponding Cannon.js Body.
      3. Sync the visual mesh position/quaternion to the physics body in the animation loop.
  `,
  [PhysicsEngine.Rapier]: `
    PHYSICS: Rapier (High Performance)
    IMPORTS: import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
    INSTRUCTIONS:
      1. Initialize: await RAPIER.init();
      2. Create world: let gravity = { x: 0.0, y: -9.81, z: 0.0 }; let world = new RAPIER.World(gravity);
      3. Use it for rigid body dynamics.
  `,
  [PhysicsEngine.Ammo]: `
    PHYSICS: Ammo.js
    INJECTION: <script src="https://github.com/kripken/ammo.js/raw/master/builds/ammo.js"></script>
    INSTRUCTIONS: Use standard Ammo.js setup. Note: This is heavy, only use if requested for complex simulation.
  `
};

export const PromptRegistry = {
  
  // --- BLUEPRINT PHASE ---
  
  QuantizeRequirements: (prefs: UserPreferences) => `
    Act as a Lead Game Designer.
    Analyze these User Specifications and output a 'Quantized Spec Sheet' (JSON).

    Specs:
    - Target Engine: ${prefs.gameEngine}
    - Genre: ${prefs.genre}
    - Visual Style: ${prefs.visualStyle}
    - Camera: ${prefs.cameraPerspective}
    - Environment: ${prefs.environmentType}
    - Atmosphere: ${prefs.atmosphere}
    - Pacing: ${prefs.pacing}
    - Physics: ${prefs.physicsEngine}
    - Concept: ${prefs.projectDescription}
    - Seed: ${prefs.seed}

    Task:
    Extract Title, Summary, Mechanics, and Visual Requirements.
    Output pure JSON. Be creative but concise.
  `,

  ArchitectSystem: (specData: any, prefs: UserPreferences) => `
    Act as a Software Architect.
    Using this Quantized Spec Sheet, design the system architecture.

    Spec Sheet:
    ${JSON.stringify(specData, null, 2)}

    Platform: ${prefs.platform}
    Engine: ${prefs.gameEngine}
    Physics Engine: ${prefs.physicsEngine}
    Preferred Architecture Style: ${prefs.architectureStyle}
    Target Capabilities: GPU: ${prefs.capabilities.gpuTier}

    Task:
    Generate Architecture, Tech Stack, and Prerequisites.
    
    STRICT RULES:
    1. Output pure JSON only.
    2. 'nodes' must describe the actual Core Loop components for this specific game.
    3. Ensure descriptions are meaningful and distinct.
    4. KEEP STRINGS CONCISE to avoid JSON errors.
  `,

  // --- ASSET PHASE ---

  DesignSoundscape: (blueprint: GeneratedGame, prefs: UserPreferences) => `
    Act as a Procedural Audio Engineer.
    Create a soundscape using PURE Web Audio API JavaScript code (Oscillators, GainNodes, Filters).
    NO external files (mp3/wav). All sound must be synthesized mathematically.

    Game Context:
    - Title: ${blueprint.title}
    - Atmosphere: ${prefs.atmosphere}
    - Genre: ${prefs.genre}
    - Mechanics: ${JSON.stringify((blueprint as any).coreMechanics)}

    Task:
    1. Write a function 'playMusic(ctx)' that creates a background loop.
    2. Write functions for 3-5 distinct Sound Effects (SFX) needed for the mechanics.

    Output JSON matching the schema.
  `,

  // --- SETTINGS OPTIMIZER ---
  
  RecommendSettings: (concept: string) => `
    Act as a Senior Technical Director. 
    Analyze the following game concept and recommend the optimal engine and design settings to build it.

    Concept: "${concept}"

    Task:
    Map this concept to the following Enums:
    - Genre (FPS, RPG, Racing, Simulation, Puzzle, Platformer, Arcade, Horror, Strategy)
    - GameEngine (ThreeJS, ThreeJS_WebGPU, P5JS, BabylonJS, KaboomJS, RawWebGL)
    - VisualStyle (Minimalist, LowPoly, Cyberpunk, Retro, Noir, Realistic, Toon)
    - CameraPerspective (FirstPerson, ThirdPerson, Isometric, SideScroller, Orbital)
    - EnvironmentType (Arena, Dungeon, OpenWorld, City, Space, Interior)
    - Atmosphere (Sunny, Dark, Neon, Foggy, Space)
    - Pacing (Arcade, Tactical, Simulation, TurnBased)

    Return a JSON object with these exact keys and values matching the provided Enums.
  `,

  // --- PROTOTYPE PHASE ---

  BuildPrototype: (blueprint: GeneratedGame, prefs: UserPreferences, audioContextStr: string, gpuRules: string, assets: any[]) => {
    
    const assignedAssets = assets.filter(a => a.role && a.role !== 'Unassigned');
    let assetInjectionBlock = "NO CUSTOM ASSETS PROVIDED. USE PROCEDURAL GEOMETRY.";
    
    if (assignedAssets.length > 0) {
        assetInjectionBlock = `
        MANDATORY ASSET INJECTION (CRITICAL):
        The user has generated specific AI assets for this game. 
        You MUST use the provided JS VARIABLE REFERENCES for the texture URLs. Do NOT treat them as strings or invent new URLs.
        These variables (window.FORGE_ASSETS[...]) will contain the Base64 data at runtime.

        ASSET MANIFEST (JSON Structure):
        ${JSON.stringify(assignedAssets.map(a => ({
            role: a.role,
            type: a.isSpriteSheet ? 'Sprite Sheet' : 'Static Image',
            description: a.description || a.prompt, 
            jsReference: a.imageUrl, 
            normalMapReference: a.normalMapUrl
        })), null, 2)}

        IMPLEMENTATION RULES:
        1. For Three.js: Use 'new THREE.TextureLoader().load( JS_REFERENCE_HERE )'. 
           - Example: new THREE.TextureLoader().load(window.FORGE_ASSETS['asset_xyz'])
           - CRITICAL: Enable 'transparent: true' for all materials using these textures.
           - CRITICAL: Set 'alphaTest: 0.5' to fix transparency sorting artifacts.
           - CRITICAL: Set 'side: THREE.DoubleSide' so sprites are visible from both sides.
        2. IF MULTIPLE ASSETS EXIST FOR ONE ROLE (e.g. 'Player'):
           - Inspect the 'description' field. If it says 'Walk Cycle' vs 'Idle', implement state switching.
        3. For Sprites (Player/Enemy): Use a PlaneGeometry or SpriteMaterial.
        4. For Walls/Floors: Apply as map. Set wrapS/wrapT to RepeatWrapping if it's a tileable texture.
        5. If 'normalMapReference' is present, assign it to normalMap.
        `;
    }

    return `
    Act as an Expert Creative Coder and Game Engine Specialist.

    BLUEPRINT:
    - Title: ${blueprint.title}
    - Mechanics: ${JSON.stringify((blueprint as any).coreMechanics)}
    - Visuals: ${JSON.stringify((blueprint as any).visualRequirements)}

    USER SETTINGS (Strict Enforcement):
    - ENGINE: ${prefs.gameEngine}
    - PHYSICS: ${prefs.physicsEngine}
    - ARCHITECTURE: ${prefs.architectureStyle}
    - PLATFORM: ${prefs.platform}
    - INPUT MODE: ${prefs.capabilities.input}
    - Style: ${prefs.visualStyle}
    - Camera: ${prefs.cameraPerspective}
    - Env: ${prefs.environmentType}
    - PROTOTYPE QUALITY: ${prefs.quality}
    - GPU TIER: ${prefs.capabilities.gpuTier}
    
    ${gpuRules}
    
    ${assetInjectionBlock}

    ENGINE SPECIFIC INSTRUCTIONS:
    ${ENGINE_SPECS[prefs.gameEngine] || ENGINE_SPECS[GameEngine.ThreeJS]}

    PHYSICS SPECIFIC INSTRUCTIONS:
    ${PHYSICS_SPECS[prefs.physicsEngine] || PHYSICS_SPECS[PhysicsEngine.None]}
    
    ARCHITECTURE ENFORCEMENT (${prefs.architectureStyle}):
    ${prefs.architectureStyle === 'Entity Component System (ECS)' ? 
      `CRITICAL: You MUST use a strict Entity Component System (ECS).
       1. Define Component Classes (e.g., class PositionComponent, class VelocityComponent).
       2. Define System Functions (e.g., function movementSystem(entities, delta)).
       3. Create a global 'world' object or array holding all Entity IDs.
       4. The main animation loop should ONLY call the Systems, passing the entity list.
       5. Do NOT put logic inside Entity classes (if any). Logic belongs in Systems.
      ` : 
      prefs.architectureStyle === 'Object Oriented (OOP)' ? 
      "You MUST use Classes (e.g., class Player, class Enemy) that encapsulate their own logic and update() methods." :
      "Use clean, modular functions."
    }

    DETERMINISTIC SEED: "${prefs.seed}"
    You MUST implement a seeded random number generator (PRNG) and use it for ALL procedural generation.
    
    AUDIO SYSTEM:
    ${audioContextStr}

    GAMEPLAY & MOVEMENT LOGIC (CRITICAL):
    1. BOUNDS CHECKING: All entities (Player, Enemies) MUST be constrained within the visible play area (e.g., x: -50 to 50, z: -50 to 50). Do not let them run off into the void.
    2. ENEMY AI: Enemies must move TOWARDS the player or the center of the map. 
    3. ORIENTATION: If using sprites for characters, ensure they 'billboard' (face the camera) OR rotate to face their movement direction.
    4. COLLISION: Ensure entities do not pass through walls.

    Task:
    Build a single-file HTML/JS prototype.
    
    CRITICAL IMPLEMENTATION RULES:
    1. SINGLE FILE: All HTML, CSS, and JS must be in one string.
    2. MODULE BOUNDARIES: Organize code into commented sections (CORE, RENDERER, INPUT, LOGIC).
    3. 'CLICK TO PLAY' OVERLAY (MANDATORY):
       - You MUST include a <div id="overlay">...</div> covering the screen.
       - You MUST use 'document.getElementById("overlay").addEventListener("click", ...)' to handle start. 
       - DO NOT use 'onclick="..."' in HTML attributes.
       - Ensure the overlay disappears (style.display = 'none') on click.
    4. NO BLANK SCREENS - VISIBILITY GUARANTEE:
       - You MUST add a THREE.AmbientLight(0xffffff, 0.7) to ensure basic visibility.
       - You MUST add a THREE.DirectionalLight.
       - You MUST ensure the Camera is positioned away from (0,0,0) and looking AT the scene.
       - If generating a room, ensure the player is INSIDE it, not in the void.
    5. ERROR HANDLING:
       - Wrap your init() and animate() functions in try/catch blocks. 
       - If an error occurs, display it in a visible DOM element on screen (not just console).
    
    6. TELEMETRY:
       ${prefs.capabilities.telemetry ? 
       `You MUST inject telemetry code to post 'forge-telemetry' messages with fps and entities count to window.parent.` : ''}

    Output: JSON with 'html' string and 'instructions'.
  `},

  // --- REFINEMENT PHASE ---

  RefineCode: (instruction: string, contextCode: string) => `
    Act as a Game Programmer.
    User Instruction: "${instruction}"
    
    Original Code (Data assets hidden for brevity):
    ${contextCode}
    
    Task:
    Determine if this is a minor fix (use 'patch' mode) or a major overhaul (use 'rewrite' mode).
    
    STRATEGY:
    1. 'patch': Use for tweaking variables, changing colors, small logic fixes. Provide 'edits'.
    2. 'rewrite': Use for adding new systems, changing control schemes, structural refactoring, or if the original code is missing critical chunks. Provide 'fullCode'.
  `
};
