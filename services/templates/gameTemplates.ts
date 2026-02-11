import { Genre, VisualStyle, CameraPerspective, EnvironmentType, Atmosphere, Pacing, GameEngine } from '../../types';

/**
 * QUICK-START TEMPLATES
 * Pre-configured game setups users can start from.
 * Each template is a proven, doctrine-compliant game concept.
 */

export interface GameTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string; // Emoji
  genre: Genre;
  visualStyle: VisualStyle;
  camera: CameraPerspective;
  environment: EnvironmentType;
  atmosphere: Atmosphere;
  pacing: Pacing;
  engine: GameEngine;
  concept: string; // Pre-filled project description
  previewColor: string; // Gradient color for card
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedPlaytime: string;
  inspirations: string[];
}

export const GAME_TEMPLATES: GameTemplate[] = [
  {
    id: 'neon-survivor',
    name: 'Neon Survivor',
    tagline: 'Outlast the swarm',
    description: 'Twin-stick arena shooter with escalating waves. Collect XP gems, choose upgrades, survive as long as possible.',
    icon: '👾',
    genre: Genre.ArenaShooter,
    visualStyle: VisualStyle.Cyberpunk,
    camera: CameraPerspective.Isometric,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Neon,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Top-down arena shooter where enemies spawn in waves. Player auto-attacks nearest enemy. Collect gems from kills to level up and choose from 3 random upgrades. Upgrades include: faster bullets, more damage, speed boost, health regen, piercing shots. Enemies get faster and more numerous each wave. Screen fills with chaos. One hit = death.',
    previewColor: 'from-purple-600 to-pink-600',
    difficulty: 'medium',
    estimatedPlaytime: '10-15 min',
    inspirations: ['Vampire Survivors', 'Brotato', '20 Minutes Till Dawn']
  },
  {
    id: 'dodge-hell',
    name: 'Dodge Hell',
    tagline: 'Pure evasion',
    description: 'Minimalist bullet hell. No weapons. Just you and an ocean of projectiles. How long can you last?',
    icon: '⚡',
    genre: Genre.DodgeSurvival,
    visualStyle: VisualStyle.Minimalist,
    camera: CameraPerspective.Isometric,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Dark,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Pure dodge survival. Player is a small glowing orb. Projectiles spawn from screen edges in patterns. No shooting - just survive. Patterns start simple (straight lines) and evolve to complex (spirals, bursts, homing). Near-misses give score bonus. Timer counts up. One hit = death. Instant restart.',
    previewColor: 'from-gray-700 to-gray-900',
    difficulty: 'hard',
    estimatedPlaytime: '2-5 min',
    inspirations: ['Super Hexagon', 'Just Shapes & Beats', 'Geometry Wars']
  },
  {
    id: 'wave-fortress',
    name: 'Wave Fortress',
    tagline: 'Build. Defend. Survive.',
    description: 'Tower defense meets survival. Place turrets between waves, then fight alongside them.',
    icon: '🏰',
    genre: Genre.WaveDefense,
    visualStyle: VisualStyle.LowPoly,
    camera: CameraPerspective.Isometric,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Sunny,
    pacing: Pacing.Tactical,
    engine: GameEngine.ThreeJS,
    concept: 'Hybrid tower defense. Between waves: place turrets on a grid (machine gun, slow tower, area damage). During waves: control a hero unit that can shoot. Enemies path toward your core. If core dies, game over. Currency from kills. 10 waves total, each harder. Boss on wave 10.',
    previewColor: 'from-green-600 to-teal-600',
    difficulty: 'medium',
    estimatedPlaytime: '15-20 min',
    inspirations: ['Kingdom Rush', 'Orcs Must Die', 'Dungeon Defenders']
  },
  {
    id: 'rhythm-run',
    name: 'Rhythm Run',
    tagline: 'Move to the beat',
    description: 'Endless runner synced to procedural music. Jump and slide on the beat for maximum points.',
    icon: '🎵',
    genre: Genre.RhythmReaction,
    visualStyle: VisualStyle.Cyberpunk,
    camera: CameraPerspective.ThirdPerson,
    environment: EnvironmentType.City,
    atmosphere: Atmosphere.Neon,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Rhythm-based endless runner. Player runs forward automatically. Obstacles appear synced to beat (procedural music). Press SPACE to jump, DOWN to slide. Perfect timing = bonus points. Combo multiplier for streaks. Miss 3 beats = death. Speed increases over time. High score chase.',
    previewColor: 'from-pink-500 to-orange-500',
    difficulty: 'medium',
    estimatedPlaytime: '3-8 min',
    inspirations: ['Beat Saber', 'Crypt of the NecroDancer', 'Geometry Dash']
  },
  {
    id: 'tactical-dungeon',
    name: 'Tactical Dungeon',
    tagline: 'Chess meets roguelike',
    description: 'Turn-based grid combat. See enemy intents. Plan your moves. One mistake can end your run.',
    icon: '♟️',
    genre: Genre.TacticalGrid,
    visualStyle: VisualStyle.LowPoly,
    camera: CameraPerspective.Isometric,
    environment: EnvironmentType.Dungeon,
    atmosphere: Atmosphere.Dark,
    pacing: Pacing.TurnBased,
    engine: GameEngine.ThreeJS,
    concept: 'Turn-based tactics on 8x8 grid. Player has 2 actions per turn (move or attack). Enemies show their next move before you act. Melee enemies charge, ranged enemies shoot lines. Kill all enemies to clear room. 5 rooms total, harder each time. Health doesnt regenerate. Strategic positioning is key.',
    previewColor: 'from-amber-700 to-red-800',
    difficulty: 'hard',
    estimatedPlaytime: '15-20 min',
    inspirations: ['Into the Breach', 'Hoplite', 'Chess']
  },
  {
    id: 'panic-station',
    name: 'Panic Station',
    tagline: 'Everything is on fire',
    description: 'Manage a failing space station. Fix systems, contain fires, save crew. It only gets worse.',
    icon: '🚀',
    genre: Genre.ResourcePanic,
    visualStyle: VisualStyle.Retro,
    camera: CameraPerspective.Isometric,
    environment: EnvironmentType.Interior,
    atmosphere: Atmosphere.Dark,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Real-time crisis management. Space station has 4 systems: Life Support, Engines, Shields, Reactor. Each can fail independently. Click to repair (takes time). If any system hits 0%, game over. Random events: fires spread, hull breaches, power surges. Systems degrade faster over time. Survive 5 minutes to win.',
    previewColor: 'from-red-600 to-orange-600',
    difficulty: 'hard',
    estimatedPlaytime: '3-5 min',
    inspirations: ['FTL', 'Overcooked', 'Keep Talking and Nobody Explodes']
  },
  {
    id: 'jump-king-lite',
    name: 'Climb',
    tagline: 'Fall. Rage. Retry.',
    description: 'Precision platformer on one tall screen. Reach the top. Every fall hurts.',
    icon: '🧗',
    genre: Genre.OneScreenPlatformer,
    visualStyle: VisualStyle.Minimalist,
    camera: CameraPerspective.SideScroller,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Foggy,
    pacing: Pacing.Tactical,
    engine: GameEngine.ThreeJS,
    concept: 'Single vertical screen platformer. Hold jump to charge, release to jump (variable height). Tiny platforms require precision. Fall = restart from bottom (no checkpoints). Reach the crown at top to win. Death counter tracks shame. Minimalist visuals, maximum frustration.',
    previewColor: 'from-slate-600 to-slate-800',
    difficulty: 'hard',
    estimatedPlaytime: '5-30 min',
    inspirations: ['Jump King', 'Getting Over It', 'Celeste']
  },
  {
    id: 'bullet-dance',
    name: 'Bullet Dance',
    tagline: 'Grace under fire',
    description: 'Classic bullet hell. Weave through patterns. Graze for points. Face the boss.',
    icon: '💫',
    genre: Genre.BulletHell,
    visualStyle: VisualStyle.Cyberpunk,
    camera: CameraPerspective.Isometric,
    environment: EnvironmentType.Space,
    atmosphere: Atmosphere.Space,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Vertical scrolling bullet hell. Player ship at bottom, moves in all directions. Enemies spawn from top in formations. Player shoots automatically. Dodge intricate bullet patterns. Graze (near-miss) bullets for score bonus. 3 phases of increasing intensity, then boss fight. 3 lives, no continues.',
    previewColor: 'from-indigo-600 to-purple-700',
    difficulty: 'hard',
    estimatedPlaytime: '5-10 min',
    inspirations: ['Touhou', 'Ikaruga', 'Jamestown']
  },
  {
    id: 'score-attack',
    name: 'Score Attack',
    tagline: 'Simple. Addictive. Endless.',
    description: 'One button. Infinite depth. Time your taps perfectly to chain combos.',
    icon: '🎯',
    genre: Genre.ScoreChase,
    visualStyle: VisualStyle.Minimalist,
    camera: CameraPerspective.SideScroller,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Dark,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Minimalist score chaser. Objects fall from top. Press SPACE when they hit the target zone. Perfect timing = 100 points + combo. Good timing = 50 points, breaks combo. Miss = game over. Speed increases with score. Combo multiplier grows. How high can you go?',
    previewColor: 'from-cyan-500 to-blue-600',
    difficulty: 'easy',
    estimatedPlaytime: '1-5 min',
    inspirations: ['Flappy Bird', 'Piano Tiles', 'Osu!']
  },
  {
    id: 'vector-void',
    name: 'Vector Void',
    tagline: 'Classic space combat',
    description: 'Vector-style physics shooter. Rotate, thrust, and blast asteroids into dust.',
    icon: '🚀',
    genre: Genre.Asteroids,
    visualStyle: VisualStyle.Minimalist,
    camera: CameraPerspective.Orbital,
    environment: EnvironmentType.Space,
    atmosphere: Atmosphere.Space,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Physics-based space combat. Triangle ship can rotate (Left/Right) and thrust (Up). Wrap-around screen logic. Shoot asteroids that split into smaller pieces. One-hit death.',
    previewColor: 'from-blue-900 to-black',
    difficulty: 'medium',
    estimatedPlaytime: '5-10 min',
    inspirations: ['Asteroids', 'Super Stardust']
  },
  {
    id: 'binary-table',
    name: 'Binary Table',
    tagline: 'The original duel',
    description: 'Ultra-responsive arcade tennis. Defeat the AI or survive the rally.',
    icon: '🏓',
    genre: Genre.Pong,
    visualStyle: VisualStyle.Retro,
    camera: CameraPerspective.SideScroller,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Dark,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Classic two-paddle contest. Ball speed increases with each hit. AI opponent perfectly tracks or has random errors based on difficulty. First to 11 wins.',
    previewColor: 'from-green-900 to-black',
    difficulty: 'easy',
    estimatedPlaytime: '3-5 min',
    inspirations: ['Pong', 'Windjammers']
  },
  {
    id: 'neon-serpent',
    name: 'Neon Serpent',
    tagline: 'Grow the trail',
    description: 'Slither through a neon grid. Eat pixels, grow longer, don\'t crash.',
    icon: '🐍',
    genre: Genre.Snake,
    visualStyle: VisualStyle.Cyberpunk,
    camera: CameraPerspective.Orbital,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Neon,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Grid-based snake movement. Collecting bits adds modules to your tail. Game speed increases exponentially. Crashing into self or walls is game over.',
    previewColor: 'from-green-500 to-blue-500',
    difficulty: 'medium',
    estimatedPlaytime: '5-10 min',
    inspirations: ['Snake', 'TRON Lightcycles']
  },
  {
    id: 'brick-breaker-x',
    name: 'Brick Breaker X',
    tagline: 'Shatter the grid',
    description: 'Modern breakout with powerups and clearing cascades.',
    icon: '🧱',
    genre: Genre.Breakout,
    visualStyle: VisualStyle.Minimalist,
    camera: CameraPerspective.SideScroller,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Sunny,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Paddle-ball destruction. Bricks have different health values. Powerups include multi-ball, laser paddle, and shield.',
    previewColor: 'from-orange-500 to-red-600',
    difficulty: 'easy',
    estimatedPlaytime: '10-15 min',
    inspirations: ['Arkanoid', 'Breakout']
  },
  {
    id: 'nebula-strike',
    name: 'Nebula Strike',
    tagline: 'Vertical shmup',
    description: 'Pilot a starfighter through enemy formations and bullet patterns.',
    icon: '🛸',
    genre: Genre.Shmup,
    visualStyle: VisualStyle.Retro,
    camera: CameraPerspective.Orbital,
    environment: EnvironmentType.Space,
    atmosphere: Atmosphere.Space,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Vertical scrolling shooter. Enemies enter in scripted paths. Score combos by destroying full wings.',
    previewColor: 'from-purple-800 to-blue-900',
    difficulty: 'hard',
    estimatedPlaytime: '5-10 min',
    inspirations: ['Galaga', 'Raiden']
  },
  {
    id: 'midnight-drift',
    name: 'Midnight Drift',
    tagline: 'Neon racing',
    description: 'High-speed drift racing on a terminal track.',
    icon: '🏎️',
    genre: Genre.Racing,
    visualStyle: VisualStyle.Cyberpunk,
    camera: CameraPerspective.ThirdPerson,
    environment: EnvironmentType.City,
    atmosphere: Atmosphere.Neon,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: '3D arcade racer focusing on drift mechanics. Beat the ghost car lap time.',
    previewColor: 'from-indigo-900 to-pink-900',
    difficulty: 'medium',
    estimatedPlaytime: '10-20 min',
    inspirations: ['OutRun', 'Ridge Racer']
  },
  {
    id: 'pixel-flap',
    name: 'Pixel Flap',
    tagline: 'Gravity defiance',
    description: 'The ultimate test of timing and patience.',
    icon: '🐦',
    genre: Genre.Flappy,
    visualStyle: VisualStyle.Retro,
    camera: CameraPerspective.SideScroller,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Sunny,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'One-button flight. Navigate infinite pipes. Score increments per pipe passed.',
    previewColor: 'from-blue-400 to-green-400',
    difficulty: 'hard',
    estimatedPlaytime: '1-5 min',
    inspirations: ['Flappy Bird']
  },
  {
    id: 'elemental-match',
    name: 'Elemental Match',
    tagline: 'Puzzle cascade',
    description: 'Match gems to trigger powerful combos and clear the board.',
    icon: '💎',
    genre: Genre.Match3,
    visualStyle: VisualStyle.LowPoly,
    camera: CameraPerspective.Orbital,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Sunny,
    pacing: Pacing.Tactical,
    engine: GameEngine.ThreeJS,
    concept: 'Classic match-3 swap logic with combo multipliers and special board-clearing items.',
    previewColor: 'from-yellow-400 to-purple-600',
    difficulty: 'easy',
    estimatedPlaytime: '5-15 min',
    inspirations: ['Bejeweled', 'Candy Crush']
  },
  {
    id: 'final-duel',
    name: 'Final Duel',
    tagline: 'Side-view combat',
    description: '1v1 fighting game with blocks, strikes, and special moves.',
    icon: '🥊',
    genre: Genre.Fighting,
    visualStyle: VisualStyle.Noir,
    camera: CameraPerspective.SideScroller,
    environment: EnvironmentType.Arena,
    atmosphere: Atmosphere.Dark,
    pacing: Pacing.Arcade,
    engine: GameEngine.ThreeJS,
    concept: 'Close quarters combat. Manage stamina and health. Use distance to avoid strikes.',
    previewColor: 'from-red-900 to-gray-900',
    difficulty: 'medium',
    estimatedPlaytime: '5-10 min',
    inspirations: ['Street Fighter', 'Tekken']
  },
  {
    id: 'deep-dark',
    name: 'Deep Dark',
    tagline: 'Psychological horror',
    description: 'Navigate a pitch-black abyss with only a fading flashlight.',
    icon: '🔦',
    genre: Genre.SurvivalHorror,
    visualStyle: VisualStyle.Realistic,
    camera: CameraPerspective.FirstPerson,
    environment: EnvironmentType.Dungeon,
    atmosphere: Atmosphere.Dark,
    pacing: Pacing.Tactical,
    engine: GameEngine.ThreeJS,
    concept: 'First-person exploration. Light is a resource. Avoid the shadow entities by staying in the light.',
    previewColor: 'from-gray-900 to-black',
    difficulty: 'hard',
    estimatedPlaytime: '10-30 min',
    inspirations: ['Amnesia', 'Silent Hill']
  },
  {
    id: 'ghost-protocol',
    name: 'Ghost Protocol',
    tagline: 'Infiltrate unseen',
    description: 'Avoid guards and security cameras to reach the terminal.',
    icon: '👤',
    genre: Genre.Stealth,
    visualStyle: VisualStyle.Noir,
    camera: CameraPerspective.Isometric,
    environment: EnvironmentType.Interior,
    atmosphere: Atmosphere.Dark,
    pacing: Pacing.Tactical,
    engine: GameEngine.ThreeJS,
    concept: 'Line of sight based stealth. Hiding in shadows reduces detection speed. Distract guards with noise.',
    previewColor: 'from-slate-900 to-emerald-900',
    difficulty: 'medium',
    estimatedPlaytime: '15-20 min',
    inspirations: ['Metal Gear Solid', 'Thief']
  }
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): GameTemplate | undefined {
  return GAME_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by genre
 */
export function getTemplatesByGenre(genre: Genre): GameTemplate[] {
  return GAME_TEMPLATES.filter(t => t.genre === genre);
}

/**
 * Get templates by difficulty
 */
export function getTemplatesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): GameTemplate[] {
  return GAME_TEMPLATES.filter(t => t.difficulty === difficulty);
}
