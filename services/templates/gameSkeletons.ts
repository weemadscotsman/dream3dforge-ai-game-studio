/**
 * DREAM3DFORGE GAME SKELETONS v1.0
 * 
 * These are COMPLETE, WORKING game templates that the AI fills in.
 * NOT abstract patterns - these are copy-paste-ready starting points.
 */

import { PLATFORMER_8BIT_SKELETON } from './platformerSkeleton';
import {
  ASTEROIDS_SKELETON, PONG_SKELETON, SNAKE_SKELETON,
  BREAKOUT_SKELETON, SHMUP_SKELETON, RACING_SKELETON, FLAPPY_SKELETON,
  VAMPIRE_SURVIVORS_SKELETON, TWIN_STICK_SKELETON
} from './arcadeSkeletons';
import {
  TOWER_DEFENSE_SKELETON, MATCH3_SKELETON, ROGUE_DUNGEON_SKELETON,
  FIGHTING_SKELETON, SURVIVAL_HORROR_SKELETON, STEALTH_SKELETON,
  FISHING_SKELETON, GOLF_SKELETON, CARD_BATTLER_SKELETON
} from './advancedSkeletons';

export const ARENA_SHOOTER_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>%%TITLE%%</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    canvas { display: block; }
    #overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,0.9);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #fff; font-family: monospace;
      cursor: pointer; transition: opacity 0.3s;
    }
    #overlay.hidden { opacity: 0; pointer-events: none; }
    #overlay h1 { font-size: 2rem; margin-bottom: 1rem; text-transform: uppercase; }
    #overlay p { color: #888; font-size: 0.9rem; }
    #hud {
      position: fixed; top: 10px; left: 10px; z-index: 50;
      font-family: monospace; color: #0f0; font-size: 14px;
      text-shadow: 0 0 10px #0f0;
    }
    #hud div { margin-bottom: 5px; }
    #death-screen {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(139,0,0,0.95);
      display: none; flex-direction: column;
      align-items: center; justify-content: center;
      color: #fff; font-family: monospace;
      cursor: pointer;
    }
    #death-screen h1 { font-size: 3rem; margin-bottom: 1rem; }
    #death-screen .stats { font-size: 1.2rem; margin-bottom: 2rem; }
    #death-screen p { color: #faa; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div id="overlay">
    <h1>%%TITLE%%</h1>
    <p>Click to Play</p>
    <p style="margin-top: 1rem; font-size: 0.7rem;">%%CONTROLS%%</p>
  </div>
  <div id="hud">
    <div>SCORE: <span id="score">0</span></div>
    <div>WAVE: <span id="wave">1</span></div>
    <div>HP: <span id="hp">100</span></div>
  </div>
  <div id="death-screen">
    <h1>GAME OVER</h1>
    <div class="stats">
      <div>Final Score: <span id="final-score">0</span></div>
      <div>Waves Survived: <span id="final-wave">0</span></div>
      <div>Time: <span id="final-time">0:00</span></div>
    </div>
    <p>Click to Restart</p>
  </div>

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

    // ═══════════════════════════════════════════════════════════════════
    // SEEDED RANDOM - Ensures variance but reproducible runs
    // ═══════════════════════════════════════════════════════════════════
    class SeededRandom {
      constructor(seed) {
        this.seed = this.hashCode(String(seed));
      }
      hashCode(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
          h = ((h << 5) - h) + str.charCodeAt(i) & 0xffffffff;
        }
        return Math.abs(h) || 1;
      }
      next() {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
      }
      range(a, b) { return a + this.next() * (b - a); }
      int(a, b) { return Math.floor(this.range(a, b + 1)); }
    }
    const RNG = new SeededRandom("%%SEED%%");

    // ═══════════════════════════════════════════════════════════════════
    // GAME STATE - Single source of truth
    // ═══════════════════════════════════════════════════════════════════
    const State = {
      isRunning: false,
      isPaused: false,
      gameTime: 0,
      wave: 1,
      score: 0,
      phase: 'calm', // calm, pressure, panic
      spawnTimer: 0,
      spawnInterval: 2.0, // seconds between spawns
      difficultyMult: 1.0,
      player: {
        hp: 100,
        maxHp: 100,
        speed: 12,
        fireRate: 0.15,
        fireCooldown: 0,
        damage: 25
      },
      enemies: [],
      bullets: [],
      particles: [],
      // Tension curve config
      tension: {
        calmEnd: 30,      // seconds until pressure
        pressureEnd: 90,  // seconds until panic
        maxDifficulty: 3.0
      }
    };

    // ═══════════════════════════════════════════════════════════════════
    // INPUT SYSTEM - Unified keyboard + touch
    // ═══════════════════════════════════════════════════════════════════
    const Input = {
      keys: {},
      mouse: { x: 0, y: 0, buttons: {} },
      touch: null
    };

    function getPlayerInput() {
      let moveX = 0, moveY = 0, fire = false;

      // Touch joystick (if available)
      const touch = window.TouchControls?.getMove?.();
      if (touch && (Math.abs(touch.x) > 0.1 || Math.abs(touch.y) > 0.1)) {
        moveX = touch.x;
        moveY = touch.y;
      } else {
        // Keyboard
        if (Input.keys['KeyA'] || Input.keys['ArrowLeft']) moveX -= 1;
        if (Input.keys['KeyD'] || Input.keys['ArrowRight']) moveX += 1;
        if (Input.keys['KeyW'] || Input.keys['ArrowUp']) moveY -= 1;
        if (Input.keys['KeyS'] || Input.keys['ArrowDown']) moveY += 1;
      }

      // Fire: mouse button, space, or touch
      fire = Input.mouse.buttons[0] || Input.keys['Space'] || window.TouchControls?.isFire?.() || false;

      // Normalize diagonal movement
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      if (len > 1) {
        moveX /= len;
        moveY /= len;
      }

      return { moveX, moveY, fire };
    }

    // Input listeners
    document.addEventListener('keydown', e => { Input.keys[e.code] = true; });
    document.addEventListener('keyup', e => { Input.keys[e.code] = false; });
    document.addEventListener('mousedown', e => { Input.mouse.buttons[e.button] = true; });
    document.addEventListener('mouseup', e => { Input.mouse.buttons[e.button] = false; });
    document.addEventListener('mousemove', e => {
      Input.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      Input.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ═══════════════════════════════════════════════════════════════════
    // THREE.JS SETUP
    // ═══════════════════════════════════════════════════════════════════
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 30, 80);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // ═══════════════════════════════════════════════════════════════════
    // ASSET CREATION HELPERS
    // ═══════════════════════════════════════════════════════════════════
    function createGridFloor(size = 100, divisions = 50, color1 = 0x000020, color2 = 0x00ff88) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#' + color1.toString(16).padStart(6, '0');
      ctx.fillRect(0, 0, 512, 512);
      
      ctx.strokeStyle = '#' + color2.toString(16).padStart(6, '0');
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#' + color2.toString(16).padStart(6, '0');
      
      const step = 512 / divisions;
      ctx.beginPath();
      for (let i = 0; i <= 512; i += step) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
      }
      ctx.stroke();

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(size / 10, size / 10);

      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      return floor;
    }

    function createNeonMaterial(color, emissiveIntensity = 1.5) {
      return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: emissiveIntensity,
        roughness: 0.2,
        metalness: 0.8
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME OBJECTS
    // ═══════════════════════════════════════════════════════════════════
    
    // FLOOR
    const floor = createGridFloor(100, 50, 0x000020, 0x00ff88);
    scene.add(floor);

    // ARENA BOUNDS (invisible walls)
    const ARENA_SIZE = 40;
    
    // PLAYER
    const playerGeo = new THREE.CylinderGeometry(0.3, 0.5, 1, 8);
    const playerMat = createNeonMaterial(0x00ffff, 2);
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 0.5;
    player.castShadow = true;
    scene.add(player);

    // Aim indicator
    const aimGeo = new THREE.RingGeometry(0.3, 0.4, 16);
    const aimMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    const aimIndicator = new THREE.Mesh(aimGeo, aimMat);
    aimIndicator.rotation.x = -Math.PI / 2;
    aimIndicator.position.y = 0.1;
    scene.add(aimIndicator);

    // ═══════════════════════════════════════════════════════════════════
    // ENEMY SYSTEM
    // ═══════════════════════════════════════════════════════════════════
    const enemyPool = [];
    
    function spawnEnemy() {
      // Spawn at edge of arena
      const angle = RNG.range(0, Math.PI * 2);
      const dist = ARENA_SIZE * 0.9;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      
      const enemyGeo = new THREE.BoxGeometry(1, 1, 1);
      const enemyMat = createNeonMaterial(0xff0044, 1.5);
      const enemy = new THREE.Mesh(enemyGeo, enemyMat);
      enemy.position.set(x, 0.5, z);
      enemy.castShadow = true;
      
      enemy.userData = {
        hp: Math.ceil(30 * State.difficultyMult),
        maxHp: Math.ceil(30 * State.difficultyMult),
        speed: 3 + State.difficultyMult,
        damage: 10,
        type: RNG.next() > 0.7 ? 'charger' : 'normal'
      };
      
      scene.add(enemy);
      State.enemies.push(enemy);
    }

    function updateEnemies(delta) {
      for (let i = State.enemies.length - 1; i >= 0; i--) {
        const enemy = State.enemies[i];
        
        // Move toward player
        const dir = new THREE.Vector3()
          .subVectors(player.position, enemy.position)
          .normalize();
        
        const speed = enemy.userData.type === 'charger' 
          ? enemy.userData.speed * 1.5 
          : enemy.userData.speed;
        
        enemy.position.x += dir.x * speed * delta;
        enemy.position.z += dir.z * speed * delta;
        
        // Face player
        enemy.lookAt(player.position.x, enemy.position.y, player.position.z);
        
        // Check collision with player
        const dist = enemy.position.distanceTo(player.position);
        if (dist < 1.2) {
          damagePlayer(enemy.userData.damage);
          // Knockback enemy
          enemy.position.x -= dir.x * 3;
          enemy.position.z -= dir.z * 3;
        }
      }
    }

    function damageEnemy(enemy, damage) {
      enemy.userData.hp -= damage;
      
      // Flash white
      enemy.material.emissive.setHex(0xffffff);
      setTimeout(() => {
        if (enemy.userData.hp > 0) {
          enemy.material.emissive.setHex(0xff0044);
        }
      }, 50);
      
      if (enemy.userData.hp <= 0) {
        killEnemy(enemy);
      }
    }

    function killEnemy(enemy) {
      const idx = State.enemies.indexOf(enemy);
      if (idx > -1) {
        State.enemies.splice(idx, 1);
        scene.remove(enemy);
        
        // Score
        State.score += 100 * Math.ceil(State.difficultyMult);
        
        // Spawn particles
        spawnParticles(enemy.position, 0xff0044, 10);
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // BULLET SYSTEM
    // ═══════════════════════════════════════════════════════════════════
    const bulletGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const bulletMat = createNeonMaterial(0x00ffff, 3);

    function shootBullet() {
      if (State.player.fireCooldown > 0) return;
      State.player.fireCooldown = State.player.fireRate;

      const bullet = new THREE.Mesh(bulletGeo, bulletMat.clone());
      bullet.position.copy(player.position);
      
      // Shoot toward aim indicator
      const dir = new THREE.Vector3()
        .subVectors(aimIndicator.position, player.position)
        .normalize();
      
      bullet.userData = {
        velocity: dir.multiplyScalar(40),
        damage: State.player.damage,
        lifetime: 3
      };
      
      scene.add(bullet);
      State.bullets.push(bullet);
    }

    function updateBullets(delta) {
      for (let i = State.bullets.length - 1; i >= 0; i--) {
        const bullet = State.bullets[i];
        
        bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(delta));
        bullet.userData.lifetime -= delta;
        
        // Check enemy collisions
        for (const enemy of State.enemies) {
          if (bullet.position.distanceTo(enemy.position) < 0.8) {
            damageEnemy(enemy, bullet.userData.damage);
            removeBullet(i);
            break;
          }
        }
        
        // Remove if expired or out of bounds
        if (bullet.userData.lifetime <= 0 || 
            Math.abs(bullet.position.x) > ARENA_SIZE ||
            Math.abs(bullet.position.z) > ARENA_SIZE) {
          removeBullet(i);
        }
      }
    }

    function removeBullet(index) {
      const bullet = State.bullets[index];
      scene.remove(bullet);
      State.bullets.splice(index, 1);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PARTICLE SYSTEM
    // ═══════════════════════════════════════════════════════════════════
    function spawnParticles(position, color, count) {
      for (let i = 0; i < count; i++) {
        const geo = new THREE.SphereGeometry(0.1, 4, 4);
        const mat = new THREE.MeshBasicMaterial({ color: color });
        const particle = new THREE.Mesh(geo, mat);
        particle.position.copy(position);
        particle.userData = {
          velocity: new THREE.Vector3(
            RNG.range(-5, 5),
            RNG.range(2, 8),
            RNG.range(-5, 5)
          ),
          lifetime: 1
        };
        scene.add(particle);
        State.particles.push(particle);
      }
    }

    function updateParticles(delta) {
      for (let i = State.particles.length - 1; i >= 0; i--) {
        const p = State.particles[i];
        p.position.add(p.userData.velocity.clone().multiplyScalar(delta));
        p.userData.velocity.y -= 15 * delta; // gravity
        p.userData.lifetime -= delta;
        
        if (p.userData.lifetime <= 0) {
          scene.remove(p);
          State.particles.splice(i, 1);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // PLAYER LOGIC
    // ═══════════════════════════════════════════════════════════════════
    function updatePlayer(delta) {
      const input = getPlayerInput();
      
      // Movement
      player.position.x += input.moveX * State.player.speed * delta;
      player.position.z += input.moveY * State.player.speed * delta;
      
      // Clamp to arena
      player.position.x = Math.max(-ARENA_SIZE + 1, Math.min(ARENA_SIZE - 1, player.position.x));
      player.position.z = Math.max(-ARENA_SIZE + 1, Math.min(ARENA_SIZE - 1, player.position.z));
      
      // Update aim indicator (raycast from camera to ground)
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(Input.mouse.x, Input.mouse.y), camera);
      const intersects = raycaster.intersectObject(floor);
      if (intersects.length > 0) {
        aimIndicator.position.x = intersects[0].point.x;
        aimIndicator.position.z = intersects[0].point.z;
      }
      
      // Shooting
      State.player.fireCooldown = Math.max(0, State.player.fireCooldown - delta);
      if (input.fire) {
        shootBullet();
      }
    }

    function damagePlayer(amount) {
      State.player.hp -= amount;
      
      // Screen shake
      camera.position.x += RNG.range(-0.5, 0.5);
      camera.position.z += RNG.range(-0.5, 0.5);
      
      if (State.player.hp <= 0) {
        die("Overwhelmed by enemies!");
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // TENSION & DIFFICULTY SYSTEM
    // ═══════════════════════════════════════════════════════════════════
    function updateTension(delta) {
      State.gameTime += delta;
      
      // Phase transitions
      if (State.gameTime < State.tension.calmEnd) {
        State.phase = 'calm';
        State.difficultyMult = 1 + (State.gameTime / State.tension.calmEnd) * 0.3;
      } else if (State.gameTime < State.tension.pressureEnd) {
        State.phase = 'pressure';
        const progress = (State.gameTime - State.tension.calmEnd) / (State.tension.pressureEnd - State.tension.calmEnd);
        State.difficultyMult = 1.3 + progress * 0.7;
      } else {
        State.phase = 'panic';
        const panicTime = State.gameTime - State.tension.pressureEnd;
        State.difficultyMult = Math.min(State.tension.maxDifficulty, 2.0 + panicTime * 0.02);
      }
      
      // Spawn rate scales with difficulty
      State.spawnInterval = Math.max(0.3, 2.0 / State.difficultyMult);
      
      // Wave progression (every 20 kills roughly)
      const expectedWave = Math.floor(State.score / 2000) + 1;
      if (expectedWave > State.wave) {
        State.wave = expectedWave;
      }
    }

    function updateSpawning(delta) {
      State.spawnTimer += delta;
      
      if (State.spawnTimer >= State.spawnInterval) {
        State.spawnTimer = 0;
        
        // Spawn more enemies in panic phase
        const count = State.phase === 'panic' ? 3 : (State.phase === 'pressure' ? 2 : 1);
        for (let i = 0; i < count; i++) {
          if (State.enemies.length < 50) { // Cap
            spawnEnemy();
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // DEATH & RESTART
    // ═══════════════════════════════════════════════════════════════════
    function die(reason) {
      State.isRunning = false;
      
      const minutes = Math.floor(State.gameTime / 60);
      const seconds = Math.floor(State.gameTime % 60);
      
      document.getElementById('final-score').textContent = State.score;
      document.getElementById('final-wave').textContent = State.wave;
      document.getElementById('final-time').textContent = minutes + ':' + seconds.toString().padStart(2, '0');
      document.getElementById('death-screen').style.display = 'flex';
    }

    function restart() {
      // Clear enemies
      State.enemies.forEach(e => scene.remove(e));
      State.enemies = [];
      
      // Clear bullets
      State.bullets.forEach(b => scene.remove(b));
      State.bullets = [];
      
      // Clear particles
      State.particles.forEach(p => scene.remove(p));
      State.particles = [];
      
      // Reset state
      State.isRunning = true;
      State.gameTime = 0;
      State.wave = 1;
      State.score = 0;
      State.phase = 'calm';
      State.spawnTimer = 0;
      State.difficultyMult = 1;
      State.player.hp = State.player.maxHp;
      
      // Reset player position
      player.position.set(0, 0.5, 0);
      
      document.getElementById('death-screen').style.display = 'none';
    }

    // ═══════════════════════════════════════════════════════════════════
    // HUD
    // ═══════════════════════════════════════════════════════════════════
    function updateHUD() {
      document.getElementById('score').textContent = State.score;
      document.getElementById('wave').textContent = State.wave;
      document.getElementById('hp').textContent = Math.max(0, State.player.hp);
    }

    // ═══════════════════════════════════════════════════════════════════
    // TELEMETRY
    // ═══════════════════════════════════════════════════════════════════
    let frameCount = 0, lastFPS = 0;
    setInterval(() => { lastFPS = frameCount; frameCount = 0; }, 1000);
    
    function sendTelemetry() {
      frameCount++;
      window.parent.postMessage({ 
        type: 'forge-telemetry', 
        fps: lastFPS, 
        entities: State.enemies.length + State.bullets.length + State.particles.length
      }, '*');
    }

    // ═══════════════════════════════════════════════════════════════════
    // GAME LOOP
    // ═══════════════════════════════════════════════════════════════════
    const clock = new THREE.Clock();

    function gameLoop() {
      requestAnimationFrame(gameLoop);
      
      const delta = Math.min(clock.getDelta(), 0.1); // Cap delta to prevent tunneling
      
      if (State.isRunning && !State.isPaused) {
        updateTension(delta);
        updatePlayer(delta);
        updateEnemies(delta);
        updateBullets(delta);
        updateParticles(delta);
        updateSpawning(delta);
        updateHUD();
      }
      
      // Camera follow (smooth)
      camera.position.x += (player.position.x - camera.position.x) * 0.05;
      camera.position.z += (player.position.z + 20 - camera.position.z) * 0.05;
      camera.lookAt(player.position);
      
      renderer.render(scene, camera);
      sendTelemetry();
    }

    // ═══════════════════════════════════════════════════════════════════
    // START
    // ═══════════════════════════════════════════════════════════════════
    document.getElementById('overlay').addEventListener('click', () => {
      document.getElementById('overlay').classList.add('hidden');
      State.isRunning = true;
    });

    document.getElementById('death-screen').addEventListener('click', () => {
      restart();
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    gameLoop();
  </script>
</body>
</html>
`;

export const DODGE_SURVIVAL_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>%%TITLE%%</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    canvas { display: block; }
    #overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,0.9);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #fff; font-family: monospace;
      cursor: pointer;
    }
    #overlay.hidden { opacity: 0; pointer-events: none; transition: opacity 0.3s; }
    #overlay h1 { font-size: 2rem; margin-bottom: 1rem; }
    #hud {
      position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
      font-family: monospace; color: #ff0; font-size: 24px;
      text-shadow: 0 0 10px #ff0;
    }
    #death-screen {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,0.95);
      display: none; flex-direction: column;
      align-items: center; justify-content: center;
      color: #fff; font-family: monospace;
      cursor: pointer;
    }
    #death-screen h1 { font-size: 2rem; color: #f00; margin-bottom: 1rem; }
    #death-screen .time { font-size: 3rem; color: #ff0; margin-bottom: 2rem; }
  </style>
</head>
<body>
  <div id="overlay">
    <h1>%%TITLE%%</h1>
    <p>Avoid everything. Survive.</p>
    <p style="margin-top: 1rem; font-size: 0.7rem; color: #888;">%%CONTROLS%%</p>
  </div>
  <div id="hud">TIME: <span id="time">0.00</span></div>
  <div id="death-screen">
    <h1>ELIMINATED</h1>
    <div class="time"><span id="final-time">0.00</span>s</div>
    <p>Click to retry</p>
  </div>

  <script type="importmap">
  { "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }
  </script>
  <script type="module">
    import * as THREE from 'three';

    // Seeded RNG
    class SeededRandom {
      constructor(seed) { this.seed = [...seed].reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0) | 0, 0) || 1; }
      next() { this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff; return this.seed / 0x7fffffff; }
      range(a, b) { return a + this.next() * (b - a); }
    }
    const RNG = new SeededRandom("%%SEED%%");

    // State
    const State = {
      isRunning: false,
      time: 0,
      player: { x: 0, y: 0, radius: 0.3 },
      projectiles: [],
      spawnTimer: 0,
      spawnRate: 1.5,
      baseSpeed: 5
    };

    // Input
    const Input = { keys: {} };
    document.addEventListener('keydown', e => Input.keys[e.code] = true);
    document.addEventListener('keyup', e => Input.keys[e.code] = false);

    function getMove() {
      let x = 0, y = 0;
      const touch = window.TouchControls?.getMove?.();
      if (touch && (Math.abs(touch.x) > 0.1 || Math.abs(touch.y) > 0.1)) {
        x = touch.x; y = -touch.y;
      } else {
        if (Input.keys['KeyA'] || Input.keys['ArrowLeft']) x -= 1;
        if (Input.keys['KeyD'] || Input.keys['ArrowRight']) x += 1;
        if (Input.keys['KeyW'] || Input.keys['ArrowUp']) y += 1;
        if (Input.keys['KeyS'] || Input.keys['ArrowDown']) y -= 1;
      }
      const len = Math.sqrt(x*x + y*y);
      return len > 1 ? { x: x/len, y: y/len } : { x, y };
    }

    // Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a15);

    const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, 0.1, 100);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Player
    const playerGeo = new THREE.CircleGeometry(State.player.radius, 16);
    const playerMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const playerMesh = new THREE.Mesh(playerGeo, playerMat);
    scene.add(playerMesh);

    // Hitbox indicator
    const hitboxGeo = new THREE.CircleGeometry(0.1, 8);
    const hitboxMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    scene.add(hitbox);

    // Arena border
    const borderGeo = new THREE.RingGeometry(14.8, 15, 64);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xff0044, side: THREE.DoubleSide });
    const border = new THREE.Mesh(borderGeo, borderMat);
    scene.add(border);

    // Projectile pool
    function spawnProjectile() {
      const angle = RNG.range(0, Math.PI * 2);
      const speed = State.baseSpeed * (1 + State.time * 0.02);
      
      const geo = new THREE.CircleGeometry(0.3, 8);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geo, mat);
      
      mesh.position.x = Math.cos(angle) * 18;
      mesh.position.y = Math.sin(angle) * 18;
      
      // Aim at player with some variance
      const targetAngle = Math.atan2(State.player.y - mesh.position.y, State.player.x - mesh.position.x);
      const variance = RNG.range(-0.3, 0.3);
      
      mesh.userData = {
        vx: Math.cos(targetAngle + variance) * speed,
        vy: Math.sin(targetAngle + variance) * speed
      };
      
      scene.add(mesh);
      State.projectiles.push(mesh);
    }

    function updateProjectiles(delta) {
      for (let i = State.projectiles.length - 1; i >= 0; i--) {
        const p = State.projectiles[i];
        p.position.x += p.userData.vx * delta;
        p.position.y += p.userData.vy * delta;
        
        // Check collision with player (tiny hitbox)
        const dx = p.position.x - State.player.x;
        const dy = p.position.y - State.player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < 0.4) { // Hitbox collision
          die();
          return;
        }
        
        // Remove if out of bounds
        if (Math.abs(p.position.x) > 25 || Math.abs(p.position.y) > 25) {
          scene.remove(p);
          State.projectiles.splice(i, 1);
        }
      }
    }

    function updatePlayer(delta) {
      const input = getMove();
      const speed = 8;
      
      State.player.x += input.x * speed * delta;
      State.player.y += input.y * speed * delta;
      
      // Clamp to arena
      const limit = 14;
      State.player.x = Math.max(-limit, Math.min(limit, State.player.x));
      State.player.y = Math.max(-limit, Math.min(limit, State.player.y));
      
      playerMesh.position.x = State.player.x;
      playerMesh.position.y = State.player.y;
      hitbox.position.x = State.player.x;
      hitbox.position.y = State.player.y;
    }

    function updateSpawning(delta) {
      State.spawnTimer += delta;
      const interval = Math.max(0.1, State.spawnRate - State.time * 0.01);
      
      if (State.spawnTimer >= interval) {
        State.spawnTimer = 0;
        const count = 1 + Math.floor(State.time / 20);
        for (let i = 0; i < count; i++) spawnProjectile();
      }
    }

    function die() {
      State.isRunning = false;
      document.getElementById('final-time').textContent = State.time.toFixed(2);
      document.getElementById('death-screen').style.display = 'flex';
    }

    function restart() {
      State.projectiles.forEach(p => scene.remove(p));
      State.projectiles = [];
      State.time = 0;
      State.spawnTimer = 0;
      State.player.x = 0;
      State.player.y = 0;
      State.isRunning = true;
      document.getElementById('death-screen').style.display = 'none';
    }

    function updateHUD() {
      document.getElementById('time').textContent = State.time.toFixed(2);
    }

    // Telemetry
    let frameCount = 0, fps = 0;
    setInterval(() => { fps = frameCount; frameCount = 0; }, 1000);

    // Loop
    const clock = new THREE.Clock();
    function loop() {
      requestAnimationFrame(loop);
      const delta = Math.min(clock.getDelta(), 0.1);
      
      if (State.isRunning) {
        State.time += delta;
        updatePlayer(delta);
        updateProjectiles(delta);
        updateSpawning(delta);
        updateHUD();
      }
      
      renderer.render(scene, camera);
      frameCount++;
      window.parent.postMessage({ type: 'forge-telemetry', fps, entities: State.projectiles.length }, '*');
    }

    // Start
    document.getElementById('overlay').addEventListener('click', () => {
      document.getElementById('overlay').classList.add('hidden');
      State.isRunning = true;
    });
    document.getElementById('death-screen').addEventListener('click', restart);
    
    window.addEventListener('resize', () => {
      const aspect = window.innerWidth / window.innerHeight;
      camera.left = -20 * aspect;
      camera.right = 20 * aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    loop();
  </script>
</body>
</html>
`;

export const SCORE_CHASE_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>%%TITLE%%</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    canvas { display: block; }
    #overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,0.9);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      color: #fff; font-family: monospace;
      cursor: pointer;
    }
    #overlay.hidden { display: none; }
    #hud {
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      font-family: monospace; text-align: center;
    }
    #hud .score { font-size: 48px; color: #fff; text-shadow: 0 0 20px #0ff; }
    #hud .multiplier { font-size: 24px; color: #ff0; }
    #death-screen {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,0.95);
      display: none; flex-direction: column;
      align-items: center; justify-content: center;
      color: #fff; font-family: monospace;
      cursor: pointer;
    }
    #death-screen .final { font-size: 4rem; color: #0ff; }
  </style>
</head>
<body>
  <div id="overlay">
    <h1 style="font-size: 2rem;">%%TITLE%%</h1>
    <p style="color: #888; margin-top: 1rem;">%%CONTROLS%%</p>
    <p style="color: #666; margin-top: 0.5rem; font-size: 0.8rem;">Click to Start</p>
  </div>
  <div id="hud">
    <div class="score"><span id="score">0</span></div>
    <div class="multiplier">x<span id="mult">1</span></div>
  </div>
  <div id="death-screen">
    <p style="margin-bottom: 1rem;">FINAL SCORE</p>
    <div class="final" id="final-score">0</div>
    <p style="margin-top: 2rem; color: #888;">Click to Retry</p>
  </div>

  <script type="importmap">
  { "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }
  </script>
  <script type="module">
    import * as THREE from 'three';

    class SeededRandom {
      constructor(seed) { this.seed = [...seed].reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0) | 0, 0) || 1; }
      next() { this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff; return this.seed / 0x7fffffff; }
      range(a, b) { return a + this.next() * (b - a); }
    }
    const RNG = new SeededRandom("%%SEED%%");

    const State = {
      isRunning: false,
      score: 0,
      multiplier: 1,
      comboTimer: 0,
      speed: 10,
      obstacles: [],
      collectibles: [],
      player: { x: 0, lane: 1 }, // 0, 1, 2 lanes
      spawnTimer: 0
    };

    const LANES = [-4, 0, 4];
    const Input = { keys: {}, lastLane: 1 };
    document.addEventListener('keydown', e => {
      if (!Input.keys[e.code]) {
        Input.keys[e.code] = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') State.player.lane = Math.max(0, State.player.lane - 1);
        if (e.code === 'KeyD' || e.code === 'ArrowRight') State.player.lane = Math.min(2, State.player.lane + 1);
      }
    });
    document.addEventListener('keyup', e => Input.keys[e.code] = false);

    // Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0020);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x404080, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Floor (scrolling)
    const floorGeo = new THREE.PlaneGeometry(20, 200, 1, 1);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x111122 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -50;
    scene.add(floor);

    // Lane markers
    for (let i = 0; i < 3; i++) {
      const marker = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 200),
        new THREE.MeshBasicMaterial({ color: 0x0088ff })
      );
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(LANES[i], 0.01, -50);
      scene.add(marker);
    }

    // Player
    const playerGeo = new THREE.BoxGeometry(1.5, 1, 2);
    const playerMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.y = 0.5;
    scene.add(player);

    function spawnObstacle() {
      const lane = Math.floor(RNG.next() * 3);
      const geo = new THREE.BoxGeometry(2, 2, 2);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff0044 });
      const obs = new THREE.Mesh(geo, mat);
      obs.position.set(LANES[lane], 1, -100);
      obs.userData = { type: 'obstacle' };
      scene.add(obs);
      State.obstacles.push(obs);
    }

    function spawnCollectible() {
      const lane = Math.floor(RNG.next() * 3);
      const geo = new THREE.SphereGeometry(0.5, 8, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1 });
      const col = new THREE.Mesh(geo, mat);
      col.position.set(LANES[lane], 1, -100);
      col.userData = { type: 'collectible' };
      scene.add(col);
      State.collectibles.push(col);
    }

    function update(delta) {
      // Speed increases over time
      State.speed = 10 + State.score * 0.001;
      
      // Move player to lane
      const targetX = LANES[State.player.lane];
      player.position.x += (targetX - player.position.x) * 10 * delta;
      
      // Combo decay
      if (State.comboTimer > 0) {
        State.comboTimer -= delta;
        if (State.comboTimer <= 0) {
          State.multiplier = 1;
        }
      }
      
      // Update obstacles
      for (let i = State.obstacles.length - 1; i >= 0; i--) {
        const obs = State.obstacles[i];
        obs.position.z += State.speed * delta;
        
        // Collision
        if (Math.abs(obs.position.z) < 1.5 && Math.abs(obs.position.x - player.position.x) < 1.5) {
          die();
          return;
        }
        
        // Remove if passed
        if (obs.position.z > 10) {
          scene.remove(obs);
          State.obstacles.splice(i, 1);
          State.score += 10 * State.multiplier;
        }
      }
      
      // Update collectibles
      for (let i = State.collectibles.length - 1; i >= 0; i--) {
        const col = State.collectibles[i];
        col.position.z += State.speed * delta;
        col.rotation.y += delta * 3;
        
        // Collect
        if (Math.abs(col.position.z) < 1.5 && Math.abs(col.position.x - player.position.x) < 1.5) {
          scene.remove(col);
          State.collectibles.splice(i, 1);
          State.score += 100 * State.multiplier;
          State.multiplier = Math.min(10, State.multiplier + 1);
          State.comboTimer = 2;
          continue;
        }
        
        if (col.position.z > 10) {
          scene.remove(col);
          State.collectibles.splice(i, 1);
        }
      }
      
      // Spawning
      State.spawnTimer += delta;
      const spawnInterval = Math.max(0.3, 1 - State.score * 0.0001);
      if (State.spawnTimer >= spawnInterval) {
        State.spawnTimer = 0;
        if (RNG.next() > 0.3) spawnObstacle();
        else spawnCollectible();
      }
      
      // HUD
      document.getElementById('score').textContent = State.score;
      document.getElementById('mult').textContent = State.multiplier;
    }

    function die() {
      State.isRunning = false;
      document.getElementById('final-score').textContent = State.score;
      document.getElementById('death-screen').style.display = 'flex';
    }

    function restart() {
      State.obstacles.forEach(o => scene.remove(o));
      State.collectibles.forEach(c => scene.remove(c));
      State.obstacles = [];
      State.collectibles = [];
      State.score = 0;
      State.multiplier = 1;
      State.speed = 10;
      State.spawnTimer = 0;
      State.player.lane = 1;
      State.isRunning = true;
      document.getElementById('death-screen').style.display = 'none';
    }

    // Telemetry
    let frameCount = 0, fps = 0;
    setInterval(() => { fps = frameCount; frameCount = 0; }, 1000);

    const clock = new THREE.Clock();
    function loop() {
      requestAnimationFrame(loop);
      const delta = Math.min(clock.getDelta(), 0.1);
      
      if (State.isRunning) update(delta);
      
      renderer.render(scene, camera);
      frameCount++;
      window.parent.postMessage({ type: 'forge-telemetry', fps, entities: State.obstacles.length + State.collectibles.length }, '*');
    }

    document.getElementById('overlay').addEventListener('click', () => {
      document.getElementById('overlay').classList.add('hidden');
      State.isRunning = true;
    });
    document.getElementById('death-screen').addEventListener('click', restart);
    
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    loop();
  </script>
</body>
</html>
`;

// Map genres to skeletons
export const GENRE_SKELETONS: Record<string, string> = {
  'Arena Shooter': ARENA_SHOOTER_SKELETON,
  'Dodge Survival': DODGE_SURVIVAL_SKELETON,
  'Score Chase': SCORE_CHASE_SKELETON,
  'Bullet Hell': DODGE_SURVIVAL_SKELETON,
  'Wave Defense': TOWER_DEFENSE_SKELETON,
  'One-Screen Platformer': PLATFORMER_8BIT_SKELETON,
  'Resource Panic': TOWER_DEFENSE_SKELETON,
  'Tactical Grid': ROGUE_DUNGEON_SKELETON,
  'Rhythm Reaction': SCORE_CHASE_SKELETON,
  'Asteroids': ASTEROIDS_SKELETON,
  'Pong': PONG_SKELETON,
  'Snake': SNAKE_SKELETON,
  'Breakout': BREAKOUT_SKELETON,
  'Shmup': SHMUP_SKELETON,
  'Racing': RACING_SKELETON,
  'Flappy': FLAPPY_SKELETON,
  'Match-3': MATCH3_SKELETON,
  'Fighting': FIGHTING_SKELETON,
  'Survival Horror': SURVIVAL_HORROR_SKELETON,
  'Stealth': STEALTH_SKELETON,
  'Fishing': FISHING_SKELETON,
  'Golf': GOLF_SKELETON,
  'Card Battler': CARD_BATTLER_SKELETON,
  'Survivor': VAMPIRE_SURVIVORS_SKELETON,
  'Twin Stick': TWIN_STICK_SKELETON
};

// Export platformer specifically for direct access
export { PLATFORMER_8BIT_SKELETON };

export function getSkeletonForGenre(genre: string): string | null {
  return GENRE_SKELETONS[genre] || ARENA_SHOOTER_SKELETON;
}
