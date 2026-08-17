// ── Kai Genomics Research Intelligence — pure helpers ────────────────────────
// Deliberately free of any Node-only imports (no `fs`, no `path`) so this
// module can be safely imported from both Server and Client Components.
// Filesystem access lives exclusively in `./articles.ts`.

import type { LoadedResearchArticle, ResearchArticle } from './types'

// Preferred display order for known categories. Anything not in this list
// (a brand-new category an automation invents) is appended automatically —
// the filter is never hard-coded to a fixed set.
const CATEGORY_ORDER = [
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

/** Explicit `featured: true` wins; otherwise the most recent article (list must be pre-sorted newest-first). */
export function getFeaturedArticle<T extends ResearchArticle>(articles: T[]): T | undefined {
  return articles.find((a) => a.featured) ?? articles[0]
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
