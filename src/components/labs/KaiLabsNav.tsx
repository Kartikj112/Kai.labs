'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const LINKS: [string, string][] = [
  ['/', 'Home'],
  ['/genomics', 'Kai Genomics'],
  ['/exchange', 'Kai Exchange'],
  ['/research', 'Research'],
  ['/tools', 'Tools'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
]

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href + '/')
}

export function KaiLabsNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname() || '/'

  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  // Close the menu whenever the route changes.
  useEffect(() => { setMenuOpen(false) }, [pathname])

  return (
    <>
      <nav
        aria-label="Main navigation"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
          display: 'flex', justifyContent: 'center',
          padding: '20px 24px',
          pointerEvents: 'none',
        }}
      >
        <div
          className="neo-glass neo-elevated neo-pill"
          style={{
            pointerEvents: 'auto',
            width: '100%', maxWidth: 1240,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            gap: 20,
            padding: '14px 24px 14px 28px',
            border: '1px solid var(--border-color)',
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="nav-logo"
            style={{
              fontFamily: 'var(--font-sans), Syne, sans-serif',
              fontWeight: 700, fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'var(--text)', textDecoration: 'none', position: 'relative', zIndex: 1,
            }}
          >
            KAI<span style={{ color: 'var(--accent)' }}>.</span>LABS
          </Link>

          {/* Desktop links */}
          <ul
            className="nav-main-links"
            style={{ display: 'flex', gap: 28, listStyle: 'none', position: 'relative', zIndex: 1 }}
          >
            {LINKS.map(([href, label]) => {
              const active = isActive(pathname, href)
              return (
                <li key={href}>
                  <Link
                    href={href}
                    style={{
                      fontFamily: 'var(--font-mono), DM Mono, monospace',
                      fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: active ? 'var(--accent)' : 'var(--muted)',
                      textDecoration: 'none', transition: 'color 0.3s',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = 'var(--text)' }}
                    onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = active ? 'var(--accent)' : 'var(--muted)' }}
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ThemeToggle />

            {/* Hamburger (≤900px) */}
            <button
              className="nav-hamburger"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="hb-lines" aria-hidden><span /><span /><span /></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      <div id="mobile-menu" className={`mobile-menu${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen}>
        {LINKS.map(([href, label], i) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
            style={isActive(pathname, href) ? { color: 'var(--accent)' } : undefined}
          >
            <span className="mm-idx">{String(i + 1).padStart(2, '0')}</span>
            {label}
          </Link>
        ))}
        <div className="mobile-menu-footer">
          <span className="mm-label">Appearance</span>
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}
