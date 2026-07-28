import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  aboutLede, missionStatement, pillars, principles,
  founderName, founderRole, founderBio,
} from '@/lib/data/about'

export const metadata: Metadata = {
  title: 'About — Kai Labs',
  description:
    'Kai Labs is a scientific ecosystem for computational biology — research, education, and open tools, founded by Kartik Juyal.',
}

export default function AboutPage() {
  return (
    <main style={{ paddingTop: 64 }}>
      {/* ── Hero / lede ──────────────────────────────────────── */}
      <section style={{ padding: '120px 40px 72px', maxWidth: 1000, margin: '0 auto' }}>
        <span
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)',
          }}
        >
          About Kai Labs
        </span>
        <h1
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
            fontWeight: 300, fontSize: 'clamp(40px, 6.5vw, 82px)', lineHeight: 1.02,
            letterSpacing: '-0.03em', margin: '24px 0 28px', maxWidth: 820, animationDelay: '0.1s',
          }}
        >
          {aboutLede}
        </h1>
      </section>

      {/* ── Mission ──────────────────────────────────────────── */}
      <section style={{ padding: '40px 40px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 24,
            }}
          >
            Mission
          </span>
          <p
            style={{
              fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
              fontWeight: 300, fontSize: 'clamp(22px, 3.4vw, 34px)', lineHeight: 1.45,
              letterSpacing: '-0.01em', maxWidth: 860,
            }}
          >
            {missionStatement}
          </p>
        </div>
      </section>

      {/* ── Pillars ──────────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto' }}>
        <span
          style={{
            display: 'block', fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 32,
          }}
        >
          The Ecosystem
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {pillars.map((p) => (
            <Link
              key={p.index}
              href={p.href}
              className="feature-card"
              style={{
                display: 'flex', flexDirection: 'column', gap: 12, padding: '24px 22px',
                border: '1px solid var(--border-color)', borderRadius: 14, background: 'var(--surface)',
                textDecoration: 'none', transition: 'border-color 0.4s, transform 0.4s',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em' }}>
                {p.index}
              </span>
              <h3 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: 23, lineHeight: 1.1 }}>
                {p.name}
              </h3>
              <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.8 }}>
                {p.blurb}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Principles ───────────────────────────────────────── */}
      <section style={{ padding: '40px 40px 80px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span
            style={{
              display: 'block', fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', margin: '40px 0 32px',
            }}
          >
            Principles
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40 }}>
            {principles.map((pr, i) => (
              <div key={pr.title}>
                <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: 24, margin: '10px 0 12px' }}>
                  {pr.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12, color: 'var(--muted)', lineHeight: 1.85 }}>
                  {pr.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder ──────────────────────────────────────────── */}
      <section style={{ padding: '90px 40px 130px', maxWidth: 1000, margin: '0 auto' }}>
        <span
          style={{
            display: 'block', fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 36,
          }}
        >
          Founder
        </span>

        <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 40, alignItems: 'start' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
              <Image src="/Kartik.jpg" alt={founderName} fill style={{ objectFit: 'cover' }} />
            </div>
            <span aria-hidden style={{ position: 'absolute', inset: -5, borderRadius: '50%', border: '1px solid var(--accent-soft)', pointerEvents: 'none' }} />
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: 34, lineHeight: 1.1, marginBottom: 6 }}>
              {founderName}
            </h2>
            <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 28 }}>
              {founderRole}
            </p>
            {founderBio.map((para, i) => (
              <p key={i} style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13, lineHeight: 2, color: 'var(--muted)', marginBottom: 18 }}>
                {para}
              </p>
            ))}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
              <Link href="/genomics" className="btn-ghost">Kai Genomics →</Link>
              <Link href="/contact" className="btn-ghost">Get in touch →</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
