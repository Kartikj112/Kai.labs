const contactLinks = [
  {
    label: 'Email',
    href: 'mailto:kartikjuyal66@gmail.com',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/kartikjuyal',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/>
        <circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/kaigenomics',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/kaigenomics',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
  },
]

export function Contact() {
  return (
    <section
      id="contact"
      style={{
        textAlign: 'center',
        padding: '120px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Watermark */}
      <span className="contact-watermark" aria-hidden>KAI</span>

      <h2
        className="reveal"
        style={{
          fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(42px, 8vw, 96px)',
          fontWeight: 300, letterSpacing: '-0.03em',
          lineHeight: 0.95, marginBottom: 40,
          position: 'relative', zIndex: 1,
        }}
      >
        Let&apos;s do{' '}
        <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>science</em>
        <br />
        together.
      </h2>

      <p
        className="reveal reveal-delay-1"
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 13, color: 'var(--muted)',
          letterSpacing: '0.05em', lineHeight: 1.8,
          marginBottom: 48, position: 'relative', zIndex: 1,
        }}
      >
        Questions about workshops, collaborations, consulting, or satellite lecturing?
        <br />
        Reach out — we respond within 48 hours.
      </p>

      {/* Primary CTA */}
      <div
        className="reveal reveal-delay-2"
        style={{
          display: 'inline-flex', flexWrap: 'wrap', gap: 16,
          position: 'relative', zIndex: 1, marginBottom: 36,
        }}
      >
        <a href="mailto:kartikjuyal66@gmail.com" className="btn-primary">
          Get In Touch
        </a>
        <a href="#lecturer-application" className="btn-ghost">
          Apply as Lecturer →
        </a>
      </div>

      {/* Social links */}
      <div
        className="reveal reveal-delay-3"
        style={{
          marginTop: 36,
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'center', gap: 12,
          position: 'relative', zIndex: 1,
        }}
      >
        {contactLinks.map(({ label, href, icon }) => (
          <a
            key={label}
            href={href}
            target={href.startsWith('mailto') ? undefined : '_blank'}
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              border: '1px solid var(--border-color)',
              borderRadius: 999,
              textDecoration: 'none', color: 'var(--text)',
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 11, letterSpacing: '0.08em',
              transition: 'background-color 0.3s, color 0.3s, border-color 0.3s, transform 0.2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.transform    = 'translateY(-1px)'
              el.style.borderColor  = 'rgba(184,245,200,.25)'
              el.style.background   = 'var(--hover)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.transform    = 'translateY(0)'
              el.style.borderColor  = 'var(--border-color)'
              el.style.background   = 'transparent'
            }}
          >
            {icon}
            {label}
          </a>
        ))}
      </div>
    </section>
  )
}
