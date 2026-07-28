import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWorkshop } from '@/lib/exchange/db'
import { ApplyForm } from '@/components/exchange/ApplyForm'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const w = await getWorkshop(slug)
  return { title: w ? `Apply — ${w.title}` : 'Apply — Kai Exchange' }
}

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params
  const w = await getWorkshop(slug)
  if (!w) notFound()

  return (
    <main style={{ paddingTop: 64, minHeight: '100vh' }}>
      <section style={{ padding: '120px 40px 120px', maxWidth: 720, margin: '0 auto' }}>
        <Link href={`/exchange/workshops/${w.slug}`} style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, letterSpacing: '0.1em', color: 'var(--muted)', textDecoration: 'none' }}>
          ← {w.title}
        </Link>

        <h1 className="animate-fade-up" style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: 'clamp(34px, 6vw, 60px)', lineHeight: 1.0, letterSpacing: '-0.03em', margin: '20px 0 14px' }}>
          Apply to <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>attend</em>.
        </h1>
        <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13, color: 'var(--muted)', lineHeight: 1.85, maxWidth: 540, marginBottom: 40 }}>
          You&apos;re applying for <strong style={{ color: 'var(--text)' }}>{w.title}</strong>.
          Applications are reviewed by the host before joining details are sent.
        </p>

        <ApplyForm slug={w.slug} title={w.title} />
      </section>
    </main>
  )
}
