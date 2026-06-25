/* ─── Pure math — exported for unit tests ───────────────────────────────── */

/**
 * Computes the vertical offset of a sine wave at position x and time t.
 * @param {number} x - horizontal position (CSS px)
 * @param {number} t - elapsed time (seconds × speed multiplier)
 * @param {number} amplitude - wave height in px
 * @param {number} frequency - spatial frequency (radians per px)
 * @param {number} phase - phase offset (radians)
 * @returns {number} vertical offset in px
 */
export function computeWaveY(x, t, amplitude, frequency, phase) {
  return amplitude * Math.sin(x * frequency + t + phase);
}

/**
 * Computes the displacement vector applied to a wave point by a magnetic
 * cursor field. The force falls off with the square of the distance.
 * @param {number} px - point x (CSS px)
 * @param {number} py - point y (CSS px)
 * @param {number} cx - cursor x (CSS px)
 * @param {number} cy - cursor y (CSS px)
 * @param {number} force - field strength constant
 * @param {number} falloff - softening term added to distSq (prevents infinity)
 * @returns {{ x: number, y: number }}
 */
export function computeMagneticDisplacement(px, py, cx, cy, force, falloff) {
  const dx = cx - px;
  const dy = cy - py;
  const distSq = dx * dx + dy * dy;
  const d = Math.sqrt(distSq);
  if (d === 0) return { x: 0, y: 0 };
  const magnitude = force / (distSq + falloff);
  return {
    x: (dx / d) * magnitude,
    y: (dy / d) * magnitude,
  };
}

/* ─── Canvas animation ──────────────────────────────────────────────────── */

const NUM_LINES = 12;
const STEP = 3; // px between sampled points along each wave
const AMPLITUDE = 14; // base wave height in CSS px
const FORCE = 120000; // magnetic field strength (gives ~27px disp at d=50px)
const FALLOFF = 2000; // softening term; keep << typical distSq so effect is visible
const MAX_DISP = 55; // cap on magnetic displacement per point (px)

export function initWaves(canvas) {
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  prefersReduced = false; // TODO: remove this line to respect prefers-reduced-motion

  let cursor = null;
  let rafId = null;
  let isRunning = false;
  let lastTime = 0;
  let elapsed = 0;
  let waveColor = "";

  function readWaveColor() {
    waveColor = getComputedStyle(canvas)
      .getPropertyValue("--wave-color")
      .trim();
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    if (prefersReduced) drawFrame(elapsed);
  }

  function drawFrame(t) {
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const amp = prefersReduced ? 0 : AMPLITUDE;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 1;

    for (let i = 0; i < NUM_LINES; i++) {
      const baseY = (h * (i + 1)) / (NUM_LINES + 1);
      const freq = 0.008 + i * 0.001;
      const phase = i * 0.9;
      const speed = (0.4 + i * 0.025) * t;

      ctx.beginPath();

      for (let x = 0; x <= w + STEP; x += STEP) {
        let y = baseY + computeWaveY(x, speed, amp, freq, phase);

        if (cursor !== null) {
          const disp = computeMagneticDisplacement(
            x,
            y,
            cursor.x,
            cursor.y,
            FORCE,
            FALLOFF,
          );
          y += Math.max(-MAX_DISP, Math.min(MAX_DISP, disp.y));
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }
  }

  function tick(timestamp) {
    if (!isRunning) return;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    elapsed += dt;
    drawFrame(elapsed);
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    isRunning = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function onMouseMove(e) {
    cursor = { x: e.clientX, y: e.clientY };
  }

  function onMouseLeave() {
    cursor = null;
  }

  function onVisibilityChange() {
    if (document.hidden) {
      stop();
    } else if (!prefersReduced) {
      start();
    }
  }

  function onThemeChange() {
    readWaveColor();
    if (prefersReduced) drawFrame(elapsed);
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseleave", onMouseLeave);
  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("themechange", onThemeChange);

  // Pause when canvas leaves viewport (e.g. user has scrolled past it)
  const intersectionObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      if (!prefersReduced) start();
    } else {
      stop();
    }
  });
  intersectionObserver.observe(canvas);

  // Handle canvas resize
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  readWaveColor();
  resize();
  drawFrame(0); // draw first frame immediately before RAF loop starts

  return function destroy() {
    stop();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseleave", onMouseLeave);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    document.removeEventListener("themechange", onThemeChange);
  };
}
