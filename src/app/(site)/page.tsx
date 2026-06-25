import Link from 'next/link'
import { FeatureCard } from '@/components/labs/FeatureCard'

export default function KaiLabsHome() {
  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '160px 40px 80px',
          overflow: 'hidden',
        }}
      >
        {/* faint oxblood wash */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 70% 50% at 75% 30%, var(--accent-soft) 0%, transparent 60%)',
          }}
        />

        <span
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--accent)', marginBottom: 28, position: 'relative', zIndex: 1,
          }}
        >
          Kai Labs · Computational Biology Ecosystem
        </span>

        <h1
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
            fontWeight: 300, fontSize: 'clamp(64px, 13vw, 184px)', lineHeight: 0.92,
            letterSpacing: '-0.04em', marginBottom: 32, position: 'relative', zIndex: 1,
            animationDelay: '0.1s',
          }}
        >
          Kai<span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Labs</span>
        </h1>

        <p
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 14, color: 'var(--muted)', letterSpacing: '0.04em',
            lineHeight: 1.9, maxWidth: 580, marginBottom: 48,
            position: 'relative', zIndex: 1, animationDelay: '0.2s',
          }}
        >
          A scientific ecosystem for computational biology, genomics, AI, and
          community-driven learning. Research. Learn. Build.
        </p>

        <div
          className="animate-fade-up"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 1, animationDelay: '0.3s' }}
        >
          <Link href="/genomics" className="btn-primary">Explore Kai Genomics</Link>
          <Link href="/exchange" className="btn-ghost">Join Kai Exchange →</Link>
        </div>
      </section>

      {/* ── Ecosystem grid ───────────────────────────────────── */}
      <section style={{ padding: '40px 40px 140px', maxWidth: 1200, margin: '0 auto' }}>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--muted)', marginBottom: 40,
          }}
        >
          The Ecosystem
        </span>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          <FeatureCard
            index="01"
            title="Kai Genomics"
            description="Research and bioinformatics education — workshops, publications, and an interactive decision engine for genomics workflows."
            href="/genomics"
            cta="Enter"
            status="Live"
            delay={0}
          />
          <FeatureCard
            index="02"
            title="Kai Exchange"
            description="A free platform where scientists teach scientists. Host or attend community workshops — no payments, no subscriptions."
            href="/exchange"
            cta="Preview"
            status="Soon"
            delay={0.08}
          />
          <FeatureCard
            index="03"
            title="Research"
            description="Scientific projects, publications, and open questions across genomics, origin-of-life, and natural-product discovery."
            href="/research"
            cta="Explore"
            status="Live"
            delay={0.16}
          />
          <FeatureCard
            index="04"
            title="Tools"
            description="Interactive computational-biology tools — starting with the Kai Decision Engine for end-to-end pipeline guidance."
            href="/tools"
            cta="Open"
            status="Live"
            delay={0.24}
          />
        </div>
      </section>
    </main>
  )
}
