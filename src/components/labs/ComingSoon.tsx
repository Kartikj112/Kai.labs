import Link from 'next/link'

interface ComingSoonProps {
  eyebrow: string
  title: string
  description: string
  bullets?: string[]
}

export function ComingSoon({ eyebrow, title, description, bullets }: ComingSoonProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '160px 40px 120px', maxWidth: 860, margin: '0 auto',
      }}
    >
      <span
        className="animate-fade-up"
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)',
          marginBottom: 24,
        }}
      >
        {eyebrow}
      </span>

      <h1
        className="animate-fade-up"
        style={{
          fontFamily: 'var(--font-pixel-display), ui-monospace, monospace',
          fontWeight: 500, fontSize: 'clamp(48px, 9.7vw, 112px)', lineHeight: 1.04,
          letterSpacing: 0, marginBottom: 28, animationDelay: '0.1s',
        }}
      >
        {title}
      </h1>

      <p
        className="animate-fade-up"
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 14, color: 'var(--muted)', lineHeight: 1.9, maxWidth: 560,
          marginBottom: 40, animationDelay: '0.2s',
        }}
      >
        {description}
      </p>

      {bullets && bullets.length > 0 && (
        <ul
          className="animate-fade-up"
          style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 48, animationDelay: '0.3s' }}
        >
          {bullets.map((b) => (
            <li
              key={b}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12,
                color: 'var(--text)', lineHeight: 1.7,
              }}
            >
              <span aria-hidden style={{ color: 'var(--accent)', marginTop: 2 }}>—</span>
              {b}
            </li>
          ))}
        </ul>
      )}

      <div className="animate-fade-up" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', animationDelay: '0.4s' }}>
        <Link href="/" className="btn-ghost">← Back to Kai Labs</Link>
        <Link href="/genomics" className="btn-ghost">Explore Kai Genomics →</Link>
      </div>
    </main>
  )
}
