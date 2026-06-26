import { waveDefaults } from '../background/waves.js'

const SLIDERS = [
  { key: 'numLines',    label: 'Lines',                 min: 5,      max: 60,      step: 1,      fmt: v => String(Math.round(v)) },
  { key: 'bandSpacing', label: 'Spacing (px)',           min: 2,      max: 20,      step: 1,      fmt: v => String(Math.round(v)) },
  { key: 'amplitude',   label: 'Amplitude (px)',         min: 0,      max: 40,      step: 1,      fmt: v => String(Math.round(v)) },
  { key: 'baseFreq',    label: 'Frequency',              min: 0.001,  max: 0.02,    step: 0.001,  fmt: v => v.toFixed(3) },
  { key: 'baseSpeed',   label: 'Speed',                  min: 0.05,   max: 1.5,     step: 0.05,   fmt: v => v.toFixed(2) },
  { key: 'variance',    label: 'Variance',               min: 0,      max: 3,       step: 0.1,    fmt: v => v.toFixed(1) },
  { key: 'force',       label: 'Magnetic force',         min: 10000,  max: 2000000, step: 10000,  fmt: v => Math.round(v / 1000) + 'k' },
  { key: 'falloff',     label: 'Field focus',            min: 50,     max: 5000,    step: 50,     fmt: v => String(Math.round(v)) },
  { key: 'maxDisp',     label: 'Max displacement (px)',  min: 0,      max: 500,     step: 10,     fmt: v => String(Math.round(v)) },
  { key: 'edgeSpread',  label: 'Edge spread',            min: 0,      max: 20,      step: 0.5,    fmt: v => v.toFixed(1) },
]

export function initControls(cfg) {
  // ── Toggle button ───────────────────────────────────────────────────────
  const toggleBtn = document.createElement('button')
  toggleBtn.id = 'controls-toggle'
  toggleBtn.type = 'button'
  toggleBtn.textContent = 'controls'
  toggleBtn.setAttribute('aria-expanded', 'false')
  toggleBtn.setAttribute('aria-controls', 'controls-panel')
  document.body.appendChild(toggleBtn)

  // ── Panel ───────────────────────────────────────────────────────────────
  const panel = document.createElement('div')
  panel.id = 'controls-panel'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'Wave controls')
  panel.hidden = true

  // Header
  const header = document.createElement('div')
  header.className = 'controls-header'

  const title = document.createElement('span')
  title.className = 'controls-title'
  title.textContent = 'Wave controls'

  const closeBtn = document.createElement('button')
  closeBtn.type = 'button'
  closeBtn.className = 'controls-close'
  closeBtn.setAttribute('aria-label', 'Close wave controls')
  closeBtn.textContent = '×'

  header.appendChild(title)
  header.appendChild(closeBtn)
  panel.appendChild(header)

  // Sliders
  const inputs = {}
  for (const { key, label, min, max, step, fmt } of SLIDERS) {
    const row = document.createElement('div')
    row.className = 'controls-row'

    const id = `ctrl-${key}`

    const lbl = document.createElement('label')
    lbl.htmlFor = id
    lbl.textContent = label

    const input = document.createElement('input')
    input.type = 'range'
    input.id = id
    input.min = min
    input.max = max
    input.step = step
    input.value = cfg[key]

    const output = document.createElement('output')
    output.setAttribute('for', id)
    output.textContent = fmt(cfg[key])

    input.addEventListener('input', () => {
      cfg[key] = Number(input.value)
      output.textContent = fmt(cfg[key])
    })

    inputs[key] = { input, output, fmt }
    row.appendChild(lbl)
    row.appendChild(input)
    row.appendChild(output)
    panel.appendChild(row)
  }

  // Reset button
  const resetBtn = document.createElement('button')
  resetBtn.type = 'button'
  resetBtn.className = 'controls-reset'
  resetBtn.textContent = 'Reset'
  resetBtn.addEventListener('click', () => {
    Object.assign(cfg, waveDefaults)
    for (const { key, fmt } of SLIDERS) {
      inputs[key].input.value = cfg[key]
      inputs[key].output.textContent = fmt(cfg[key])
    }
  })
  panel.appendChild(resetBtn)

  document.body.appendChild(panel)

  // ── Toggle logic ────────────────────────────────────────────────────────
  let isOpen = false

  function open() {
    isOpen = true
    panel.hidden = false
    toggleBtn.setAttribute('aria-expanded', 'true')
    panel.querySelector('input[type="range"]')?.focus()
  }

  function close() {
    isOpen = false
    panel.hidden = true
    toggleBtn.setAttribute('aria-expanded', 'false')
    toggleBtn.focus()
  }

  function toggle() {
    isOpen ? close() : open()
  }

  toggleBtn.addEventListener('click', toggle)
  closeBtn.addEventListener('click', close)

  document.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName
    if ((e.key === 'r' || e.key === 'R') && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      e.preventDefault()
      toggle()
    } else if (e.key === 'Escape' && isOpen) {
      close()
    }
  })
}
