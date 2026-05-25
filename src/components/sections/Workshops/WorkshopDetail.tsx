import type { Workshop } from '@/lib/types'
import { InterestPanel } from './InterestPanel'

interface WorkshopDetailProps {
  workshop: Workshop
}

const CheckIcon = () => (
  <svg className="prereq-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" aria-hidden>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

export function WorkshopDetail({ workshop }: WorkshopDetailProps) {
  return (
    <div id="detail-page" style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Detail Hero ─────────────────────────────────────────────────── */}
      <div
        style={{
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '140px 40px 64px',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {/* Subtle radial bg */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 70% 40%, rgba(184,245,200,.04) 0%, transparent 60%)',
            zIndex: 0,
          }}
        />

        <p style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 11, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--accent)',
          marginBottom: 20, position: 'relative', zIndex: 1,
        }}>
          Workshop {workshop.number}
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(40px, 7vw, 88px)',
          fontWeight: 300, lineHeight: 0.95,
          letterSpacing: '-0.02em', maxWidth: 800,
          position: 'relative', zIndex: 1,
        }}>
          {workshop.title.split(' ').map((word, i) =>
            ['Bioinformatics','Metagenomics','Pangenomics','Sequencing','Genomics','Functional','Amplicon','Bacterial','Introduction','Sanger','Pan-genomics'].includes(word)
              ? <em key={i} style={{ fontStyle: 'italic', color: 'var(--accent)' }}>{word} </em>
              : word + ' '
          )}
        </h1>

        {/* Meta row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 48,
          marginTop: 40, position: 'relative', zIndex: 1,
        }}>
          {[
            { key: 'Level',    val: workshop.level    },
            { key: 'Duration', val: workshop.duration  },
            { key: 'Format',   val: workshop.format    },
          ].map(({ key, val }) => (
            <div key={key}>
              <p style={{
                fontFamily: 'var(--font-mono), DM Mono, monospace',
                fontSize: 10, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
              }}>{key}</p>
              <p style={{
                fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
                fontSize: 22, fontWeight: 400, letterSpacing: '-0.01em',
              }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body: content + sidebar ──────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) 380px',
        gap: 1,
        background: 'var(--border-color)',
      }}
        className="detail-body-grid"
      >
        {/* Left: content */}
        <div style={{ padding: '64px 40px', background: 'var(--bg)' }}>

          {/* Overview */}
          <p className="detail-section-title">Overview</p>
          <p style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 13, lineHeight: 2, color: 'var(--muted)', marginBottom: 56,
          }}>
            {workshop.overview}
          </p>

          {/* Prerequisites */}
          <div style={{ marginBottom: 56 }}>
            <p className="detail-section-title">Prerequisites</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border-color)', marginTop: 20 }}>
              {workshop.prerequisites.map((p, i) => (
                <div key={i} style={{
                  background: 'var(--bg)', padding: '20px 24px',
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                }}>
                  <CheckIcon />
                  <p style={{
                    fontFamily: 'var(--font-mono), DM Mono, monospace',
                    fontSize: 12, lineHeight: 1.8, color: 'var(--muted)',
                  }}>{p.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Modules */}
          <p className="detail-section-title">Curriculum</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border-color)', marginBottom: 56 }}>
            {workshop.modules.map((m) => (
              <div
                key={m.num}
                style={{
                  background: 'var(--bg)', padding: '24px 28px',
                  display: 'flex', gap: 20, alignItems: 'flex-start',
                  transition: 'background 0.3s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--hover)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)' }}
              >
                <span style={{
                  fontFamily: 'var(--font-mono), DM Mono, monospace',
                  fontSize: 10, color: 'var(--accent)',
                  letterSpacing: '0.15em', paddingTop: 4, minWidth: 24,
                }}>
                  {m.num}
                </span>
                <div>
                  <p style={{
                    fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
                    fontSize: 18, fontWeight: 400, marginBottom: 8, letterSpacing: '-0.01em',
                  }}>{m.name}</p>
                  <p style={{
                    fontFamily: 'var(--font-mono), DM Mono, monospace',
                    fontSize: 12, color: 'var(--muted)', lineHeight: 1.8,
                  }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tools */}
          <p className="detail-section-title">Tools &amp; Software</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {workshop.tools.map((tool) => (
              <span key={tool} className="tool-chip">{tool}</span>
            ))}
          </div>
        </div>

        {/* Right: sticky sidebar */}
        <div style={{
          background: 'var(--surface)',
          padding: '48px 36px',
          position: 'sticky',
          top: 88,
          alignSelf: 'start',
        }}>
          {/* Register label */}
          <p style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 10, letterSpacing: '0.25em',
            textTransform: 'uppercase', color: 'var(--accent)',
            marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ width: 16, height: 1, background: 'var(--accent)', flexShrink: 0, display: 'inline-block' }} />
            Register
          </p>

          <InterestPanel workshopId={workshop.id} />

          {/* Registration placeholder */}
          <div style={{
            border: '1px dashed rgba(184,245,200,.2)',
            background: 'rgba(184,245,200,.02)',
            padding: '40px 28px',
            textAlign: 'center',
            marginBottom: 20,
            marginTop: 32,
          }}>
            <p style={{ fontSize: 28, marginBottom: 14, opacity: 0.4 }}>🧬</p>
            <p style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 11, letterSpacing: '0.06em',
              color: 'var(--muted)', lineHeight: 1.9,
            }}>
              <strong style={{ display: 'block', color: 'var(--accent)', fontSize: 12, letterSpacing: '0.1em', marginBottom: 10 }}>
                Registration Coming Soon
              </strong>
              Use code{' '}
              <code style={{ color: 'var(--accent)', background: 'rgba(184,245,200,.08)', padding: '2px 6px' }}>
                EARLYBIRD
              </code>{' '}
              for 20% off your first workshop.
            </p>
          </div>

          <p style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 10, color: 'var(--muted)',
            lineHeight: 1.8, letterSpacing: '0.04em',
          }}>
            All workshops include lifetime access to materials, a private Slack channel, and a certificate of completion.
          </p>
        </div>
      </div>
    </div>
  )
}
