/** Pure, testable parsing and safety checks shared by the research ingestion CLI. */
export interface Candidate {
  doi: string
  title: string
  abstract: string
  journal?: string
  authors: string[]
  date: string
  url: string
}

export interface ScreeningResult {
  doi: string
  relevance: number
  category: string
  reason: string
}

export const MIN_ABSTRACT_CHARS = 350

export function normaliseDoi(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const doi = decodeURIComponentSafe(value.trim())
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .toLowerCase()
  return /^10\.\d{4,9}\/[\w.()/:;+-]+$/i.test(doi) ? doi : null
}

function decodeURIComponentSafe(value: string): string {
  try { return decodeURIComponent(value) } catch { return value }
}

export function stripMarkup(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|#38);/gi, '&')
    .replace(/&(?:lt|#60);/gi, '<')
    .replace(/&(?:gt|#62);/gi, '>')
    .replace(/&(?:quot|#34);/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&#x[\da-f]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ').trim()
}

export function parseDate(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value
}

export function crossrefDate(item: { published?: { 'date-parts'?: number[][] }; 'published-online'?: { 'date-parts'?: number[][] } }): string | null {
  // The online date is the first public appearance; a later issue's print date
  // can otherwise make a months-old article seem new.
  const parts = (item['published-online']?.['date-parts'] ?? item.published?.['date-parts'])?.[0]
  if (!parts || !Number.isInteger(parts[0])) return null
  const [year, month = 1, day = 1] = parts
  return parseDate(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
}

export function inPublicationWindow(date: string, since: string, through: string): boolean {
  return date >= since && date <= through
}

export function mergeCandidates(items: Candidate[]): Candidate[] {
  const byDoi = new Map<string, Candidate>()
  for (const item of items) {
    const doi = normaliseDoi(item.doi)
    if (!doi) continue
    const candidate = { ...item, doi, url: `https://doi.org/${doi}` }
    const previous = byDoi.get(doi)
    if (!previous) { byDoi.set(doi, candidate); continue }
    // Crossref tends to have fuller bibliographic metadata; Europe PMC more
    // often holds the actual abstract. Keep the longest evidence text.
    byDoi.set(doi, {
      ...previous,
      abstract: candidate.abstract.length > previous.abstract.length ? candidate.abstract : previous.abstract,
      authors: previous.authors.length ? previous.authors : candidate.authors,
      journal: previous.journal || candidate.journal,
      date: previous.date < candidate.date ? previous.date : candidate.date,
    })
  }
  return [...byDoi.values()]
}

/** Validate provider output against the *input list*, not only its JSON schema. */
export function vetScreening(results: ScreeningResult[], candidates: Candidate[], categories: readonly string[]): ScreeningResult[] {
  const valid = new Set(candidates.map((c) => c.doi))
  const used = new Set<string>()
  const accepted: ScreeningResult[] = []
  for (const result of results) {
    const doi = normaliseDoi(result.doi)
    if (!doi || !valid.has(doi) || used.has(doi)) continue
    if (!Number.isFinite(result.relevance) || result.relevance < 1 || result.relevance > 10) continue
    if (!categories.includes(result.category) || !result.reason?.trim()) continue
    used.add(doi)
    accepted.push({ ...result, doi })
  }
  return accepted
}

export function publishedDoisFromFiles(entries: { doi?: string }[]): Set<string> {
  return new Set(entries.map((e) => normaliseDoi(e.doi)).filter((x): x is string => !!x))
}
