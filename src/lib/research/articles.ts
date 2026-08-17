// ── Kai Genomics Research Intelligence — content loader ──────────────────────
//
// Articles live as individual JSON files in `content/research/*.json`.
// This module is the ONLY place that touches the filesystem — every page/
// component consumes plain, already-validated data from the functions below.
//
// This is intentionally a flat, dependency-free filesystem reader (no CMS,
// no database) so an external automation (n8n) can publish a new article by
// committing one JSON file + one image to the repo — nothing here needs to
// change for that to work.
//
// SERVER-ONLY: relies on Node's `fs`. Never import this from a Client
// Component — import from `./helpers` instead for pure/shared logic.

import fs from 'fs'
import path from 'path'
import type { LoadedResearchArticle, ResearchArticle, ResearchImage } from './types'
import { estimateReadingTime, getFeaturedArticle as getFeaturedArticlePure } from './helpers'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'research')
const PUBLIC_DIR = path.join(process.cwd(), 'public')

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isValidImage(v: unknown): v is ResearchImage {
  return !!v && typeof v === 'object' && isNonEmptyString((v as ResearchImage).src) && isNonEmptyString((v as ResearchImage).alt)
}

/**
 * Validates the required subset of the schema. Returns a list of problems;
 * an empty list means the article is safe to publish.
 */
function validate(data: unknown, filename: string): string[] {
  const problems: string[] = []
  if (!data || typeof data !== 'object') {
    return [`${filename}: not a valid JSON object`]
  }
  const a = data as Record<string, unknown>

  if (!isNonEmptyString(a.slug)) problems.push(`${filename}: missing required "slug"`)
  if (!isNonEmptyString(a.title)) problems.push(`${filename}: missing required "title"`)
  if (!isNonEmptyString(a.date) || Number.isNaN(Date.parse(a.date as string))) {
    problems.push(`${filename}: missing or invalid required "date" (expected ISO date string)`)
  }
  if (!isNonEmptyString(a.category)) problems.push(`${filename}: missing required "category"`)
  if (!isNonEmptyString(a.excerpt)) problems.push(`${filename}: missing required "excerpt"`)
  if (!isValidImage(a.heroImage)) problems.push(`${filename}: missing required "heroImage" (needs src + alt)`)

  return problems
}

/** Does the referenced public asset actually exist on disk? */
function publicFileExists(src: string): boolean {
  const relative = src.startsWith('/') ? src.slice(1) : src
  try {
    return fs.existsSync(path.join(PUBLIC_DIR, relative))
  } catch {
    return false
  }
}

function load(filename: string): LoadedResearchArticle | null {
  const fullPath = path.join(CONTENT_DIR, filename)
  let raw: string
  try {
    raw = fs.readFileSync(fullPath, 'utf-8')
  } catch (err) {
    console.warn(`[research] could not read ${filename}:`, err)
    return null
  }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (err) {
    console.warn(`[research] skipping ${filename}: invalid JSON (${(err as Error).message})`)
    return null
  }

  const problems = validate(data, filename)
  if (problems.length > 0) {
    console.warn(`[research] skipping ${filename}:\n  - ${problems.join('\n  - ')}`)
    return null
  }

  const article = data as ResearchArticle
  if (article.draft) return null

  return {
    ...article,
    tags: article.tags ?? [],
    heroImageExists: publicFileExists(article.heroImage.src),
    readingTime: estimateReadingTime(article),
  }
}

/** All published (non-draft, schema-valid) articles, newest first. */
export function getAllArticles(): LoadedResearchArticle[] {
  let filenames: string[]
  try {
    filenames = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.json'))
  } catch {
    // content/research doesn't exist yet — an empty research section is a
    // valid (if uneventful) state, not an error.
    return []
  }

  return filenames
    .map(load)
    .filter((a): a is LoadedResearchArticle => a !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function getArticleBySlug(slug: string): LoadedResearchArticle | undefined {
  return getAllArticles().find((a) => a.slug === slug)
}

/** Explicit `featured: true` wins; otherwise the most recent article. */
export function getFeaturedArticle(articles: LoadedResearchArticle[]): LoadedResearchArticle | undefined {
  return getFeaturedArticlePure(articles)
}

export { formatDate, slugifyCategory, getCategories } from './helpers'
