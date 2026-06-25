'use client'

import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { Workshop } from '@/lib/types'

interface NavProps {
  activeDetail: Workshop | null
  onBack: () => void
}

const LINKS: [string, string][] = [
  ['#workshops', 'Workshops'],
  ['#about', 'About'],
  ['#publications', 'Research'],
  ['/engine', 'Decision Engine'],
  ['#lecturer-application', 'Become a Lecturer'],
  ['#contact', 'Contact'],
]

export function Nav({ activeDetail, onBack }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Lock scroll while the mobile menu is open.
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [menuOpen])

  // Close on Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <>
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

        {/* Theme toggle (shared, single source of truth) */}
        <ThemeToggle />

        {/* Desktop links — hidden when a detail page is open */}
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
            {LINKS.map(([href, label]) => (
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
                  onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = 'var(--text)' }}
                  onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = 'var(--muted)' }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Back button — shown when a workshop detail is open */}
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
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
          >
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
              <path d="M5 1L1 5L5 9M1 5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            All Workshops
          </button>
        )}

        {/* Hamburger — only visible ≤900px (CSS controlled) */}
        {!activeDetail && (
          <button
            className="nav-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="hb-lines" aria-hidden>
              <span /><span /><span />
            </span>
          </button>
        )}
      </nav>

      {/* Mobile slide-down menu */}
      <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        {LINKS.map(([href, label], i) => (
          <a
            key={href}
            href={href}
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="mm-idx">{String(i + 1).padStart(2, '0')}</span>
            {label}
          </a>
        ))}
        <div className="mobile-menu-footer">
          <span className="mm-label">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}
