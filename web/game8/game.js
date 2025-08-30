const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d', { alpha: false });

const fpsEl = document.getElementById('fps');

let W = cvs.width, H = cvs.height;
let scale = 1;

// world
let map = null;
let keys = new Set();
const TCOL = {
  grass: '#2e7d32',
  path:  '#8d6e63',
  water: '#1565c0',
  wall:  '#424242'
};

const player = {
  x: 0, y: 0, w: 12, h: 12,
  spd: 2.0,
  color: '#ffd54f',
};
const camera = { x:0, y:0 };

async function loadMap() {
  const res = await fetch('map.json');
  map = await res.json();
  player.x = map.spawn.x * map.tileSize + 2;
  player.y = map.spawn.y * map.tileSize + 2;
}

function tileAt(px, py) {
  if (!map) return 0;
  const tx = Math.floor(px / map.tileSize);
  const ty = Math.floor(py / map.tileSize);
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return 3;
  return map.tiles[ty * map.width + tx];
}
function isSolid(t) { return map.solids.includes(t); }

function moveEntity(ent, dx, dy) {
  // แก้ชนขอบ/กำแพงแบบ AABB
  const nx = ent.x + dx, ny = ent.y + dy;
  // ตรวจ 4 จุดรอบ hitbox
  const hw = ent.w/2, hh = ent.h/2;
  const points = [
    [nx - hw, ny - hh], [nx + hw, ny - hh],
    [nx - hw, ny + hh], [nx + hw, ny + hh]
  ];
  let blocked = false;
  for (const [px, py] of points) {
    if (isSolid(tileAt(px, py))) { blocked = true; break; }
  }
  if (!blocked) { ent.x = nx; ent.y = ny; }
}

function update(dt) {
  let dx = 0, dy = 0;
  if (keys.has('ArrowLeft') || keys.has('a')) dx -= player.spd;
  if (keys.has('ArrowRight')|| keys.has('d')) dx += player.spd;
  if (keys.has('ArrowUp')   || keys.has('w')) dy -= player.spd;
  if (keys.has('ArrowDown') || keys.has('s')) dy += player.spd;

  // ปรับความเร็วคงที่เมื่อเดินทแยง
  if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }

  moveEntity(player, dx, 0);
  moveEntity(player, 0, dy);

  // กล้องตามผู้เล่น
  camera.x = Math.floor(player.x - W/2);
  camera.y = Math.floor(player.y - H/2);
  const maxX = map.width * map.tileSize - W;
  const maxY = map.height* map.tileSize - H;
  camera.x = Math.max(0, Math.min(camera.x, Math.max(0, maxX)));
  camera.y = Math.max(0, Math.min(camera.y, Math.max(0, maxY)));
}

function drawTile(t, x, y) {
  const type = map.legend[String(t)] || 'grass';
  ctx.fillStyle = TCOL[type] || '#000';
  ctx.fillRect(x, y, map.tileSize, map.tileSize);
}

function drawNPC(n) {
  const px = n.x * map.tileSize - camera.x;
  const py = n.y * map.tileSize - camera.y;
  ctx.fillStyle = '#ff8a80';
  ctx.fillRect(px+2, py+2, 12, 12);
}

function render() {
  ctx.fillStyle = '#101014';
  ctx.fillRect(0,0,W,H);

  // วาด tile เฉพาะที่อยู่ในเฟรมเพื่อประสิทธิภาพ
  const ts = map.tileSize;
  const sx = Math.floor(camera.x/ts), sy = Math.floor(camera.y/ts);
  const ex = Math.ceil((camera.x+W)/ts), ey = Math.ceil((camera.y+H)/ts);
  for (let ty = sy; ty < ey; ty++) {
    for (let tx = sx; tx < ex; tx++) {
      if (tx<0||ty<0||tx>=map.width||ty>=map.height) continue;
      const t = map.tiles[ty*map.width + tx];
      drawTile(t, tx*ts - camera.x, ty*ts - camera.y);
    }
  }

  // NPC
  for (const n of (map.npcs||[])) drawNPC(n);

  // Player
  ctx.fillStyle = player.color;
  ctx.fillRect(Math.floor(player.x - camera.x - player.w/2),
               Math.floor(player.y - camera.y - player.h/2),
               player.w, player.h);
}

let last = performance.now(), acc=0, frames=0, fps=0, fpsTimer=0;
function loop(t) {
  const dt = (t - last)/1000; last = t;
  update(dt);
  render();

  frames++; fpsTimer += dt;
  if (fpsTimer >= 0.5) { fps = Math.round(frames/fpsTimer); frames=0; fpsTimer=0; fpsEl.textContent = fps; }

  requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => keys.add(e.key));
window.addEventListener('keyup',   e => keys.delete(e.key));

loadMap().then(()=> requestAnimationFrame(loop));
