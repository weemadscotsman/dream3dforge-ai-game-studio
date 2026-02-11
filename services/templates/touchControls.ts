/**
 * TOUCH CONTROLS SYSTEM
 * Injected into generated games for mobile support.
 * 
 * Features:
 * - Virtual joystick (left side)
 * - Action buttons (right side)
 * - Auto-detection of touch vs mouse
 * - Haptic feedback (if available)
 * - Genre-specific button layouts
 */

/**
 * Complete touch controls code block to inject into generated HTML
 * This goes right before </body>
 */
export const TOUCH_CONTROLS_INJECTION = `
<!-- ========== MOBILE TOUCH CONTROLS ========== -->
<style>
#touch-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  pointer-events: none;
  z-index: 9999;
  display: none;
  user-select: none;
  -webkit-user-select: none;
}
#touch-controls.active { display: block; }

/* Joystick */
#joystick-zone {
  position: absolute;
  left: 20px;
  bottom: 20px;
  width: 140px;
  height: 140px;
  pointer-events: auto;
  touch-action: none;
}
#joystick-base {
  position: absolute;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
  border: 2px solid rgba(255,255,255,0.25);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
#joystick-thumb {
  position: absolute;
  width: 50px;
  height: 50px;
  background: radial-gradient(circle, rgba(99,102,241,0.9) 0%, rgba(99,102,241,0.5) 100%);
  border: 2px solid rgba(255,255,255,0.5);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 15px rgba(99,102,241,0.3);
}
#joystick-thumb.active {
  background: radial-gradient(circle, rgba(129,140,248,1) 0%, rgba(99,102,241,0.8) 100%);
  box-shadow: 0 0 25px rgba(99,102,241,0.6);
}

/* Action Buttons */
#touch-buttons {
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 160px;
  height: 160px;
  pointer-events: auto;
}
.touch-btn {
  position: absolute;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);
  color: rgba(255,255,255,0.9);
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.touch-btn:active, .touch-btn.pressed {
  background: radial-gradient(circle, rgba(239,68,68,0.8) 0%, rgba(239,68,68,0.4) 100%);
  border-color: rgba(239,68,68,0.8);
  transform: scale(0.92);
  box-shadow: 0 0 20px rgba(239,68,68,0.4);
}
#btn-fire {
  right: 0;
  bottom: 45px;
  width: 80px;
  height: 80px;
  background: radial-gradient(circle, rgba(239,68,68,0.5) 0%, rgba(239,68,68,0.2) 100%);
  border-color: rgba(239,68,68,0.5);
}
#btn-jump { right: 85px; bottom: 0; }
#btn-special { right: 85px; bottom: 85px; font-size: 10px; width: 60px; height: 60px; }

/* Landscape mode */
@media (orientation: landscape) and (max-height: 500px) {
  #touch-controls { height: 140px; }
  #joystick-zone { width: 110px; height: 110px; }
  #joystick-base { width: 90px; height: 90px; }
  #joystick-thumb { width: 40px; height: 40px; }
  .touch-btn { width: 55px; height: 55px; font-size: 10px; }
  #btn-fire { width: 65px; height: 65px; }
}
</style>

<div id="touch-controls">
  <div id="joystick-zone">
    <div id="joystick-base">
      <div id="joystick-thumb"></div>
    </div>
  </div>
  <div id="touch-buttons">
    <button id="btn-fire" class="touch-btn">FIRE</button>
    <button id="btn-jump" class="touch-btn">JUMP</button>
    <button id="btn-special" class="touch-btn">●●●</button>
  </div>
</div>

<script>
(function() {
  // Touch Controls Module
  const TC = {
    enabled: false,
    joy: { x: 0, y: 0, active: false },
    btn: { fire: false, jump: false, special: false },
    
    init() {
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      if (!isTouch) return;
      
      this.enabled = true;
      const el = document.getElementById('touch-controls');
      if (el) el.classList.add('active');
      
      this.initJoystick();
      this.initButtons();
      
      // Prevent scroll/zoom
      document.addEventListener('touchmove', e => {
        if (e.target.closest('#touch-controls')) e.preventDefault();
      }, { passive: false });
      
      console.log('[Touch] Controls enabled');
    },
    
    initJoystick() {
      const zone = document.getElementById('joystick-zone');
      const thumb = document.getElementById('joystick-thumb');
      if (!zone || !thumb) return;
      
      let ptrId = null, cx = 0, cy = 0;
      const max = 35;
      
      zone.addEventListener('pointerdown', e => {
        e.preventDefault();
        zone.setPointerCapture(e.pointerId);
        ptrId = e.pointerId;
        const r = zone.getBoundingClientRect();
        cx = r.left + r.width/2;
        cy = r.top + r.height/2;
        thumb.classList.add('active');
        this.joy.active = true;
        this.moveJoy(e.clientX, e.clientY, cx, cy, max, thumb);
        if (navigator.vibrate) navigator.vibrate(10);
      });
      
      zone.addEventListener('pointermove', e => {
        if (e.pointerId === ptrId) {
            e.preventDefault();
            this.moveJoy(e.clientX, e.clientY, cx, cy, max, thumb);
        }
      });
      
      const end = e => {
        if (e.pointerId === ptrId) {
            ptrId = null;
            thumb.style.transform = 'translate(-50%,-50%)';
            thumb.classList.remove('active');
            this.joy.x = 0; this.joy.y = 0; this.joy.active = false;
        }
      };
      zone.addEventListener('pointerup', end);
      zone.addEventListener('pointercancel', end);
    },
    
    moveJoy(tx, ty, cx, cy, max, thumb) {
      let dx = tx - cx, dy = ty - cy;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d > max) { dx = dx/d*max; dy = dy/d*max; }
      thumb.style.transform = 'translate(calc(-50% + '+dx+'px), calc(-50% + '+dy+'px))';
      this.joy.x = dx/max;
      this.joy.y = dy/max;
    },
    
    initButtons() {
      const setup = (id, key) => {
        const b = document.getElementById(id);
        if (!b) return;
        b.addEventListener('pointerdown', e => {
          e.preventDefault();
          this.btn[key] = true;
          b.classList.add('pressed');
          b.setPointerCapture(e.pointerId);
          if (navigator.vibrate) navigator.vibrate(5);
        });
        const end = (e) => {
            e.preventDefault();
            this.btn[key] = false;
            b.classList.remove('pressed');
        };
        b.addEventListener('pointerup', end);
        b.addEventListener('pointercancel', end);
      };
      setup('btn-fire', 'fire');
      setup('btn-jump', 'jump');
      setup('btn-special', 'special');
    },
    
    // API for games to use
    getMove() {
      if (!this.enabled || !this.joy.active) return null;
      return { x: this.joy.x, y: this.joy.y };
    },
    isFire() { return this.btn.fire; },
    isJump() { return this.btn.jump; },
    isSpecial() { return this.btn.special; }
  };
  
  // Expose globally
  window.TouchControls = TC;
  
  // Init on ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TC.init());
  } else {
    TC.init();
  }
})();
</script>
<!-- ========== END TOUCH CONTROLS ========== -->
`;

/**
 * Instructions for AI to integrate touch controls
 */
export const TOUCH_CONTROLS_INTEGRATION_GUIDE = `
MOBILE TOUCH CONTROLS INTEGRATION:

The game includes auto-injected touch controls. To use them:

1. MOVEMENT - Check touch joystick in your input handling:
   const touch = window.TouchControls?.getMove();
   if (touch) {
     // touch.x and touch.y are -1 to 1
     player.velocity.x = touch.x * speed;
     player.velocity.z = touch.y * speed;
   } else {
     // Fall back to keyboard
     if (Input.keys['KeyW']) player.velocity.z = -speed;
     // etc...
   }

2. ACTIONS - Check touch buttons alongside keyboard/mouse:
   const firing = Input.mouse.buttons[0] || window.TouchControls?.isFire();
   const jumping = Input.keys['Space'] || window.TouchControls?.isJump();
   const special = Input.keys['KeyE'] || window.TouchControls?.isSpecial();

3. The touch controls auto-hide on desktop and auto-show on mobile.
   No additional setup required.

4. Button labels can be customized by the game after load:
   document.getElementById('btn-fire').textContent = 'SHOOT';
   document.getElementById('btn-jump').textContent = 'DASH';
`;

/**
 * Get touch-aware input handling code snippet
 */
export const TOUCH_INPUT_SNIPPET = `
// Touch-aware input helper
function getPlayerInput() {
  const input = { moveX: 0, moveY: 0, fire: false, jump: false, special: false };
  
  // Touch controls (if available and active)
  const touch = window.TouchControls?.getMove();
  if (touch) {
    input.moveX = touch.x;
    input.moveY = touch.y;
  } else {
    // Keyboard fallback
    if (Input.keys['KeyA'] || Input.keys['ArrowLeft']) input.moveX -= 1;
    if (Input.keys['KeyD'] || Input.keys['ArrowRight']) input.moveX += 1;
    if (Input.keys['KeyW'] || Input.keys['ArrowUp']) input.moveY -= 1;
    if (Input.keys['KeyS'] || Input.keys['ArrowDown']) input.moveY += 1;
  }
  
  // Normalize diagonal movement
  const len = Math.sqrt(input.moveX * input.moveX + input.moveY * input.moveY);
  if (len > 1) { input.moveX /= len; input.moveY /= len; }
  
  // Action buttons (combine touch + keyboard + mouse)
  input.fire = Input.mouse?.buttons?.[0] || Input.keys['Space'] || window.TouchControls?.isFire?.() || false;
  input.jump = Input.keys['Space'] || Input.keys['KeyW'] || window.TouchControls?.isJump?.() || false;
  input.special = Input.keys['KeyE'] || Input.keys['ShiftLeft'] || window.TouchControls?.isSpecial?.() || false;
  
  return input;
}
`;
