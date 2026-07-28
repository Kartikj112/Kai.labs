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
        {/* Instructor photo — a raised neomorphic disc frame nested around
            the photo. Both circles get an explicit, equal width/height and
            are centered with flexbox rather than an absolutely-positioned
            sibling ring, so the frame can never stretch into an ellipse
            regardless of the grid/flex context it sits in. */}
        <div
          className="reveal"
          style={{ marginBottom: 44, display: 'inline-flex' }}
        >
          <div
            className="neo"
            style={{
              width: 148, height: 148, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg)', flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 116, height: 116, borderRadius: '50%',
                overflow: 'hidden', position: 'relative',
                border: '1.5px solid var(--accent-soft)',
                boxShadow: 'inset 0 0 0 1px var(--shadow-um)',
              }}
            >
              <Image src="/Kartik.jpg" alt="Kartik Juyal" fill sizes="116px" style={{ objectFit: 'cover' }} />
            </div>
          </div>
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
      <div style={{ paddingTop: 60, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {aboutStats.map((stat, i) => (
          <div
            key={stat.label}
            className={`neo reveal${i > 0 ? ` reveal-delay-${i}` : ''}`}
            style={{
              padding: '20px 26px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              background: 'var(--surface)',
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
