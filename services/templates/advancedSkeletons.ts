/**
 * DREAM3DFORGE ADVANCED SKELETONS (Part 3: Complex Mechanics)
 */

export const TOWER_DEFENSE_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>%%TITLE%%</title>
  <style>
    body { margin: 0; background: #111; color: #fff; font-family: monospace; overflow: hidden; }
    #ui { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; }
    .btn { background: #333; padding: 10px 20px; border: 2px solid #555; cursor: pointer; }
    .btn:hover { background: #444; }
    #hud { position: fixed; top: 10px; right: 10px; font-size: 20px; text-shadow: 0 0 10px #ff0; }
  </style>
</head>
<body>
  <div id="hud">CASH: $<span id="money">100</span> | LIFE: <span id="life">20</span></div>
  <div id="ui">
    <div class="btn" onclick="selectTower('gun')">GUN ($25)</div>
    <div class="btn" onclick="selectTower('laser')">LASER ($50)</div>
  </div>
  <script type="importmap">{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }</script>
  <script type="module">
    import * as THREE from 'three';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(10, 15, 10);
    camera.lookAt(0,0,0);
    const renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const State = { money: 100, life: 20, selection: null, towers: [], enemies: [], path: [] };

    function init() {
      // Create grid
      const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
      scene.add(grid);
      
      // Define path
      State.path = [ {x:-10, z:0}, {x:0, z:0}, {x:0, z:10} ];
      
      // Visual path
      const pathGeo = new THREE.BoxGeometry(20, 0.1, 2);
      const pathMat = new THREE.MeshBasicMaterial({color: 0x333333});
      const p1 = new THREE.Mesh(pathGeo, pathMat);
      p1.position.x = -5;
      scene.add(p1);
    }

    window.selectTower = (t) => { State.selection = t; };

    renderer.domElement.onclick = (e) => {
      if (!State.selection) return;
      // Raycast to floor
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2((e.clientX/window.innerWidth)*2-1, -(e.clientY/window.innerHeight)*2+1), camera);
      const intersects = ray.intersectObject(new THREE.Mesh(new THREE.PlaneGeometry(20,20), new THREE.MeshBasicMaterial()));
      if (intersects.length > 0) {
        const p = intersects[0].point;
        const tx = Math.floor(p.x) + 0.5;
        const tz = Math.floor(p.z) + 0.5;
        
        if (State.money >= (State.selection === 'gun' ? 25 : 50)) {
          const tower = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.8), new THREE.MeshBasicMaterial({color: State.selection === 'gun' ? 0x888888 : 0x00ffff}));
          tower.position.set(tx, 1, tz);
          scene.add(tower);
          State.towers.push(tower);
          State.money -= (State.selection === 'gun' ? 25 : 50);
          document.getElementById('money').innerText = State.money;
        }
      }
    };

    function loop() {
      requestAnimationFrame(loop);
      renderer.render(scene, camera);
    }
    init(); loop();
  </script>
</body>
</html>
`;

export const MATCH3_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>%%TITLE%%</title>
  <style>
    body { background: #222; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    #board { display: grid; grid-template-columns: repeat(8, 50px); grid-gap: 5px; background: #444; padding: 10px; border-radius: 10px; }
    .cell { width: 50px; height: 50px; border-radius: 5px; cursor: pointer; transition: transform 0.1s; }
    .cell:hover { transform: scale(1.1); }
    .selected { outline: 3px solid #fff; }
  </style>
</head>
<body>
  <h1 id="score">SCORE: 0</h1>
  <div id="board"></div>
  <script>
    const COLORS = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
    let board = [];
    let selected = null;
    let score = 0;

    function init() {
      const container = document.getElementById('board');
      for (let i=0; i<64; i++) {
        const color = COLORS[Math.floor(Math.random()*COLORS.length)];
        board[i] = color;
        const div = document.createElement('div');
        div.className = 'cell';
        div.style.backgroundColor = color;
        div.onclick = () => handleClick(i, div);
        container.appendChild(div);
      }
    }

    function handleClick(idx, el) {
      if (!selected) {
        selected = {idx, el};
        el.classList.add('selected');
      } else {
        // Swap logic
        selected.el.classList.remove('selected');
        const c1 = board[selected.idx];
        const c2 = board[idx];
        
        // Only swap if adjacent
        const d = Math.abs(selected.idx - idx);
        if (d === 1 || d === 8) {
          board[selected.idx] = c2; board[idx] = c1;
          render();
          checkMatches();
        }
        selected = null;
      }
    }

    function render() {
      const cells = document.getElementsByClassName('cell');
      for (let i=0; i<64; i++) {
        cells[i].style.backgroundColor = board[i];
      }
    }

    function checkMatches() {
      // Naive match check
      let toRemove = new Set();
      for (let i=0; i<64; i++) {
        // Horizontal
        if (i%8 < 6 && board[i] === board[i+1] && board[i] === board[i+2]) {
          toRemove.add(i); toRemove.add(i+1); toRemove.add(i+2);
        }
        // Vertical
        if (i < 48 && board[i] === board[i+8] && board[i] === board[i+16]) {
          toRemove.add(i); toRemove.add(i+8); toRemove.add(i+16);
        }
      }
      if (toRemove.size > 0) {
        score += toRemove.size * 10;
        document.getElementById('score').innerText = 'SCORE: ' + score;
        toRemove.forEach(idx => board[idx] = COLORS[Math.floor(Math.random()*COLORS.length)]);
        render();
        setTimeout(checkMatches, 300);
      }
    }

    init();
  </script>
</body>
</html>
`;

export const ROGUE_DUNGEON_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>%%TITLE%%</title>
  <style>
    body { background: #000; color: #aaa; font-family: 'Courier New', Courier, monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    #view { line-height: 1; letter-spacing: 2px; font-size: 24px; }
  </style>
</head>
<body>
  <div id="view"></div>
  <script>
    const W = 40, H = 20;
    let map = [];
    let px = 5, py = 5;

    function init() {
      for(let y=0; y<H; y++) {
        map[y] = [];
        for(let x=0; x<W; x++) {
          map[y][x] = (x===0 || x===W-1 || y===0 || y===H-1 || Math.random() < 0.1) ? '#' : '.';
        }
      }
      map[py][px] = '.';
      render();
    }

    function render() {
      let html = '';
      for(let y=0; y<H; y++) {
        for(let x=0; x<W; x++) {
          if (x===px && y===py) html += '<span style="color:#fff">@</span>';
          else if (map[y][x] === '#') html += '#';
          else html += '<span style="color:#444">.</span>';
        }
        html += '<br>';
      }
      document.getElementById('view').innerHTML = html;
    }

    window.onkeydown = e => {
      let nx = px, ny = py;
      if (e.code === 'ArrowUp') ny--;
      if (e.code === 'ArrowDown') ny++;
      if (e.code === 'ArrowLeft') nx--;
      if (e.code === 'ArrowRight') nx++;
      
      if (map[ny][nx] !== '#') {
        px = nx; py = ny;
        render();
      }
    }
    init();
  </script>
</body>
</html>
`;

export const FIGHTING_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>%%TITLE%%</title>
  <style>
    body { background: #333; color: #fff; font-family: sans-serif; overflow: hidden; }
    #hud { position: fixed; top: 10px; width: 100%; display: flex; justify-content: space-around; font-size: 30px; }
  </style>
</head>
<body>
  <div id="hud">
    <div id="p1-hp" style="width: 40%; height: 20px; background: #0f0;"></div>
    <div id="p2-hp" style="width: 40%; height: 20px; background: #0f0;"></div>
  </div>
  <script type="importmap">{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }</script>
  <script type="module">
    import * as THREE from 'three';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    function init() {
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.5), new THREE.MeshBasicMaterial({color: 0x0000ff}));
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.5), new THREE.MeshBasicMaterial({color: 0xff0000}));
      p1.position.x = -3; p2.position.x = 3;
      scene.add(p1, p2);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), new THREE.MeshBasicMaterial({color: 0x555}));
      floor.rotation.x = -Math.PI/2;
      scene.add(floor);
    }

    function loop() {
      requestAnimationFrame(loop);
      renderer.render(scene, camera);
    }
    init(); loop();
  </script>
</body>
</html>
`;

export const SURVIVAL_HORROR_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>%%TITLE%%</title>
  <style>
    body { margin: 0; background: #000; color: #fff; overflow: hidden; cursor: crosshair; }
  </style>
</head>
<body>
  <script type="importmap">{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }</script>
  <script type="module">
    import * as THREE from 'three';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    function init() {
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({color: 0x111111}));
      floor.rotation.x = -Math.PI/2;
      scene.add(floor);
      const spotLight = new THREE.SpotLight(0xffffff, 5);
      spotLight.angle = 0.3;
      spotLight.position.set(0, 5, 0);
      scene.add(spotLight);
    }

    function loop() {
      requestAnimationFrame(loop);
      renderer.render(scene, camera);
    }
    init(); loop();
  </script>
</body>
</html>
`;

export const STEALTH_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>%%TITLE%%</title>
  <style>
    body { background: #000; color: #fff; font-family: monospace; overflow: hidden; }
  </style>
</head>
<body>
  <script type="importmap">{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }</script>
  <script type="module">
    import * as THREE from 'three';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    function init() {
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshBasicMaterial({color: 0x222}));
      floor.rotation.x = -Math.PI/2;
      scene.add(floor);
      const p = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0x0f0}));
      p.position.y = 0.5;
      scene.add(p);
    }
    function loop() {
      requestAnimationFrame(loop);
      renderer.render(scene, camera);
    }
    init(); loop();
  </script>
</body>
</html>
`;

export const FISHING_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>%%TITLE%%</title>
</head>
<body style="background: #4ec0ca; margin: 0; overflow: hidden;">
  <div style="width: 30px; height: 300px; background: #fff; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border: 2px solid #000;">
    <div id="hook" style="width: 100%; height: 20px; background: #f00; position: absolute; bottom: 0;"></div>
  </div>
  <script>
    let pos = 0; let v = 0;
    window.onmousedown = () => v += 5;
    function loop() {
      v -= 0.2; pos = Math.max(0, Math.min(280, pos + v));
      document.getElementById('hook').style.bottom = pos + 'px';
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>
`;

export const GOLF_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>%%TITLE%%</title>
</head>
<body style="margin:0; background:#000; overflow:hidden;">
  <script type="importmap">{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }</script>
  <script type="module">
    import * as THREE from 'three';
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    function init() {
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({color: 0xffffff}));
      ball.position.y = 0.5;
      scene.add(ball);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshBasicMaterial({color: 0x008800}));
      p.rotation.x = -Math.PI/2;
      scene.add(p);
      camera.position.set(0, 5, 10);
      camera.lookAt(0,0,0);
    }
    function loop() {
      requestAnimationFrame(loop);
      renderer.render(scene, camera);
    }
    init(); loop();
  </script>
</body>
</html>
`;

export const CARD_BATTLER_SKELETON = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>%%TITLE%%</title>
  <style>
    body { background: #1a1a2e; color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; overflow: hidden; }
    #game { position: relative; width: 800px; height: 600px; background: #16213e; border: 4px solid #0f3460; border-radius: 20px; box-shadow: 0 0 50px rgba(0,0,0,0.5); overflow: hidden; display: flex; flex-direction: column; }
    
    .hud { padding: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .stat-box { background: #0f3460; padding: 10px 20px; border-radius: 10px; border: 1px solid #e94560; }
    .hp-bar { width: 200px; height: 15px; background: #1a1a2e; border-radius: 7px; margin-top: 5px; overflow: hidden; }
    .hp-fill { height: 100%; background: #e94560; transition: width 0.3s; }
    
    .battle-area { flex: 1; display: flex; justify-content: space-around; align-items: center; }
    .entity { text-align: center; }
    .avatar { font-size: 80px; filter: drop-shadow(0 0 10px rgba(255,255,255,0.2)); margin-bottom: 10px; }
    
    .hand { height: 180px; background: rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; gap: 15px; padding: 10px; }
    .card { width: 100px; height: 140px; background: #e94560; border-radius: 10px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 10px; transition: transform 0.2s, box-shadow 0.2s; border: 2px solid white; color: white; }
    .card:hover { transform: translateY(-10px); box-shadow: 0 10px 20px rgba(233,69,96,0.5); }
    .card .cost { align-self: flex-start; background: #1a1a2e; width: 20px; height: 20px; border-radius: 50%; display: flex; items: center; justify-content: center; font-size: 12px; }
    .card .name { font-weight: bold; font-size: 14px; text-align: center; }
    .card .desc { font-size: 10px; text-align: center; opacity: 0.9; }

    #log { position: absolute; bottom: 200px; left: 50%; transform: translateX(-50%); text-align: center; font-style: italic; color: #aaa; text-shadow: 0 0 5px #000; pointer-events: none; }
    #overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: none; flex-direction: column; items: center; justify-content: center; z-index: 100; text-align: center; cursor: pointer; }
    #overlay h1 { font-size: 60px; color: #e94560; }
  </style>
</head>
<body>
  <div id="game">
    <div class="hud">
      <div class="stat-box">
        <div>PLAYER</div>
        <div class="hp-bar"><div id="p-hp-fill" class="hp-fill" style="width: 100%"></div></div>
        <div id="p-hp-text">100 / 100</div>
      </div>
      <div id="turn-indicator" style="font-weight: bold; color: #e94560; font-size: 20px">YOUR TURN</div>
      <div class="stat-box text-right">
        <div>ENEMY</div>
        <div class="hp-bar"><div id="e-hp-fill" class="hp-fill" style="width: 100%"></div></div>
        <div id="e-hp-text">100 / 100</div>
      </div>
    </div>

    <div class="battle-area">
      <div class="entity">
        <div class="avatar">🧙‍♂️</div>
        <div id="p-status"></div>
      </div>
      <div class="entity">
        <div class="avatar">🐉</div>
        <div id="e-status"></div>
      </div>
    </div>

    <div id="log">A wild beast appears!</div>
    <div class="hand" id="hand"></div>
  </div>

  <div id="overlay" onclick="location.reload()">
    <h1 id="result-title">VICTORY</h1>
    <p>Click to restart</p>
  </div>

  <script>
    const State = {
      player: { hp: 100, maxHp: 100, energy: 3, block: 0 },
      enemy: { hp: 100, maxHp: 100, block: 0, intent: 'attack' },
      turn: 'player',
      deck: [
        { name: "Strike", cost: 1, type: "attack", value: 10, desc: "Deal 10 damage" },
        { name: "Strike", cost: 1, type: "attack", value: 10, desc: "Deal 10 damage" },
        { name: "Defend", cost: 1, type: "block", value: 8, desc: "Gain 8 Block" },
        { name: "Slam", cost: 2, type: "attack", value: 20, desc: "Deal 20 damage" },
        { name: "Fireball", cost: 3, type: "attack", value: 35, desc: "Deal 35 damage" }
      ],
      hand: []
    };

    function updateUI() {
      document.getElementById('p-hp-fill').style.width = (State.player.hp / State.player.maxHp * 100) + '%';
      document.getElementById('e-hp-fill').style.width = (State.enemy.hp / State.enemy.maxHp * 100) + '%';
      document.getElementById('p-hp-text').innerText = State.player.hp + ' / ' + State.player.maxHp + (State.player.block > 0 ? ' (+' + State.player.block + ')' : '');
      document.getElementById('e-hp-text').innerText = State.enemy.hp + ' / ' + State.enemy.maxHp + (State.enemy.block > 0 ? ' (+' + State.enemy.block + ')' : '');
      document.getElementById('turn-indicator').innerText = State.turn === 'player' ? 'YOUR TURN' : 'ENEMY TURN';
      
      const handEl = document.getElementById('hand');
      handEl.innerHTML = '';
      if (State.turn === 'player') {
        State.hand.forEach((card, idx) => {
          const div = document.createElement('div');
          div.className = 'card';
          div.innerHTML = '<div class="cost">' + card.cost + '</div><div class="name">' + card.name + '</div><div class="desc">' + card.desc + '</div>';
          div.onclick = () => playCard(idx);
          handEl.appendChild(div);
        });
      }
    }

    function log(msg) {
      document.getElementById('log').innerText = msg;
    }

    function playCard(idx) {
      if (State.turn !== 'player') return;
      const card = State.hand[idx];
      if (State.player.energy < card.cost) {
        log("Not enough energy!");
        return;
      }

      State.player.energy -= card.cost;
      State.hand.splice(idx, 1);

      if (card.type === 'attack') {
        let dmg = card.value;
        if (State.enemy.block > 0) {
          const soak = Math.min(dmg, State.enemy.block);
          State.enemy.block -= soak;
          dmg -= soak;
        }
        State.enemy.hp = Math.max(0, State.enemy.hp - dmg);
        log("You used " + card.name + " for " + card.value + " damage!");
      } else if (card.type === 'block') {
        State.player.block += card.value;
        log("You gained " + card.value + " Block!");
      }

      if (State.enemy.hp <= 0) {
        endGame("VICTORY");
      } else if (State.player.energy <= 0 || State.hand.length === 0) {
        endTurn();
      }
      updateUI();
    }

    function endTurn() {
      State.turn = 'enemy';
      updateUI();
      setTimeout(enemyTurn, 1000);
    }

    function enemyTurn() {
      const dmg = 15;
      let finalDmg = dmg;
      if (State.player.block > 0) {
        const soak = Math.min(finalDmg, State.player.block);
        State.player.block -= soak;
        finalDmg -= soak;
      }
      State.player.hp = Math.max(0, State.player.hp - finalDmg);
      log("Enemy attacks for " + dmg + " damage!");
      
      if (State.player.hp <= 0) {
        endGame("DEFEAT");
      } else {
        startPlayerTurn();
      }
      updateUI();
    }

    function startPlayerTurn() {
      State.turn = 'player';
      State.player.energy = 3;
      State.player.block = 0;
      State.hand = [];
      // Draw 3 random cards from deck
      for(let i=0; i<3; i++) {
        State.hand.push(State.deck[Math.floor(Math.random() * State.deck.length)]);
      }
      log("Your turn! Draw 3 cards.");
      updateUI();
    }

    function endGame(title) {
      const overlay = document.getElementById('overlay');
      document.getElementById('result-title').innerText = title;
      overlay.style.display = 'flex';
    }

    startPlayerTurn();
  </script>
</body>
</html>
`;
