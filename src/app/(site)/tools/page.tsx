import Link from 'next/link'

export const metadata = { title: 'Tools — Kai Labs' }

export default function ToolsPage() {
  return (
    <main style={{ minHeight: '100vh', padding: '160px 40px 120px', maxWidth: 1080, margin: '0 auto' }}>
      <span
        className="animate-fade-up"
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)',
        }}
      >
        Tools
      </span>
      <h1
        className="animate-fade-up"
        style={{
          fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
          fontWeight: 300, fontSize: 'clamp(48px, 9vw, 104px)', lineHeight: 0.98,
          letterSpacing: '-0.03em', margin: '24px 0 20px', animationDelay: '0.1s',
        }}
      >
        Computational <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>tools</em>.
      </h1>
      <p
        className="animate-fade-up"
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 14, color: 'var(--muted)', lineHeight: 1.9, maxWidth: 560, marginBottom: 56,
          animationDelay: '0.2s',
        }}
      >
        Interactive tools for computational biology and genomics. More are on the way.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <Link
          href="/engine"
          className="feature-card animate-fade-up"
          style={{
            animationDelay: '0.3s', display: 'flex', flexDirection: 'column', gap: 14,
            padding: '28px 26px', border: '1px solid var(--border-color)', borderRadius: 14,
            textDecoration: 'none', background: 'var(--surface)',
            transition: 'border-color 0.4s, transform 0.4s',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em' }}>
            01 · Live
          </span>
          <h3 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: 28, lineHeight: 1.1 }}>
            Kai Decision Engine
          </h3>
          <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}>
            Fourteen guided modules spanning sequencing strategy, assembly, MAG recovery,
            differential abundance, genome mining, and more — each ending in a printable workflow.
          </p>
          <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, letterSpacing: '0.1em', color: 'var(--text)', marginTop: 4 }}>
            Open the engine →
          </span>
        </Link>
      </div>
    </main>
  )
}
