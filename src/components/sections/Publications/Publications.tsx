import { publications, satelliteInstructors } from '@/lib/data/content'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SatelliteCard } from '@/components/sections/Instructors/SatelliteCard'

export function Publications() {
  return (
    <section
      id="publications"
      style={{ padding: '100px 40px', background: 'var(--surface)', position: 'relative' }}
    >
      <SectionLabel>Research</SectionLabel>

      <h2
        className="reveal reveal-delay-1"
        style={{
          fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(32px, 5vw, 64px)',
          fontWeight: 300, letterSpacing: '-0.02em',
          lineHeight: 1.05, marginBottom: 56, maxWidth: 600,
        }}
      >
        Published work in
        <br />
        <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>microbial genomics.</em>
      </h2>

      {/* Publication list */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 1,
        background: 'var(--border-color)',
      }}>
        {publications.map((pub, i) => (
          <a
            key={pub.href}
            href={pub.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`pub-item reveal${i > 0 ? ` reveal-delay-${i}` : ''}`}
          >
            <span style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 12, color: 'var(--accent)', letterSpacing: '0.1em',
            }}>
              {pub.year}
            </span>
            <span style={{
              fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
              fontSize: 19, fontWeight: 400, lineHeight: 1.3, letterSpacing: '-0.01em',
            }}>
              {pub.title}
            </span>
            <span className="pub-arrow">↗</span>
          </a>
        ))}
      </div>

      {/* ── Satellite Instructors ── */}
      <div
        className="reveal"
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 10, letterSpacing: '0.25em',
          textTransform: 'uppercase', color: 'var(--accent)',
          margin: '80px 0 40px', display: 'flex', alignItems: 'center', gap: 14,
        }}
      >
        <span style={{ width: 20, height: 1, background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
        Satellite Instructors
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
      }}>
        {satelliteInstructors.map((inst, i) => (
          <SatelliteCard
            key={inst.id}
            instructor={inst}
            revealDelay={((i % 3) + 1) as 1 | 2 | 3}
          />
        ))}
      </div>
    </section>
  )
}
