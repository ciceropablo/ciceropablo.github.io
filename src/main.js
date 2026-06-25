import { initTheme } from './theme/theme.js'
import { initWaves } from './background/waves.js'

initTheme(document.getElementById('theme-toggle'))
initWaves(document.getElementById('bg-canvas'))
