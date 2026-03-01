/* ============================================================
   DEEPA ELECTRONIC — script.js
   Anti-Gravity physics engine + UI interactions
   ============================================================ */

"use strict";

/* ================================================================
   1. CART / ADD BUTTON — quick feedback on click
   ================================================================ */
document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    const orig = this.textContent;
    this.textContent = '✓';
    this.style.background = 'linear-gradient(135deg,#10b981,#059669)';
    setTimeout(() => {
      this.textContent = orig;
      this.style.background = '';
    }, 1200);
  });
});

/* ================================================================
   2. CONTACT FORM — submit handler
   ================================================================ */
function handleForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.textContent = 'Sent! ✓';
  btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
  setTimeout(() => {
    btn.textContent = 'Send Message →';
    btn.style.background = '';
    e.target.reset();
  }, 2500);
}

/* ================================================================
   3. SCROLL REVEAL — IntersectionObserver
   ================================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-up');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document
  .querySelectorAll('.product-card,.testi-card,.about-card,.feat-item,.contact-item')
  .forEach(el => revealObserver.observe(el));

/* ================================================================
   4. SMOOTH SCROLL — hero buttons
   ================================================================ */
document.querySelectorAll('[data-scroll]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.querySelector(btn.dataset.scroll);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ================================================================
   5. ANTI-GRAVITY ENGINE — Matter.js physics simulation
   ================================================================ */
let engine, runner, bodies = [], gravityActive = false;

/**
 * Activate the anti-gravity effect.
 * Grabs every visible element, hides the real page, then renders
 * physics-driven block representations on a canvas overlay.
 */
function activateGravity() {
  if (gravityActive) return;
  gravityActive = true;

  document.getElementById('btn-gravity').style.display = 'none';
  document.getElementById('btn-reset').style.display   = 'flex';

  /* --- Canvas setup --- */
  const canvas = document.getElementById('gravity-canvas');
  canvas.style.display = 'block';
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  /* --- Collect visible target elements --- */
  const selectors = [
    'header', 'h1', 'h2', 'h3', 'h4', 'p',
    '.hero-badge', '.hero-btns', '.stat-item',
    '.product-card', '.about-card',
    '.feat-item', '.testi-card', '.contact-item',
    '.section-label', '.btn-primary', '.btn-outline',
    'footer', 'nav', '.hero-visual', '.neon-divider', '.contact-form'
  ];

  const seen    = new Set();
  const targets = [];

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (!seen.has(el) && isVisible(el)) {
        seen.add(el);
        targets.push(el);
      }
    });
  });

  /* --- Hide original page --- */
  document.querySelectorAll('body > *:not(#gravity-canvas):not(#gravity-bar)').forEach(el => {
    el.style.visibility = 'hidden';
  });

  /* --- Matter.js setup --- */
  const { Engine, Runner, Bodies, Body, Composite } = Matter;

  engine = Engine.create();
  engine.gravity.y = 1.2;

  bodies = [];

  targets.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;

    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    const body = Bodies.rectangle(cx, cy, rect.width, rect.height, {
      restitution: 0.35,
      friction:    0.5,
      frictionAir: 0.008,
      angle: (Math.random() - 0.5) * 0.2
    });

    /* Random initial kick */
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 6,
      y: (Math.random() - 0.5) * 3 - 2
    });

    body._el   = el;
    body._rect = rect;

    bodies.push(body);
  });

  /* Invisible boundaries */
  const floor  = Matter.Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 25, window.innerWidth * 2, 50,             { isStatic: true });
  const wallL  = Matter.Bodies.rectangle(-25,                    window.innerHeight / 2, 50, window.innerHeight * 2,            { isStatic: true });
  const wallR  = Matter.Bodies.rectangle(window.innerWidth + 25, window.innerHeight / 2, 50, window.innerHeight * 2,            { isStatic: true });

  Composite.add(engine.world, [...bodies, floor, wallL, wallR]);

  runner = Runner.create();
  Runner.run(runner, engine);

  /* --- Draw loop --- */
  function draw() {
    if (!gravityActive) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bodies.forEach(body => {
      const { position: pos, angle } = body;
      const w = body._rect.width;
      const h = body._rect.height;

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(angle);

      /* Card background */
      ctx.shadowColor = 'rgba(0,212,255,0.25)';
      ctx.shadowBlur  = 12;
      ctx.fillStyle   = getBodyColor(body._el);
      ctx.strokeStyle = 'rgba(0,212,255,0.15)';
      ctx.lineWidth   = 1;
      roundRect(ctx, -w / 2, -h / 2, w, h, 10);
      ctx.fill();
      ctx.stroke();

      /* Label */
      ctx.shadowBlur      = 0;
      ctx.fillStyle       = '#e2e8f0';
      ctx.font            = `${Math.min(13, h * 0.35)}px Outfit, sans-serif`;
      ctx.textAlign       = 'center';
      ctx.textBaseline    = 'middle';
      const label = getElementLabel(body._el);
      if (label) ctx.fillText(truncate(label, 24), 0, 0);

      ctx.restore();
    });

    requestAnimationFrame(draw);
  }

  draw();
}

/* ----------------------------------------------------------------
   Reset — restore the page to its original state
   ---------------------------------------------------------------- */
function resetGravity() {
  gravityActive = false;
  bodies = [];

  if (runner) Matter.Runner.stop(runner);
  if (engine) Matter.Engine.clear(engine);

  const canvas = document.getElementById('gravity-canvas');
  canvas.style.display = 'none';
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* Restore page visibility */
  document.querySelectorAll('body > *:not(#gravity-canvas):not(#gravity-bar)').forEach(el => {
    el.style.visibility = '';
  });

  document.getElementById('btn-gravity').style.display = 'flex';
  document.getElementById('btn-reset').style.display   = 'none';
}

/* ================================================================
   HELPER UTILITIES
   ================================================================ */

/** Check if an element is currently visible in the viewport */
function isVisible(el) {
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/** Choose a fill color based on element type */
function getBodyColor(el) {
  if (!el) return 'rgba(26,26,46,0.85)';
  const cls = el.className || '';
  const tag = (el.tagName || '').toLowerCase();
  if (cls.includes('product-card') || cls.includes('testi-card') || cls.includes('about-card')) return '#1a1a2e';
  if (tag === 'header') return 'rgba(10,10,15,0.95)';
  if (tag === 'footer') return '#12121c';
  if (cls.includes('hero-badge')) return 'rgba(0,212,255,0.1)';
  return 'rgba(26,26,46,0.85)';
}

/** Extract a short text label from an element */
function getElementLabel(el) {
  if (!el) return '';
  const text = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ');
  return text || (el.querySelector('img') ? '🖼️' : '');
}

/** Truncate a string to n characters */
function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/**
 * Draw a rounded rectangle path on a canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x  - top-left x (relative to current transform)
 * @param {number} y  - top-left y
 * @param {number} w  - width
 * @param {number} h  - height
 * @param {number} r  - corner radius
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,   x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ================================================================
   6. RESIZE — update canvas size on window resize
   ================================================================ */
window.addEventListener('resize', () => {
  const canvas = document.getElementById('gravity-canvas');
  if (canvas.style.display !== 'none') {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});
