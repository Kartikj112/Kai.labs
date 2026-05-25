import { SectionLabel } from '@/components/ui/SectionLabel'
import { ApplicationForm } from './ApplicationForm'

const benefits = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Design Your Own Curriculum',
    desc: 'Choose topics you\'re passionate about and build workshops that showcase your unique expertise.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
    ),
    title: 'Flexible Scheduling',
    desc: 'Set your own availability and deliver sessions remotely or in-person based on your preferences.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
      </svg>
    ),
    title: 'Earn While Teaching',
    desc: 'Receive competitive compensation for each workshop delivered, with transparent revenue sharing.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Platform & Support',
    desc: 'We handle marketing, registration, logistics, and administrative tasks so you can focus on teaching.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Build Your Reputation',
    desc: 'Get visibility in the genomics community and establish yourself as an expert in your field.',
  },
]

export function LecturerApplication() {
  return (
    <section
      id="lecturer-application"
      style={{ background: 'var(--surface)', padding: '100px 40px', position: 'relative' }}
    >
      <SectionLabel>Join Our Team</SectionLabel>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 80,
        maxWidth: 1200,
        margin: '0 auto',
        alignItems: 'start',
      }}
        className="lecturer-split-grid"
      >
        {/* Left: info (sticky) */}
        <div style={{ position: 'sticky', top: 120 }} className="lecturer-info-sticky">
          <h2
            className="reveal reveal-delay-1"
            style={{
              fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(36px, 6vw, 68px)',
              fontWeight: 300, lineHeight: 1.05,
              letterSpacing: '-0.02em', marginBottom: 32,
            }}
          >
            Become a{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Satellite Lecturer</em>
          </h2>

          <p className="reveal reveal-delay-2" style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 13, lineHeight: 2, color: 'var(--muted)', marginBottom: 20,
          }}>
            Kai Genomics is building a network of independent instructors who design and deliver specialized workshops under our brand. As a Satellite Lecturer, you'll have the platform, infrastructure, and audience to share your expertise while earning compensation for your knowledge.
          </p>

          <p className="reveal reveal-delay-3" style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 13, lineHeight: 2, color: 'var(--muted)', marginBottom: 40,
          }}>
            We're looking for passionate researchers, bioinformaticians, and domain experts who want to contribute to the next generation of genomics education — whether you're a graduate student, postdoc, or early-career professional with specialized skills to share.
          </p>

          {/* Benefits list */}
          <div
            className="reveal reveal-delay-4"
            style={{
              display: 'flex', flexDirection: 'column',
              gap: 1, background: 'var(--border-color)', marginBottom: 32,
            }}
          >
            {benefits.map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: 'var(--surface)',
                padding: '24px 28px',
                display: 'flex', alignItems: 'flex-start', gap: 20,
              }}>
                <span style={{ width: 20, height: 20, flexShrink: 0, marginTop: 2, color: 'var(--accent)', display: 'flex' }}>
                  {icon}
                </span>
                <p style={{
                  fontFamily: 'var(--font-mono), DM Mono, monospace',
                  fontSize: 12, lineHeight: 1.8, color: 'var(--text)',
                }}>
                  <strong style={{ fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.05em' }}>
                    {title}
                  </strong>
                  <br />
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: form */}
        <div
          className="reveal reveal-delay-5"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border-color)',
            padding: '48px 40px',
          }}
        >
          <div style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 10, letterSpacing: '0.25em',
            textTransform: 'uppercase', color: 'var(--accent)',
            marginBottom: 32, display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ width: 20, height: 1, background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
            Application Form
          </div>

          <ApplicationForm />
        </div>
      </div>
    </section>
  )
}
