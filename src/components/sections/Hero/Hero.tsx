import { DnaCanvas } from './DnaCanvas'

export function Hero() {
  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0 40px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <DnaCanvas />

      {/* Eyebrow */}
      <p
        className="animate-fade-up"
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: 24,
          animationDelay: '0.3s',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Microbial Genomics &amp; Metagenomics
      </p>

      {/* Main title */}
      <h1
        className="animate-fade-up"
        style={{
          fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
          fontSize: 'clamp(44px, 9vw, 120px)',
          fontWeight: 300,
          lineHeight: 0.92,
          letterSpacing: '-0.02em',
          maxWidth: 900,
          animationDelay: '0.5s',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Decode the
        <br />
        <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>invisible</em>
        <br />
        microbiome.
      </h1>

      {/* Sub */}
      <p
        className="animate-fade-up"
        style={{
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 13,
          color: 'var(--muted)',
          letterSpacing: '0.05em',
          marginTop: 32,
          maxWidth: 460,
          lineHeight: 1.8,
          animationDelay: '0.8s',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Expert-led workshops in microbial genomics, metagenomics,
        <br />
        and bioinformatics — from sequencing to discovery.
      </p>

      {/* CTAs */}
      <div
        className="animate-fade-up"
        style={{
          marginTop: 48,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          animationDelay: '1s',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <a href="#workshops" className="btn-primary">
          Explore Workshops
        </a>
        <a href="#about" className="btn-ghost">
          Meet the Instructor →
        </a>
      </div>

      {/* Scroll hint */}
      <div
        className="animate-fade-up"
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 32,
          right: 40,
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animationDelay: '1.4s',
          zIndex: 1,
        }}
      >
        <span
          className="scroll-icon"
          style={{
            width: 20,
            height: 32,
            border: '1px solid var(--muted)',
            borderRadius: 999,
            display: 'inline-flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 5,
            overflow: 'hidden',
          }}
        />
        Scroll
      </div>
    </section>
  )
}
