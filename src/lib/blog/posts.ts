// ── Kai Blogs — content loader ──────────────────────────────────────────────
//
// Same shape as Research Intelligence: the folder is the CMS. Drop a `.md`
// file into `content/blog/`, push, and Vercel's redeploy publishes it.
//
// A malformed post is skipped with a console warning rather than failing the
// build, and a post marked `draft: true` is visible only in development — so
// you can preview it at /blog/<slug> with `npm run dev` before publishing.
//
// SERVER-ONLY: relies on Node's `fs`. Never import this from a Client Component.

import fs from 'fs'
import path from 'path'
import type { BlogPost } from './types'
import { founderName } from '@/lib/data/about'

const CONTENT_DIR = path.join(process.cwd(), 'content', 'blog')
const SHOW_DRAFTS = process.env.NODE_ENV !== 'production'

type FrontmatterValue = string | string[] | boolean

function unquote(v: string): string {
  return v.trim().replace(/^(['"])(.*)\1$/, '$2')
}

/**
 * Deliberately small: `key: value`, `key: [a, b]`, and booleans. That covers
 * every field a post uses without pulling a YAML parser into the dependency
 * surface the README promises to keep empty.
 */
function parseFrontmatter(raw: string): { data: Record<string, FrontmatterValue>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: raw }

  const data: Record<string, FrontmatterValue> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/)
    if (!kv) continue
    const value = kv[2].trim()
    if (/^\[.*\]$/.test(value)) {
      data[kv[1]] = value.slice(1, -1).split(',').map(unquote).filter(Boolean)
    } else if (value === 'true' || value === 'false') {
      data[kv[1]] = value === 'true'
    } else {
      data[kv[1]] = unquote(value)
    }
  }
  return { data, body: m[2] }
}

function str(v: FrontmatterValue | undefined): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

/** First real paragraph of the body, stripped of Markdown, for the index card. */
function deriveExcerpt(body: string): string {
  const para = body
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !/^(#|>|```|!\[|[-*+]\s|\d+[.)]\s|-{3,})/.test(p))
  if (!para) return ''
  const plain = para
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 240 ? `${plain.slice(0, 237).replace(/\s+\S*$/, '')}…` : plain
}

function readingTime(body: string): string {
  const words = body.split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 220))} min read`
}

function load(filename: string): BlogPost | null {
  let raw: string
  try {
    raw = fs.readFileSync(path.join(CONTENT_DIR, filename), 'utf-8')
  } catch (err) {
    console.warn(`[blog] could not read ${filename}:`, err)
    return null
  }

  const { data, body } = parseFrontmatter(raw)
  const title = str(data.title)
  const date = str(data.date)
  const problems: string[] = []
  if (!title) problems.push('missing required "title"')
  if (!date || Number.isNaN(Date.parse(date))) problems.push('missing or invalid required "date" (expected YYYY-MM-DD)')
  if (!body.trim()) problems.push('empty body')
  if (problems.length > 0) {
    console.warn(`[blog] skipping ${filename}:\n  - ${problems.join('\n  - ')}`)
    return null
  }

  const draft = data.draft === true
  if (draft && !SHOW_DRAFTS) return null

  return {
    slug: str(data.slug) ?? filename.replace(/\.md$/, ''),
    title: title!,
    date: date!,
    excerpt: str(data.excerpt) ?? deriveExcerpt(body),
    dek: str(data.excerpt),
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: str(data.author) ?? founderName,
    cover: str(data.cover),
    featured: data.featured === true,
    draft,
    body,
    readingTime: readingTime(body),
  }
}

/** All visible posts, newest first. */
export function getAllPosts(): BlogPost[] {
  let filenames: string[]
  try {
    filenames = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'))
  } catch {
    return []
  }

  return filenames
    .map(load)
    .filter((p): p is BlogPost => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug)
}
