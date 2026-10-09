/**
 * Kai Genomics Research Intelligence — autonomous ingest.
 *
 * Finds newly published papers in the lab's fields, decides which are worth
 * writing up, writes them, and leaves behind exactly what the site already
 * knows how to read: one JSON file per article in `content/research/`.
 *
 * Pipeline:
 *   1. DISCOVER  Crossref and Europe PMC independently, one query per topic,
 *                both without keys (a Crossref contact email is recommended).
 *   2. DEDUPE    Drop anything whose DOI is already in content/.processed-dois.json.
 *   3. ENRICH    Europe PMC fills the gaps in publisher abstracts. A candidate
 *                without enough source text is dropped. Enrichment is capped
 *                and concurrent so one unresponsive source cannot hang CI.
 *   4. SCREEN    The newest MAX_SCREEN candidates are scored against the lab's
 *                focus and given a category, in batches. Most are rejected here,
 *                which is the point: cheap calls decide, and only the winners
 *                are written.
 *   5. WRITE     One model call per selected paper produces the body sections.
 *   6. PERSIST   Write the JSON, extend the ledger.
 *   7. VERIFY    Re-read through the site's own loader and assert the new slugs
 *                actually parse. A file that the site would skip is a failure
 *                here, not a silent no-op in production.
 *
 * Every successfully screened DOI is added to the ledger, whether accepted or
 * rejected. DOIs missing from failed/partial batches remain eligible later.
 * A paper selected for writing but not written is also left for next time.
 *
 * Needs exactly one model key — GEMINI_API_KEY (free tier) or ANTHROPIC_API_KEY
 * (paid). Whichever is present is used; Gemini wins if both are. Everything else
 * in the pipeline is keyless.
 *
 * Providers meter requests and tokens differently by plan; the script caps
 * attempted model requests. Check your actual provider quota before enabling.
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
import { crossrefDate, inPublicationWindow, mergeCandidates, MIN_ABSTRACT_CHARS, normaliseDoi, parseDate, publishedDoisFromFiles, stripMarkup, vetScreening } from './research-core.mts'
import type { Candidate } from './research-core.mts'

// ── Config ───────────────────────────────────────────────────────────────────

/**
 * An unset GitHub repository variable arrives as an empty string, and a
 * mistyped one as something Number() turns into NaN — which would silently
 * screen zero candidates rather than fail. Anything not a positive integer
 * falls back to the default and says so.
 */
function posIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) {
    console.warn(`! ${name}="${raw}" is not a positive integer — using ${fallback}`)
    return fallback
  }
  return n
}

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
  'origin of life autocatalytic sets',
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
  'autocatalytic', 'origin of life', 'prebiotic', 'protocell',
  'assembly theory', 'self-replicat', 'chemical reaction network',
]

/** Overlap index delays and missed weekly schedules; the DOI ledger prevents repeats. */
const LOOKBACK_DAYS = 45
/** Per topic; candidates are combined across both independent indexes. */
const ROWS_PER_TOPIC = 12
const EUROPEPMC_ROWS_PER_TOPIC = 8
/** Cap enrichment work; do not make unbounded sequential remote calls. */
const MAX_ENRICH = posIntEnv('MAX_ENRICH', 80)
/**
 * How many candidates actually reach the model, newest first. Keep the
 * screening prompts small enough to return one result per DOI consistently.
 */
const MAX_SCREEN = posIntEnv('MAX_SCREEN', 36)
/** Articles published per run. Kept low deliberately — this is a digest. */
const DEFAULT_LIMIT = 3
/** Below this, a paper isn't worth a page. */
const MIN_RELEVANCE = 6
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
/** Stop after discovery. Needs no API key — use to check both public indexes. */
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
  anthropic: 'claude-sonnet-5-5',
}

const MODEL =
  valueOf('--model', '') ||
  process.env.RESEARCH_MODEL?.trim() ||
  (PROVIDER ? DEFAULT_MODELS[PROVIDER] : '')

const log = (...a: unknown[]) => console.log(...a)
const debug = (...a: unknown[]) => VERBOSE && console.log('   ', ...a)

// ── HTTP ─────────────────────────────────────────────────────────────────────

async function getJson<T>(url: string): Promise<T> {
  let failure: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      })
      if (res.status === 429 || res.status >= 500) {
        failure = new Error(`HTTP ${res.status} for ${new URL(url).host}`)
        if (attempt < 1) await sleep(1500 * (attempt + 1))
        continue
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${new URL(url).host}`)
      return (await res.json()) as T
    } catch (err) {
      failure = err
      debug(`fetch failed (attempt ${attempt + 1}):`, (err as Error).message)
      if (attempt < 1) await sleep(1500 * (attempt + 1))
    }
  }
  throw failure instanceof Error ? failure : new Error('Request failed')
}

// ── 1. Discover ──────────────────────────────────────────────────────────────

interface CrossrefItem {
  DOI?: string
  title?: string[]
  abstract?: string
  author?: { given?: string; family?: string }[]
  'container-title'?: string[]
  published?: { 'date-parts'?: number[][] }
  'published-online'?: { 'date-parts'?: number[][] }
}

interface EuropePmcResult {
  doi?: string
  title?: string
  abstractText?: string
  journalTitle?: string
  authorString?: string
  firstPublicationDate?: string
  firstIndexDate?: string
}

function looksInField(title: string, abstract: string): boolean {
  const hay = `${title} ${abstract}`.toLowerCase()
  return DOMAIN_TERMS.some((t) => hay.includes(t))
}

async function discover(): Promise<Candidate[]> {
  const all: Candidate[] = []
  const today = new Date().toISOString().slice(0, 10)
  let succeeded = 0
  let failed = 0
  let filtered = 0

  // Independent discovery indexes: Crossref includes many publisher deposits;
  // Europe PMC includes biomedical papers with abstracts absent from Crossref.
  // A failure of one index must not silently suppress results from the other.
  for (const topic of TOPICS) {
    const url = new URL('https://api.crossref.org/works')
    url.searchParams.set('query', topic)
    url.searchParams.set('filter', `from-pub-date:${SINCE},until-pub-date:${today},type:journal-article`)
    url.searchParams.set('rows', String(ROWS_PER_TOPIC))
    url.searchParams.set('select', 'DOI,title,abstract,author,container-title,published,published-online')
    if (CONTACT_EMAIL) url.searchParams.set('mailto', CONTACT_EMAIL)
    try {
      const body = await getJson<{ message?: { items?: CrossrefItem[] } }>(url.toString())
      const items = body.message?.items ?? []
      succeeded++
      debug(`Crossref ${topic} → ${items.length} hits`)
      for (const it of items) {
        const doi = normaliseDoi(it.DOI)
        const title = it.title?.[0]?.trim()
        const date = crossrefDate(it)
        if (!doi || !title || !date || !inPublicationWindow(date, SINCE, today)) continue
        const cleanTitle = stripMarkup(title)
        const abstract = stripMarkup(it.abstract || '')
        // With no abstract, do not reject by title alone — Europe PMC can fill
        // it in later. The final screening still demands adequate source text.
        if (!looksInField(cleanTitle, abstract)) { filtered++; continue }
        all.push({
          doi, title: cleanTitle, abstract,
          journal: it['container-title']?.[0],
          authors: (it.author ?? []).map((a) => [a.given, a.family].filter(Boolean).join(' ').trim()).filter(Boolean).slice(0, 8),
          date, url: `https://doi.org/${doi}`,
        })
      }
    } catch (err) {
      failed++
      console.warn(`      ! Crossref / ${topic}: ${(err as Error).message}`)
    }
  }

  for (const topic of TOPICS) {
    const url = new URL('https://www.ebi.ac.uk/europepmc/webservices/rest/search')
    // The search terms are a field-limited query; NOT a request for full text
    // or for a model to browse publishers. The DOI is independently verified.
    const terms = topic.split(/\s+/).filter(Boolean).slice(0, 3)
    url.searchParams.set('query', `TITLE_ABS:(${terms.join(' AND ')}) AND FIRST_PDATE:[${SINCE} TO ${today}]`)
    url.searchParams.set('format', 'json')
    url.searchParams.set('resultType', 'core')
    url.searchParams.set('pageSize', String(EUROPEPMC_ROWS_PER_TOPIC))
    url.searchParams.set('sort', 'FIRST_PDATE_D desc')
    try {
      const body = await getJson<{ resultList?: { result?: EuropePmcResult[] } }>(url.toString())
      const items = body.resultList?.result ?? []
      succeeded++
      debug(`Europe PMC ${topic} → ${items.length} hits`)
      for (const it of items) {
        const doi = normaliseDoi(it.doi)
        const date = parseDate(it.firstPublicationDate)
        if (!doi || !date || !it.title || !inPublicationWindow(date, SINCE, today)) continue
        const title = stripMarkup(it.title)
        const abstract = stripMarkup(it.abstractText ?? '')
        if (!looksInField(title, abstract)) { filtered++; continue }
        all.push({
          doi, title, abstract,
          journal: it.journalTitle,
          authors: (it.authorString ?? '').split(/,\s*/).map((a) => a.trim()).filter(Boolean).slice(0, 8),
          date, url: `https://doi.org/${doi}`,
        })
      }
    } catch (err) {
      failed++
      console.warn(`      ! Europe PMC / ${topic}: ${(err as Error).message}`)
    }
  }
  log(`      source requests: ${succeeded} succeeded, ${failed} failed; ${filtered} off-topic hits rejected`)
  if (succeeded === 0) throw new Error('All discovery sources failed; not treating this as a zero-paper week')
  return mergeCandidates(all)
}

// ── 3. Enrich ────────────────────────────────────────────────────────────────

async function fillAbstract(c: Candidate): Promise<Candidate> {
  if (c.abstract.length >= MIN_ABSTRACT_CHARS) return c

  const url = new URL('https://www.ebi.ac.uk/europepmc/webservices/rest/search')
  url.searchParams.set('query', `DOI:"${c.doi}"`)
  url.searchParams.set('format', 'json')
  url.searchParams.set('resultType', 'core')
  url.searchParams.set('pageSize', '1')
  try {
    const body = await getJson<{ resultList?: { result?: EuropePmcResult[] } }>(url.toString())
    const result = body.resultList?.result?.[0]
    if (normaliseDoi(result?.doi) === c.doi && result?.abstractText) {
      const recovered = stripMarkup(result.abstractText)
      if (recovered.length > c.abstract.length) return { ...c, abstract: recovered }
    }
  } catch (err) {
    debug(`could not enrich ${c.doi}: ${(err as Error).message}`)
  }
  return c
}

/** Bound latency while respecting biomedical API rate limits. */
async function enrichCandidates(candidates: Candidate[]): Promise<Candidate[]> {
  const out = new Array<Candidate>(candidates.length)
  let cursor = 0
  async function worker() {
    while (cursor < candidates.length) {
      const index = cursor++
      out[index] = await fillAbstract(candidates[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, candidates.length) }, () => worker()))
  return out
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
/**
 * A 429 is two different things. A per-minute limit clears in seconds and is
 * worth waiting out; a per-day quota does not clear until tomorrow, and every
 * retry against it is another request the provider may count. The server's
 * "retry in 24s" hint is misleading here — it describes the per-minute window.
 */
function isDailyQuota(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /per[ _-]?day|daily[ _-]?(?:limit|quota)|requestsperday|requests_per_day/i.test(msg)
}

function isTransient(err: unknown): boolean {
  const status = (err as { status?: number })?.status
  if (typeof status === 'number') return status === 429 || status >= 500
  const msg = err instanceof Error ? err.message : String(err)
  return /\b(429|500|502|503|504)\b|overload|high demand|rate.?limit|quota|timeout|try again|unavailable/i.test(
    msg
  )
}

/**
 * Providers usually say how long to wait, and they know better than a fixed
 * curve does — a quota window that resets in 41s is not helped by a 4s backoff.
 * Reads Gemini's "Please retry in 41.6s" and the `retryDelay: 30s` field both
 * SDKs surface in different shapes. Returns milliseconds, or null to fall back.
 */
function serverRetryHint(err: unknown): number | null {
  const msg = err instanceof Error ? err.message : String(err)
  const m =
    msg.match(/retry in\s+([\d.]+)\s*s/i) ||
    msg.match(/retryDelay["':\s]+([\d.]+)s/i) ||
    msg.match(/retry-after["':\s]+([\d.]+)/i)
  if (!m) return null
  const seconds = Number(m[1])
  if (!Number.isFinite(seconds) || seconds <= 0) return null
  // Pad slightly — the window is usually just past what the server quotes.
  return Math.min(Math.round(seconds * 1000) + 3000, 120_000)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Free tiers meter requests, so retries spend the same budget the real work
 * does. This is the ceiling on total model calls per run, retries included —
 * once it's gone, stopping is better than burning a daily quota on a provider
 * that is refusing anyway.
 */
const MODEL_CALL_BUDGET = posIntEnv('MODEL_CALL_BUDGET', 18)
let modelCalls = 0

class BudgetExhausted extends Error {}

/** Wraps any Ask with backoff that prefers the server's own retry hint. */
function withRetry(ask: Ask, attempts = 5): Ask {
  return async <T,>(args: AskArgs<T>) => {
    let last: unknown
    for (let i = 0; i < attempts; i++) {
      if (modelCalls >= MODEL_CALL_BUDGET) {
        throw new BudgetExhausted(
          `model call budget spent (${MODEL_CALL_BUDGET}) — raise MODEL_CALL_BUDGET or wait for the quota window`
        )
      }
      modelCalls++
      try {
        return await ask<T>(args)
      } catch (err) {
        if (isDailyQuota(err)) {
          throw new BudgetExhausted(
            `the provider's daily quota is spent — stopping rather than retrying into it. ` +
              `(${(err as Error).message?.split('\n')[0]?.slice(0, 140)})`
          )
        }
        if (!isTransient(err)) throw err
        last = err
        if (i === attempts - 1) break
        // The server's hint wins; otherwise exponential with jitter so parallel
        // retries don't resynchronise.
        const wait = serverRetryHint(err) ?? Math.round(4000 * 2 ** i * (0.75 + Math.random() * 0.5))
        log(`      … ${(err as Error).message?.split('\n')[0]?.slice(0, 100)}`)
        log(`      … waiting ${Math.round(wait / 1000)}s (attempt ${i + 2}/${attempts})`)
        await sleep(wait)
      }
    }
    throw last
  }
}

// Both SDKs retry on their own by default, underneath withRetry(). Stacked,
// one logical call became up to 25 HTTP requests — and on a 20-a-day free tier
// the first "high demand" 503 spent the whole day's quota before a single
// paper was screened. withRetry() is the only retry layer; the SDKs get none.

function anthropicAsk(): Ask {
  const client = new Anthropic({ maxRetries: 0 })
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
    const interaction = await ai.interactions.create(
      {
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
      },
      { retries: { strategy: 'none' } }
    )

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
 * Smaller batches reduce response truncation and isolate provider failures.
 * Each result must correspond to a supplied DOI; incomplete batches are retried
 * next run rather than being marked as processed.
 */
const SCREEN_BATCH = 12

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
      // Out of budget means every later batch would fail too — stop, and keep
      // whatever earlier batches produced.
      if (err instanceof BudgetExhausted) {
        console.warn(`      ! ${err.message}`)
        break
      }
      // One lost batch is some papers not considered this week — they stay out
      // of the ledger, so next week reconsiders them. Losing the run entirely
      // would throw away the whole pipeline's work.
      console.warn(`      ! batch ${n + 1}/${batches.length} failed: ${(err as Error).message?.slice(0, 120)}`)
      continue
    }

    if (out?.selections) {
      const vetted = vetScreening(out.selections, batch, CATEGORY_ORDER)
      all.push(...vetted)
      if (vetted.length !== batch.length) console.warn(`      ! batch ${n + 1}: ${batch.length - vetted.length} entries missing/invalid; will retry next run`)
    }
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
  const body = await ask({
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
  // Keep the wire JSON Schema simple for both providers; perform additional
  // editorial completeness checks locally so a sparse response is retried.
  if (!body || !body.title?.trim() || !body.excerpt?.trim()) return null
  const sections = [body.summary, body.whyItMatters, body.keyFindings,
    body.methods, body.kaiGenomicsPerspective, body.implications]
  if (sections.some((list) => !list.length || !list.some((v) => v.trim()))) return null
  return body
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
  if (!Number.isInteger(LIMIT) || LIMIT < 1 || LIMIT > 20) throw new Error('--limit must be an integer from 1 to 20')
  if (!parseDate(SINCE)) throw new Error('--since must be a real date in YYYY-MM-DD format')
  if (FORCED && FORCED !== 'gemini' && FORCED !== 'anthropic') throw new Error('LLM_PROVIDER must be gemini or anthropic')
  if (!DISCOVER_ONLY && PROVIDER === 'gemini' && !HAS_GEMINI) throw new Error('Selected Gemini but GEMINI_API_KEY is missing')
  if (!DISCOVER_ONLY && PROVIDER === 'anthropic' && !HAS_ANTHROPIC) throw new Error('Selected Anthropic but ANTHROPIC_API_KEY is missing')
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
  // Seed deduplication from actual published files too: a deleted/corrupt
  // ledger must never allow a second write-up of the same DOI.
  const { getAllArticles } = await import('../src/lib/research/articles')
  const published = publishedDoisFromFiles(getAllArticles().filter((a) => !a.isSample))
  const seen = new Set([...ledger.map((d) => d.toLowerCase()), ...published])
  const fresh = found.filter((c) => !seen.has(c.doi))
  log(`\n[2/6] ${fresh.length} not yet processed (${found.length - fresh.length} already decided)`)
  if (fresh.length === 0) {
    log('\nEverything found has been seen before. Done.')
    return
  }

  // 3. Enrich
  log(`\n[3/6] Fetching missing abstracts from Europe PMC…`)
  const toEnrich = [...fresh].sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_ENRICH)
  log(`      enriching up to ${toEnrich.length} candidates (cap: ${MAX_ENRICH})`)
  const enriched = await enrichCandidates(toEnrich)
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

  // 4. Screen — newest first, capped, because requests are the scarce resource.
  const shortlist = [...readable]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, MAX_SCREEN)

  const batchCount = Math.ceil(shortlist.length / SCREEN_BATCH)
  log(`\n[4/6] Screening ${shortlist.length} of ${readable.length} candidates, newest first…`)
  log(`      ${batchCount} batch(es) + up to ${LIMIT} write(s) = ~${batchCount + LIMIT} model calls`)

  const scores = await screen(ask, shortlist)
  const byDoi = new Map(shortlist.map((c) => [c.doi, c]))

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
  const publishedDois: string[] = []

  for (const [n, sel] of selected.entries()) {
    const c = byDoi.get(sel.doi.toLowerCase())!
    if (n > 0) await sleep(2000)

    let body: Awaited<ReturnType<typeof writeArticle>> = null
    try {
      body = await writeArticle(ask, c, sel.category)
    } catch (err) {
      if (err instanceof BudgetExhausted) {
        console.warn(`      ! ${err.message}`)
        break
      }
      // A failed write is not a final research decision: the DOI remains
      // eligible for screening again next run.
      console.warn(`      ✗ ${c.doi}: ${(err as Error).message?.slice(0, 120)}`)
      continue
    }
    if (!body) {
      console.warn(`      ✗ ${c.doi}: model returned no parsable article — skipped`)
      continue
    }

    const slug = uniqueSlug(slugify(body.title) || slugify(c.doi.replace(/^10\./, 'research-10-')))
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
    publishedDois.push(c.doi)
  }

  // Every DOI we screened is decided, published or not — so none is paid for
  // twice. The exception is a paper that was selected but never written (the
  // budget ran out, or the write failed): those are the best candidates of the
  // run, and ledgering them would drop them for good. Leaving them out means
  // next run screens them again and gets another chance to write them.
  const writtenDois = new Set(publishedDois.map((d) => d.toLowerCase()))
  const unwritten = new Set(
    selected.map((s) => s.doi.toLowerCase()).filter((d) => !writtenDois.has(d))
  )
  if (unwritten.size > 0) {
    log(`      ${unwritten.size} selected paper(s) not written — left out of the ledger for next run`)
  }
  const decided = [
    ...new Set([
      ...ledger,
      ...published,
      ...ranked.map((s) => s.doi.toLowerCase()).filter((d) => !unwritten.has(d)),
    ]),
  ]
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

  log(`\n      ${modelCalls} model call(s) used of a ${MODEL_CALL_BUDGET} budget`)
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
