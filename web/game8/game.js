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

const MBTI = {
  ISTJ:{hair:'#000000', outfit:'#555555', prof:'Judge / Legal Administrator'},
  ISFJ:{hair:'#8B4513', outfit:'#CD853F', prof:'Doctor / Nurse'},
  INFJ:{hair:'#800080', outfit:'#9370DB', prof:'Educator / Philosopher'},
  INTJ:{hair:'#4B0082', outfit:'#6A5ACD', prof:'Scientist / Social Architect'},
  ISTP:{hair:'#808000', outfit:'#BDB76B', prof:'Engineer / Inventor'},
  ISFP:{hair:'#FF69B4', outfit:'#FFC0CB', prof:'Artist / Designer'},
  INFP:{hair:'#FF00FF', outfit:'#DA70D6', prof:'Writer / Therapist'},
  INTP:{hair:'#00FFFF', outfit:'#AFEEEE', prof:'Researcher / Technology Developer'},
  ESTP:{hair:'#FF0000', outfit:'#DC143C', prof:'Explorer / Athlete'},
  ESFP:{hair:'#FFA500', outfit:'#FF8C00', prof:'Actor / Event Organizer'},
  ENFP:{hair:'#FFFF00', outfit:'#FFD700', prof:'Communicator / Community Leader'},
  ENTP:{hair:'#00FF00', outfit:'#32CD32', prof:'Entrepreneur / Innovator'},
  ESTJ:{hair:'#0000FF', outfit:'#1E90FF', prof:'Project Leader / Executive'},
  ESFJ:{hair:'#A52A2A', outfit:'#DEB887', prof:'Teacher / Social Worker'},
  ENFJ:{hair:'#008000', outfit:'#66CDAA', prof:'Politician / Social Leader'},
  ENTJ:{hair:'#800000', outfit:'#B22222', prof:'Corporate Leader / Economic Commander'},
};

const player = {
  x: 0, y: 0, w: 12, h: 12,
  spd: 2.0,
  mbti: 'ISTJ',
  hair: MBTI['ISTJ'].hair,
  outfit: MBTI['ISTJ'].outfit,
  skin: '#f1c27d',
  gender: 'male',
  profession: MBTI['ISTJ'].prof,
};
const camera = { x:0, y:0 };

async function loadMap() {
  const res = await fetch('map.json');
  map = await res.json();
  player.x = map.spawn.x * map.tileSize + 2;
  player.y = map.spawn.y * map.tileSize + 2;
  map.npcs = (map.npcs||[]).map(n => {
    n.gender = n.gender || 'male';
    n.skin = n.skin || '#f1c27d';
    applyMBTI(n, n.mbti || 'ISTJ');
    return n;
  });
}

function applyMBTI(ch, type) {
  const data = MBTI[type] || MBTI['ISTJ'];
  ch.mbti = type;
  ch.hair = data.hair;
  ch.outfit = data.outfit;
  if (!ch.profession) ch.profession = data.prof;
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

function drawCharacter(ch, x, y) {
  const w = 12, h = 12;
  if (ch.gender === 'female') {
    ctx.fillStyle = ch.hair; ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = ch.skin; ctx.fillRect(x, y+4, w, 4);
  } else {
    ctx.fillStyle = ch.hair; ctx.fillRect(x+2, y, w-4, 4);
    ctx.fillStyle = ch.skin; ctx.fillRect(x+2, y+4, w-4, 4);
  }
  ctx.fillStyle = ch.outfit; ctx.fillRect(x, y+8, w, 4);
}

function drawNPC(n) {
  const px = n.x * map.tileSize - camera.x;
  const py = n.y * map.tileSize - camera.y;
  drawCharacter(n, px+2, py+2);
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
  const px = Math.floor(player.x - camera.x - player.w/2);
  const py = Math.floor(player.y - camera.y - player.h/2);
  drawCharacter(player, px, py);
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

const mbtiSel = document.getElementById('mbti');
const genderSel = document.getElementById('gender');
const skinSel = document.getElementById('skin');
const profInput = document.getElementById('profession');

function syncPlayer() {
  applyMBTI(player, mbtiSel.value);
  player.gender = genderSel.value;
  player.skin = skinSel.value;
  player.profession = profInput.value || MBTI[player.mbti].prof;
  profInput.placeholder = MBTI[player.mbti].prof;
}

mbtiSel.addEventListener('change', syncPlayer);
genderSel.addEventListener('change', syncPlayer);
skinSel.addEventListener('change', syncPlayer);
profInput.addEventListener('input', () => { player.profession = profInput.value; });

syncPlayer();

window.addEventListener('keydown', e => keys.add(e.key));
window.addEventListener('keyup',   e => keys.delete(e.key));

loadMap().then(()=> requestAnimationFrame(loop));
