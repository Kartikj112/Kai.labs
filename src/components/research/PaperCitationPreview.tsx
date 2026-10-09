import type { ResearchArticle } from '@/lib/research/types'

/**
 * A truthful, paper-specific citation cover, NOT a screenshot or a scientific
 * figure. Displayed when the rights-checked acquisition pipeline cannot obtain
 * a reusable figure. It needs no external API, image file, or GitHub run.
 */
export function PaperCitationPreview({
  article,
  variant = 'card',
}: {
  article: Pick<ResearchArticle, 'title' | 'category' | 'journal' | 'date' | 'doi' | 'authors'>
  variant?: 'card' | 'featured' | 'detail'
}) {
  const year = /^\d{4}/.exec(article.date)?.[0] ?? ''
  const author = article.authors?.find(Boolean)
  return (
    <div
      className={`paper-citation-preview paper-citation-preview--${variant}`}
      role="img"
      aria-label={`Citation preview for ${article.title}. This is not a figure from the paper.`}
    >
      <div className="paper-citation-preview__sheet">
        <div className="paper-citation-preview__topline">
          <span>KAI / RESEARCH INTELLIGENCE</span>
          <span>{year || 'RESEARCH'}</span>
        </div>
        <div className="paper-citation-preview__rule" />
        <div className="paper-citation-preview__label">RESEARCH PAPER · CITATION PREVIEW</div>
        <div className="paper-citation-preview__title">{article.title}</div>
        <div className="paper-citation-preview__meta">
          {author && <span className="paper-citation-preview__author">{author}{(article.authors?.length ?? 0) > 1 ? ' et al.' : ''}</span>}
          <span>{article.journal || article.category}</span>
        </div>
        <div className="paper-citation-preview__footer">
          <span className="paper-citation-preview__doi">{article.doi ? `DOI ${article.doi}` : 'SOURCE LINKED IN ARTICLE'}</span>
          <span aria-hidden>↗</span>
        </div>
      </div>
    </div>
  )
}
