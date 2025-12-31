/* app.js
   Consolidated working starfield + interactive connections + petals wind effect.
   Single-canvas approach: layer everything in one canvas for simplicity and compatibility.
*/

const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d', { alpha: true });

let DPR = Math.max(1, window.devicePixelRatio || 1);
let W = window.innerWidth;
let H = window.innerHeight;

function resizeCanvas() {
  DPR = Math.max(1, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* --------------- Parameters (tweak these for performance/feel) --------------- */
let STAR_BASE = Math.max(90, Math.floor((W * H) / 38000)); // star count scales with screen
if (STAR_BASE > 400) STAR_BASE = 400;
const PETAL_COUNT = (W < 700) ? 60 : 180;
const CONNECT_RADIUS = Math.min(180, Math.round(Math.min(W, H) * 0.12));
const TRACE_TTL = 700; // ms for short trace curve
const COMET_PROBABILITY = 0.015; // chance per second to spawn comet

/* --------------- State --------------- */
const stars = [];
const particles = []; // petals & hearts
const traces = [];
const comets = [];
let mouse = { x: W / 2, y: H / 2, px: null, py: null, vx: 0, vy: 0, down: false, lastNearest: null };

/* --------------- Utility --------------- */
function rand(a, b) { return a + Math.random() * (b - a) }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy }

/* --------------- Initialize stars --------------- */
function seedStars() {
  stars.length = 0;
  for (let i = 0; i < STAR_BASE; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + 0.4,
      angle: Math.random() * Math.PI * 2,
      speed: (Math.random() * 0.6 + 0.3) * 0.02,
      phase: Math.random() * Math.PI * 2
    });
  }
}

/* --------------- Initialize particles (petals/hearts) --------------- */
function seedParticles() {
  particles.length = 0;
  for (let i = 0; i < PETAL_COUNT; i++) {
    particles.push(makeParticle(Math.random() * W, Math.random() * H, i));
  }
}

function makeParticle(x, y, i) {
  const isHeart = Math.random() < 0.28;
  return {
    x, y,
    vx: (Math.random() - 0.5) * 0.6,
    vy: Math.random() * 0.4 + 0.1, // Slower fall speed
    size: 6 + Math.random() * 14,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    isHeart,
    id: i
  };
}

/* --------------- Event handlers (mouse as wind) --------------- */
window.addEventListener('pointermove', (e) => {
  mouse.px = mouse.x || e.clientX;
  mouse.py = mouse.y || e.clientY;
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.vx = mouse.x - mouse.px;
  mouse.vy = mouse.y - mouse.py;
  mouse.lastMoveTime = performance.now();
});
window.addEventListener('pointerdown', (e) => {
  mouse.down = true;
  spawnCometAt(e.clientX, e.clientY);
  // small local burst of particles
  spawnBurst(e.clientX, e.clientY, 10);
});
window.addEventListener('pointerup', () => { mouse.down = false });

/* --------------- Find nearest star to a point --------------- */
function findNearestStar(x, y) {
  let bestIdx = -1, bestD = Infinity;
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const d2 = dist2(x, y, s.x, s.y);
    if (d2 < bestD) { bestD = d2; bestIdx = i; }
  }
  return { idx: bestIdx, d2: bestD };
}

/* --------------- Traces (short-lived curves when moving between stars) --------------- */
function pushTrace(x1, y1, x2, y2) {
  traces.push({ x1, y1, x2, y2, born: performance.now() });
}

/* --------------- Comet (shooting star) --------------- */
function spawnCometAt(sx, sy) {
  const vx = 6 + Math.random() * 4;
  const vy = 2 + Math.random() * 1.5;
  comets.push({ x: sx, y: sy, vx, vy, born: performance.now(), life: 1200 });
}
function spawnCometAuto() {
  const sx = Math.random() * W * 0.3;
  const sy = Math.random() * H * 0.18;
  spawnCometAt(sx, sy);
}

/* --------------- Particle burst for click --------------- */
function spawnBurst(cx, cy, count) {
  for (let i = 0; i < count; i++) {
    const p = makeParticle(cx + (Math.random() - 0.5) * 40, cy + (Math.random() - 0.5) * 40, particles.length + Math.random() * 1000);
    p.vx += (Math.random() - 0.5) * 4;
    p.vy += -Math.random() * 3 - 1.4;
    particles.push(p);
  }
  // trim
  if (particles.length > PETAL_COUNT * 3) particles.splice(0, particles.length - PETAL_COUNT * 3);
}

/* --------------- Main draw loop --------------- */
let last = performance.now();
function frame(now) {
  const dt = now - last; last = now;
  // clear
  ctx.clearRect(0, 0, W, H);

  // background gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0b0820');
  g.addColorStop(0.42, '#241031');
  g.addColorStop(1, '#100313');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // aurora bands (soft)
  for (let b = 0; b < 3; b++) {
    ctx.globalCompositeOperation = 'lighter';
    const bandY = H * (0.18 + b * 0.18);
    const amp = 40 + b * 20 + Math.sin(now * 0.00025 + b) * 18;
    const grad = ctx.createLinearGradient(0, bandY - amp * 1.6, 0, bandY + amp * 1.6);
    if (b === 0) {
      grad.addColorStop(0, 'rgba(220,160,255,0.06)');
      grad.addColorStop(0.5, 'rgba(255,190,230,0.09)');
      grad.addColorStop(1, 'rgba(200,220,255,0.04)');
    } else if (b === 1) {
      grad.addColorStop(0, 'rgba(200,160,255,0.03)');
      grad.addColorStop(0.5, 'rgba(220,170,255,0.05)');
      grad.addColorStop(1, 'rgba(190,210,255,0.02)');
    } else {
      grad.addColorStop(0, 'rgba(210,180,255,0.02)');
      grad.addColorStop(0.5, 'rgba(210,200,255,0.03)');
      grad.addColorStop(1, 'rgba(180,200,240,0.01)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-150, bandY);
    for (let x = -150; x <= W + 150; x += 30) {
      const y = bandY + Math.sin((x * 0.004) + now * 0.0003 + b) * amp * (0.55 + 0.45 * Math.sin(x * 0.001 + b));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 200, H + 120);
    ctx.lineTo(-200, H + 120);
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  // update stars
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    // drift
    s.x += Math.cos(s.angle) * s.speed * (dt * 0.06);
    s.y += Math.sin(s.angle) * s.speed * (dt * 0.06);
    s.angle += Math.sin(now * 0.00012 + i) * 0.0005;
    if (s.x < -10) s.x = W + 10;
    if (s.x > W + 10) s.x = -10;
    if (s.y < -10) s.y = H + 10;
    if (s.y > H + 10) s.y = -10;

    const tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(now * 0.002 + s.phase));
    const alpha = 0.25 + 0.7 * tw * (s.r / 2.0);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // nearest star highlight & connect lines
  const nearest = findNearestTo(mouse.x, mouse.y);
  if (nearest.index >= 0) {
    const s = stars[nearest.index];
    // connect to neighbors within radius
    for (let j = 0; j < stars.length; j++) {
      if (j === nearest.index) continue;
      const t = stars[j];
      const d2 = dist2(s.x, s.y, t.x, t.y);
      if (d2 <= CONNECT_RADIUS * CONNECT_RADIUS) {
        const alpha = 0.28 * (1 - d2 / (CONNECT_RADIUS * CONNECT_RADIUS));
        ctx.strokeStyle = `rgba(220,200,255,${alpha})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
      }
    }
    // highlight nearest
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,240,255,0.9)';
    ctx.arc(s.x, s.y, s.r * 1.8 + 0.7, 0, Math.PI * 2);
    ctx.fill();
    // if we switched nearest, create a trace
    if (mouse.lastNearest != null && mouse.lastNearest !== nearest.index) {
      const prev = stars[mouse.lastNearest];
      if (prev) traces.push({ x1: prev.x, y1: prev.y, x2: s.x, y2: s.y, born: performance.now() });
    }
    mouse.lastNearest = nearest.index;
  }

  // draw traces (short-lived)
  for (let k = traces.length - 1; k >= 0; k--) {
    const tr = traces[k];
    const age = performance.now() - tr.born;
    const tnorm = age / TRACE_TTL;
    if (tnorm >= 1) { traces.splice(k, 1); continue; }
    const a = 0.9 * (1 - tnorm);
    ctx.lineWidth = 2.0 * (1 - tnorm);
    ctx.strokeStyle = `rgba(255,220,240,${a})`;
    ctx.beginPath();
    const mx = (tr.x1 + tr.x2) / 2 + Math.sin(age * 0.008) * 18;
    const my = (tr.y1 + tr.y2) / 2 + Math.cos(age * 0.006) * 12;
    ctx.moveTo(tr.x1, tr.y1);
    ctx.quadraticCurveTo(mx, my, tr.x2, tr.y2);
    ctx.stroke();
  }

  // update & draw comets
  for (let i = comets.length - 1; i >= 0; i--) {
    const c = comets[i];
    const age = performance.now() - c.born;
    const lifeNorm = age / c.life;
    if (lifeNorm > 1) { comets.splice(i, 1); continue; }
    c.x += c.vx * (dt * 0.05);
    c.y += c.vy * (dt * 0.05);
    const trailLen = 40 + (1 - lifeNorm) * 120;
    ctx.beginPath();
    const g = ctx.createLinearGradient(c.x, c.y, c.x - c.vx * trailLen, c.y - c.vy * trailLen);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,200,240,0.0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 2 + (1 - lifeNorm) * 3;
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x - c.vx * trailLen, c.y - c.vy * trailLen);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.arc(c.x, c.y, 2.2 + (1 - lifeNorm) * 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // update particles (petals/hearts) with simple wind following mouse
  const windFactor = Math.min(2.5, Math.sqrt((mouse.vx || 0) * (mouse.vx || 0) + (mouse.vy || 0) * (mouse.vy || 0)) * 0.06);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    // attraction to mouse movement (if within radius)
    const dx = (mouse.x - p.x);
    const dy = (mouse.y - p.y);
    const d2 = dx * dx + dy * dy;
    if (d2 < 200 * 200 && (mouse.x !== undefined)) {
      const influence = 1 - Math.sqrt(d2) / 200;
      p.vx += (mouse.vx || 0) * 0.008 * influence;
      p.vy += (mouse.vy || 0) * 0.006 * influence;
      // slight pull
      p.vx += (dx / 10000) * 0.9 * influence;
      p.vy += (dy / 12000) * 0.35 * influence;
    } else {
      // mild noise
      p.vx += Math.sin((p.id + now * 0.0002 + i)) * 0.0004;
    }

    // gravity & drag (slower)
    p.vy += 0.01 * (0.4 + p.size / 40); // Reduced gravity for slower fall
    p.vx *= 0.994;
    p.vy *= 0.998;

    p.x += p.vx * (DPR > 1 ? 1.0 : 1.0);
    p.y += p.vy * (DPR > 1 ? 1.0 : 1.0);

    // recycle - spawn more hearts at bottom
    if (p.y > H + 30 || p.x < -60 || p.x > W + 60) {
      if (p.isHeart && Math.random() < 0.3) {
        // Spawn hearts at bottom more often
        p.x = Math.random() * W;
        p.y = H + 10 + Math.random() * 50;
        p.vx = (Math.random() - 0.5) * 0.4;
        p.vy = -Math.random() * 0.3 - 0.1; // Float upward
      } else {
        p.x = Math.random() * W;
        p.y = -20 - Math.random() * 120;
        p.vx = (Math.random() - 0.5) * 0.6;
        p.vy = Math.random() * 0.4 + 0.1; // Slower initial speed
      }
    }

    // render
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot + Math.sin(now * 0.001 + p.id) * 0.04);
    const s = p.size;
    if (p.isHeart) {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.18);
      ctx.bezierCurveTo(-s, -s * 0.9, -s * 0.9, s * 0.4, 0, s);
      ctx.bezierCurveTo(s * 0.9, s * 0.4, s, -s * 0.9, 0, -s * 0.18);
      ctx.fillStyle = `rgba(255,150,185,${0.12 + Math.min(0.7, 0.45 * Math.abs(Math.sin(now * 0.004 + p.id)))})`;
      ctx.fill();
    } else {
      // Pink petals
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.6, s, Math.PI * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,150,180,${0.15 + 0.35 * Math.abs(Math.sin(now * 0.002 + p.id))})`;
      ctx.fill();
    }
    ctx.restore();
    p.rot += p.rotSpeed;
  }

  // occasional comet spawn
  if (Math.random() < COMET_PROBABILITY * (dt / 1000)) spawnCometAuto();

  // Update and draw letter page hearts
  checkLetterPageVisibility();
  updateLetterHearts(now);

  requestAnimationFrame(frame);
}

/* helpers */
function findNearestTo(x, y) {
  if (typeof x !== 'number' || typeof y !== 'number') return { index: -1 };
  let best = -1; let bestd = Infinity;
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const d2 = dist2(x, y, s.x, s.y);
    if (d2 < bestd) { bestd = d2; best = i; }
  }
  if (bestd > CONNECT_RADIUS * CONNECT_RADIUS) return { index: -1 };
  return { index: best, d2: bestd };
}

/* seed everything */
seedStars();
seedParticles();

// Check letter page visibility on scroll
window.addEventListener('scroll', checkLetterPageVisibility);
window.addEventListener('resize', () => {
  if (letterHearts.length > 0) {
    seedLetterHearts();
  }
});

requestAnimationFrame(frame);

/* --------------- Letter Page: Modal Popup --------------- */
const scrollWrap = document.getElementById('scrollWrap');
const openBtn = document.getElementById('openBtn');
const closeBtn = document.getElementById('closeBtn');
const letterModal = document.getElementById('letterModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const letterFrame = document.querySelector('.letter-frame');

let isModalOpen = false;

function openLetterModal() {
  if (isModalOpen) return;
  isModalOpen = true;
  letterModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
  // Spawn hearts around letter when opened
  setTimeout(() => {
    if (checkLetterPageVisibility()) {
      seedLetterHearts();
    }
  }, 600);
}

function closeLetterModal() {
  if (!isModalOpen) return;
  isModalOpen = false;
  letterModal.classList.remove('active');
  document.body.style.overflow = ''; // Restore scrolling
  // Clear letter hearts when closed
  letterHearts.length = 0;
}

if (openBtn) {
  openBtn.addEventListener('click', openLetterModal);
}
if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', closeLetterModal);
}
if (modalOverlay) {
  modalOverlay.addEventListener('click', closeLetterModal);
}
// Keep the old close button for compatibility
if (closeBtn) {
  closeBtn.addEventListener('click', closeLetterModal);
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isModalOpen) {
    closeLetterModal();
  }
});

/* --------------- Floating Hearts for Letter Page --------------- */
const letterHearts = [];
const LETTER_HEART_COUNT = 30;

function makeLetterHeart(x, y, i) {
  return {
    x, y,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -Math.random() * 0.4 - 0.2,
    size: 6 + Math.random() * 10,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.015,
    id: i,
    alpha: 0.3 + Math.random() * 0.5
  };
}

function seedLetterHearts() {
  letterHearts.length = 0;
  const modalContent = document.querySelector('.modal-content');
  if (!modalContent) return;

  const rect = modalContent.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const width = rect.width;
  const height = rect.height;

  // Spawn hearts around modal boundaries
  for (let i = 0; i < LETTER_HEART_COUNT; i++) {
    let x, y;
    const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left

    if (side === 0) { // Top
      x = rect.left + Math.random() * width;
      y = rect.top - 20 - Math.random() * 40;
    } else if (side === 1) { // Right
      x = rect.right + 20 + Math.random() * 40;
      y = rect.top + Math.random() * height;
    } else if (side === 2) { // Bottom
      x = rect.left + Math.random() * width;
      y = rect.bottom + 20 + Math.random() * 40;
    } else { // Left
      x = rect.left - 20 - Math.random() * 40;
      y = rect.top + Math.random() * height;
    }

    letterHearts.push(makeLetterHeart(x, y, i));
  }
}

// Check if letter page is visible and modal is open
function checkLetterPageVisibility() {
  const letterPage = document.getElementById('page-letter');
  if (!letterPage) return false;

  const rect = letterPage.getBoundingClientRect();
  const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
  const isModalOpen = letterModal && letterModal.classList.contains('active');

  // Only spawn hearts when modal is opened
  if (isVisible && isModalOpen && letterHearts.length === 0) {
    seedLetterHearts();
  }

  // Clear hearts if modal is closed
  if (!isModalOpen && letterHearts.length > 0) {
    letterHearts.length = 0;
  }

  return isVisible;
}

// Update letter hearts in main draw loop - float around modal boundaries
function updateLetterHearts(now) {
  if (letterHearts.length === 0) return;

  const modalContent = document.querySelector('.modal-content');
  if (!modalContent) return;

  const rect = modalContent.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < letterHearts.length; i++) {
    const h = letterHearts[i];

    // Gentle drift
    h.vx += Math.sin((h.id + now * 0.0003) * 0.5) * 0.0006;
    h.vy += Math.cos((h.id + now * 0.0002) * 0.5) * 0.0004;

    // Keep hearts around letter boundaries - gentle orbit
    const dx = h.x - centerX;
    const dy = h.y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const targetDist = Math.max(rect.width, rect.height) * 0.6;

    if (dist > targetDist * 1.2) {
      // Pull back toward boundaries
      h.vx -= (dx / dist) * 0.001;
      h.vy -= (dy / dist) * 0.001;
    } else if (dist < targetDist * 0.5) {
      // Push away from center
      h.vx += (dx / dist) * 0.0005;
      h.vy += (dy / dist) * 0.0005;
    }

    // Drag
    h.vx *= 0.996;
    h.vy *= 0.997;

    h.x += h.vx;
    h.y += h.vy;
    h.rot += h.rotSpeed;

    // Recycle if too far from letter
    if (h.y < rect.top - 150 || h.y > rect.bottom + 150 ||
      h.x < rect.left - 150 || h.x > rect.right + 150) {
      // Respawn around letter boundaries
      const side = Math.floor(Math.random() * 4);
      if (side === 0) { // Top
        h.x = rect.left + Math.random() * rect.width;
        h.y = rect.top - 20 - Math.random() * 40;
      } else if (side === 1) { // Right
        h.x = rect.right + 20 + Math.random() * 40;
        h.y = rect.top + Math.random() * rect.height;
      } else if (side === 2) { // Bottom
        h.x = rect.left + Math.random() * rect.width;
        h.y = rect.bottom + 20 + Math.random() * 40;
      } else { // Left
        h.x = rect.left - 20 - Math.random() * 40;
        h.y = rect.top + Math.random() * rect.height;
      }
      h.vx = (Math.random() - 0.5) * 0.3;
      h.vy = -Math.random() * 0.4 - 0.2;
    }

    // Draw heart
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rot + Math.sin(now * 0.001 + h.id) * 0.1);
    const s = h.size;
    const alpha = h.alpha * (0.6 + 0.4 * Math.abs(Math.sin(now * 0.003 + h.id)));
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.18);
    ctx.bezierCurveTo(-s, -s * 0.9, -s * 0.9, s * 0.4, 0, s);
    ctx.bezierCurveTo(s * 0.9, s * 0.4, s, -s * 0.9, 0, -s * 0.18);
    ctx.fillStyle = `rgba(255,100,150,${alpha})`;
    ctx.fill();
    ctx.restore();
  }
}

/* reduced-motion fallback */
const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
if (mq.matches) {
  // drastically reduce effects: keep static stars only
  // stop comets and traces
  traces.length = 0;
  comets.length = 0;
  // clear periodic motion by stopping loop and doing single draw
  // (For brevity we keep loop but reduce counts)
  while (stars.length > 80) stars.pop();
  while (particles.length > 40) particles.pop();
}

// ===== PHOTO GRID & STORY FUNCTIONALITY =====

// Photo grid data
const photoGridData = [
  {
    id: 1,
    image: './images/grid/photo1.jpg',
    caption: 'Remember when we watched that sunset together? This moment captured everything I love about our adventures.'
  },
  {
    id: 2,
    image: './images/grid/photo2.jpg',
    caption: 'That spontaneous trip that became one of our best memories. Your laugh made everything perfect.'
  },
  {
    id: 3,
    image: './images/grid/photo3.jpg',
    caption: 'Coffee dates and deep conversations. These simple moments mean the world to me.'
  },
  {
    id: 4,
    image: './images/grid/photo4.jpg',
    caption: 'Dancing in the rain like nobody was watching. Your joy is contagious!'
  },
  {
    id: 5,
    image: './images/grid/photo5.jpg',
    caption: 'The day we got lost and found our favorite spot. Every wrong turn led us somewhere beautiful.'
  },
  {
    id: 6,
    image: './images/grid/photo6.jpg',
    caption: 'Midnight conversations that lasted till dawn. Time stops when I\'m with you.'
  },
  {
    id: 7,
    image: './images/grid/photo7.jpg',
    caption: 'That perfect summer day. Sunshine, good music, and you - my favorite combination.'
  },
  {
    id: 8,
    image: './images/grid/photo8.jpg',
    caption: 'Building dreams together. Every project with you feels like magic.'
  },
  {
    id: 9,
    image: './images/grid/photo9.jpg',
    caption: 'The look in your eyes when you\'re truly happy. I could stare at this forever.'
  }
];

// Music playlist
const musicPlaylist = [
  {
    title: "Perfect Moment",
    file: "./audio/songs/song1.mp3"
  },
  {
    title: "Sunset Dreams",
    file: "./audio/songs/song2.mp3"
  },
  {
    title: "Coffee & Conversations",
    file: "./audio/songs/song3.mp3"
  },
  {
    title: "Rain Dance",
    file: "./audio/songs/song4.mp3"
  },
  {
    title: "Lost & Found",
    file: "./audio/songs/song5.mp3"
  }
];

class PhotoGridManager {
  constructor() {
    this.photoGrid = document.querySelector('.photo-grid');
    this.storyModal = document.getElementById('storyModal');
    this.storyOverlay = document.getElementById('storyOverlay');
    this.storyImage = document.getElementById('storyImage');
    this.storyCloseBtn = document.getElementById('storyCloseBtn');
    this.storyBackBtn = document.getElementById('storyBackBtn');
    this.musicToggle = document.getElementById('musicToggle');
    this.playPause = document.getElementById('playPause');

    this.currentAudio = null;
    this.currentSongIndex = 0;
    this.isPlaying = false;

    this.init();
  }

  init() {
    this.createGridItems();
    this.setupEventListeners();
  }

  createGridItems() {
    photoGridData.forEach(photo => {
      const gridItem = document.createElement('div');
      gridItem.className = 'grid-item';
      gridItem.dataset.photoId = photo.id;

      const img = document.createElement('img');
      img.src = photo.image;
      img.alt = `Photo ${photo.id}`;
      img.loading = 'lazy';

      gridItem.appendChild(img);
      this.photoGrid.appendChild(gridItem);
    });
  }

  setupEventListeners() {
    // Grid item clicks
    document.querySelectorAll('.grid-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const photoId = parseInt(e.currentTarget.dataset.photoId);
        this.openStory(photoId);
      });
    });

    // Close story modal
    this.storyCloseBtn.addEventListener('click', () => this.closeStory());
    this.storyOverlay.addEventListener('click', () => this.closeStory());
    this.storyBackBtn.addEventListener('click', () => this.closeStory());

    // Music player controls
    this.musicToggle.addEventListener('click', () => this.toggleMusic());
    this.playPause.addEventListener('click', () => this.togglePlayPause());

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.storyModal.classList.contains('active')) {
        this.closeStory();
      }
    });
  }

  openStory(photoId) {
    const photo = photoGridData.find(p => p.id === photoId);
    if (!photo) return;

    // Set story content
    this.storyImage.src = photo.image;

    // Show modal
    this.storyModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Start music if not already playing
    if (!this.currentAudio) {
      this.playCurrentSong();
    }
  }

  closeStory() {
    this.storyModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  playCurrentSong() {
    console.log('Playing song at index:', this.currentSongIndex);
    console.log('Playlist length:', musicPlaylist.length);

    if (this.currentAudio) {
      this.currentAudio.pause();
    }

    const song = musicPlaylist[this.currentSongIndex];
    console.log('Song to play:', song);

    this.currentAudio = new Audio(song.file);
    this.currentAudio.volume = 0.5;

    this.currentAudio.addEventListener('ended', () => {
      this.currentSongIndex = (this.currentSongIndex + 1) % musicPlaylist.length;
      this.playCurrentSong();
    });

    this.currentAudio.play().catch(error => {
      console.log('Audio play failed:', error);
    });

    // Update UI
    this.playPause.textContent = '⏸';
    this.musicToggle.classList.add('playing');
    this.isPlaying = true;
  }

  togglePlayPause() {
    if (!this.currentAudio) {
      this.playCurrentSong();
      return;
    }

    if (this.isPlaying) {
      this.currentAudio.pause();
      this.playPause.textContent = '▶';
      this.musicToggle.classList.remove('playing');
      this.isPlaying = false;
    } else {
      this.currentAudio.play();
      this.playPause.textContent = '⏸';
      this.musicToggle.classList.add('playing');
      this.isPlaying = true;
    }
  }

  toggleMusic() {
    if (!this.currentAudio) {
      this.playCurrentSong();
    } else {
      this.togglePlayPause();
    }
  }
}

// Initialize photo grid when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PhotoGridManager();
});
