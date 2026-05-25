import Image from 'next/image'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { aboutStats } from '@/lib/data/content'

export function About() {
  return (
    <section
      id="about"
      style={{
        padding: '100px 40px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80,
        alignItems: 'start',
        position: 'relative',
      }}
      className="about-grid"
    >
      {/* ── Left: bio ── */}
      <div>
        {/* Instructor photo */}
        <div
          className="reveal"
          style={{ marginBottom: 40, position: 'relative', display: 'inline-block' }}
        >
          <div
            style={{
              width: 100, height: 100, borderRadius: '50%',
              overflow: 'hidden', border: '1px solid var(--border-color)',
              position: 'relative',
            }}
          >
            {/* Fallback avatar if image not present */}
            <Image src="/Kartik.jpg" alt="Kartik Juyal" fill style={{ objectFit: 'cover' }} />
          </div>
          {/* Accent ring */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: -5,
              borderRadius: '50%',
              border: '1px solid rgba(184,245,200,.18)',
              pointerEvents: 'none',
              display: 'block',
            }}
          />
        </div>

        <SectionLabel>Instructor</SectionLabel>

        <h2
          className="reveal reveal-delay-1"
          style={{
            fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
            fontSize: 'clamp(32px, 5vw, 64px)',
            fontWeight: 300, lineHeight: 1.05,
            letterSpacing: '-0.02em', marginBottom: 32,
          }}
        >
          Science from the
          <br />
          ocean floor to
          <br />
          the{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>algorithm.</em>
        </h2>

        {[
          'Kartik is a computational biologist and bioinformatics researcher based in Goa, India. Currently a Project Associate II and PhD candidate at the CSIR–National Institute of Oceanography, he leads research on marine sponge-associated microbial communities for drug discovery.',
          'A self-taught computational biologist, Kartik bridges wet-lab microbiology with data-driven genomic analysis. His work spans genome mining, metagenomics, and the identification of novel antimicrobial compounds — with published results in peer-reviewed journals.',
          'As an independent consultant, he supports small colleges and research laboratories with NGS data analysis, reproducible workflows, and student mentorship.',
        ].map((bio, i) => (
          <p
            key={i}
            className={`reveal reveal-delay-${i + 2}`}
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 13, lineHeight: 2,
              color: 'var(--muted)', marginBottom: 20,
            }}
          >
            {bio}
          </p>
        ))}
      </div>

      {/* ── Right: stats ── */}
      <div style={{ paddingTop: 60 }}>
        {aboutStats.map((stat, i) => (
          <div
            key={stat.label}
            className={`reveal${i > 0 ? ` reveal-delay-${i}` : ''}`}
            style={{
              borderTop: '1px solid var(--border-color)',
              padding: '24px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              ...(i === aboutStats.length - 1 ? { borderBottom: '1px solid var(--border-color)' } : {}),
            }}
          >
            <span style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--muted)',
            }}>
              {stat.label}
            </span>
            <div style={{ textAlign: stat.align === 'right' ? 'right' : undefined }}>
              <span style={{
                fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
                fontSize: stat.smallValue ? (stat.value.includes('\n') ? 14.7 : 18.9) : 32,
                fontWeight: 300,
                letterSpacing: stat.smallValue ? 0 : '-0.02em',
                lineHeight: stat.value.includes('\n') ? 1.4 : undefined,
                color: 'var(--accent)',
                whiteSpace: 'pre-line',
              }}>
                {stat.value}
              </span>
              {stat.unit && (
                <span style={{
                  fontFamily: 'var(--font-mono), DM Mono, monospace',
                  fontSize: 11, color: 'var(--muted)', marginLeft: 8,
                }}>
                  {stat.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
