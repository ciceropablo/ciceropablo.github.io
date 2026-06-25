# ciceropablo.github.io

Personal landing page for Cícero Santos.

## Stack & decisions

| Concern | Choice | Reason |
|---|---|---|
| Build | Vite 5 | Bundle/minify/asset pipeline; no UI framework overhead |
| Font | Inter Variable | Best screen grotesque; single woff2 for all weights; Swiss-style neutral |
| Layout | CSS Grid + golden ratio scale | φ-derived type and spacing scale; `clamp()` fluid sizing |
| Theme | CSS custom properties + `data-theme` | Zero JS for initial theme (anti-FOUC script); system preference fallback |
| Animation | Vanilla canvas | No runtime deps; `requestAnimationFrame` loop; magnetic wave effect |
| Tests | Vitest | Pure-logic unit tests for wave math, theme resolution, throttle |
| CI/CD | GitHub Actions → GitHub Pages | Single workflow: lint → test → build → deploy |

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm run test      # run all tests once (Vitest)
npm run test:watch # Vitest in watch mode
npm run lint      # ESLint
```

## Project structure

```
src/
  background/waves.js   canvas animation + exported pure math
  theme/theme.js        theme resolution, toggle, persistence
  utils/throttle.js     rafThrottle utility
  styles/
    tokens.css          CSS custom properties (colors, type/spacing scale)
    reset.css           minimal reset
    typography.css      @font-face (Inter Variable), type styles
    layout.css          grid, canvas, responsive
    main.css            CSS entry point (@import all)
  main.js               JS entry point
tests/
  waves.test.js         wave math tests
  theme.test.js         theme logic tests
  throttle.test.js      rafThrottle tests
public/
  favicon.ico
  fonts/                (if self-hosting fonts manually)
```

## Customising

### Bio & subtitle
Edit the `[BIO]` and `[BIO_SUBTITLE]` placeholders directly in `index.html`. Also update the `<meta name="description">`, `og:description`, and `twitter:description` tags.

### Font
Change the `@import` in `src/styles/typography.css` to any other `@fontsource-variable/*` package. Update `font-family` references in the same file.

### Colors & theme
All theme tokens live in `src/styles/tokens.css` as CSS custom properties. Edit the `:root` (light) block and the `[data-theme="dark"]` block.

### Wave animation
Tweak the constants at the top of `src/background/waves.js`: `NUM_LINES`, `AMPLITUDE`, `FORCE`, `FALLOFF`, `MAX_DISP`, and the per-line `freq`/`speed` formula.

## Deploy

The GitHub Actions workflow (`.github/workflows/ci.yml`) deploys automatically to GitHub Pages on every push to `master`. Enable Pages in the repository settings and set the source to **GitHub Actions**.

For manual deploy:

```bash
npm run build
# then upload dist/ to any static host
```
