'use client'

import Link from 'next/link'

export interface FeatureCardProps {
  index: string
  title: string
  description: string
  href: string
  cta: string
  status?: string
  delay?: number
}

export function FeatureCard({ index, title, description, href, cta, status, delay = 0 }: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="feature-card animate-fade-up"
      style={{
        animationDelay: `${delay}s`,
        display: 'flex', flexDirection: 'column', gap: 14,
        padding: '28px 26px',
        border: '1px solid transparent',
        borderRadius: 'var(--r-lg)',
        textDecoration: 'none',
        background: 'var(--surface)',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em',
          }}
        >
          {index}
        </span>
        {status && (
          <span
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--muted)', background: 'var(--surface-2)',
              boxShadow: '3px 4px 8px var(--shadow-um), -2px -2px 6px var(--shadow-lu)',
              borderRadius: 999, padding: '4px 10px',
            }}
          >
            {status}
          </span>
        )}
      </div>

      <h3
        style={{
          fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
          fontWeight: 400, fontSize: 28, lineHeight: 1.1, color: 'var(--text)',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 12, color: 'var(--muted)', lineHeight: 1.8, flex: 1,
        }}
      >
        {description}
      </p>

      <span
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 11, letterSpacing: '0.1em', color: 'var(--text)', marginTop: 4,
        }}
      >
        {cta} →
      </span>
    </Link>
  )
}
