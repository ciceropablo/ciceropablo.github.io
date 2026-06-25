const STORAGE_KEY = 'theme'
const ATTR = 'data-theme'
const EVENT = 'themechange'

/** Resolves the active theme from stored preference and system signal.
 *  localStorage value takes precedence over the OS preference. */
export function resolveTheme(stored, systemPrefersDark) {
  if (stored === 'light' || stored === 'dark') return stored
  return systemPrefersDark ? 'dark' : 'light'
}

/** Persists the chosen theme to localStorage. */
export function persistTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme)
}

/** Returns the opposite theme. */
export function toggleTheme(current) {
  return current === 'dark' ? 'light' : 'dark'
}

/** Wires up the toggle button and keeps the <html> attribute in sync.
 *  Dispatches a 'themechange' CustomEvent on document whenever the theme
 *  switches so that other modules (e.g. waves canvas) can react. */
export function initTheme(buttonEl) {
  if (!buttonEl) return

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  function applyTheme(theme, { persist = false } = {}) {
    document.documentElement.setAttribute(ATTR, theme)
    if (persist) persistTheme(theme)
    buttonEl.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false')
    buttonEl.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
    )
    buttonEl.textContent = theme === 'dark' ? 'light' : 'dark'
    document.dispatchEvent(new CustomEvent(EVENT, { detail: { theme } }))
  }

  function currentTheme() {
    return document.documentElement.getAttribute(ATTR) || 'light'
  }

  buttonEl.addEventListener('click', () => {
    applyTheme(toggleTheme(currentTheme()), { persist: true })
  })

  mediaQuery.addEventListener('change', (e) => {
    // Only react to system changes if the user has no explicit stored preference
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      applyTheme(e.matches ? 'dark' : 'light')
    }
  })

  // Sync button state with whatever theme the anti-FOUC script applied
  const initial = resolveTheme(
    localStorage.getItem(STORAGE_KEY),
    mediaQuery.matches,
  )
  applyTheme(initial)
}
