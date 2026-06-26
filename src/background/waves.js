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

const STEP = 3; // px between sampled points — performance parameter, not exposed

export const waveDefaults = {
  numLines: 30,
  bandSpacing: 5,
  amplitude: 5,
  baseFreq: 0.007,
  baseSpeed: 0.38,
  variance: 1,
  force: 700000,
  falloff: 600,
  maxDisp: 280,
  edgeSpread: 6,
};

export function initWaves(canvas, cfg = waveDefaults) {
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
    const amp = prefersReduced ? 0 : cfg.amplitude;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = waveColor;

    const n = cfg.numLines;
    const bandHeight = (n - 1) * cfg.bandSpacing;
    const bandTop = (h - bandHeight) / 2;
    const centerIdx = (n - 1) / 2;

    for (let i = 0; i < n; i++) {
      const baseY = bandTop + i * cfg.bandSpacing;
      const norm = n > 1 ? i / (n - 1) : 0; // 0→1 across lines, independent of numLines
      const freq = cfg.baseFreq * (1 + norm * cfg.variance * 1.2);
      const phase = i * 0.3;
      const speed = cfg.baseSpeed * (1 + norm * cfg.variance * 0.6) * t;

      // Center lines are opaque and thick; edge lines fade and thin
      const proximity = centerIdx > 0 ? 1 - Math.abs(i - centerIdx) / centerIdx : 1;
      ctx.globalAlpha = 0.06 + proximity * 0.44;
      ctx.lineWidth = 0.5 + proximity * 0.5;

      ctx.beginPath();

      for (let x = 0; x <= w + STEP; x += STEP) {
        const edgeFactor = Math.abs(x - w / 2) / (w / 2);
        const spreadY = edgeFactor * cfg.edgeSpread * (i - centerIdx);
        let y = baseY + computeWaveY(x, speed, amp, freq, phase) + spreadY;

        if (cursor !== null) {
          const disp = computeMagneticDisplacement(
            x,
            y,
            cursor.x,
            cursor.y,
            cfg.force,
            cfg.falloff,
          );
          y += Math.max(-cfg.maxDisp, Math.min(cfg.maxDisp, disp.y));
        }

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    ctx.globalAlpha = 1;
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
