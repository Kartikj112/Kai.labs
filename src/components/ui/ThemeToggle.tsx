'use client'

import { useTheme } from '@/lib/hooks/useTheme'

interface ThemeToggleProps {
  /** Hide the text label (e.g. on tight nav bars). */
  showLabel?: boolean
}

/**
 * A single, shared theme switch. Reads from the theme context, so every
 * instance on a page reflects the same state.
 */
export function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const { theme, toggle } = useTheme()
  const isLight = theme === 'light'

  return (
    <button
      onClick={toggle}
      aria-pressed={isLight}
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      className="theme-toggle neo-sm"
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--surface)',
        border: 'none',
        borderRadius: 999,
        padding: '8px 12px',
        color: 'var(--muted)',
        fontFamily: 'var(--font-mono), DM Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition:
          'background-color 0.35s ease, color 0.35s ease, box-shadow 0.3s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.color = 'var(--text)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.color = 'var(--muted)'
        el.style.transform = 'translateY(0)'
      }}
    >
      <span
        style={{
          width: 38,
          height: 20,
          borderRadius: 999,
          background: 'var(--surface)',
          boxShadow: 'inset 3px 3px 7px var(--shadow-um), inset -2px -2px 6px var(--shadow-lu)',
          position: 'relative',
          display: 'block',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '2px 3px 6px var(--shadow-um-2), -1px -1px 3px var(--shadow-lu)',
            transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1), background 0.3s ease',
            transform: isLight ? 'translateX(18px)' : 'translateX(0)',
          }}
        />
      </span>
      {showLabel && (
        <span className="theme-toggle-label" style={{ lineHeight: 1 }}>
          {isLight ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  )
}
