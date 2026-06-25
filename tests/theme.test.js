import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resolveTheme, persistTheme, toggleTheme } from '../src/theme/theme.js'

// Stub localStorage for the Node environment
const makeStorage = () => {
  const store = {}
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
  }
}

beforeEach(() => {
  const storage = makeStorage()
  vi.stubGlobal('localStorage', storage)
})

describe('resolveTheme', () => {
  it('returns "light" when no stored value and system is light', () => {
    expect(resolveTheme(null, false)).toBe('light')
  })

  it('returns "dark" when no stored value and system is dark', () => {
    expect(resolveTheme(null, true)).toBe('dark')
  })

  it('returns stored "dark" even when system is light', () => {
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('returns stored "light" even when system is dark', () => {
    expect(resolveTheme('light', true)).toBe('light')
  })

  it('ignores unknown stored values and falls back to system', () => {
    expect(resolveTheme('invalid', true)).toBe('dark')
    expect(resolveTheme('invalid', false)).toBe('light')
  })

  it('ignores empty string and falls back to system', () => {
    expect(resolveTheme('', false)).toBe('light')
  })
})

describe('toggleTheme', () => {
  it('toggles light → dark', () => {
    expect(toggleTheme('light')).toBe('dark')
  })

  it('toggles dark → light', () => {
    expect(toggleTheme('dark')).toBe('light')
  })
})

describe('persistTheme', () => {
  it('writes the theme to localStorage', () => {
    persistTheme('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('overwrites a previous value', () => {
    persistTheme('dark')
    persistTheme('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('persists "light"', () => {
    persistTheme('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })
})
