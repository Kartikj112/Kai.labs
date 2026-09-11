import { workshops } from '@/lib/data/workshops'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { WorkshopCard } from './WorkshopCard'
import type { Workshop } from '@/lib/types'

interface WorkshopsProps {
  onOpenWorkshop: (workshop: Workshop) => void
}

export function Workshops({ onOpenWorkshop }: WorkshopsProps) {
  return (
    <section
      id="workshops"
      style={{
        padding: '100px 40px',
        background: 'var(--surface)',
        position: 'relative',
      }}
    >
      <SectionLabel>Curriculum</SectionLabel>

      <h2
        className="reveal reveal-delay-1"
        style={{
          fontFamily: 'var(--font-pixel-display), ui-monospace, monospace',
          fontSize: 'clamp(36px, 6.5vw, 78px)',
          fontWeight: 500,
          lineHeight: 1.05,
          letterSpacing: 0,
          maxWidth: 700,
          marginBottom: 64,
        }}
      >
        Hands-on training
        <br />
        for the{' '}
        <em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>next generation</em>
        <br />
        of microbial researchers.
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 1,
          background: 'var(--border-color)',
          border: '1px solid var(--border-color)',
        }}
      >
        {workshops.map((workshop, i) => (
          <WorkshopCard
            key={workshop.id}
            workshop={workshop}
            revealDelay={((i % 3) + 1) as 1 | 2 | 3}
            onOpen={onOpenWorkshop}
          />
        ))}
      </div>
    </section>
  )
}
