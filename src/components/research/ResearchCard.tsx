import Link from 'next/link'
import Image from 'next/image'
import type { LoadedResearchArticle } from '@/lib/research/types'
import { formatDate } from '@/lib/research/helpers'

interface ResearchCardProps {
  article: LoadedResearchArticle
  revealDelay?: 1 | 2 | 3 | 4 | 5
}

export function ResearchCard({ article, revealDelay }: ResearchCardProps) {
  return (
    <Link
      href={`/research/${article.slug}`}
      className={`research-card${revealDelay ? ` reveal reveal-delay-${revealDelay}` : ''}`}
      aria-label={`Read analysis: ${article.title}`}
    >
      <div className="research-card-media">
        {article.heroImageExists ? (
          <Image
            src={article.heroImage.src}
            alt={article.heroImage.alt}
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <div className="research-placeholder-media" aria-hidden>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.2">
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

      <div className="research-card-body" style={{ padding: '24px 24px 26px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)',
            }}
          >
            {article.category}
          </span>
          {article.isSample && <span className="sample-badge">Sample</span>}
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
            fontWeight: 400, fontSize: 22, lineHeight: 1.2, letterSpacing: '-0.01em',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {article.title}
        </h3>

        <p
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 12, color: 'var(--muted)', lineHeight: 1.8, flex: 1,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {article.excerpt}
        </p>

        <div
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 10, color: 'var(--muted)', letterSpacing: '0.05em',
          }}
        >
          {formatDate(article.date)}
          {article.journal ? ` · ${article.journal}` : ''}
        </div>

        {article.tags && article.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {article.tags.slice(0, 3).map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        )}

        <span
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 11, letterSpacing: '0.08em', color: 'var(--text)', marginTop: 6,
          }}
        >
          Read more →
        </span>
      </div>
    </Link>
  )
}
