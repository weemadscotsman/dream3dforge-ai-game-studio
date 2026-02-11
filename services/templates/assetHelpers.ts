export const ASSET_HELPERS = `
/**
 * DREAM3DFORGE ASSET LIBRARY v2.0
 * COPY PASTE THESE FUNCTIONS TO CREATE HIGH-QUALITY ASSETS
 */

const _geoCache = {};
const _matCache = {};

// 1. ADVANCED PIXEL TEXTURE (Supports specific resolution and smoothing)
function createPixelTexture(ascii, palette, size=64) {
  const canvas = document.createElement('canvas');
  const rows = ascii.trim().split('\\n').map(r => r.trim());
  
  canvas.width = rows[0].length * size;
  canvas.height = rows.length * size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      if (palette[char]) {
        ctx.fillStyle = palette[char];
        ctx.fillRect(x * size, y * size, size, size);
      }
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  return tex;
}

// 2. NEON GRID TEXTURE (Cyberpunk / Retro Floors)
function createGridTexture(color1='#000000', color2='#00ff00', size=512, divisions=10) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = color1;
  ctx.fillRect(0,0,size,size);

  // Glow effect
  ctx.shadowBlur = 10;
  ctx.shadowColor = color2;
  ctx.strokeStyle = color2;
  ctx.lineWidth = 2;

  // Grid
  const step = size / divisions;
  ctx.beginPath();
  for(let i=0; i<=size; i+=step) {
    ctx.moveTo(i, 0); ctx.lineTo(i, size);
    ctx.moveTo(0, i); ctx.lineTo(size, i);
  }
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// 3. GLOWING NEON MATERIAL BUILDER
function createNeonMaterial(color, intensity=1.5) {
  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.2,
    metalness: 0.8
  });
}

// 4. VOXEL MODEL BUILDER (Performance Optimized)
// Turns an ASCII map into a single optimized geometry
function createVoxelModel(layers, palette, scale=1) {
  const group = new THREE.Group();
  const boxGeo = new THREE.BoxGeometry(scale, scale, scale);
  
  // Clean layers
  const cleanLayers = layers.map(l => l.trim().split('\\n').map(r => r.trim()));

  cleanLayers.forEach((rows, yLayer) => {
    rows.forEach((row, zRow) => {
      for(let xCol=0; xCol<row.length; xCol++) {
        const char = row[xCol];
        if(!palette[char]) continue;

        // Create Mesh
        const mat = _matCache[palette[char]] || new THREE.MeshStandardMaterial({ 
            color: palette[char],
            roughness: 0.3
        });
        _matCache[palette[char]] = mat;

        const mesh = new THREE.Mesh(boxGeo, mat);
        // Center offsets
        const xOffset = -(row.length * scale) / 2;
        const zOffset = -(rows.length * scale) / 2;
        
        mesh.position.set(
            xOffset + (xCol * scale), 
            (cleanLayers.length - yLayer) * scale, 
            zOffset + (zRow * scale)
        );
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
      }
    });
  });
  
  return group;
}

/**
 * EXAMPLE USAGE:
 * const shipDesign = [
 *   \` .A.
 *     BAB
 *     .A. \`
 * ];
 * const palette = { 'A': '#ff0000', 'B': '#333333' };
 * const ship = createVoxelModel(shipDesign, palette, 0.5);
 * scene.add(ship);
 */
`;
