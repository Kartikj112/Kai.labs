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
      className="theme-toggle"
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 999,
        padding: '8px 12px',
        color: 'var(--muted)',
        fontFamily: 'var(--font-mono), DM Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition:
          'background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.color = 'var(--text)'
        el.style.borderColor = 'var(--accent)'
        el.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.color = 'var(--muted)'
        el.style.borderColor = 'var(--border-color)'
        el.style.transform = 'translateY(0)'
      }}
    >
      <span
        style={{
          width: 38,
          height: 20,
          borderRadius: 999,
          background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
          border: '1px solid var(--border-color)',
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
            boxShadow: '0 4px 14px rgba(0,0,0,.18)',
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
