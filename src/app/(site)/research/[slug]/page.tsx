import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getAllArticles, getArticleBySlug } from '@/lib/research/articles'
import { formatDate } from '@/lib/research/helpers'
import { ArticleSection } from '@/components/research/ArticleSection'
import { SITE_URL } from '@/lib/site-config'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return { title: 'Research — Kai Labs' }

  const url = `${SITE_URL}/research/${article.slug}`
  const ogImage = article.heroImageExists ? `${SITE_URL}${article.heroImage.src}` : undefined

  return {
    title: `${article.title} — Kai Genomics Research`,
    description: article.excerpt,
    keywords: article.tags,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      url,
      publishedTime: article.date,
      authors: article.authors,
      images: ogImage ? [{ url: ogImage, width: 1600, height: 900, alt: article.heroImage.alt }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function ResearchArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <div
        style={{
          padding: '140px 40px 0', maxWidth: 1100, margin: '0 auto',
        }}
      >
        <Link
          href="/research"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--muted)', textDecoration: 'none', marginBottom: 36,
          }}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
            <path d="M5 1L1 5L5 9M1 5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          All Research
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)',
            }}
          >
            {article.category}
          </span>
          {article.isSample && <span className="sample-badge">Sample Article</span>}
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
            fontWeight: 300, fontSize: 'clamp(32px, 5.4vw, 64px)', lineHeight: 1.06,
            letterSpacing: '-0.02em', maxWidth: 920, marginBottom: 28,
          }}
        >
          {article.title}
        </h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, marginBottom: 48 }}>
          <MetaItem label="Published" value={formatDate(article.date)} />
          {article.journal && <MetaItem label="Journal" value={article.journal} />}
          {article.authors && article.authors.length > 0 && (
            <MetaItem label="Authors" value={article.authors.join(', ')} />
          )}
          <MetaItem label="Reading Time" value={article.readingTime} />
        </div>
      </div>

      {/* ── Hero image ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 8px' }}>
        <div
          style={{
            position: 'relative', width: '100%', aspectRatio: '16 / 8',
            borderRadius: 14, overflow: 'hidden', background: 'var(--surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          {article.heroImageExists ? (
            <Image
              src={article.heroImage.src}
              alt={article.heroImage.alt}
              fill
              priority
              sizes="(max-width: 1100px) 100vw, 1100px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="research-placeholder-media" aria-hidden>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.1">
                <circle cx="12" cy="12" r="3.2" />
                <circle cx="4.5" cy="7" r="1.6" />
                <circle cx="19.5" cy="7" r="1.6" />
                <circle cx="4.5" cy="17" r="1.6" />
                <circle cx="19.5" cy="17" r="1.6" />
                <path d="M9.2 10.2 5.7 8M14.8 10.2l3.5-2.2M9.2 13.8 5.7 16M14.8 13.8l3.5 2.2" />
              </svg>
            </div>
          )}
        </div>
        {(article.heroImage.caption || article.heroImage.credit) && (
          <p
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, marginTop: 12,
            }}
          >
            {article.heroImage.caption}
            {article.heroImage.caption && article.heroImage.credit ? ' — ' : ''}
            {article.heroImage.credit && <span>Credit: {article.heroImage.credit}</span>}
          </p>
        )}
      </div>

      {/* ── Body: content + sidebar ─────────────────────────────── */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 1,
          background: 'var(--border-color)', marginTop: 56,
        }}
        className="detail-body-grid"
      >
        {/* Left: content */}
        <div style={{ padding: '64px 40px', background: 'var(--bg)', maxWidth: 760, justifySelf: 'end', width: '100%' }}>
          <ArticleSection title="Summary" paragraphs={article.summary ?? []} />
          <ArticleSection title="Why This Matters" paragraphs={article.whyItMatters ?? []} />

          {article.keyFindings && article.keyFindings.length > 0 && (
            <div style={{ marginBottom: 52 }}>
              <p className="detail-section-title">Key Findings</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {article.keyFindings.map((finding, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13,
                      color: 'var(--muted)', lineHeight: 1.9,
                    }}
                  >
                    <span aria-hidden style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }}>—</span>
                    {finding}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ArticleSection title="Methods" paragraphs={article.methods ?? []} />

          {article.images && article.images.length > 0 && (
            <div style={{ marginBottom: 52, display: 'flex', flexDirection: 'column', gap: 28 }}>
              {article.images.map((img, i) => (
                <figure key={i} style={{ margin: 0 }}>
                  <div
                    style={{
                      position: 'relative', width: '100%', aspectRatio: '16 / 9',
                      borderRadius: 12, overflow: 'hidden', background: 'var(--surface)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <Image src={img.src} alt={img.alt} fill loading="lazy" sizes="760px" style={{ objectFit: 'cover' }} />
                  </div>
                  {(img.caption || img.credit) && (
                    <figcaption
                      style={{
                        fontFamily: 'var(--font-mono), DM Mono, monospace',
                        fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, marginTop: 10,
                      }}
                    >
                      {img.caption}{img.caption && img.credit ? ' — ' : ''}{img.credit && `Credit: ${img.credit}`}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}

          {article.kaiGenomicsPerspective && article.kaiGenomicsPerspective.length > 0 && (
            <div style={{ marginBottom: 52 }}>
              <p className="detail-section-title">Kai Genomics Perspective</p>
              <div className="perspective-box" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {article.kaiGenomicsPerspective.map((p, i) => (
                  <p key={i} style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13, lineHeight: 2, color: 'var(--text)' }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}

          <ArticleSection title="What This Could Mean" paragraphs={article.implications ?? []} />
        </div>

        {/* Right: sticky sidebar */}
        <div style={{ background: 'var(--surface)', padding: '48px 36px', position: 'sticky', top: 88, alignSelf: 'start' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--accent)',
              marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            <span style={{ width: 16, height: 1, background: 'var(--accent)', flexShrink: 0, display: 'inline-block' }} />
            Paper Information
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginBottom: 32 }}>
            {article.journal && <SidebarRow label="Journal" value={article.journal} />}
            {article.authors && article.authors.length > 0 && (
              <SidebarRow label="Authors" value={article.authors.join(', ')} />
            )}
            <SidebarRow label="Published" value={formatDate(article.date)} />
            {article.doi && <SidebarRow label="DOI" value={article.doi} />}
            {article.tags && article.tags.length > 0 && (
              <div>
                <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>
                  Keywords
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {article.tags.map((t) => (
                    <span key={t} className="tag">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {article.sourceUrl ? (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: 'block', width: '100%', textAlign: 'center', boxSizing: 'border-box' }}
            >
              Read original paper →
            </a>
          ) : (
            <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
              Original source not yet linked for this entry.
            </p>
          )}

          {article.isSample && (
            <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.8, marginTop: 24 }}>
              This is placeholder sample content demonstrating the Research Intelligence
              system — not an actual published finding.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
        {value}
      </p>
    </div>
  )
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12.5, color: 'var(--text)', lineHeight: 1.7, wordBreak: 'break-word' }}>
        {value}
      </p>
    </div>
  )
}
