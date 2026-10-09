# Kai Labs — architecture

_Last reviewed: 2026-10-09. This describes the checked-in repository, not the live Vercel deployment configuration._

## Boundaries and runtime

```text
Browser
  ├── /genomics ─── React workshop cards, static curriculum & registration links
  ├── /research ─── statically rendered JSON research digest
  ├── /blog ─────── Markdown posts
  ├── /engine ────── 21 client-interactive decision-support graphs
  └── /exchange ─── public listings and forms
                         │ server actions / server-side REST fetch
                         ├── Supabase PostgREST (optional)
                         └── Resend (optional)

GitHub Actions (weekly + manual)
  ├── Crossref REST ─────── discover candidate papers
  ├── Europe PMC REST ───── independent discovery + abstract enrichment
  ├── Gemini OR Claude ─── relevance scoring + evidence-grounded summaries
  ├── content/research/*.json + content/.processed-dois.json
  └── Git commit to repository default branch
        └── Vercel build/deployment ─── next build reads committed files
```

**Important:** The Research Intelligence pipeline is NOT a Vercel background agent, a
browser automation, or a live request handler. The public `/research` route reads local
files during the Next.js build; **new papers appear only after the GitHub Action runs,
commits, and Vercel successfully deploys**. There is no website API route that triggers
scanning and no scheduled function on Vercel. The LLM never directly navigates websites;
the discovery code calls research-index REST APIs, and the LLM uses returned abstracts.

## Main parts

| Area | Entry point | Reads/writes | Dependencies |
|---|---|---|---|
| Shell and SEO | `src/app/layout.tsx`, `(site)/layout.tsx`, `sitemap.ts`, `robots.ts` | Shared nav/footer, page metadata | Next.js |
| Kai Genomics | `src/app/(site)/genomics/page.tsx` | `src/lib/data/workshops.ts`; interactive details + external forms | React |
| Research | `src/app/(site)/research/{page.tsx,[slug]/page.tsx}` | `src/lib/research/articles.ts` → `content/research/*.json` | Node `fs` during build |
| Research producer | `scripts/research-ingest.mts`, `scripts/research-core.mts` | Crossref, Europe PMC, model API → research JSON + ledger | Node/tsx in Actions only |
| Publishing | `.github/workflows/research-ingest.yml` | Commits content to default branch | GitHub Actions write permission |
| Kai Blogs | `src/lib/blog/posts.ts`, `(site)/blog/` | `content/blog/*.md` | Local Markdown parser |
| Exchange | `src/lib/exchange/*`, `/exchange`, `/admin` | Supabase + server actions; seed fallback | `SUPABASE_*`, `ADMIN_PASSWORD` |
| Email | `src/lib/email/*` | Resend REST | `RESEND_*` |
| Engine | `src/lib/engines/*`, `/engine` | Static typed decision graphs | Prebuild `validate-engines.mts` |

The `src/lib/research/articles.ts` loader is server-only, validates a minimum article
schema, excludes drafts, selects local fallback images, and sorts by publication date.
Keep filesystem imports out of `use client` components. `src/lib/research/helpers.ts`
holds browser-safe category and date utilities. Source files in `public/` are served as
static assets. Supabase credentials and LLM keys must **never** be `NEXT_PUBLIC_*`.

## Research ingestion data and failure strategy

```text
Week's topic searches in BOTH indexes
   ↓ DOI normalisation + publication window + domain prefilter
Merge by DOI (prefer fuller abstracts)
   ↓ compare ledger AND already published article DOIs
Enrich missing/thin abstracts from Europe PMC (bounded, 3 workers)
   ↓ MIN_ABSTRACT_CHARS / newest 36 to screen
Screen in batches of 12, validate model DOIs/scores/categories
   ├─ invalid/failed entries → NOT entered in ledger; eligible next run
   └─ verified scores 6+ → up to --limit article drafts
       ↓ output schema, grounded in metadata/abstract only
Write JSON files and ledger
   ↓ import production loader to verify slugs
Actions build / commit / push → Vercel deployment
```

- All external requests have a 10-second per-attempt timeout and bounded retries.
  Individual source search failures warn; total source failure causes the Action to fail.
- Publishing is **at most** `--limit`, not guaranteed. Papers below the relevance
  threshold are intentionally skipped. A run with no eligible candidates is valid.
- DOIs from incomplete screening batches, failed article writes, or unavailable
  abstracts are **not** recorded as decided. This avoids permanently losing good papers.
- A DOI present in a non-sample article cannot be republished even if someone resets
  or deletes the processed-DOI ledger.
- `--dry-run` does not modify either content JSON or the ledger. The GitHub Action
  skips build/commit in this mode.
- GitHub/LLM permissions and service quotas are operational dependencies; no keys or
  credentials are stored in source control.

See [Research Intelligence operations](RESEARCH-INTELLIGENCE.md) for configuration,
manual tests, symptoms, and recovery steps. This file is the high-level system map.
