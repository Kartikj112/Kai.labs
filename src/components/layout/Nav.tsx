'use client'

import Link from 'next/link'
import { useTheme } from '@/lib/hooks/useTheme'
import type { Workshop } from '@/lib/types'

interface NavProps {
  activeDetail: Workshop | null
  onBack: () => void
}

export function Nav({ activeDetail, onBack }: NavProps) {
  const { theme, toggle } = useTheme()
  const isLight = theme === 'light'

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
      }}
    >
      {/* Gradient fade background */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, var(--nav-fade) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Logo */}
      <a
        href="#"
        className="nav-logo"
        onClick={activeDetail ? onBack : undefined}
        style={{
          fontFamily: 'var(--font-sans), Syne, sans-serif',
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text)',
          textDecoration: 'none',
          position: 'relative',
          zIndex: 1,
          cursor: 'pointer',
        }}
      >
        KAI<span style={{ color: 'var(--accent)' }}>.</span>GENOMICS
      </a>

      {/* Theme Toggle */}
      <button
        onClick={toggle}
        aria-pressed={isLight}
        aria-label="Toggle theme"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(255,255,255,.02)',
          border: '1px solid var(--border-color)',
          borderRadius: 999,
          padding: '8px 12px',
          color: 'var(--muted)',
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'background-color 0.35s ease, color 0.35s ease, border-color 0.35s ease, transform 0.2s ease',
          order: activeDetail ? 3 : undefined,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.color = 'var(--text)'
          el.style.borderColor = 'rgba(184,245,200,.25)'
          el.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
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
            background: 'rgba(184,245,200,.08)',
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
              transition: 'transform 0.3s ease, background 0.3s ease',
              transform: isLight ? 'translateX(18px)' : 'translateX(0)',
            }}
          />
        </span>
        <span className="nav-toggle-label" style={{ lineHeight: 1 }}>
          {isLight ? 'Light' : 'Dark'}
        </span>
      </button>

      {/* Main nav links — hidden when detail is open */}
      {!activeDetail && (
        <ul
          style={{
            display: 'flex',
            gap: 32,
            listStyle: 'none',
            position: 'relative',
            zIndex: 1,
          }}
          className="nav-main-links"
        >
          {[
            ['#workshops', 'Workshops'],
            ['#about', 'About'],
            ['#publications', 'Research'],
            ['/engine', 'Decision Engine'],
            ['#lecturer-application', 'Become a Lecturer'],
            ['#contact', 'Contact'],
          ].map(([href, label]) => (
            <li key={href}>
              <a
                href={href}
                style={{
                  fontFamily: 'var(--font-mono), DM Mono, monospace',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  textDecoration: 'none',
                  transition: 'color 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.target as HTMLAnchorElement).style.color = 'var(--text)' }}
                onMouseLeave={e => { (e.target as HTMLAnchorElement).style.color = 'var(--muted)' }}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      )}

      {/* Back button — shown when detail is open */}
      {activeDetail && (
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1,
            transition: 'color 0.3s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
            <path d="M5 1L1 5L5 9M1 5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          All Workshops
        </button>
      )}
    </nav>
  )
}
