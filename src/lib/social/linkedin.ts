import fs from 'node:fs'
import path from 'node:path'

export const LINKEDIN_PROFILE = 'https://www.linkedin.com/in/kartik-juyal-8b8960268/'

export interface CuratedLinkedInPost {
  id: string
  title: string
  summary: string
  url: string
  embedUrl: string
  label: string
}

/**
 * LinkedIn cannot be treated as a public JSON feed. Only explicitly
 * curated public post URLs can be embedded. Reject other hosts and IDs
 * so content JSON cannot inject an arbitrary iframe destination.
 */
export function parseLinkedInActivityId(candidate: string): string | null {
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' || !['www.linkedin.com', 'linkedin.com'].includes(url.hostname)) return null
    const match = url.pathname.match(/(?:^|[-/:])activity[-:]?(\d{12,25})(?:-|\/|$)/i)
      ?? url.pathname.match(/urn:li:activity:(\d{12,25})(?:\/|$)/i)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

/** Makes entries safe and sorts them in the editorial order from JSON. */
export function normalizeLinkedInPosts(raw: unknown): CuratedLinkedInPost[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  const result: CuratedLinkedInPost[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    if (typeof row.url !== 'string' || typeof row.title !== 'string') continue
    const id = parseLinkedInActivityId(row.url)
    const title = row.title.trim().slice(0, 150)
    if (!id || !title || ids.has(id)) continue
    ids.add(id)
    result.push({
      id,
      title,
      summary: typeof row.summary === 'string' ? row.summary.trim().slice(0, 450) : '',
      label: typeof row.label === 'string' && row.label.trim() ? row.label.trim().slice(0, 50) : 'LinkedIn post',
      url: row.url,
      embedUrl: `https://www.linkedin.com/embed/feed/update/urn:li:activity:${id}`,
    })
  }
  return result
}

export function getCuratedLinkedInPosts(): CuratedLinkedInPost[] {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'social', 'linkedin-posts.json'), 'utf8')) as unknown
    return normalizeLinkedInPosts(data)
  } catch (error) {
    console.warn('[linkedin] Could not read curated posts:', error)
    return []
  }
}
