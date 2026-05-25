'use client'

import { useEffect } from 'react'

/**
 * Runs once on client mount to apply the saved / OS-preferred theme
 * before React hydration, preventing a flash of wrong theme.
 * The actual inline <script> in layout.tsx handles the very first paint;
 * this component keeps it in sync after client-side navigation.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kai-theme')
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
      const theme = saved || (prefersLight ? 'light' : 'dark')
      document.documentElement.setAttribute('data-theme', theme)
    } catch { /* noop */ }
  }, [])

  return <>{children}</>
}
