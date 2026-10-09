// ── Kai Genomics Research Intelligence — pure helpers ────────────────────────
// Deliberately free of any Node-only imports (no `fs`, no `path`) so this
// module can be safely imported from both Server and Client Components.
// Filesystem access lives exclusively in `./articles.ts`.

import type { LoadedResearchArticle, ResearchArticle, ResearchImage } from './types'

// Preferred display order for known categories. Anything not in this list
// (a brand-new category an automation invents) is appended automatically —
// the filter is never hard-coded to a fixed set.
//
// Exported because `scripts/research-ingest.mts` constrains the model to these
// values when it categorises a paper. Keeping one list means the ingest and the
// filter row can't drift, and every category here has default artwork in
// public/research/images/_defaults/<slugified>.jpg.
export const CATEGORY_ORDER = [
  'Genomics',
  'Metagenomics',
  'Bioinformatics',
  'Computational Biology',
  'Natural Products',
  'BGC Discovery',
  'Antimicrobial Peptides',
  'Antibiotics',
  'AI × Biology',
  'Protein Design',
  'Synthetic Biology',
  'Marine Biotechnology',
  'Microbial Biotechnology',
  'Drug Discovery',
]

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Stable, URL/DOM-safe id for a category, e.g. "AI × Biology" -> "ai-biology". */
export function slugifyCategory(category: string): string {
  return category
    .toLowerCase()
    .replace(/[×&]/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Unique categories present in the given articles, in a stable, readable order. */
export function getCategories(articles: ResearchArticle[]): string[] {
  const present = new Set(articles.map((a) => a.category))
  const ordered = CATEGORY_ORDER.filter((c) => present.has(c))
  const extras = [...present].filter((c) => !CATEGORY_ORDER.includes(c)).sort()
  return [...ordered, ...extras]
}

/** Never render generic ingestion artwork as if it were a paper figure. */
export function shouldRenderResearchImage(image: ResearchImage, existsOnDisk: boolean): boolean {
  return existsOnDisk && !image.src.startsWith('/research/images/_defaults/')
}

/**
 * Demo fixtures and drafts must never enter the public feed or get featured,
 * even if a legacy fixture was marked `featured: true`.
 * The old sample JSON files now live under examples/research/ for reference.
 */
export function isPublicResearchArticle(article: Pick<ResearchArticle, 'draft' | 'isSample' | 'journal'>): boolean {
  return article.draft !== true && article.isSample !== true &&
    !(typeof article.journal === 'string' && article.journal.toLowerCase().includes('sample entry'))
}

/** Explicitly featured REAL papers win; otherwise use the newest real paper. */
export function getFeaturedArticle<T extends ResearchArticle>(articles: T[]): T | undefined {
  const published = articles.filter(isPublicResearchArticle)
  return published.find((a) => a.featured) ?? published[0]
}

export function estimateReadingTime(article: ResearchArticle): string {
  const words = [
    article.excerpt,
    ...(article.summary ?? []),
    ...(article.whyItMatters ?? []),
    ...(article.keyFindings ?? []),
    ...(article.methods ?? []),
    ...(article.kaiGenomicsPerspective ?? []),
    ...(article.implications ?? []),
  ]
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length

  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} min read`
}

export type { LoadedResearchArticle }
