import Link from 'next/link'
import Image from 'next/image'
import type { LoadedResearchArticle } from '@/lib/research/types'
import { formatDate } from '@/lib/research/helpers'

interface FeaturedResearchProps {
  article: LoadedResearchArticle
}

export function FeaturedResearch({ article }: FeaturedResearchProps) {
  return (
    <div
      className="research-featured-grid reveal"
      style={{
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        gap: 56,
        alignItems: 'center',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        padding: 20,
        background: 'var(--surface)',
      }}
    >
      <Link
        href={`/research/${article.slug}`}
        aria-label={`Read analysis: ${article.title}`}
        style={{
          position: 'relative', display: 'block', width: '100%', aspectRatio: '4 / 3',
          borderRadius: 12, overflow: 'hidden', background: 'var(--bg)',
        }}
      >
        {article.heroImageExists ? (
          <Image
            src={article.heroImage.src}
            alt={article.heroImage.alt}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="research-placeholder-media" aria-hidden>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.1">
              <circle cx="12" cy="12" r="3.2" />
              <circle cx="4.5" cy="7" r="1.6" />
              <circle cx="19.5" cy="7" r="1.6" />
              <circle cx="4.5" cy="17" r="1.6" />
              <circle cx="19.5" cy="17" r="1.6" />
              <path d="M9.2 10.2 5.7 8M14.8 10.2l3.5-2.2M9.2 13.8 5.7 16M14.8 13.8l3.5 2.2" />
            </svg>
          </div>
        )}
      </Link>

      <div style={{ padding: '12px 28px 12px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)',
            }}
          >
            Featured · {article.category}
          </span>
          {article.isSample && <span className="sample-badge">Sample</span>}
        </div>

        <Link href={`/research/${article.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
              fontWeight: 300, fontSize: 'clamp(28px, 3.2vw, 42px)', lineHeight: 1.08,
              letterSpacing: '-0.02em', marginBottom: 18,
            }}
          >
            {article.title}
          </h2>
        </Link>

        <p
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 13, color: 'var(--muted)', lineHeight: 1.9, marginBottom: 22, maxWidth: 520,
          }}
        >
          {article.excerpt}
        </p>

        <div
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 11, color: 'var(--muted)', letterSpacing: '0.05em', marginBottom: 28,
          }}
        >
          {formatDate(article.date)}
          {article.journal ? ` · ${article.journal}` : ''}
          {' · '}{article.readingTime}
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link href={`/research/${article.slug}`} className="btn-primary">
            Read analysis
          </Link>
          {article.sourceUrl && (
            <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              {article.doi ? 'View DOI ↗' : 'Original source ↗'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
