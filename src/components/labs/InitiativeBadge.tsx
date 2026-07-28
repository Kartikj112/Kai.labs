import Link from 'next/link'

/**
 * Small lockup shown on sub-brand pages (e.g. Kai Genomics) to anchor them
 * inside the Kai Labs parent brand.
 */
export function InitiativeBadge({ href = '/' }: { href?: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        border: 'none',
        borderRadius: 999,
        textDecoration: 'none',
        fontFamily: 'var(--font-mono), DM Mono, monospace',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        background: 'var(--accent-soft)',
        boxShadow: '4px 5px 10px var(--shadow-um), -3px -3px 8px var(--shadow-lu)',
        transition: 'color 0.3s, box-shadow 0.3s, transform 0.3s',
      }}
      className="initiative-badge"
    >
      <span
        aria-hidden
        style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--accent)' }}
      />
      A Kai Labs Initiative
    </Link>
  )
}
