import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'KAI AMP-ASM — Kai Labs',
  description: 'Launch KAI AMP-ASM, the independent antimicrobial peptide research screening prototype.',
}

export default function AmpAgentLaunchPage() {
  const configured = process.env.AMP_ASM_APP_URL?.trim()
  // Restrict redirects to HTTPS endpoints explicitly configured by the site operator.
  if (configured) {
    try {
      const target = new URL(configured)
      if (target.protocol === 'https:' && !target.username && !target.password) {
        target.pathname = '/tools/amp-agent'
        target.search = ''
        target.hash = ''
        redirect(target.toString())
      }
    } catch (error) {
      // Next.js redirects throw intentionally; rethrow those instead of swallowing them.
      if (error && typeof error === 'object' && 'digest' in error &&
          String(error.digest).startsWith('NEXT_REDIRECT')) throw error
    }
  }
  return (
    <main style={{ minHeight: '70vh', padding: '160px 40px 100px', maxWidth: 920, margin: '0 auto' }}>
      <p style={{ fontFamily: 'var(--font-mono), monospace', color: 'var(--accent)', letterSpacing: '0.15em', fontSize: 12 }}>
        KAI AGENTS / RESEARCH PROTOTYPE
      </p>
      <h1 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(36px, 7vw, 72px)', margin: '24px 0' }}>
        KAI AMP-ASM
      </h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.8, maxWidth: 620 }}>
        The AMP-ASM tool is being connected to Kai Labs. The research engine is
        deployed separately so its discovery workflows and models can evolve independently.
      </p>
      <p style={{ marginTop: 24 }}>
        <Link href="/tools" style={{ color: 'var(--accent)' }}>← Back to Kai Labs tools</Link>
      </p>
    </main>
  )
}
