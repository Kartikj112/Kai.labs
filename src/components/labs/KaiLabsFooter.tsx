import Link from 'next/link'

const ECOSYSTEM: [string, string][] = [
  ['/genomics', 'Kai Genomics'],
  ['/exchange', 'Kai Exchange'],
  ['/research', 'Research'],
  ['/tools', 'Tools'],
]

export function KaiLabsFooter() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', padding: '48px 40px 36px' }}>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          flexWrap: 'wrap', gap: 28, maxWidth: 1200, margin: '0 auto',
        }}
      >
        <div style={{ maxWidth: 320 }}>
          <div
            style={{
              fontFamily: 'var(--font-sans), Syne, sans-serif',
              fontWeight: 700, fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            KAI<span style={{ color: 'var(--accent)' }}>.</span>LABS
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 11, color: 'var(--muted)', letterSpacing: '0.04em', lineHeight: 1.8,
            }}
          >
            A scientific ecosystem for computational biology, genomics, AI, and
            community-driven learning.
          </p>
        </div>

        <nav aria-label="Ecosystem" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)',
              marginBottom: 4,
            }}
          >
            Ecosystem
          </span>
          {ECOSYSTEM.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: 'var(--font-mono), DM Mono, monospace',
                fontSize: 12, color: 'var(--text)', textDecoration: 'none', letterSpacing: '0.04em',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, maxWidth: 1200, margin: '36px auto 0',
          paddingTop: 24, borderTop: '1px solid var(--border-color)',
        }}
      >
        <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em' }}>
          © {year} Kai Labs. All rights reserved.
        </p>
        <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em' }}>
          Goa, India — IST
        </p>
      </div>
    </footer>
  )
}
