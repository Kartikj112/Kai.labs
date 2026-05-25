import type { Workshop } from '@/lib/types'

interface WorkshopCardProps {
  workshop: Workshop
  revealDelay?: 1 | 2 | 3
  onOpen: (workshop: Workshop) => void
}

export function WorkshopCard({ workshop, revealDelay = 1, onOpen }: WorkshopCardProps) {
  return (
    <div
      className={`workshop-card reveal reveal-delay-${revealDelay}`}
      onClick={() => onOpen(workshop)}
      role="button"
      tabIndex={0}
      aria-label={`Open workshop: ${workshop.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(workshop)
        }
      }}
    >
      {/* Live badge */}
      {workshop.isLive && (
        <span
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            display: 'inline-flex',
            alignItems: 'center',
            borderRadius: 999,
            background: '#ff6a2a',
            color: '#fff',
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '5px 10px',
            boxShadow: '0 10px 24px rgba(255,106,42,.25)',
            zIndex: 2,
          }}
        >
          LIVE
        </span>
      )}

      {/* Card number */}
      <p
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'var(--muted)',
          marginBottom: 32,
        }}
      >
        {workshop.number}
      </p>

      {/* Title */}
      <h3
        style={{
          fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
          fontSize: 24,
          fontWeight: 400,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          marginBottom: 16,
        }}
      >
        {workshop.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 12,
          lineHeight: 1.9,
          color: 'var(--muted)',
          marginBottom: 48,
        }}
      >
        {workshop.description}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {workshop.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
