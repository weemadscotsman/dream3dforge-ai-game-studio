/**
 * DREAM3DFORGE - 8-BIT PLATFORMER SKELETON v1.0
 * 
 * Complete Mario-style platformer with:
 * - Procedural level generation
 * - Built-in chiptune audio system
 * - Proper platformer physics
 * - Enemy AI with stomping
 * - Collectibles and power-ups
 * - Classic 8-bit pixel aesthetic
 */

export const PLATFORMER_8BIT_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>%%TITLE%%</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; height: 100%; 
      overflow: hidden; 
      background: #000;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    canvas { 
      display: block; 
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    #overlay {
      position: fixed; inset: 0; z-index: 100;
      background: linear-gradient(180deg, #5c94fc 0%, #5c94fc 60%, #00a800 60%, #00a800 100%);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: 'Courier New', monospace;
      cursor: pointer;
    }
    #overlay.hidden { display: none; }
    #overlay h1 { 
      font-size: 3rem; 
      color: #fff; 
      text-shadow: 4px 4px 0 #000;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 4px;
    }
    #overlay p { color: #ffe135; font-size: 1.2rem; text-shadow: 2px 2px 0 #000; }
    #overlay .controls { margin-top: 2rem; color: #fff; font-size: 0.9rem; text-shadow: 2px 2px 0 #000; }
    
    #hud {
      position: fixed; top: 10px; left: 10px; right: 10px;
      display: flex; justify-content: space-between;
      font-family: 'Courier New', monospace;
      color: #fff; font-size: 16px;
      text-shadow: 2px 2px 0 #000;
      z-index: 50;
    }
    
    #death-screen {
      position: fixed; inset: 0; z-index: 100;
      background: #000;
      display: none; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: 'Courier New', monospace;
      cursor: pointer;
    }
    #death-screen h1 { font-size: 2rem; color: #ff0000; margin-bottom: 1rem; }
    #death-screen .stats { color: #fff; font-size: 1.2rem; margin-bottom: 2rem; text-align: center; }
    #death-screen .stats div { margin: 0.5rem 0; }
    #death-screen p { color: #ffe135; }
    
    #win-screen {
      position: fixed; inset: 0; z-index: 100;
      background: linear-gradient(180deg, #000 0%, #1a0033 100%);
      display: none; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: 'Courier New', monospace;
      cursor: pointer;
    }
    #win-screen h1 { font-size: 2.5rem; color: #ffe135; margin-bottom: 1rem; text-shadow: 0 0 20px #ff0; }
  </style>
</head>
<body>
  <div id="overlay">
    <h1>%%TITLE%%</h1>
    <p>Click to Start</p>
    <div class="controls">
      %%CONTROLS%%
    </div>
  </div>
  
  <div id="hud">
    <div>SCORE: <span id="score">0</span></div>
    <div>WORLD <span id="world">1-1</span></div>
    <div>COINS: <span id="coins">0</span></div>
    <div>LIVES: <span id="lives">3</span></div>
    <div>TIME: <span id="time">300</span></div>
  </div>
  
  <div id="death-screen">
    <h1>GAME OVER</h1>
    <div class="stats">
      <div>FINAL SCORE: <span id="final-score">0</span></div>
      <div>WORLDS CLEARED: <span id="final-world">0</span></div>
      <div>COINS COLLECTED: <span id="final-coins">0</span></div>
    </div>
    <p>Click to Try Again</p>
  </div>
  
  <div id="win-screen">
    <h1>★ WORLD CLEAR ★</h1>
    <p>Click to Continue</p>
  </div>
  
  <canvas id="game"></canvas>

  <script>
    // ═══════════════════════════════════════════════════════════════════════════
    // SEEDED RANDOM - Procedural generation consistency
    // ═══════════════════════════════════════════════════════════════════════════
    class SeededRandom {
      constructor(seed) {
        this.seed = this.hashCode(String(seed));
        this.initialSeed = this.seed;
      }
      hashCode(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
          h = ((h << 5) - h) + str.charCodeAt(i) & 0xffffffff;
        }
        return Math.abs(h) || 1;
      }
      reset() { this.seed = this.initialSeed; }
      next() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
      }
      range(a, b) { return a + this.next() * (b - a); }
      int(a, b) { return Math.floor(this.range(a, b + 1)); }
      chance(probability) { return this.next() < probability; }
      pick(array) { return array[this.int(0, array.length - 1)]; }
    }
    const RNG = new SeededRandom("%%SEED%%");

    // ═══════════════════════════════════════════════════════════════════════════
    // 8-BIT CHIPTUNE AUDIO SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════
    class ChiptuneAudio {
      constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.currentMusic = null;
        this.enabled = true;
      }

      init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
        
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.4;
        this.musicGain.connect(this.masterGain);
        
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.6;
        this.sfxGain.connect(this.masterGain);
      }

      resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }

      // Note frequency helper
      noteFreq(note, octave) {
        const notes = { 'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11 };
        const n = notes[note] || 0;
        return 440 * Math.pow(2, (n - 9) / 12 + (octave - 4));
      }

      // Play a short beep/blip
      playTone(freq, duration, type = 'square', volume = 0.5) {
        if (!this.ctx || !this.enabled) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
      }

      // Sound Effects
      playJump() {
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
      }

      playCoin() {
        if (!this.ctx || !this.enabled) return;
        this.playTone(988, 0.05, 'square', 0.3);
        setTimeout(() => this.playTone(1319, 0.15, 'square', 0.3), 50);
      }

      playStomp() {
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
      }

      playPowerUp() {
        if (!this.ctx || !this.enabled) return;
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          setTimeout(() => this.playTone(freq, 0.1, 'square', 0.3), i * 80);
        });
      }

      playHurt() {
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
      }

      playDeath() {
        if (!this.ctx || !this.enabled) return;
        this.stopMusic();
        const notes = [392, 370, 349, 330, 311, 294, 277, 262];
        notes.forEach((freq, i) => {
          setTimeout(() => this.playTone(freq, 0.15, 'square', 0.4), i * 100);
        });
      }

      playWin() {
        if (!this.ctx || !this.enabled) return;
        this.stopMusic();
        const melody = [523, 523, 523, 523, 415, 466, 523, 466, 523];
        const durations = [0.1, 0.1, 0.1, 0.3, 0.1, 0.1, 0.1, 0.1, 0.4];
        let time = 0;
        melody.forEach((freq, i) => {
          setTimeout(() => this.playTone(freq, durations[i], 'square', 0.4), time * 1000);
          time += durations[i] + 0.05;
        });
      }

      // Background Music - Simple looping melody
      startMusic() {
        if (!this.ctx || !this.enabled || this.currentMusic) return;
        
        const bpm = 140;
        const beatTime = 60 / bpm;
        
        // Mario-style melody pattern
        const melody = [
          { note: 'E', oct: 5, dur: 0.5 },
          { note: 'E', oct: 5, dur: 0.5 },
          { note: null, dur: 0.5 },
          { note: 'E', oct: 5, dur: 0.5 },
          { note: null, dur: 0.5 },
          { note: 'C', oct: 5, dur: 0.5 },
          { note: 'E', oct: 5, dur: 1 },
          { note: 'G', oct: 5, dur: 1 },
          { note: null, dur: 1 },
          { note: 'G', oct: 4, dur: 1 },
          { note: null, dur: 1 },
        ];
        
        // Bass pattern
        const bass = [
          { note: 'C', oct: 3, dur: 0.5 },
          { note: 'G', oct: 3, dur: 0.5 },
          { note: 'C', oct: 4, dur: 0.5 },
          { note: 'G', oct: 3, dur: 0.5 },
        ];

        let melodyIndex = 0;
        let bassIndex = 0;
        let melodyTime = 0;
        let bassTime = 0;

        const playLoop = () => {
          if (!this.enabled) return;
          
          const now = this.ctx.currentTime;
          
          // Play melody
          if (melodyTime <= now) {
            const m = melody[melodyIndex % melody.length];
            if (m.note) {
              this.playTone(this.noteFreq(m.note, m.oct), m.dur * beatTime * 0.9, 'square', 0.2);
            }
            melodyTime = now + m.dur * beatTime;
            melodyIndex++;
          }
          
          // Play bass
          if (bassTime <= now) {
            const b = bass[bassIndex % bass.length];
            this.playTone(this.noteFreq(b.note, b.oct), b.dur * beatTime * 0.8, 'triangle', 0.25);
            bassTime = now + b.dur * beatTime;
            bassIndex++;
          }
        };

        this.currentMusic = setInterval(playLoop, 50);
      }

      stopMusic() {
        if (this.currentMusic) {
          clearInterval(this.currentMusic);
          this.currentMusic = null;
        }
      }

      toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stopMusic();
        else this.startMusic();
      }
    }

    const Audio = new ChiptuneAudio();

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME STATE
    // ═══════════════════════════════════════════════════════════════════════════
    const TILE_SIZE = 16;
    const GRAVITY = 0.5;
    const MAX_FALL_SPEED = 10;
    
    const State = {
      isRunning: false,
      isPaused: false,
      
      // Player stats
      score: 0,
      coins: 0,
      lives: 3,
      time: 300,
      world: 1,
      level: 1,
      
      // Level data
      levelWidth: 0,
      levelHeight: 14,
      tiles: [],
      entities: [],
      particles: [],
      
      // Camera
      cameraX: 0,
      
      // Difficulty scaling
      difficultyMult: 1.0,
      
      // Timers
      timeTimer: 0,
      invincibleTimer: 0
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER
    // ═══════════════════════════════════════════════════════════════════════════
    const Player = {
      x: 48,
      y: 160,
      vx: 0,
      vy: 0,
      width: 14,
      height: 16,
      
      // States
      isGrounded: false,
      isBig: false,
      hasStar: false,
      facingRight: true,
      isJumping: false,
      isDead: false,
      
      // Physics
      speed: 2.5,
      jumpForce: -9,
      maxSpeed: 4,
      acceleration: 0.3,
      friction: 0.85,
      
      // Animation
      frame: 0,
      frameTimer: 0
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // INPUT SYSTEM
    // ═══════════════════════════════════════════════════════════════════════════
    const Input = {
      left: false,
      right: false,
      jump: false,
      jumpPressed: false,
      run: false
    };

    document.addEventListener('keydown', e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') Input.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') Input.right = true;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        if (!Input.jump) Input.jumpPressed = true;
        Input.jump = true;
      }
      if (e.code === 'ShiftLeft' || e.code === 'KeyX') Input.run = true;
      if (e.code === 'KeyM') Audio.toggle();
    });

    document.addEventListener('keyup', e => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') Input.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') Input.right = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') Input.jump = false;
      if (e.code === 'ShiftLeft' || e.code === 'KeyX') Input.run = false;
    });

    // Touch controls integration
    function getInput() {
      let left = Input.left;
      let right = Input.right;
      let jump = Input.jumpPressed;
      
      // Touch joystick
      const touch = window.TouchControls?.getMove?.();
      if (touch) {
        if (touch.x < -0.3) left = true;
        if (touch.x > 0.3) right = true;
      }
      
      // Touch buttons
      if (window.TouchControls?.isJump?.()) {
        if (!Input._touchJumpHeld) {
          jump = true;
          Input._touchJumpHeld = true;
        }
      } else {
        Input._touchJumpHeld = false;
      }
      
      Input.jumpPressed = false;
      return { left, right, jump, run: Input.run || window.TouchControls?.isFire?.() };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TILE TYPES
    // ═══════════════════════════════════════════════════════════════════════════
    const TILES = {
      AIR: 0,
      GROUND: 1,
      BRICK: 2,
      QUESTION: 3,
      QUESTION_EMPTY: 4,
      PIPE_TL: 5,
      PIPE_TR: 6,
      PIPE_BL: 7,
      PIPE_BR: 8,
      BLOCK: 9,
      CLOUD: 10,
      BUSH: 11,
      PLATFORM: 12
    };

    const SOLID_TILES = [TILES.GROUND, TILES.BRICK, TILES.QUESTION, TILES.QUESTION_EMPTY, 
                         TILES.PIPE_TL, TILES.PIPE_TR, TILES.PIPE_BL, TILES.PIPE_BR, 
                         TILES.BLOCK, TILES.PLATFORM];

    // ═══════════════════════════════════════════════════════════════════════════
    // ENTITY TYPES
    // ═══════════════════════════════════════════════════════════════════════════
    class Entity {
      constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 16;
        this.height = 16;
        this.type = type;
        this.active = true;
        this.facingRight = RNG.chance(0.5);
      }
    }

    class Goomba extends Entity {
      constructor(x, y) {
        super(x, y, 'goomba');
        this.vx = this.facingRight ? 0.5 : -0.5;
        this.squished = false;
        this.squishTimer = 0;
      }
    }

    class Koopa extends Entity {
      constructor(x, y) {
        super(x, y, 'koopa');
        this.vx = this.facingRight ? 0.5 : -0.5;
        this.inShell = false;
        this.shellSpeed = 0;
        this.height = 24;
      }
    }

    class Coin extends Entity {
      constructor(x, y) {
        super(x, y, 'coin');
        this.frame = 0;
        this.bobOffset = RNG.range(0, Math.PI * 2);
      }
    }

    class Mushroom extends Entity {
      constructor(x, y) {
        super(x, y, 'mushroom');
        this.vx = 1;
        this.emerged = false;
        this.emergeY = y;
      }
    }

    class Star extends Entity {
      constructor(x, y) {
        super(x, y, 'star');
        this.vx = 2;
        this.bounceForce = -6;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROCEDURAL LEVEL GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    function generateLevel(world, level) {
      RNG.reset();
      // Mix seed with world/level for unique levels
      for (let i = 0; i < world * 10 + level; i++) RNG.next();
      
      const width = 200 + world * 20;
      State.levelWidth = width;
      State.tiles = [];
      State.entities = [];
      
      // Initialize empty level
      for (let y = 0; y < State.levelHeight; y++) {
        State.tiles[y] = [];
        for (let x = 0; x < width; x++) {
          State.tiles[y][x] = TILES.AIR;
        }
      }
      
      // Ground level with gaps
      let groundY = State.levelHeight - 2;
      let lastGap = -10;
      
      for (let x = 0; x < width; x++) {
        // Create gaps (not in first 10 tiles or last 20)
        const gapChance = 0.03 + world * 0.01;
        if (x > 10 && x < width - 20 && x - lastGap > 8 && RNG.chance(gapChance)) {
          const gapWidth = RNG.int(2, 3 + Math.floor(world / 2));
          for (let g = 0; g < gapWidth && x + g < width - 20; g++) {
            // No ground here (gap)
          }
          x += gapWidth - 1;
          lastGap = x;
          continue;
        }
        
        // Ground
        State.tiles[groundY][x] = TILES.GROUND;
        State.tiles[groundY + 1][x] = TILES.GROUND;
      }
      
      // Platforms and obstacles
      for (let x = 15; x < width - 30; x += RNG.int(8, 15)) {
        const structureType = RNG.int(0, 10);
        
        if (structureType < 4) {
          // Floating platform with ? blocks
          const platY = RNG.int(groundY - 6, groundY - 3);
          const platWidth = RNG.int(3, 6);
          for (let px = 0; px < platWidth; px++) {
            if (x + px < width) {
              if (RNG.chance(0.4)) {
                State.tiles[platY][x + px] = TILES.QUESTION;
              } else {
                State.tiles[platY][x + px] = TILES.BRICK;
              }
            }
          }
        } else if (structureType < 6) {
          // Pipe
          const pipeHeight = RNG.int(2, 4);
          const pipeY = groundY - pipeHeight;
          if (x + 1 < width) {
            State.tiles[pipeY][x] = TILES.PIPE_TL;
            State.tiles[pipeY][x + 1] = TILES.PIPE_TR;
            for (let py = 1; py < pipeHeight; py++) {
              State.tiles[pipeY + py][x] = TILES.PIPE_BL;
              State.tiles[pipeY + py][x + 1] = TILES.PIPE_BR;
            }
          }
          x += 1;
        } else if (structureType < 8) {
          // Staircase
          const stairHeight = RNG.int(3, 5);
          const goingUp = RNG.chance(0.5);
          for (let s = 0; s < stairHeight; s++) {
            const col = goingUp ? s : (stairHeight - 1 - s);
            for (let h = 0; h <= s; h++) {
              if (x + col < width) {
                State.tiles[groundY - 1 - h][x + col] = TILES.BLOCK;
              }
            }
          }
          x += stairHeight - 1;
        } else {
          // Enemy placement
          if (RNG.chance(0.6)) {
            const enemyType = RNG.chance(0.7) ? 'goomba' : 'koopa';
            if (enemyType === 'goomba') {
              State.entities.push(new Goomba(x * TILE_SIZE, (groundY - 1) * TILE_SIZE));
            } else {
              State.entities.push(new Koopa(x * TILE_SIZE, (groundY - 2) * TILE_SIZE));
            }
          }
        }
      }
      
      // Coins scattered around
      for (let x = 20; x < width - 20; x += RNG.int(5, 12)) {
        if (RNG.chance(0.5)) {
          const coinY = RNG.int(groundY - 7, groundY - 3);
          // Check not inside solid
          if (State.tiles[coinY] && State.tiles[coinY][x] === TILES.AIR) {
            State.entities.push(new Coin(x * TILE_SIZE + 4, coinY * TILE_SIZE));
          }
        }
      }
      
      // More enemies based on difficulty
      const enemyCount = 5 + world * 3;
      for (let i = 0; i < enemyCount; i++) {
        const ex = RNG.int(20, width - 20);
        if (RNG.chance(0.7)) {
          State.entities.push(new Goomba(ex * TILE_SIZE, (groundY - 1) * TILE_SIZE));
        } else {
          State.entities.push(new Koopa(ex * TILE_SIZE, (groundY - 2) * TILE_SIZE));
        }
      }
      
      // Flag pole at end
      const flagX = width - 5;
      for (let fy = groundY - 9; fy < groundY; fy++) {
        State.tiles[fy][flagX] = TILES.BLOCK;
      }
      
      // Decorative clouds and bushes
      for (let x = 5; x < width; x += RNG.int(15, 30)) {
        State.tiles[3][x] = TILES.CLOUD;
        if (x + 1 < width) State.tiles[3][x + 1] = TILES.CLOUD;
      }
      
      for (let x = 8; x < width; x += RNG.int(20, 40)) {
        State.tiles[groundY - 1][x] = TILES.BUSH;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COLLISION DETECTION
    // ═══════════════════════════════════════════════════════════════════════════
    function getTile(x, y) {
      const tx = Math.floor(x / TILE_SIZE);
      const ty = Math.floor(y / TILE_SIZE);
      if (ty < 0 || ty >= State.levelHeight || tx < 0 || tx >= State.levelWidth) {
        return ty >= State.levelHeight ? TILES.GROUND : TILES.AIR;
      }
      return State.tiles[ty][tx];
    }

    function isSolid(x, y) {
      return SOLID_TILES.includes(getTile(x, y));
    }

    function checkCollision(entity) {
      const left = entity.x;
      const right = entity.x + entity.width;
      const top = entity.y;
      const bottom = entity.y + entity.height;
      
      return {
        topLeft: isSolid(left + 2, top),
        topRight: isSolid(right - 2, top),
        bottomLeft: isSolid(left + 2, bottom),
        bottomRight: isSolid(right - 2, bottom),
        left: isSolid(left, top + entity.height / 2),
        right: isSolid(right, top + entity.height / 2)
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER UPDATE
    // ═══════════════════════════════════════════════════════════════════════════
    function updatePlayer(dt) {
      if (Player.isDead) return;
      
      const input = getInput();
      const runMult = input.run ? 1.5 : 1;
      
      // Horizontal movement
      if (input.left) {
        Player.vx -= Player.acceleration * runMult;
        Player.facingRight = false;
      }
      if (input.right) {
        Player.vx += Player.acceleration * runMult;
        Player.facingRight = true;
      }
      
      // Friction
      if (!input.left && !input.right) {
        Player.vx *= Player.friction;
        if (Math.abs(Player.vx) < 0.1) Player.vx = 0;
      }
      
      // Clamp speed
      const maxSpd = Player.maxSpeed * runMult;
      Player.vx = Math.max(-maxSpd, Math.min(maxSpd, Player.vx));
      
      // Jumping
      if (input.jump && Player.isGrounded) {
        Player.vy = Player.jumpForce;
        Player.isGrounded = false;
        Player.isJumping = true;
        Audio.playJump();
      }
      
      // Variable jump height
      if (!input.jump && Player.vy < -3) {
        Player.vy = -3;
      }
      
      // Gravity
      Player.vy += GRAVITY;
      if (Player.vy > MAX_FALL_SPEED) Player.vy = MAX_FALL_SPEED;
      
      // Move and collide X
      Player.x += Player.vx;
      const collX = checkCollision(Player);
      if (collX.left || collX.topLeft) {
        Player.x = Math.floor(Player.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE - 2;
        Player.vx = 0;
      }
      if (collX.right || collX.topRight) {
        Player.x = Math.floor(Player.x / TILE_SIZE) * TILE_SIZE + 2;
        Player.vx = 0;
      }
      
      // Move and collide Y
      Player.y += Player.vy;
      const collY = checkCollision(Player);
      
      if (Player.vy > 0 && (collY.bottomLeft || collY.bottomRight)) {
        Player.y = Math.floor(Player.y / TILE_SIZE) * TILE_SIZE;
        Player.vy = 0;
        Player.isGrounded = true;
        Player.isJumping = false;
      } else if (Player.vy < 0 && (collY.topLeft || collY.topRight)) {
        Player.y = Math.floor(Player.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
        Player.vy = 0;
        
        // Hit block from below
        const hitX = Math.floor((Player.x + Player.width / 2) / TILE_SIZE);
        const hitY = Math.floor(Player.y / TILE_SIZE);
        hitBlock(hitX, hitY);
      } else {
        Player.isGrounded = false;
      }
      
      // Level boundaries
      if (Player.x < 0) Player.x = 0;
      
      // Fall death
      if (Player.y > State.levelHeight * TILE_SIZE + 50) {
        killPlayer();
      }
      
      // Check goal
      if (Player.x >= (State.levelWidth - 6) * TILE_SIZE) {
        winLevel();
      }
      
      // Invincibility timer
      if (State.invincibleTimer > 0) {
        State.invincibleTimer -= dt;
      }
      
      // Animation
      Player.frameTimer += dt;
      if (Player.frameTimer > 0.1) {
        Player.frameTimer = 0;
        Player.frame = (Player.frame + 1) % 3;
      }
    }

    function hitBlock(tx, ty) {
      if (ty < 0 || ty >= State.levelHeight || tx < 0 || tx >= State.levelWidth) return;
      
      const tile = State.tiles[ty][tx];
      
      if (tile === TILES.QUESTION) {
        State.tiles[ty][tx] = TILES.QUESTION_EMPTY;
        Audio.playCoin();
        
        // Spawn item
        if (RNG.chance(0.7)) {
          State.coins++;
          State.score += 100;
          spawnCoinEffect(tx * TILE_SIZE + 4, ty * TILE_SIZE - 16);
        } else if (RNG.chance(0.5)) {
          State.entities.push(new Mushroom(tx * TILE_SIZE, ty * TILE_SIZE - 16));
        } else {
          State.entities.push(new Star(tx * TILE_SIZE, ty * TILE_SIZE - 16));
        }
      } else if (tile === TILES.BRICK && Player.isBig) {
        State.tiles[ty][tx] = TILES.AIR;
        spawnBrickParticles(tx * TILE_SIZE, ty * TILE_SIZE);
        State.score += 50;
      }
    }

    function killPlayer() {
      if (Player.isDead) return;
      
      if (Player.isBig && State.invincibleTimer <= 0) {
        Player.isBig = false;
        Player.height = 16;
        State.invincibleTimer = 2;
        Audio.playHurt();
        return;
      }
      
      if (State.invincibleTimer > 0) return;
      
      Player.isDead = true;
      Player.vy = -8;
      Audio.playDeath();
      
      setTimeout(() => {
        State.lives--;
        if (State.lives <= 0) {
          gameOver();
        } else {
          resetLevel();
        }
      }, 1500);
    }

    function winLevel() {
      if (!State.isRunning) return;
      State.isRunning = false;
      Audio.playWin();
      
      document.getElementById('win-screen').style.display = 'flex';
    }

    function nextLevel() {
      State.level++;
      if (State.level > 4) {
        State.level = 1;
        State.world++;
      }
      State.difficultyMult = 1 + (State.world - 1) * 0.2;
      startLevel();
      document.getElementById('win-screen').style.display = 'none';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENTITY UPDATE
    // ═══════════════════════════════════════════════════════════════════════════
    function updateEntities(dt) {
      for (let i = State.entities.length - 1; i >= 0; i--) {
        const e = State.entities[i];
        if (!e.active) {
          State.entities.splice(i, 1);
          continue;
        }
        
        // Skip if too far from camera
        if (e.x < State.cameraX - 100 || e.x > State.cameraX + canvas.width + 100) continue;
        
        if (e.type === 'goomba') updateGoomba(e, dt);
        else if (e.type === 'koopa') updateKoopa(e, dt);
        else if (e.type === 'coin') updateCoin(e, dt);
        else if (e.type === 'mushroom') updateMushroom(e, dt);
        else if (e.type === 'star') updateStar(e, dt);
        
        // Check player collision
        if (checkEntityPlayerCollision(e)) {
          handleEntityCollision(e);
        }
      }
    }

    function updateGoomba(e, dt) {
      if (e.squished) {
        e.squishTimer -= dt;
        if (e.squishTimer <= 0) e.active = false;
        return;
      }
      
      e.vy += GRAVITY * 0.5;
      e.x += e.vx * State.difficultyMult;
      e.y += e.vy;
      
      // Ground collision
      if (isSolid(e.x + 8, e.y + e.height)) {
        e.y = Math.floor(e.y / TILE_SIZE) * TILE_SIZE;
        e.vy = 0;
      }
      
      // Wall collision
      if (isSolid(e.x + (e.vx > 0 ? e.width : 0), e.y + 8)) {
        e.vx *= -1;
      }
      
      // Fall off screen
      if (e.y > State.levelHeight * TILE_SIZE) e.active = false;
    }

    function updateKoopa(e, dt) {
      e.vy += GRAVITY * 0.5;
      
      if (e.inShell && e.shellSpeed !== 0) {
        e.x += e.shellSpeed;
        // Kill other enemies
        for (const other of State.entities) {
          if (other !== e && other.active && (other.type === 'goomba' || other.type === 'koopa')) {
            if (Math.abs(other.x - e.x) < 16 && Math.abs(other.y - e.y) < 16) {
              other.active = false;
              State.score += 100;
              Audio.playStomp();
            }
          }
        }
      } else if (!e.inShell) {
        e.x += e.vx * State.difficultyMult;
      }
      
      e.y += e.vy;
      
      if (isSolid(e.x + 8, e.y + e.height)) {
        e.y = Math.floor(e.y / TILE_SIZE) * TILE_SIZE;
        e.vy = 0;
      }
      
      if (isSolid(e.x + (e.vx > 0 || e.shellSpeed > 0 ? e.width : 0), e.y + 8)) {
        e.vx *= -1;
        e.shellSpeed *= -1;
      }
      
      if (e.y > State.levelHeight * TILE_SIZE) e.active = false;
    }

    function updateCoin(e, dt) {
      e.frame += dt * 10;
      e.y += Math.sin(e.frame + e.bobOffset) * 0.3;
    }

    function updateMushroom(e, dt) {
      if (!e.emerged) {
        e.y -= 0.5;
        if (e.y <= e.emergeY - 16) {
          e.emerged = true;
        }
        return;
      }
      
      e.vy += GRAVITY * 0.5;
      e.x += e.vx;
      e.y += e.vy;
      
      if (isSolid(e.x + 8, e.y + e.height)) {
        e.y = Math.floor(e.y / TILE_SIZE) * TILE_SIZE;
        e.vy = 0;
      }
      
      if (isSolid(e.x + (e.vx > 0 ? e.width : 0), e.y + 8)) {
        e.vx *= -1;
      }
    }

    function updateStar(e, dt) {
      e.vy += GRAVITY * 0.3;
      e.x += e.vx;
      e.y += e.vy;
      
      if (isSolid(e.x + 8, e.y + e.height)) {
        e.y = Math.floor(e.y / TILE_SIZE) * TILE_SIZE;
        e.vy = e.bounceForce;
      }
      
      if (isSolid(e.x + (e.vx > 0 ? e.width : 0), e.y + 8)) {
        e.vx *= -1;
      }
    }

    function checkEntityPlayerCollision(e) {
      if (Player.isDead) return false;
      return Player.x < e.x + e.width &&
             Player.x + Player.width > e.x &&
             Player.y < e.y + e.height &&
             Player.y + Player.height > e.y;
    }

    function handleEntityCollision(e) {
      if (e.type === 'coin') {
        State.coins++;
        State.score += 200;
        Audio.playCoin();
        e.active = false;
      } else if (e.type === 'mushroom') {
        if (!Player.isBig) {
          Player.isBig = true;
          Player.height = 24;
          Player.y -= 8;
        }
        State.score += 1000;
        Audio.playPowerUp();
        e.active = false;
      } else if (e.type === 'star') {
        Player.hasStar = true;
        State.invincibleTimer = 10;
        State.score += 1000;
        Audio.playPowerUp();
        e.active = false;
      } else if (e.type === 'goomba') {
        if (Player.hasStar) {
          e.active = false;
          State.score += 100;
          Audio.playStomp();
        } else if (Player.vy > 0 && Player.y + Player.height - 8 < e.y + e.height / 2) {
          // Stomp
          e.squished = true;
          e.squishTimer = 0.5;
          e.height = 8;
          Player.vy = -6;
          State.score += 100;
          Audio.playStomp();
        } else {
          killPlayer();
        }
      } else if (e.type === 'koopa') {
        if (Player.hasStar) {
          e.active = false;
          State.score += 100;
          Audio.playStomp();
        } else if (Player.vy > 0 && Player.y + Player.height - 8 < e.y + e.height / 2) {
          if (e.inShell && e.shellSpeed === 0) {
            // Kick shell
            e.shellSpeed = Player.x < e.x ? 5 : -5;
          } else {
            // Go into shell
            e.inShell = true;
            e.shellSpeed = 0;
            e.height = 16;
          }
          Player.vy = -6;
          State.score += 100;
          Audio.playStomp();
        } else if (e.inShell && e.shellSpeed === 0) {
          // Kick stationary shell
          e.shellSpeed = Player.x < e.x ? 5 : -5;
        } else {
          killPlayer();
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PARTICLES
    // ═══════════════════════════════════════════════════════════════════════════
    function spawnCoinEffect(x, y) {
      State.particles.push({
        x, y, vy: -5, type: 'coin', timer: 0.5
      });
    }

    function spawnBrickParticles(x, y) {
      for (let i = 0; i < 4; i++) {
        State.particles.push({
          x: x + (i % 2) * 8,
          y: y + Math.floor(i / 2) * 8,
          vx: (i % 2 === 0 ? -2 : 2) + RNG.range(-1, 1),
          vy: -5 + RNG.range(-2, 0),
          type: 'brick',
          timer: 1
        });
      }
    }

    function updateParticles(dt) {
      for (let i = State.particles.length - 1; i >= 0; i--) {
        const p = State.particles[i];
        p.timer -= dt;
        if (p.timer <= 0) {
          State.particles.splice(i, 1);
          continue;
        }
        
        if (p.type === 'coin') {
          p.y += p.vy;
          p.vy += GRAVITY;
        } else if (p.type === 'brick') {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += GRAVITY;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAMERA
    // ═══════════════════════════════════════════════════════════════════════════
    function updateCamera() {
      const targetX = Player.x - canvas.width / 3;
      State.cameraX += (targetX - State.cameraX) * 0.1;
      State.cameraX = Math.max(0, Math.min(State.levelWidth * TILE_SIZE - canvas.width, State.cameraX));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════════════════════════════════════
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');

    // 8-bit color palette
    const COLORS = {
      sky: '#5c94fc',
      ground: '#c84c0c',
      groundDark: '#a02800',
      brick: '#d87844',
      brickDark: '#a02800',
      question: '#ffa044',
      questionDark: '#c87400',
      block: '#b8b8b8',
      blockDark: '#808080',
      pipe: '#00a800',
      pipeDark: '#008000',
      pipeHighlight: '#80d880',
      cloud: '#fcfcfc',
      player: '#ff0000',
      playerSkin: '#fca044',
      goomba: '#c84c0c',
      goombaFeet: '#fca044',
      koopa: '#00a800',
      koopaShell: '#00a800',
      coin: '#ffd700',
      mushroom: '#ff0000',
      mushroomSpots: '#fcfcfc',
      star: '#ffd700'
    };

    function resizeCanvas() {
      const aspect = 16 / 9;
      let w = window.innerWidth;
      let h = window.innerHeight;
      
      if (w / h > aspect) {
        w = h * aspect;
      } else {
        h = w / aspect;
      }
      
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = 400;
      canvas.height = 225;
    }

    function render() {
      ctx.imageSmoothingEnabled = false;
      
      // Sky background
      ctx.fillStyle = COLORS.sky;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.translate(-Math.floor(State.cameraX), 0);
      
      // Render tiles
      const startX = Math.floor(State.cameraX / TILE_SIZE);
      const endX = Math.ceil((State.cameraX + canvas.width) / TILE_SIZE) + 1;
      
      for (let y = 0; y < State.levelHeight; y++) {
        for (let x = startX; x < endX && x < State.levelWidth; x++) {
          const tile = State.tiles[y]?.[x];
          if (tile === TILES.AIR) continue;
          
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          
          renderTile(tile, px, py);
        }
      }
      
      // Render entities
      for (const e of State.entities) {
        if (e.x < State.cameraX - 50 || e.x > State.cameraX + canvas.width + 50) continue;
        renderEntity(e);
      }
      
      // Render particles
      for (const p of State.particles) {
        renderParticle(p);
      }
      
      // Render player
      if (!Player.isDead || Player.vy < 0) {
        renderPlayer();
      }
      
      ctx.restore();
    }

    function renderTile(tile, x, y) {
      switch (tile) {
        case TILES.GROUND:
          ctx.fillStyle = COLORS.ground;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = COLORS.groundDark;
          ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
          break;
          
        case TILES.BRICK:
          ctx.fillStyle = COLORS.brick;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = COLORS.brickDark;
          ctx.fillRect(x, y, TILE_SIZE, 2);
          ctx.fillRect(x, y + 7, TILE_SIZE, 2);
          ctx.fillRect(x + 7, y, 2, TILE_SIZE);
          break;
          
        case TILES.QUESTION:
        case TILES.QUESTION_EMPTY:
          ctx.fillStyle = tile === TILES.QUESTION ? COLORS.question : COLORS.block;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = tile === TILES.QUESTION ? COLORS.questionDark : COLORS.blockDark;
          ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
          ctx.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);
          if (tile === TILES.QUESTION) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.fillText('?', x + 5, y + 12);
          }
          break;
          
        case TILES.BLOCK:
          ctx.fillStyle = COLORS.block;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = COLORS.blockDark;
          ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
          ctx.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);
          break;
          
        case TILES.PIPE_TL:
        case TILES.PIPE_TR:
        case TILES.PIPE_BL:
        case TILES.PIPE_BR:
          ctx.fillStyle = COLORS.pipe;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = COLORS.pipeHighlight;
          if (tile === TILES.PIPE_TL || tile === TILES.PIPE_BL) {
            ctx.fillRect(x, y, 4, TILE_SIZE);
          }
          ctx.fillStyle = COLORS.pipeDark;
          if (tile === TILES.PIPE_TR || tile === TILES.PIPE_BR) {
            ctx.fillRect(x + TILE_SIZE - 4, y, 4, TILE_SIZE);
          }
          if (tile === TILES.PIPE_TL || tile === TILES.PIPE_TR) {
            ctx.fillRect(x, y, TILE_SIZE, 4);
          }
          break;
          
        case TILES.CLOUD:
          ctx.fillStyle = COLORS.cloud;
          ctx.beginPath();
          ctx.arc(x + 8, y + 10, 8, 0, Math.PI * 2);
          ctx.arc(x + 20, y + 8, 10, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case TILES.BUSH:
          ctx.fillStyle = '#00a800';
          ctx.beginPath();
          ctx.arc(x + 8, y + 12, 8, 0, Math.PI * 2);
          ctx.arc(x + 18, y + 10, 10, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
    }

    function renderEntity(e) {
      const x = Math.floor(e.x);
      const y = Math.floor(e.y);
      
      if (e.type === 'goomba') {
        if (e.squished) {
          ctx.fillStyle = COLORS.goomba;
          ctx.fillRect(x, y + 8, 16, 8);
        } else {
          ctx.fillStyle = COLORS.goomba;
          ctx.beginPath();
          ctx.arc(x + 8, y + 6, 8, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(x + 2, y + 6, 12, 8);
          ctx.fillStyle = COLORS.goombaFeet;
          ctx.fillRect(x, y + 12, 6, 4);
          ctx.fillRect(x + 10, y + 12, 6, 4);
          ctx.fillStyle = '#000';
          ctx.fillRect(x + 3, y + 4, 3, 3);
          ctx.fillRect(x + 10, y + 4, 3, 3);
        }
      } else if (e.type === 'koopa') {
        if (e.inShell) {
          ctx.fillStyle = COLORS.koopaShell;
          ctx.beginPath();
          ctx.ellipse(x + 8, y + 10, 8, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffe135';
          ctx.fillRect(x + 4, y + 8, 8, 4);
        } else {
          ctx.fillStyle = COLORS.koopa;
          ctx.fillRect(x + 4, y, 8, 10);
          ctx.fillRect(x + 2, y + 10, 12, 10);
          ctx.fillStyle = '#ffe135';
          ctx.fillRect(x + 6, y + 2, 6, 6);
        }
      } else if (e.type === 'coin') {
        ctx.fillStyle = COLORS.coin;
        const stretch = Math.abs(Math.sin(e.frame));
        ctx.beginPath();
        ctx.ellipse(x + 4, y + 8, 4 * stretch, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'mushroom') {
        ctx.fillStyle = COLORS.mushroom;
        ctx.beginPath();
        ctx.arc(x + 8, y + 6, 8, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = COLORS.mushroomSpots;
        ctx.beginPath();
        ctx.arc(x + 5, y + 3, 2, 0, Math.PI * 2);
        ctx.arc(x + 11, y + 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fca044';
        ctx.fillRect(x + 4, y + 6, 8, 10);
      } else if (e.type === 'star') {
        ctx.fillStyle = COLORS.star;
        ctx.save();
        ctx.translate(x + 8, y + 8);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
          const r = i === 0 ? 8 : 8;
          ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          const angle2 = angle + 2 * Math.PI / 5;
          ctx.lineTo(Math.cos(angle2) * 4, Math.sin(angle2) * 4);
        }
        ctx.fill();
        ctx.restore();
      }
    }

    function renderParticle(p) {
      if (p.type === 'coin') {
        ctx.fillStyle = COLORS.coin;
        ctx.beginPath();
        ctx.arc(p.x + 4, p.y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'brick') {
        ctx.fillStyle = COLORS.brick;
        ctx.fillRect(p.x, p.y, 6, 6);
      }
    }

    function renderPlayer() {
      const x = Math.floor(Player.x);
      const y = Math.floor(Player.y);
      
      // Flash when invincible
      if (State.invincibleTimer > 0 && Math.floor(State.invincibleTimer * 10) % 2 === 0) {
        return;
      }
      
      // Star power rainbow
      let bodyColor = COLORS.player;
      if (Player.hasStar) {
        const hue = (Date.now() / 50) % 360;
        bodyColor = 'hsl(' + hue + ', 100%, 50%)';
      }
      
      ctx.save();
      if (!Player.facingRight) {
        ctx.translate(x + Player.width, 0);
        ctx.scale(-1, 1);
        ctx.translate(-x, 0);
      }
      
      const h = Player.isBig ? 24 : 16;
      
      // Body
      ctx.fillStyle = bodyColor;
      if (Player.isBig) {
        ctx.fillRect(x + 4, y + 8, 8, 16);
      } else {
        ctx.fillRect(x + 4, y + 4, 8, 12);
      }
      
      // Head
      ctx.fillStyle = COLORS.playerSkin;
      ctx.beginPath();
      ctx.arc(x + 8, y + (Player.isBig ? 6 : 4), Player.isBig ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Hat
      ctx.fillStyle = bodyColor;
      ctx.fillRect(x + 2, y + (Player.isBig ? 2 : 1), 12, Player.isBig ? 4 : 3);
      
      ctx.restore();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HUD UPDATE
    // ═══════════════════════════════════════════════════════════════════════════
    function updateHUD() {
      document.getElementById('score').textContent = State.score.toString().padStart(6, '0');
      document.getElementById('world').textContent = State.world + '-' + State.level;
      document.getElementById('coins').textContent = State.coins;
      document.getElementById('lives').textContent = State.lives;
      document.getElementById('time').textContent = Math.ceil(State.time);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GAME FLOW
    // ═══════════════════════════════════════════════════════════════════════════
    function startLevel() {
      generateLevel(State.world, State.level);
      
      Player.x = 48;
      Player.y = (State.levelHeight - 4) * TILE_SIZE;
      Player.vx = 0;
      Player.vy = 0;
      Player.isDead = false;
      Player.isGrounded = false;
      
      State.cameraX = 0;
      State.time = 300 - (State.world - 1) * 20;
      State.isRunning = true;
      State.particles = [];
      
      Audio.startMusic();
    }

    function resetLevel() {
      Player.x = 48;
      Player.y = (State.levelHeight - 4) * TILE_SIZE;
      Player.vx = 0;
      Player.vy = 0;
      Player.isDead = false;
      Player.isBig = false;
      Player.height = 16;
      Player.hasStar = false;
      
      State.cameraX = 0;
      State.time = 300 - (State.world - 1) * 20;
      State.invincibleTimer = 0;
      State.isRunning = true;
      
      Audio.startMusic();
    }

    function gameOver() {
      State.isRunning = false;
      Audio.stopMusic();
      
      document.getElementById('final-score').textContent = State.score;
      document.getElementById('final-world').textContent = State.world + '-' + State.level;
      document.getElementById('final-coins').textContent = State.coins;
      document.getElementById('death-screen').style.display = 'flex';
    }

    function restart() {
      State.score = 0;
      State.coins = 0;
      State.lives = 3;
      State.world = 1;
      State.level = 1;
      State.difficultyMult = 1;
      Player.isBig = false;
      Player.height = 16;
      Player.hasStar = false;
      
      document.getElementById('death-screen').style.display = 'none';
      startLevel();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TELEMETRY
    // ═══════════════════════════════════════════════════════════════════════════
    let frameCount = 0, fps = 0;
    setInterval(() => { fps = frameCount; frameCount = 0; }, 1000);

    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN LOOP
    // ═══════════════════════════════════════════════════════════════════════════
    let lastTime = 0;
    
    function gameLoop(timestamp) {
      requestAnimationFrame(gameLoop);
      
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
      lastTime = timestamp;
      
      if (State.isRunning && !State.isPaused) {
        updatePlayer(dt);
        updateEntities(dt);
        updateParticles(dt);
        updateCamera();
        
        // Timer
        State.timeTimer += dt;
        if (State.timeTimer >= 1) {
          State.timeTimer = 0;
          State.time--;
          if (State.time <= 0) {
            killPlayer();
          }
        }
        
        updateHUD();
      }
      
      render();
      
      frameCount++;
      window.parent.postMessage({
        type: 'forge-telemetry',
        fps: fps,
        entities: State.entities.length
      }, '*');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    document.getElementById('overlay').addEventListener('click', () => {
      Audio.init();
      Audio.resume();
      document.getElementById('overlay').classList.add('hidden');
      startLevel();
    });

    document.getElementById('death-screen').addEventListener('click', restart);
    document.getElementById('win-screen').addEventListener('click', nextLevel);

    // Start the loop (paused until overlay clicked)
    requestAnimationFrame(gameLoop);
  </script>
</body>
</html>
`;

export default PLATFORMER_8BIT_SKELETON;
