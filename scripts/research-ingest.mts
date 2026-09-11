/**
 * Kai Genomics Research Intelligence — autonomous ingest.
 *
 * Finds newly published papers in the lab's fields, decides which are worth
 * writing up, writes them, and leaves behind exactly what the site already
 * knows how to read: one JSON file per article in `content/research/`.
 *
 * Pipeline:
 *   1. DISCOVER  Crossref, one query per topic. No API key — Crossref asks only
 *                for a contact address so it can put you in the polite pool.
 *   2. DEDUPE    Drop anything whose DOI is already in content/.processed-dois.json.
 *   3. ENRICH    Crossref omits many abstracts; Europe PMC fills the gaps. Also
 *                keyless. A candidate with no abstract is dropped — the model
 *                must never write up a paper it hasn't read.
 *   4. SCREEN    One model call ranks every candidate against the lab's focus
 *                and assigns a category. Most papers are rejected here, which is
 *                the point: one cheap call decides, and only winners get written.
 *   5. WRITE     One model call per selected paper produces the body sections.
 *   6. PERSIST   Write the JSON, extend the ledger.
 *   7. VERIFY    Re-read through the site's own loader and assert the new slugs
 *                actually parse. A file that the site would skip is a failure
 *                here, not a silent no-op in production.
 *
 * Every DOI that reaches step 4 is added to the ledger whether it was published
 * or rejected — "processed" means decided, so a rejected paper is never paid to
 * screen twice.
 *
 * Needs exactly one model key — GEMINI_API_KEY (free tier) or ANTHROPIC_API_KEY
 * (paid). Whichever is present is used; Gemini wins if both are. Everything else
 * in the pipeline is keyless.
 *
 * Run with:
 *   npx tsx scripts/research-ingest.mts --discover-only # no key needed at all
 *   npx tsx scripts/research-ingest.mts --dry-run       # no writes, no ledger
 *   npx tsx scripts/research-ingest.mts --limit 2
 *   npx tsx scripts/research-ingest.mts --reset-ledger  # forget past decisions
 */
import fs from 'node:fs'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { CATEGORY_ORDER, slugifyCategory } from '../src/lib/research/helpers'
import type { ResearchArticle } from '../src/lib/research/types'

// ── Config ───────────────────────────────────────────────────────────────────

const ROOT = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content', 'research')
const LEDGER_PATH = path.join(ROOT, 'content', '.processed-dois.json')
const DEFAULTS_DIR = path.join(ROOT, 'public', 'research', 'images', '_defaults')

/**
 * What the lab actually works on. These become Crossref queries, and they're
 * also what the screening step measures relevance against — so this constant is
 * the one place to widen or narrow the pipeline's interests.
 */
const TOPICS = [
  'sponge microbiome metagenomics',
  'metagenome-assembled genomes marine',
  'biosynthetic gene cluster genome mining',
  'antimicrobial peptide design machine learning',
  'antimicrobial resistance novel antibiotics discovery',
  'protein language model structure prediction',
  'natural product discovery bioinformatics',
  'microbial genomics computational pipeline',
]

/**
 * Cheap pre-filter before anything is paid for. Crossref's relevance ranking is
 * keyword-based, so "sponge microbiome" also returns carbon-fibre sponges and
 * loofahs; a candidate must contain at least one of these to be worth screening.
 * Deliberately broad — this only removes the obviously-wrong-field papers, and
 * the model does the real judging.
 */
const DOMAIN_TERMS = [
  'genom', 'metagenom', 'microbiom', 'microbial', 'bacteri', 'archaea',
  'peptide', 'antimicrobial', 'antibiotic', 'biosynthetic gene cluster', 'bgc',
  'nrps', 'pks', 'natural product', 'secondary metabolite',
  'protein', 'proteom', 'sequenc', 'bioinformatic', 'phylogen',
  'holobiont', 'symbion', 'mag ', 'metagenome-assembled',
  'machine learning', 'deep learning', 'neural network', 'language model',
]

/** Papers older than this are not "emerging research". */
const LOOKBACK_DAYS = 30
/** Per topic. 8 topics × 12 = up to ~96 candidates before dedupe. */
const ROWS_PER_TOPIC = 12
/** Articles published per run. Kept low deliberately — this is a digest. */
const DEFAULT_LIMIT = 3
/** Below this, a paper isn't worth a page. */
const MIN_RELEVANCE = 6
/**
 * Minimum abstract length to write from. A real research abstract runs
 * 1200-2500 characters; the ~380-character "Microbiology Resource Announcement"
 * genre is a deposit notice, not a finding, and there is nothing in it to
 * summarise honestly.
 */
const MIN_ABSTRACT_CHARS = 600

/**
 * Crossref's "polite pool" is faster and more reliable, and asks only for a real
 * contact address. Unset is fine — you land in the public pool. A fabricated
 * address would be worse than none, so an unset variable sends nothing.
 */
const CONTACT_EMAIL = process.env.CROSSREF_CONTACT_EMAIL?.trim() || ''
const USER_AGENT = CONTACT_EMAIL
  ? `KaiGenomicsResearchIntelligence/1.0 (mailto:${CONTACT_EMAIL})`
  : 'KaiGenomicsResearchIntelligence/1.0'

// ── CLI ──────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const has = (f: string) => argv.includes(f)
const valueOf = (f: string, fallback: string) => {
  const i = argv.indexOf(f)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}

const DRY_RUN = has('--dry-run')
const VERBOSE = has('--verbose')
const RESET_LEDGER = has('--reset-ledger')
/** Stop after discovery. Needs no API key — use it to check the Crossref side alone. */
const DISCOVER_ONLY = has('--discover-only')
const LIMIT = Number(valueOf('--limit', String(DEFAULT_LIMIT)))
const SINCE = valueOf(
  '--since',
  new Date(Date.now() - LOOKBACK_DAYS * 864e5).toISOString().slice(0, 10)
)

/**
 * Which service writes the digest. Chosen by whichever key is present, so the
 * pipeline is not tied to one vendor's billing:
 *
 *   GEMINI_API_KEY     → Google Gemini. Has a free tier, which is why it is the
 *                        default when both keys exist.
 *   ANTHROPIC_API_KEY  → Claude. Better prose; costs money per token.
 *
 * Force one with the LLM_PROVIDER variable ('gemini' | 'anthropic'). Override
 * the model with RESEARCH_MODEL. Both are plain GitHub repository variables, so
 * switching provider or model is a UI change, never a code change.
 */
type ProviderId = 'gemini' | 'anthropic'

const FORCED = (valueOf('--provider', '') || process.env.LLM_PROVIDER?.trim() || '') as ProviderId | ''
const HAS_GEMINI = !!process.env.GEMINI_API_KEY?.trim()
const HAS_ANTHROPIC = !!process.env.ANTHROPIC_API_KEY?.trim()

const PROVIDER: ProviderId | null = FORCED
  ? FORCED
  : HAS_GEMINI
    ? 'gemini'
    : HAS_ANTHROPIC
      ? 'anthropic'
      : null

const DEFAULT_MODELS: Record<ProviderId, string> = {
  gemini: 'gemini-3.8-flash',
  anthropic: 'claude-opus-5',
}

const MODEL =
  valueOf('--model', '') ||
  process.env.RESEARCH_MODEL?.trim() ||
  (PROVIDER ? DEFAULT_MODELS[PROVIDER] : '')

const log = (...a: unknown[]) => console.log(...a)
const debug = (...a: unknown[]) => VERBOSE && console.log('   ', ...a)

// ── Types ────────────────────────────────────────────────────────────────────

interface Candidate {
  doi: string
  title: string
  abstract: string
  journal?: string
  authors: string[]
  date: string
  url: string
}

// ── HTTP ─────────────────────────────────────────────────────────────────────

async function getJson<T>(url: string): Promise<T | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } })
      if (res.status === 429 || res.status >= 500) {
        // Crossref and Europe PMC both throttle by slowing you down, not by
        // failing outright — backing off is usually enough.
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
        continue
      }
      if (!res.ok) {
        debug(`HTTP ${res.status} for ${url}`)
        return null
      }
      return (await res.json()) as T
    } catch (err) {
      debug(`fetch failed (attempt ${attempt + 1}):`, (err as Error).message)
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
    }
  }
  return null
}

/** Crossref returns abstracts as JATS XML; Europe PMC sometimes returns HTML. */
function stripMarkup(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x?[0-9a-fA-F]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── 1. Discover ──────────────────────────────────────────────────────────────

interface CrossrefItem {
  DOI?: string
  title?: string[]
  abstract?: string
  author?: { given?: string; family?: string }[]
  'container-title'?: string[]
  published?: { 'date-parts'?: number[][] }
  URL?: string
}

function dateFromParts(parts?: number[][]): string | null {
  const p = parts?.[0]
  if (!p || !p[0]) return null
  const [y, m = 1, d = 1] = p
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function looksInField(title: string, abstract: string): boolean {
  const hay = `${title} ${abstract}`.toLowerCase()
  return DOMAIN_TERMS.some((t) => hay.includes(t))
}

async function discover(): Promise<Candidate[]> {
  const byDoi = new Map<string, Candidate>()
  const today = new Date().toISOString().slice(0, 10)
  let rejected = 0

  for (const topic of TOPICS) {
    // until-pub-date matters: a lot of Crossref records carry a placeholder
    // issue date years in the future (2100, 2121), and without an upper bound
    // those dominate a date sort. Relevance order plus a bounded window is
    // steadier. has-abstract:true does the Europe PMC's job up front.
    const url =
      'https://api.crossref.org/works' +
      `?query.bibliographic=${encodeURIComponent(topic)}` +
      `&filter=from-pub-date:${SINCE},until-pub-date:${today},type:journal-article,has-abstract:true` +
      `&rows=${ROWS_PER_TOPIC}` +
      '&select=DOI,title,abstract,author,container-title,published,URL' +
      (CONTACT_EMAIL ? `&mailto=${encodeURIComponent(CONTACT_EMAIL)}` : '')

    const body = await getJson<{ message?: { items?: CrossrefItem[] } }>(url)
    const items = body?.message?.items ?? []
    debug(`${topic} → ${items.length} hits`)

    for (const it of items) {
      const doi = it.DOI?.toLowerCase()
      const title = it.title?.[0]?.trim()
      const date = dateFromParts(it.published?.['date-parts'])
      if (!doi || !title || !date || byDoi.has(doi)) continue

      const cleanTitle = stripMarkup(title)
      const cleanAbstract = it.abstract ? stripMarkup(it.abstract) : ''
      if (!looksInField(cleanTitle, cleanAbstract)) {
        rejected++
        continue
      }

      byDoi.set(doi, {
        doi,
        title: cleanTitle,
        abstract: cleanAbstract,
        journal: it['container-title']?.[0],
        authors: (it.author ?? [])
          .map((a) => [a.given, a.family].filter(Boolean).join(' ').trim())
          .filter(Boolean)
          .slice(0, 8),
        date,
        url: it.URL || `https://doi.org/${doi}`,
      })
    }
  }

  debug(`${rejected} hits dropped by the domain pre-filter`)
  return [...byDoi.values()]
}

// ── 3. Enrich ────────────────────────────────────────────────────────────────

async function fillAbstract(c: Candidate): Promise<Candidate> {
  if (c.abstract.length >= MIN_ABSTRACT_CHARS) return c

  const url =
    'https://www.ebi.ac.uk/europepmc/webservices/rest/search' +
    `?query=${encodeURIComponent(`DOI:"${c.doi}"`)}&format=json&resultType=core&pageSize=1`

  const body = await getJson<{ resultList?: { result?: { abstractText?: string }[] } }>(url)
  const text = body?.resultList?.result?.[0]?.abstractText
  if (text) c.abstract = stripMarkup(text)
  return c
}

// ── Provider adapter ─────────────────────────────────────────────────────────
//
// Both services do the same job here: take a system prompt and a user prompt,
// return JSON matching a schema. The rest of the pipeline only sees `ask()`, so
// adding or swapping a provider never touches the discovery or writing logic.

/** How hard to think. Screening is classification; writing is not. */
type Effort = 'low' | 'default'

interface AskArgs<T> {
  system: string
  user: string
  schema: z.ZodType<T>
  effort?: Effort
}

interface Ask {
  <T>(args: AskArgs<T>): Promise<T | null>
}

/**
 * Both providers shed load under pressure, and a free tier sheds it sooner —
 * "currently experiencing high demand" is a 500, not a bug, and it clears on its
 * own. Anything transient is worth waiting out rather than losing the run: the
 * discovery work is already done by this point and would otherwise be discarded.
 * A 400 or 401 is not transient and rethrows immediately.
 */
function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status
  if (typeof status === 'number') return status === 429 || status >= 500
  const msg = err instanceof Error ? err.message : String(err)
  return /\b(429|500|502|503|504)\b|overload|high demand|rate.?limit|timeout|try again|unavailable/i.test(
    msg
  )
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Wraps any Ask with exponential backoff. 6 attempts spans roughly four minutes. */
function withRetry(ask: Ask, attempts = 6): Ask {
  return async <T,>(args: AskArgs<T>) => {
    let last: unknown
    for (let i = 0; i < attempts; i++) {
      try {
        return await ask<T>(args)
      } catch (err) {
        if (!isTransient(err)) throw err
        last = err
        if (i === attempts - 1) break
        // Exponential, with jitter so parallel retries don't resynchronise.
        const wait = Math.round(4000 * 2 ** i * (0.75 + Math.random() * 0.5))
        log(`      … ${(err as Error).message?.slice(0, 90)}`)
        log(`      … retrying in ${Math.round(wait / 1000)}s (attempt ${i + 2}/${attempts})`)
        await sleep(wait)
      }
    }
    throw last
  }
}

function anthropicAsk(): Ask {
  const client = new Anthropic()
  return async <T,>({ system, user, schema, effort = 'default' }: AskArgs<T>) => {
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system,
      messages: [{ role: 'user', content: user }],
      output_config: {
        format: zodOutputFormat(schema as never),
        ...(effort === 'low' ? { effort: 'low' as const } : {}),
      },
    })
    return (res.parsed_output as T | null) ?? null
  }
}

function geminiAsk(): Ask {
  // Reads GEMINI_API_KEY from the environment.
  const ai = new GoogleGenAI({})
  return async <T,>({ system, user, schema }: AskArgs<T>) => {
    const interaction = await ai.interactions.create({
      model: MODEL,
      system_instruction: system,
      input: user,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        // `reused: 'inline'` keeps $ref out of the schema — Gemini's structured
        // output rejects references.
        schema: z.toJSONSchema(schema as never, { reused: 'inline' }),
      },
    })

    const text = interaction.output_text
    if (!text) return null

    // Belt and braces: the schema is declared to the API, but a free-tier model
    // can still return something that doesn't validate. Better a skipped
    // article than a malformed one on the site.
    try {
      return schema.parse(JSON.parse(text))
    } catch (err) {
      debug('response failed schema validation:', (err as Error).message)
      return null
    }
  }
}

// ── 4. Screen ────────────────────────────────────────────────────────────────

const ScreenSchema = z.object({
  selections: z.array(
    z.object({
      doi: z.string().describe('The DOI exactly as given in the candidate list'),
      relevance: z.number().describe('1-10. How relevant to the lab focus areas'),
      category: z.enum(CATEGORY_ORDER as unknown as [string, ...string[]]),
      reason: z.string().describe('One sentence: why this is or is not worth writing up'),
    })
  ),
})

const LAB_FOCUS = `Kai Genomics is a computational biology lab. Its focus areas:
- Marine sponge microbiomes: holobionts, shotgun metagenomics, metagenome-assembled
  genomes (MAGs), metabolic interdependencies in uncultivable microbes.
- Genome mining and natural products: biosynthetic gene clusters (BGCs), NRPS/PKS,
  ranking novel clusters for experimental characterisation, drug discovery.
- Antimicrobial peptides: AMP design and evaluation, sequence and structure
  prediction, biophysical modelling, activity against priority pathogens, AMR.
- Origin of life and assembly theory: autocatalytic sets, Markov processes,
  computational models of emergent self-sustaining chemistry.
Adjacent work that genuinely informs those — protein design, AI applied to biology,
bioinformatics method papers, metagenomic tooling — also counts.`

/**
 * Screening is classification against a fixed rubric — it doesn't need deep
 * reasoning, so it runs at low effort. The writing calls use the default.
 *
 * It runs in batches rather than one request. Scores are independent of each
 * other (each paper is measured against the rubric, not against its neighbours),
 * so batching changes nothing about the result — but a single request carrying
 * ninety abstracts is the most likely thing in this pipeline to be load-shed,
 * and when it fails the whole run dies. Smaller requests survive, and a batch
 * that fails anyway costs one batch instead of everything.
 */
const SCREEN_BATCH = 25

async function screen(ask: Ask, candidates: Candidate[]) {
  const batches: Candidate[][] = []
  for (let i = 0; i < candidates.length; i += SCREEN_BATCH) {
    batches.push(candidates.slice(i, i + SCREEN_BATCH))
  }

  const all: { doi: string; relevance: number; category: string; reason: string }[] = []

  for (const [n, batch] of batches.entries()) {
    const list = batch
      .map(
        (c, i) =>
          `[${i + 1}] DOI: ${c.doi}\nTitle: ${c.title}\nJournal: ${c.journal ?? 'unknown'}\n` +
          `Abstract: ${c.abstract.slice(0, 1200)}`
      )
      .join('\n\n---\n\n')

    let out: { selections: typeof all } | null = null
    try {
      out = await ask({
        system:
          `You screen newly published papers for a research digest.\n\n${LAB_FOCUS}\n\n` +
          `Score each candidate 1-10 for relevance to those focus areas and assign the single ` +
          `best category. Be strict: a paper that merely shares a keyword is not relevant. Most ` +
          `candidates should score low — a 7+ means someone in this lab would genuinely want to ` +
          `read it. Return an entry for every candidate.`,
        user: `Screen these ${batch.length} candidates.\n\n${list}`,
        schema: ScreenSchema,
        effort: 'low',
      })
    } catch (err) {
      // One lost batch is some papers not considered this week — they stay out
      // of the ledger, so next week reconsiders them. Losing the run entirely
      // would throw away the whole pipeline's work.
      console.warn(`      ! batch ${n + 1}/${batches.length} failed: ${(err as Error).message?.slice(0, 120)}`)
      continue
    }

    if (out?.selections) all.push(...out.selections)
    log(`      batch ${n + 1}/${batches.length} → ${out?.selections?.length ?? 0} scored`)

    // Free tiers meter by requests per minute; a short pause is cheaper than
    // provoking the 429 that a burst would earn.
    if (n < batches.length - 1) await sleep(2000)
  }

  const out = { selections: all }

  return out?.selections ?? []
}

// ── 5. Write ─────────────────────────────────────────────────────────────────

const ArticleSchema = z.object({
  title: z.string().describe('A clear, factual headline. Not clickbait. Under 110 characters.'),
  excerpt: z.string().describe('One or two sentences for the card. Under 280 characters.'),
  tags: z.array(z.string()).describe('3-5 short topic keywords'),
  summary: z.array(z.string()).describe('2-3 paragraphs: what the paper did and found'),
  whyItMatters: z.array(z.string()).describe('1-2 paragraphs: the problem this addresses'),
  keyFindings: z.array(z.string()).describe('3-5 single-sentence findings'),
  methods: z.array(z.string()).describe('1-2 paragraphs: how the work was done'),
  kaiGenomicsPerspective: z
    .array(z.string())
    .describe("1-2 paragraphs: how this connects to the lab's own work, in the lab's voice"),
  implications: z.array(z.string()).describe('1 paragraph: what could follow from this'),
})

async function writeArticle(ask: Ask, c: Candidate, category: string) {
  return ask({
    system: `You write for Kai Genomics Research Intelligence — a digest that summarises new papers for researchers, collaborators, and informed non-specialists.

${LAB_FOCUS}

Rules:
- Work only from the abstract and metadata provided. Never invent numbers, sample sizes, p-values, organisms, or author claims. If the abstract doesn't say it, don't write it.
- Where the abstract is thin, write less rather than padding. A short accurate section beats a long speculative one.
- Plain, precise prose. Explain jargon on first use. No hype, no "groundbreaking", no marketing voice.
- "Kai Genomics Perspective" is the lab's own commentary — it may be interpretive, but it must be clearly framed as the lab's reading, not as findings from the paper.
- Write in British English, matching the rest of the site.`,
    user:
      `Write up this paper. Category: ${category}\n\n` +
      `Title: ${c.title}\nJournal: ${c.journal ?? 'unknown'}\n` +
      `Authors: ${c.authors.join(', ') || 'unknown'}\nPublished: ${c.date}\nDOI: ${c.doi}\n\n` +
      `Abstract:\n${c.abstract}`,
    schema: ArticleSchema,
  })
}

// ── 6. Persist ───────────────────────────────────────────────────────────────

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .split('-')
    .slice(0, 10)
    .join('-')
}

function uniqueSlug(base: string): string {
  let slug = base
  let n = 2
  while (fs.existsSync(path.join(CONTENT_DIR, `${slug}.json`))) slug = `${base}-${n++}`
  return slug
}

function readLedger(): string[] {
  if (RESET_LEDGER) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf-8'))
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!DISCOVER_ONLY && !PROVIDER) {
    console.error('✗ No model API key found. Set one of:')
    console.error('    GEMINI_API_KEY     — Google Gemini, has a free tier')
    console.error('    ANTHROPIC_API_KEY  — Claude, billed per token')
    console.error('  (Or pass --discover-only to exercise the Crossref side without either.)')
    process.exit(1)
  }

  log(`\nKai Genomics Research Intelligence — ingest`)
  log(`  provider   ${PROVIDER ?? 'none (discovery only)'}`)
  log(`  model      ${MODEL || '—'}`)
  log(`  since      ${SINCE}`)
  log(`  limit      ${LIMIT} article(s)`)
  if (DRY_RUN) log(`  MODE       dry run — nothing will be written`)
  if (RESET_LEDGER) log(`  MODE       ledger reset — past decisions forgotten`)

  // 1. Discover
  log(`\n[1/6] Searching Crossref across ${TOPICS.length} topics…`)
  const found = await discover()
  log(`      ${found.length} distinct papers published since ${SINCE}`)
  if (found.length === 0) {
    log('\nNothing new. Done.')
    return
  }

  // 2. Dedupe
  const ledger = readLedger()
  const seen = new Set(ledger.map((d) => d.toLowerCase()))
  const fresh = found.filter((c) => !seen.has(c.doi))
  log(`\n[2/6] ${fresh.length} not yet processed (${found.length - fresh.length} already decided)`)
  if (fresh.length === 0) {
    log('\nEverything found has been seen before. Done.')
    return
  }

  // 3. Enrich
  log(`\n[3/6] Fetching missing abstracts from Europe PMC…`)
  const enriched: Candidate[] = []
  for (const c of fresh) enriched.push(await fillAbstract(c))
  const readable = enriched.filter((c) => c.abstract.length >= MIN_ABSTRACT_CHARS)
  log(`      ${readable.length} have an abstract worth writing from (${enriched.length - readable.length} too thin)`)
  if (readable.length === 0) {
    log('\nNo candidate has an abstract worth reading. Done.')
    return
  }

  if (DISCOVER_ONLY) {
    log('')
    for (const c of readable.slice(0, 15)) {
      log(`  ${c.date}  ${c.title.slice(0, 78)}`)
      log(`              ${c.journal ?? 'unknown journal'} · ${c.abstract.length} char abstract · ${c.doi}`)
    }
    log(`\nDiscovery only — stopping before the model. ${readable.length} candidate(s) ready.`)
    return
  }

  const ask: Ask = withRetry(PROVIDER === 'gemini' ? geminiAsk() : anthropicAsk())

  // 4. Screen
  log(`\n[4/6] Screening ${readable.length} candidates…`)
  const scores = await screen(ask, readable)
  const byDoi = new Map(readable.map((c) => [c.doi, c]))

  const ranked = scores
    .filter((s) => byDoi.has(s.doi.toLowerCase()))
    .sort((a, b) => b.relevance - a.relevance)

  for (const s of ranked.slice(0, 8)) {
    debug(`${String(s.relevance).padStart(2)}/10  ${s.category.padEnd(24)} ${s.reason}`)
  }

  if (ranked.length === 0) {
    console.error('✗ every screening batch failed — nothing was scored.')
    process.exit(1)
  }

  const selected = ranked.filter((s) => s.relevance >= MIN_RELEVANCE).slice(0, LIMIT)
  log(`      ${ranked.length} scored, ${selected.length} at ${MIN_RELEVANCE}+ will be written up`)

  // 5 + 6. Write and persist
  log(`\n[5/6] Writing…`)
  const writtenSlugs: string[] = []

  for (const [n, sel] of selected.entries()) {
    const c = byDoi.get(sel.doi.toLowerCase())!
    if (n > 0) await sleep(2000)

    let body: Awaited<ReturnType<typeof writeArticle>> = null
    try {
      body = await writeArticle(ask, c, sel.category)
    } catch (err) {
      // One article lost is one article. The DOI still enters the ledger below,
      // so it won't be reconsidered — that's the right trade for a digest: a
      // paper missed is not a paper wrong.
      console.warn(`      ✗ ${c.doi}: ${(err as Error).message?.slice(0, 120)}`)
      continue
    }
    if (!body) {
      console.warn(`      ✗ ${c.doi}: model returned no parsable article — skipped`)
      continue
    }

    const slug = uniqueSlug(slugify(body.title))
    const categorySlug = slugifyCategory(sel.category)
    const article: ResearchArticle = {
      slug,
      title: body.title,
      date: c.date,
      category: sel.category,
      excerpt: body.excerpt,
      // Point at the per-category default. The site's resolveImage() falls
      // through to its SVG placeholder if this ever goes missing, so a new
      // category without artwork degrades rather than breaks.
      heroImage: {
        src: `/research/images/_defaults/${categorySlug}.jpg`,
        alt: `${sel.category} — illustrative image`,
        credit: 'Kai Genomics',
      },
      tags: body.tags,
      journal: c.journal,
      authors: c.authors,
      doi: c.doi,
      sourceUrl: c.url,
      summary: body.summary,
      whyItMatters: body.whyItMatters,
      keyFindings: body.keyFindings,
      methods: body.methods,
      kaiGenomicsPerspective: body.kaiGenomicsPerspective,
      implications: body.implications,
    }

    if (!fs.existsSync(path.join(DEFAULTS_DIR, `${categorySlug}.jpg`))) {
      console.warn(`      ! no default image for "${sel.category}" — the page will use the SVG placeholder`)
    }

    log(`      ✓ ${slug}`)
    log(`        ${sel.category} · relevance ${sel.relevance}/10 · ${c.doi}`)

    if (!DRY_RUN) {
      fs.mkdirSync(CONTENT_DIR, { recursive: true })
      fs.writeFileSync(
        path.join(CONTENT_DIR, `${slug}.json`),
        JSON.stringify(article, null, 2) + '\n',
        'utf-8'
      )
    }
    writtenSlugs.push(slug)
  }

  // Every DOI we screened is decided, published or not — so none is paid for twice.
  const decided = [...new Set([...ledger, ...ranked.map((s) => s.doi.toLowerCase())])]
  if (!DRY_RUN) {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(decided, null, 2) + '\n', 'utf-8')
  }
  log(`\n      ledger: ${ledger.length} → ${decided.length} DOIs`)

  // 7. Verify through the site's own loader.
  log(`\n[6/6] Verifying through the site's loader…`)
  if (DRY_RUN) {
    log('      skipped (dry run)')
  } else if (writtenSlugs.length === 0) {
    log('      nothing written')
  } else {
    const { getAllArticles } = await import('../src/lib/research/articles')
    const live = new Set(getAllArticles().map((a) => a.slug))
    const missing = writtenSlugs.filter((s) => !live.has(s))
    if (missing.length > 0) {
      console.error(`      ✗ the site would skip: ${missing.join(', ')}`)
      process.exit(1)
    }
    log(`      ✓ all ${writtenSlugs.length} parse and would render`)
  }

  log(
    writtenSlugs.length > 0
      ? `\nPublished ${writtenSlugs.length} article(s).`
      : `\nNothing met the bar this run. That's a normal outcome.`
  )
}

main().catch((err) => {
  console.error('\n✗ ingest failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
