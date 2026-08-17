import type { Metadata } from 'next'
import { getAllArticles, getCategories } from '@/lib/research/articles'
import { ResearchExplorer } from '@/components/research/ResearchExplorer'
import { researchAreas } from '@/lib/data/research'
import { publications } from '@/lib/data/content'

export const metadata: Metadata = {
  title: 'Research — Kai Labs',
  description:
    'Kai Genomics Research Intelligence tracks and interprets emerging developments in genomics, metagenomics, bioinformatics, natural products, antimicrobial peptides, and AI-driven biological discovery.',
}

export default function ResearchPage() {
  const articles = getAllArticles()
  const categories = getCategories(articles)

  return (
    <main style={{ paddingTop: 64 }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ padding: '120px 40px 64px', maxWidth: 1200, margin: '0 auto' }}>
        <span
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)',
          }}
        >
          Research Intelligence
        </span>
        <h1
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
            fontWeight: 300, fontSize: 'clamp(42px, 7vw, 84px)', lineHeight: 1.0,
            letterSpacing: '-0.03em', margin: '24px 0 24px', animationDelay: '0.1s',
          }}
        >
          Kai Genomics
          <br />
          <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Research Intelligence.</em>
        </h1>
        <p
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 14, color: 'var(--muted)', lineHeight: 1.9, maxWidth: 640, animationDelay: '0.2s',
          }}
        >
          We track and interpret emerging research across genomics, metagenomics, bioinformatics,
          natural products, antimicrobial peptides, protein design, and AI-driven biological
          discovery — summarised for researchers, collaborators, and the curious.
        </p>
      </section>

      {/* ── Featured + grid + filters ───────────────────────────── */}
      <section style={{ padding: '24px 40px 100px', maxWidth: 1200, margin: '0 auto' }}>
        <ResearchExplorer articles={articles} categories={categories} />
      </section>

      {/* ── Lab focus areas (existing content, preserved) ──────── */}
      <section style={{ padding: '24px 40px 80px', maxWidth: 1100, margin: '0 auto', borderTop: '1px solid var(--border-color)' }}>
        <span
          style={{
            display: 'block', fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: 'var(--muted)', margin: '56px 0 32px',
          }}
        >
          From the Lab — Focus Areas
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {researchAreas.map((area) => (
            <article
              key={area.id}
              style={{
                display: 'flex', flexDirection: 'column', gap: 14,
                padding: '28px 26px', border: '1px solid var(--border-color)',
                borderRadius: 14, background: 'var(--surface)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.16em' }}>
                {area.index}
              </span>
              <h2 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: 26, lineHeight: 1.12 }}>
                {area.title}
              </h2>
              <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12, color: 'var(--muted)', lineHeight: 1.85, flex: 1 }}>
                {area.summary}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {area.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10,
                      letterSpacing: '0.06em', color: 'var(--muted)',
                      border: '1px solid var(--border-color)', borderRadius: 999, padding: '4px 10px',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Publications (existing content, preserved) ──────────── */}
      <section style={{ padding: '40px 40px 140px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span
            style={{
              display: 'block', fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: 'var(--muted)', marginBottom: 32,
            }}
          >
            Selected Publications
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border-color)' }}>
            {publications.map((pub) => (
              <a key={pub.href} href={pub.href} target="_blank" rel="noopener noreferrer" className="pub-item">
                <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                  {pub.year}
                </span>
                <span style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontSize: 19, fontWeight: 400, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {pub.title}
                </span>
                <span className="pub-arrow">↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
