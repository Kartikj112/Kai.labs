import Link from 'next/link'
import type { WorkshopCard as WC } from '@/lib/exchange/types'
import { SKILL_LABELS } from '@/lib/exchange/types'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
function fmtTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function WorkshopCard({ w }: { w: WC }) {
  return (
    <Link href={`/exchange/workshops/${w.slug}`} className="kx-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span className="kx-tag" style={{ color: 'var(--accent)', borderColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}>
          {w.category}
        </span>
        <span className="kx-tag">{SKILL_LABELS[w.skill]}</span>
      </div>

      <h3 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: 23, lineHeight: 1.15 }}>
        {w.title}
      </h3>

      <div style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.7 }}>
        {w.hostName}{w.institution ? ` · ${w.institution}` : ''}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--text)', marginTop: 2 }}>
        <span>{fmtDate(w.startsAt)}</span>
        <span style={{ color: 'var(--muted)' }}>{fmtTime(w.startsAt)}</span>
        <span style={{ color: 'var(--muted)' }}>{fmtDuration(w.durationMin)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--accent2)' }}>
          {w.seatsRemaining !== null ? `${w.seatsRemaining} seats left` : `Up to ${w.maxAttendees}`}
        </span>
        <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--text)' }}>View →</span>
      </div>
    </Link>
  )
}
