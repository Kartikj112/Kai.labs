export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-color)',
        padding: '32px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-sans), Syne, sans-serif',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        KAI<span style={{ color: 'var(--accent)' }}>.</span>GENOMICS
      </div>

      <p
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 11,
          color: 'var(--muted)',
          letterSpacing: '0.08em',
        }}
      >
        © {year} Kai Genomics. All rights reserved.
      </p>

      <p
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 11,
          color: 'var(--muted)',
          letterSpacing: '0.08em',
        }}
      >
        Goa, India — IST
      </p>
    </footer>
  )
}
