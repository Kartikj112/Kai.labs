import type { Metadata } from 'next'
import Link from 'next/link'
import { listApprovedWorkshops, isExchangeConfigured } from '@/lib/exchange/db'
import { WorkshopCard } from '@/components/exchange/WorkshopCard'

export const metadata: Metadata = {
  title: 'Kai Exchange — Kai Labs',
  description: 'A free platform where scientists teach scientists. Host or attend community workshops — no payments, no subscriptions.',
}

export const dynamic = 'force-dynamic'

export default async function ExchangePage() {
  const workshops = await listApprovedWorkshops()
  const live = isExchangeConfigured()

  return (
    <main style={{ paddingTop: 64 }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ padding: '120px 40px 56px', maxWidth: 1100, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 80% 20%, var(--accent-soft) 0%, transparent 60%)' }} />
        <span className="animate-fade-up" style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', position: 'relative', zIndex: 1 }}>
          Kai Exchange
        </span>
        <h1 className="animate-fade-up" style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: 'clamp(44px, 8vw, 92px)', lineHeight: 0.98, letterSpacing: '-0.03em', margin: '24px 0 24px', position: 'relative', zIndex: 1, animationDelay: '0.1s' }}>
          Scientists teach
          <br />
          <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>scientists.</em>
        </h1>
        <p className="animate-fade-up" style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 14, color: 'var(--muted)', lineHeight: 1.9, maxWidth: 560, marginBottom: 40, position: 'relative', zIndex: 1, animationDelay: '0.2s' }}>
          A free, community-driven platform. Anyone can host a workshop; anyone can attend.
          No payments, no subscriptions — just open scientific teaching.
        </p>
        <div className="animate-fade-up" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', position: 'relative', zIndex: 1, animationDelay: '0.3s' }}>
          <a href="#workshops" className="btn-primary">Browse workshops</a>
          <Link href="/exchange/host" className="btn-ghost">Host a workshop →</Link>
        </div>
      </section>

      {/* ── Workshop grid ────────────────────────────────────── */}
      <section id="workshops" style={{ padding: '40px 40px 140px', maxWidth: 1100, margin: '0 auto', scrollMarginTop: 80 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
          <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Upcoming Workshops
          </span>
          {!live && (
            <span className="kx-tag kx-tag" style={{ color: 'var(--warn)', borderColor: 'color-mix(in srgb, var(--warn) 40%, transparent)' }}>
              Preview · example sessions
            </span>
          )}
        </div>

        {workshops.length === 0 ? (
          <div className="kx-note kx-note--warn" style={{ maxWidth: 560 }}>
            No approved workshops yet. Be the first to <Link href="/exchange/host" style={{ color: 'var(--accent)' }}>host one</Link>.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 20 }}>
            {workshops.map((w) => <WorkshopCard key={w.slug} w={w} />)}
          </div>
        )}

        {/* Host CTA */}
        <div style={{ marginTop: 64, padding: '36px 32px', border: '1px solid var(--border-color)', borderRadius: 16, background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: 26, marginBottom: 8 }}>
              Have something to teach?
            </h3>
            <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 460 }}>
              Share a method, a tool, or a technique. Submit a session and we&apos;ll review it for the community.
            </p>
          </div>
          <Link href="/exchange/host" className="btn-primary">Host a workshop</Link>
        </div>
      </section>
    </main>
  )
}
