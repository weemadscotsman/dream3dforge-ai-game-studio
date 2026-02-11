/**
 * DREAM3DFORGE PREMIUM ARCADE SKELETONS v2.5
 * Features: Seeded RNG, Particle Systems, 60fps Loops, Game States
 */

export const TWIN_STICK_SKELETON = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>%%TITLE%%</title>
    <style>
        body { margin: 0; background: #050505; color: #0ff; font-family: 'Courier New', Courier, monospace; overflow: hidden; }
        #hud { position: fixed; top: 20px; left: 20px; text-shadow: 0 0 100px #0ff; z-index: 10; font-size: 24px; pointer-events: none; }
        #overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; text-align: center; }
        .btn { padding: 15px 40px; background: transparent; border: 2px solid #0ff; color: #0ff; cursor: pointer; font-family: inherit; font-size: 20px; transition: 0.2s; box-shadow: 0 0 15px rgba(0,255,255,0.3); }
        .btn:hover { background: #0ff; color: #000; box-shadow: 0 0 30px #0ff; }
        #canvas-container { position: absolute; inset: 0; }
    </style>
</head>
<body>
    <div id="hud">SCORE: <span id="score">0</span> | HP: <span id="hp">100</span></div>
    <div id="overlay">
        <h1>%%TITLE%%</h1>
        <p>WASD to Move | MOUSE to Aim & Shoot</p>
        <button class="btn" onclick="startGame()">INITIALIZE NEURAL LINK</button>
    </div>
    <div id="canvas-container"></div>

    <script type="importmap">{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }</script>
    <script type="module">
        import * as THREE from 'three';

        // --- SEEDED RNG ---
        const SEED = "%%SEED%%";
        let seedVal = 0;
        for(let i=0; i<SEED.length; i++) seedVal += SEED.charCodeAt(i);
        const RNG = () => {
            seedVal = (seedVal * 16807) % 2147483647;
            return (seedVal - 1) / 2147483646;
        };

        // --- ENGINE SETUP ---
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        // --- GAME STATE ---
        const State = {
            phase: 'INIT',
            score: 0,
            hp: 100,
            player: null,
            bullets: [],
            enemies: [],
            particles: [],
            keys: {}
        };

        // --- PARTICLE SYSTEM ---
        function spawnParticles(pos, color, count = 10) {
            for(let i=0; i<count; i++) {
                const p = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 0.1, 0.1),
                    new THREE.MeshBasicMaterial({ color: color })
                );
                p.position.copy(pos);
                p.userData = {
                    v: new THREE.Vector3((RNG()-0.5)*0.3, (RNG()-0.5)*0.3, (RNG()-0.5)*0.3),
                    life: 1.0
                };
                scene.add(p);
                State.particles.push(p);
            }
        }

        // --- INITIALIZATION ---
        function init() {
            camera.position.set(0, 20, 10);
            camera.lookAt(0, 0, 0);

            // Floor
            const grid = new THREE.GridHelper(50, 50, 0x00ffff, 0x222222);
            scene.add(grid);

            // Lighting
            const ambient = new THREE.AmbientLight(0x404040);
            scene.add(ambient);
            const point = new THREE.PointLight(0x00ffff, 100, 50);
            point.position.set(0, 10, 0);
            scene.add(point);

            // Player
            const pGeo = new THREE.ConeGeometry(0.5, 1, 4);
            const pMat = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x003333 });
            State.player = new THREE.Mesh(pGeo, pMat);
            State.player.rotation.x = Math.PI/2;
            scene.add(State.player);
        }

        // --- INPUT ---
        window.addEventListener('keydown', e => State.keys[e.code] = true);
        window.addEventListener('keyup', e => State.keys[e.code] = false);
        let mousePos = new THREE.Vector2();
        window.addEventListener('mousemove', e => {
            mousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
            mousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        window.addEventListener('mousedown', () => {
            if(State.phase === 'PLAYING') spawnBullet();
        });

        function spawnBullet() {
            const b = new THREE.Mesh(
                new THREE.SphereGeometry(0.2),
                new THREE.MeshBasicMaterial({ color: 0x00ffff })
            );
            b.position.copy(State.player.position);
            const dir = new THREE.Vector3().subVectors(getTargetPos(), State.player.position).normalize();
            b.userData = { dir: dir, speed: 0.5 };
            scene.add(b);
            State.bullets.push(b);
        }

        function getTargetPos() {
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mousePos, camera);
            const intersect = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, intersect);
            return intersect;
        }

        function spawnEnemy() {
            const geo = new THREE.IcosahedronGeometry(0.6, 0);
            const mat = new THREE.MeshPhongMaterial({ color: 0xff0066 });
            const enemy = new THREE.Mesh(geo, mat);
            const angle = RNG() * Math.PI * 2;
            enemy.position.set(Math.cos(angle)*25, 0, Math.sin(angle)*25);
            scene.add(enemy);
            State.enemies.push(enemy);
        }

        // --- GAME LOOP ---
        function animate() {
            requestAnimationFrame(animate);
            if(State.phase !== 'PLAYING') {
                renderer.render(scene, camera);
                return;
            }

            // Move Player
            const speed = 0.2;
            if(State.keys['KeyW']) State.player.position.z -= speed;
            if(State.keys['KeyS']) State.player.position.z += speed;
            if(State.keys['KeyA']) State.player.position.x -= speed;
            if(State.keys['KeyD']) State.player.position.x += speed;

            // Player Look
            State.player.lookAt(getTargetPos());
            State.player.rotation.x = Math.PI/2;

            // Move Bullets
            for(let i = State.bullets.length-1; i>=0; i--) {
                const b = State.bullets[i];
                b.position.add(b.userData.dir.clone().multiplyScalar(b.userData.speed));
                if(b.position.length() > 50) {
                    scene.remove(b);
                    State.bullets.splice(i, 1);
                }
            }

            // Move Enemies
            for(let i = State.enemies.length-1; i>=0; i--) {
                const e = State.enemies[i];
                const dir = new THREE.Vector3().subVectors(State.player.position, e.position).normalize();
                e.position.add(dir.multiplyScalar(0.08));
                e.rotation.y += 0.05;

                // Collision with player
                if(e.position.distanceTo(State.player.position) < 1) {
                    State.hp -= 1;
                    document.getElementById('hp').innerText = State.hp;
                    spawnParticles(e.position, 0xff0066, 5);
                    if(State.hp <= 0) gameOver();
                }

                // Collision with bullets
                for(let j = State.bullets.length-1; j>=0; j--) {
                    const b = State.bullets[j];
                    if(b.position.distanceTo(e.position) < 1) {
                        spawnParticles(e.position, 0xff0066, 20);
                        scene.remove(e);
                        State.enemies.splice(i, 1);
                        scene.remove(b);
                        State.bullets.splice(j, 1);
                        State.score += 100;
                        document.getElementById('score').innerText = State.score;
                        break;
                    }
                }
            }

            // Particles
            for(let i = State.particles.length-1; i>=0; i--) {
                const p = State.particles[i];
                p.position.add(p.userData.v);
                p.userData.life -= 0.02;
                p.scale.setScalar(p.userData.life);
                if(p.userData.life <= 0) {
                    scene.remove(p);
                    State.particles.splice(i, 1);
                }
            }

            if(RNG() < 0.02) spawnEnemy();

            renderer.render(scene, camera);
        }

        function gameOver() {
            State.phase = 'GAMEOVER';
            document.getElementById('overlay').style.display = 'flex';
            document.querySelector('#overlay h1').innerText = "SYSTEM FAILURE";
            document.querySelector('#overlay p').innerText = "SCORE: " + State.score;
            document.querySelector('.btn').innerText = "REBOOT";
        }

        window.startGame = () => {
            document.getElementById('overlay').style.display = 'none';
            if(State.phase === 'GAMEOVER') location.reload();
            State.phase = 'PLAYING';
        };

        init();
        animate();
    </script>
</body>
</html>
`;

export const ASTEROIDS_SKELETON = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>%%TITLE%%</title>
    <style>
        body { margin: 0; background: #000; overflow: hidden; color: #fff; font-family: monospace; }
        #canvas-container { position: relative; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
        #hud { position: absolute; top: 20px; left: 20px; z-index: 10; font-size: 20px; }
        #overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; cursor: pointer; }
    </style>
</head>
<body>
    <div id="canvas-container">
        <div id="hud">SCORE: <span id="score">0</span></div>
        <div id="overlay" onclick="startGame()">
            <h1>%%TITLE%%</h1>
            <p>ARROWS to Fly | SPACE to Shoot</p>
            <p>TOUCH to START</p>
        </div>
        <canvas id="game"></canvas>
    </div>

    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        const W = canvas.width = window.innerWidth;
        const H = canvas.height = window.innerHeight;

        const SEED = "%%SEED%%";
        let seedVal = 0;
        for(let i=0; i<SEED.length; i++) seedVal += SEED.charCodeAt(i);
        const RNG = () => {
            seedVal = (seedVal * 16807) % 2147483647;
            return (seedVal - 1) / 2147483646;
        };

        const State = { isRunning: false, score: 0 };
        const keys = {};
        window.onkeydown = e => keys[e.code] = true;
        window.onkeyup = e => keys[e.code] = false;

        const player = { x: W/2, y: H/2, r: 10, a: 0, v: {x:0, y:0} };
        let bullets = [], asteroids = [], particles = [];

        function spawnAsteroid() {
            const side = Math.floor(RNG()*4);
            let x, y;
            if(side === 0) { x = RNG()*W; y = -50; }
            if(side === 1) { x = W+50; y = RNG()*H; }
            if(side === 2) { x = RNG()*W; y = H+50; }
            if(side === 3) { x = -50; y = RNG()*H; }
            asteroids.push({ x, y, r: 30 + RNG()*20, v: {x: (RNG()-0.5)*4, y: (RNG()-0.5)*4} });
        }

        function createParticles(x, y) {
            for(let i=0; i<8; i++) particles.push({ x, y, v: {x: (RNG()-0.5)*6, y: (RNG()-0.5)*6}, l: 1 });
        }

        function loop() {
            if(!State.isRunning) return requestAnimationFrame(loop);
            ctx.fillStyle = '#000';
            ctx.fillRect(0,0,W,H);

            // Update Player
            if(keys['ArrowLeft']) player.a -= 0.1;
            if(keys['ArrowRight']) player.a += 0.1;
            if(keys['ArrowUp']) {
                player.v.x += Math.cos(player.a)*0.2;
                player.v.y += Math.sin(player.a)*0.2;
            }
            player.x = (player.x + player.v.x + W) % W;
            player.y = (player.y + player.v.y + H) % H;
            player.v.x *= 0.99; player.v.y *= 0.99;

            if(keys['Space'] && State.tick % 10 === 0) {
                bullets.push({ x: player.x, y: player.y, v: {x: Math.cos(player.a)*10, y: Math.sin(player.a)*10}, l: 60 });
            }

            // Draw Player
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(player.x + Math.cos(player.a)*15, player.y + Math.sin(player.a)*15);
            ctx.lineTo(player.x + Math.cos(player.a+2.5)*15, player.y + Math.sin(player.a+2.5)*15);
            ctx.lineTo(player.x + Math.cos(player.a-2.5)*15, player.y + Math.sin(player.a-2.5)*15);
            ctx.closePath(); ctx.stroke();

            // Asteroids
            if(RNG() < 0.02) spawnAsteroid();
            asteroids.forEach((a, i) => {
                a.x = (a.x + a.v.x + W) % W; a.y = (a.y + a.v.y + H) % H;
                ctx.strokeStyle = '#fff';
                ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.stroke();
                if(Math.hypot(player.x-a.x, player.y-a.y) < a.r + player.r) location.reload();
            });

            // Bullets
            bullets.forEach((b, i) => {
                b.x += b.v.x; b.y += b.v.y; b.l--;
                ctx.fillStyle = '#fff'; ctx.fillRect(b.x, b.y, 2, 2);
                asteroids.forEach((a, j) => {
                    if(Math.hypot(b.x-a.x, b.y-a.y) < a.r) {
                        createParticles(a.x, a.y);
                        asteroids.splice(j, 1); bullets.splice(i, 1);
                        State.score += 100; document.getElementById('score').innerText = State.score;
                    }
                });
                if(b.l <= 0) bullets.splice(i, 1);
            });

            // Particles
            particles.forEach((p, i) => {
                p.x += p.v.x; p.y += p.v.y; p.l -= 0.02;
                ctx.globalAlpha = p.l; ctx.fillStyle = '#fff'; ctx.fillRect(p.x, p.y, 2, 2);
                if(p.l <= 0) particles.splice(i, 1);
            });
            ctx.globalAlpha = 1;

            State.tick++;
            requestAnimationFrame(loop);
        }
        State.tick = 0;
        function startGame() { document.getElementById('overlay').style.display = 'none'; State.isRunning = true; }
        loop();
    </script>
</body>
</html>
`;

export const PONG_SKELETON = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>%%TITLE%%</title>
    <style>
        body { margin: 0; background: #000; color: #fff; font-family: monospace; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
        canvas { border: 2px solid #fff; }
        #overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; cursor: pointer; }
    </style>
</head>
<body>
    <div id="overlay" onclick="startGame()">
        <h1>%%TITLE%%</h1>
        <p>ARROWS or W/S to Move</p>
        <p>CLICK to START</p>
    </div>
    <canvas id="game"></canvas>
    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        const W = canvas.width = 800; const H = canvas.height = 400;
        
        const State = { isRunning: false, p1: 0, p2: 0 };
        const ball = { x: W/2, y: H/2, vx: 5, vy: 5, r: 8 };
        const paddle1 = { x: 20, y: H/2-40, w: 10, h: 80 };
        const paddle2 = { x: W-30, y: H/2-40, w: 10, h: 80 };

        const keys = {};
        window.onkeydown = e => keys[e.code] = true;
        window.onkeyup = e => keys[e.code] = false;

        function loop() {
            if(!State.isRunning) return requestAnimationFrame(loop);
            ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
            
            // Logic
            if(keys['KeyW'] || keys['ArrowUp']) paddle1.y -= 7;
            if(keys['KeyS'] || keys['ArrowDown']) paddle1.y += 7;
            paddle1.y = Math.max(0, Math.min(H-paddle1.h, paddle1.y));
            
            // AI
            paddle2.y += (ball.y - (paddle2.y + paddle2.h/2)) * 0.1;
            
            ball.x += ball.vx; ball.y += ball.vy;
            if(ball.y < 0 || ball.y > H) ball.vy *= -1;
            
            if(ball.x < paddle1.x + paddle1.w && ball.y > paddle1.y && ball.y < paddle1.y + paddle1.h) ball.vx = Math.abs(ball.vx) + 0.5;
            if(ball.x > paddle2.x - ball.r && ball.y > paddle2.y && ball.y < paddle2.y + paddle2.h) ball.vx = -Math.abs(ball.vx) - 0.5;
            
            if(ball.x < 0) { State.p2++; reset(); }
            if(ball.x > W) { State.p1++; reset(); }
            
            // Draw
            ctx.fillStyle = '#fff';
            ctx.fillRect(paddle1.x, paddle1.y, paddle1.w, paddle1.h);
            ctx.fillRect(paddle2.x, paddle2.y, paddle2.w, paddle2.h);
            ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
            ctx.font = '30px monospace'; ctx.fillText(State.p1 + ' | ' + State.p2, W/2-40, 50);
            
            requestAnimationFrame(loop);
        }
        function reset() { ball.x = W/2; ball.y = H/2; ball.vx = (Math.random() > 0.5 ? 5 : -5); }
        function startGame() { document.getElementById('overlay').style.display = 'none'; State.isRunning = true; }
        loop();
    </script>
</body>
</html>
`;

export const SNAKE_SKELETON = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>%%TITLE%%</title>
    <style>
        body { margin: 0; background: #111; display: flex; align-items: center; justify-content: center; height: 100vh; color: #0f0; font-family: monospace; overflow: hidden; }
        #canvas-container { position: relative; border: 4px solid #0f0; box-shadow: 0 0 20px #0f0; }
        #overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
    </style>
</head>
<body>
    <div id="canvas-container">
        <canvas id="game"></canvas>
        <div id="overlay" onclick="startGame()"><h1>%%TITLE%%</h1><p>ARROWS to Turn</p></div>
    </div>
    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        const GRID = 20; canvas.width = canvas.height = 400;
        let snake = [{x:10,y:10}], dir = {x:1,y:0}, food = {x:5,y:5}, score=0, running=false;
        window.onkeydown = e => {
            if(e.code==='ArrowUp' && dir.y===0) dir={x:0,y:-1};
            if(e.code==='ArrowDown' && dir.y===0) dir={x:0,y:1};
            if(e.code==='ArrowLeft' && dir.x===0) dir={x:-1,y:0};
            if(e.code==='ArrowRight' && dir.x===0) dir={x:1,y:0};
        };
        function loop() {
            if(!running) return requestAnimationFrame(loop);
            if(++tick % 10 === 0) {
                let head = {x:snake[0].x+dir.x, y:snake[0].y+dir.y};
                if(head.x<0||head.x>=20||head.y<0||head.y>=20||snake.some(s=>s.x===head.x&&s.y===head.y)) location.reload();
                snake.unshift(head);
                if(head.x===food.x && head.y===food.y) { score+=10; food={x:Math.floor(Math.random()*20), y:Math.floor(Math.random()*20)}; }
                else snake.pop();
            }
            ctx.fillStyle='#111'; ctx.fillRect(0,0,400,400);
            ctx.fillStyle='#f00'; ctx.fillRect(food.x*20, food.y*20, 18, 18);
            ctx.fillStyle='#0f0'; snake.forEach(s=>ctx.fillRect(s.x*20, s.y*20, 18, 18));
            requestAnimationFrame(loop);
        }
        let tick=0; loop();
        function startGame() { document.getElementById('overlay').style.display='none'; running=true; }
    </script>
</body>
</html>
`;

export const BREAKOUT_SKELETON = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>%%TITLE%%</title>
    <style>
        body { margin: 0; background: #000; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: monospace; }
        canvas { border: 2px solid #fff; }
        #overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; cursor: pointer; color: #fff; }
    </style>
</head>
<body>
    <div id="overlay" onclick="startGame()"><h1>%%TITLE%%</h1><p>MOUSE to Move</p></div>
    <canvas id="game"></canvas>
    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        const W = 480, H = 320; canvas.width = W; canvas.height = H;
        let paddle = {x: W/2-35, w: 70, h: 10}, ball = {x: W/2, y: H-30, dx: 4, dy: -4, r: 7}, bricks = [];
        for(let c=0; c<5; c++) for(let r=0; r<3; r++) bricks.push({x: c*95+10, y: r*30+30, w: 75, h: 20, v: true});
        canvas.onmousemove = e => paddle.x = e.clientX - canvas.offsetLeft - paddle.w/2;
        let running = false;
        function loop() {
            if(!running) return requestAnimationFrame(loop);
            ctx.clearRect(0,0,W,H);
            ball.x+=ball.dx; ball.y+=ball.dy;
            if(ball.x<0||ball.x>W) ball.dx*=-1; if(ball.y<0) ball.dy*=-1;
            if(ball.y>H-20 && ball.x>paddle.x && ball.x<paddle.x+paddle.w) ball.dy *= -1;
            if(ball.y>H) location.reload();
            bricks.forEach(b => {
                if(b.v && ball.x>b.x && ball.x<b.x+b.w && ball.y>b.y && ball.y<b.y+b.h) { b.v=false; ball.dy*=-1; }
                if(b.v) { ctx.fillStyle='#0095DD'; ctx.fillRect(b.x, b.y, b.w, b.h); }
            });
            ctx.fillStyle='#fff'; ctx.fillRect(paddle.x, H-10, paddle.w, paddle.h);
            ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
            requestAnimationFrame(loop);
        }
        loop();
        function startGame() { document.getElementById('overlay').style.display='none'; running=true; }
    </script>
</body>
</html>
`;

export const SHMUP_SKELETON = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>%%TITLE%%</title>
    <style>
        body { margin: 0; background: #000; overflow: hidden; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; }
        canvas { border: 2px solid #555; }
        #overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
    </style>
</head>
<body>
    <div id="overlay" onclick="startGame()"><h1>%%TITLE%%</h1><p>ARROWS to Move | SPACE to Shoot</p></div>
    <canvas id="game"></canvas>
    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        const W = 400, H = 600; canvas.width = W; canvas.height = H;
        let p = {x: W/2, y: H-50}, bullets = [], enemies = [], keys = {}, running = false;
        window.onkeydown = e => keys[e.code] = true; window.onkeyup = e => keys[e.code] = false;
        function loop() {
            if(!running) return requestAnimationFrame(loop);
            ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
            if(keys['ArrowLeft'] && p.x>0) p.x-=5; if(keys['ArrowRight'] && p.x<W-20) p.x+=5;
            if(keys['Space'] && tick%10===0) bullets.push({x:p.x+8, y:p.y, v:10});
            if(tick%30===0) enemies.push({x:Math.random()*(W-20), y:-20, v:3});
            bullets.forEach((b,i)=>{ b.y-=b.v; ctx.fillStyle='#ff0'; ctx.fillRect(b.x,b.y,4,10); if(b.y<0) bullets.splice(i,1); });
            enemies.forEach((e,i)=>{ 
                e.y+=e.v; ctx.fillStyle='#f0f'; ctx.fillRect(e.x,e.y,20,20);
                if(e.y>H) location.reload();
                bullets.forEach((b,j)=>{ if(b.x>e.x&&b.x<e.x+20&&b.y>e.y&&b.y<e.y+20){ enemies.splice(i,1); bullets.splice(j,1); } });
            });
            ctx.fillStyle='#0ff'; ctx.fillRect(p.x, p.y, 20, 20);
            tick++; requestAnimationFrame(loop);
        }
        let tick=0; loop();
        function startGame() { document.getElementById('overlay').style.display='none'; running=true; }
    </script>
</body>
</html>
`;

export const RACING_SKELETON = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>%%TITLE%%</title>
    <style>
        body { margin: 0; background: #333; overflow: hidden; color: #fff; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; }
        canvas { border: 4px solid #fff; }
        #overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
    </style>
</head>
<body>
    <div id="overlay" onclick="startGame()"><h1>%%TITLE%%</h1><p>ARROWS to Drive</p></div>
    <canvas id="game"></canvas>
    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        const W = 400, H = 600; canvas.width = W; canvas.height = H;
        let car = {x: W/2-25, y: H-100, Lane: 1}, obs = [], speed = 5, running = false, tick = 0;
        window.onkeydown = e => {
            if(e.code==='ArrowLeft' && car.x > 100) car.x -= 100;
            if(e.code==='ArrowRight' && car.x < 300) car.x += 100;
        };
        function loop() {
            if(!running) return requestAnimationFrame(loop);
            ctx.fillStyle='#444'; ctx.fillRect(0,0,W,H);
            ctx.fillStyle='#fff'; ctx.fillRect(95,0,5,H); ctx.fillRect(195,0,5,H); ctx.fillRect(295,0,5,H);
            if(tick%60===0) obs.push({x: 100*Math.floor(Math.random()*3)+25, y:-100});
            obs.forEach((o,i)=>{
                o.y += speed; ctx.fillStyle='#f00'; ctx.fillRect(o.x, o.y, 50, 80);
                if(o.y>H+100) obs.splice(i,1);
                if(o.y+80>car.y && o.y<car.y+80 && o.x===car.x) location.reload();
            });
            ctx.fillStyle='#0f0'; ctx.fillRect(car.x, car.y, 50, 80);
            tick++; speed += 0.001; requestAnimationFrame(loop);
        }
        loop();
        function startGame() { document.getElementById('overlay').style.display='none'; running=true; }
    </script>
</body>
</html>
`;

export const FLAPPY_SKELETON = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>%%TITLE%%</title>
    <style>
        body { margin: 0; background: #70c5ce; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
        #overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; cursor: pointer; }
    </style>
</head>
<body>
    <div id="overlay" onclick="startGame()"><h1>%%TITLE%%</h1><p>CLICK to FLAP</p></div>
    <canvas id="game"></canvas>
    <script>
        const canvas = document.getElementById('game');
        const ctx = canvas.getContext('2d');
        const W = 320, H = 480; canvas.width = W; canvas.height = H;
        let bird = {y: H/2, v: 0, r: 12}, pipes = [], running = false;
        window.onclick = () => bird.v = -6;
        function loop() {
            if(!running) return requestAnimationFrame(loop);
            ctx.fillStyle='#70c5ce'; ctx.fillRect(0,0,W,H);
            bird.v += 0.3; bird.y += bird.v;
            if(bird.y<0||bird.y>H) location.reload();
            if(++tick%100===0) pipes.push({x:W, h:Math.random()*200+50});
            pipes.forEach((p,i)=>{
                p.x-=2; ctx.fillStyle='#00a000'; ctx.fillRect(p.x, 0, 50, p.h); ctx.fillRect(p.x, p.h+100, 50, H);
                if(bird.y-bird.r<p.h || bird.y+bird.r>p.h+100) if(p.x<bird.r+50 && p.x+50>bird.r) location.reload();
                if(p.x < -50) pipes.splice(i,1);
            });
            ctx.fillStyle='#ff0'; ctx.beginPath(); ctx.arc(W/4, bird.y, bird.r, 0, 7); ctx.fill();
            requestAnimationFrame(loop);
        }
        let tick=0; loop();
        function startGame() { document.getElementById('overlay').style.display='none'; running=true; }
    </script>
</body>
</html>
`;

export const VAMPIRE_SURVIVORS_SKELETON = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>%%TITLE%%</title>
    <style>
        body { margin: 0; background: #1a0a0a; color: #fff; font-family: 'Courier New', Courier, monospace; overflow: hidden; }
        #hud { position: fixed; top: 10px; width: 100%; text-align: center; z-index: 10; font-size: 20px; text-shadow: 2px 2px #000; }
        #xp-bar { position: fixed; top: 0; left: 0; width: 0%; height: 5px; background: #44f; z-index: 20; transition: width 0.3s; }
        #overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; cursor: pointer; }
    </style>
</head>
<body>
    <div id="xp-bar"></div>
    <div id="hud">LEVEL: <span id="lvl">1</span> | KILLS: <span id="kills">0</span></div>
    <div id="overlay" onclick="startGame()">
        <h1>%%TITLE%%</h1>
        <p>WASD to Move | Auto-Attacking Enabled</p>
        <p>SURVIVE THE NIGHT</p>
    </div>

    <script type="importmap">{ "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js" } }</script>
    <script type="module">
        import * as THREE from 'three';

        // --- SEEDED RNG ---
        const SEED = "%%SEED%%";
        let seedVal = 0;
        for(let i=0; i<SEED.length; i++) seedVal += SEED.charCodeAt(i);
        const RNG = () => {
            seedVal = (seedVal * 16807) % 2147483647;
            return (seedVal - 1) / 2147483646;
        };

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        const State = { isRunning: false, lvl: 1, xp: 0, kills: 0, hp: 100, keys: {} };
        let player, enemies = [], weapons = [], particles = [];

        function init() {
            camera.position.set(0, 15, 10);
            camera.lookAt(0, 0, 0);

            const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({ color: 0x1a1a1a }));
            ground.rotation.x = -Math.PI/2;
            scene.add(ground);

            const ambient = new THREE.AmbientLight(0x404040, 2);
            scene.add(ambient);
            const sun = new THREE.DirectionalLight(0xffffff, 1);
            sun.position.set(5, 10, 5);
            scene.add(sun);

            player = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), new THREE.MeshPhongMaterial({ color: 0x4444ff }));
            player.position.y = 0.6;
            scene.add(player);
        }

        window.onkeydown = e => State.keys[e.code] = true;
        window.onkeyup = e => State.keys[e.code] = false;

        function spawnEnemy() {
            const e = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), new THREE.MeshPhongMaterial({ color: 0xff4444 }));
            const angle = RNG() * Math.PI * 2;
            e.position.set(player.position.x + Math.cos(angle)*20, 0.3, player.position.z + Math.sin(angle)*20);
            scene.add(e);
            enemies.push(e);
        }

        function spawnWeapon() {
            const w = new THREE.Mesh(new THREE.TorusGeometry(2, 0.05, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
            w.position.copy(player.position);
            w.rotation.x = Math.PI/2;
            w.userData = { life: 0.5 };
            scene.add(w);
            weapons.push(w);

            // Hit detection
            enemies.forEach((e, i) => {
                if(e.position.distanceTo(player.position) < 2.5) {
                    scene.remove(e);
                    enemies.splice(i, 1);
                    State.kills++;
                    State.xp += 20;
                    if(State.xp >= 100) { State.lvl++; State.xp = 0; }
                    updateUI();
                }
            });
        }

        function updateUI() {
            document.getElementById('lvl').innerText = State.lvl;
            document.getElementById('kills').innerText = State.kills;
            document.getElementById('xp-bar').style.width = State.xp + '%';
        }

        function loop() {
            requestAnimationFrame(loop);
            if(!State.isRunning) return;

            const speed = 0.15;
            if(State.keys['KeyW']) player.position.z -= speed;
            if(State.keys['KeyS']) player.position.z += speed;
            if(State.keys['KeyA']) player.position.x -= speed;
            if(State.keys['KeyD']) player.position.x += speed;

            camera.position.x = player.position.x;
            camera.position.z = player.position.z + 10;

            if(RNG() < 0.05) spawnEnemy();
            if(Math.floor(Date.now()/500) % 2 === 0 && weapons.length === 0) spawnWeapon();

            enemies.forEach(e => {
                const dir = player.position.clone().sub(e.position).normalize();
                e.position.add(dir.multiplyScalar(0.04));
                if(e.position.distanceTo(player.position) < 0.8) {
                    State.hp -= 0.1;
                    if(State.hp <= 0) location.reload();
                }
            });

            weapons.forEach((w, i) => {
                w.userData.life -= 0.01;
                w.scale.setScalar(1 + (0.5 - w.userData.life)*2);
                if(w.userData.life <= 0) {
                    scene.remove(w);
                    weapons.splice(i, 1);
                }
            });

            renderer.render(scene, camera);
        }

        window.startGame = () => {
            document.getElementById('overlay').style.display = 'none';
            State.isRunning = true;
        };

        init(); loop();
    </script>
</body>
</html>
`;
