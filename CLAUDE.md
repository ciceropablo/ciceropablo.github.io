# CLAUDE.md — context for AI coding agents

## What this repo is

Personal landing page at `ciceropablo.github.io`. A single HTML page with:
- Swiss International typographic aesthetic (Inter Variable, golden ratio scale)
- Magnetic sine wave canvas animation in the background
- Light/dark theme with FOUC prevention
- Vite build, zero JS runtime dependencies, Vitest tests

## Commands

```bash
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
npm run test       # Vitest (run once)
npm run test:watch # Vitest watch
npm run lint       # ESLint (flat config)
```

## Architecture

```
index.html          entry; inline anti-FOUC <script>; links main.css + main.js
src/main.js         imports CSS; calls initTheme() and initWaves()
src/styles/
  tokens.css        ALL CSS custom props (colors, type scale, spacing scale)
  reset.css         minimal reset
  typography.css    Inter Variable @font-face + type styles
  layout.css        canvas, grid, main column, theme button, responsive
  main.css          @import entry (linked in <html>)
src/background/
  waves.js          computeWaveY(), computeMagneticDisplacement() (pure, tested)
                    initWaves(canvas) — canvas setup, RAF loop, event listeners
src/theme/
  theme.js          resolveTheme(), persistTheme(), toggleTheme() (pure, tested)
                    initTheme(btn) — wires DOM, dispatches 'themechange' event
src/utils/
  throttle.js       rafThrottle(fn, raf?) — drops calls within same frame
tests/
  waves.test.js     wave math (node env, no DOM)
  theme.test.js     theme logic (node env, localStorage stubbed)
  throttle.test.js  rafThrottle with mock raf
```

## Hard rules

- **Zero runtime dependencies.** No React, no animation libraries, no utility libs.
  devDependencies are fine (Vite, Vitest, ESLint, fontsource).
- **Content readable without JS.** CSS is linked; HTML has the text. Canvas is
  decorative (`aria-hidden`). Anti-FOUC script failure → system dark/light via
  CSS `prefers-color-scheme` media query.
- **Theme toggle is the only mechanism to change the theme.** All colors are CSS
  custom properties. Switching `[data-theme]` on `<html>` is sufficient.
- **Wave color follows theme.** `waves.js` reads `--wave-color` from computed style
  and re-reads it on the `themechange` CustomEvent.
- **Performance.** RAF loop pauses on `visibilitychange` and `IntersectionObserver`.
  `prefers-reduced-motion: reduce` → static frame only. No blocking work in JS.
- **Tests target logic, not pixels.** Do not test canvas rendering. `initWaves` and
  `initTheme` are not tested; only their exported pure functions are.
- **ESLint flat config** (`eslint.config.js`). No `.eslintrc`.
- **Vite `base: '/'`** — this is a user GitHub Pages repo (username.github.io),
  served at the domain root, not a project sub-path.

## Theme flow

1. Inline `<script>` in `<head>` reads `localStorage.theme` → sets `data-theme`.
2. CSS tokens.css: `:root` = light defaults; `[data-theme=dark]` = dark overrides;
   `@media (prefers-color-scheme: dark) :root:not([data-theme=light])` = no-JS dark.
3. `initTheme(btn)` syncs button state + dispatches `themechange` on every switch.
4. `waves.js` listens to `themechange` to update its cached `waveColor`.

## Customising content

Replace `[BIO]` and `[BIO_SUBTITLE]` in `index.html`.
Update `<meta name="description">` and OG/Twitter description tags to match.
