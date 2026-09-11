import type { Metadata } from 'next'
import Link from 'next/link'
import { HostForm } from '@/components/exchange/HostForm'

export const metadata: Metadata = {
  title: 'Host a Workshop — Kai Exchange',
  description: 'Offer a free community workshop on Kai Exchange. Submit your session for review.',
}

export default function HostPage() {
  return (
    <main style={{ paddingTop: 64, minHeight: '100vh' }}>
      <section style={{ padding: '120px 40px 120px', maxWidth: 720, margin: '0 auto' }}>
        <Link href="/exchange" style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, letterSpacing: '0.1em', color: 'var(--muted)', textDecoration: 'none' }}>
          ← Kai Exchange
        </Link>

        <h1 className="animate-fade-up" style={{ fontFamily: 'var(--font-pixel-display), ui-monospace, monospace', fontWeight: 500, fontSize: 'clamp(38px, 6.5vw, 71px)', lineHeight: 1.04, letterSpacing: 0, margin: '20px 0 16px' }}>
          Host a <em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>workshop</em>.
        </h1>
        <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13, color: 'var(--muted)', lineHeight: 1.85, maxWidth: 540, marginBottom: 40 }}>
          Tell us about your session. Submissions are reviewed before they appear on the
          Exchange — this keeps quality high for the community.
        </p>

        <HostForm />
      </section>
    </main>
  )
}
