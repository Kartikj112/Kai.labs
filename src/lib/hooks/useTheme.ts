'use client'

import { useThemeContext } from '@/providers/ThemeProvider'

/**
 * Thin wrapper over the shared theme context so existing call sites keep
 * working. All toggles read/write one source of truth and stay in sync.
 */
export function useTheme() {
  const { theme, toggle, setTheme } = useThemeContext()
  return { theme, toggle, setTheme, isDark: theme === 'dark' }
}
