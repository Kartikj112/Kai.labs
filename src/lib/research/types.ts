// ── Kai Genomics Research Intelligence — content schema ─────────────────────
// This is the contract between the website and any automated writer (n8n).
// A new article is just a new JSON file in `content/research/` that matches
// this shape — no React/TypeScript changes are ever required to publish it.

export interface ResearchImage {
  /** Path relative to /public, e.g. "/research/images/my-article.jpg" */
  src: string
  /** Required — meaningful alt text for accessibility & SEO. */
  alt: string
  /** Optional caption shown under the image. */
  caption?: string
  /** Optional attribution, e.g. "Kai Genomics" or "NASA/JPL". */
  credit?: string
  /** Optional link to where the image originally came from. */
  source?: string
}

export interface ResearchArticle {
  // ── Identity (required) ────────────────────────────────────────────────
  slug: string
  title: string
  /** ISO date string, e.g. "2026-08-12" */
  date: string
  category: string
  excerpt: string
  heroImage: ResearchImage

  // ── Identity (optional) ────────────────────────────────────────────────
  tags?: string[]
  journal?: string
  authors?: string[]
  doi?: string
  sourceUrl?: string

  // ── Flags ───────────────────────────────────────────────────────────────
  /** Pins this article as the Featured Research spotlight. */
  featured?: boolean
  /** Marks placeholder/demo content so it can be labelled in the UI. */
  isSample?: boolean
  /** Hides the article from the live site (excluded from build output). */
  draft?: boolean

  // ── Body (all optional — data-driven, not every article needs every field) ─
  /** Opening paragraphs on the article page. */
  summary?: string[]
  whyItMatters?: string[]
  /** Rendered as a bulleted list. */
  keyFindings?: string[]
  methods?: string[]
  kaiGenomicsPerspective?: string[]
  implications?: string[]
  /** Additional in-body figures beyond the hero image. */
  images?: ResearchImage[]
}

/** ResearchArticle enriched with values computed at load time. */
export interface LoadedResearchArticle extends ResearchArticle {
  /** Whether heroImage.src actually exists in /public (for graceful fallback). */
  heroImageExists: boolean
  /** Estimated reading time, e.g. "4 min read". */
  readingTime: string
}

export const REQUIRED_FIELDS = [
  'slug',
  'title',
  'date',
  'category',
  'excerpt',
  'heroImage',
] as const
