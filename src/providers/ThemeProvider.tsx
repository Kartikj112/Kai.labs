'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Theme } from '@/lib/types'

const STORAGE_KEY = 'kai-theme'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialTheme(): Theme {
  if (typeof document !== 'undefined') {
    // The inline <head> script has already resolved + applied the theme
    // before paint, so the DOM attribute is the source of truth on mount.
    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'light' || attr === 'dark') return attr
  }
  return 'dark'
}

/**
 * Single source of truth for the active theme. The inline script in
 * layout.tsx sets data-theme before first paint (no flash); this provider
 * keeps React state in sync and lets every toggle on the page share it.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  // Sync React state to whatever the pre-paint script applied.
  useEffect(() => {
    setThemeState(readInitialTheme())
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* noop */ }
  }, [])

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      try { localStorage.setItem(STORAGE_KEY, next) } catch { /* noop */ }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    // Safe fallback if used outside the provider (shouldn't happen).
    return { theme: 'dark', toggle: () => {}, setTheme: () => {} }
  }
  return ctx
}
