import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWorkshop } from '@/lib/exchange/db'
import { SKILL_LABELS } from '@/lib/exchange/types'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  }) + ' IST'
}
function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const w = await getWorkshop(slug)
  if (!w) return { title: 'Workshop — Kai Exchange' }
  return { title: `${w.title} — Kai Exchange`, description: w.description.slice(0, 155) }
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13, color: 'var(--text)' }}>
        {value}
      </span>
    </div>
  )
}

export default async function WorkshopEventPage({ params }: Props) {
  const { slug } = await params
  const w = await getWorkshop(slug)
  if (!w) notFound()

  const full = w.seatsRemaining !== null && w.seatsRemaining <= 0

  return (
    <main style={{ paddingTop: 64 }}>
      <section style={{ padding: '110px 40px 120px', maxWidth: 880, margin: '0 auto' }}>
        <Link href="/exchange" style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, letterSpacing: '0.1em', color: 'var(--muted)', textDecoration: 'none' }}>
          ← Kai Exchange
        </Link>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '24px 0 18px', flexWrap: 'wrap' }}>
          <span className="kx-tag" style={{ color: 'var(--accent)', borderColor: 'var(--accent-soft)', background: 'var(--accent-soft)' }}>
            {w.category}
          </span>
          <span className="kx-tag" style={{ color: 'var(--muted)' }}>{SKILL_LABELS[w.skill]}</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: 'clamp(34px, 6vw, 62px)', lineHeight: 1.04, letterSpacing: '-0.02em', marginBottom: 18 }}>
          {w.title}
        </h1>
        <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13, color: 'var(--muted)', marginBottom: 40 }}>
          Hosted by {w.hostName}{w.institution ? ` · ${w.institution}` : ''}
        </p>

        {/* Schedule */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 24, padding: '24px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', marginBottom: 40 }}>
          <Meta label="Date" value={fmtDate(w.startsAt)} />
          <Meta label="Time" value={fmtTime(w.startsAt)} />
          <Meta label="Duration" value={fmtDuration(w.durationMin)} />
          <Meta label="Seats" value={w.seatsRemaining === null ? `${w.maxAttendees} max` : full ? 'Full' : `${w.seatsRemaining} of ${w.maxAttendees} left`} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 40 }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
            About this workshop
          </span>
          <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
            {w.description}
          </p>
        </div>

        {/* Host bio */}
        {w.hostBio && (
          <div style={{ marginBottom: 40 }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
              About the host
            </span>
            <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13, color: 'var(--muted)', lineHeight: 1.85 }}>
              {w.hostBio}
            </p>
          </div>
        )}

        {/* Resources */}
        {w.resources.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <span style={{ display: 'block', fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>
              Resources
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {w.resources.map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12.5, color: 'var(--accent)', textDecoration: 'none' }}>
                  {r.label} ↗
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Joining details note */}
        <div className="kx-note kx-note--warn" style={{ marginBottom: 32 }}>
          Joining details are shared with attendees once their application is approved.
        </div>

        {/* Apply CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link href={`/exchange/apply/${w.slug}`} className="btn-primary">
            {full ? 'Join the waitlist' : 'Apply to attend'}
          </Link>
          <Link href="/exchange" className="btn-ghost">← All workshops</Link>
        </div>
      </section>
    </main>
  )
}
