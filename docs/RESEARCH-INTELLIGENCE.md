# Research Intelligence — operator guide

## What runs where

A GitHub Actions workflow (`.github/workflows/research-ingest.yml`) runs on Mondays
at 06:00 UTC, or when you select **Actions → Research Intelligence → Run workflow**.
This workflow is the scheduled producer. Vercel only builds and serves the generated
article files. Nothing on the `/research` page directly invokes an LLM or crawls URLs.

## Initial setup

1. Push these changes to the default GitHub branch connected to Vercel.
2. At **GitHub → Settings → Secrets and variables → Actions → Secrets**, add at
   least one valid API key: `GEMINI_API_KEY` or `ANTHROPIC_API_KEY`.
3. At **GitHub → Settings → Actions → General → Workflow permissions**, select
   **Read and write permissions**. Also check branch protection rules permit
   GitHub Actions to push; without push rights no article can deploy.
4. Recommended: set `CROSSREF_CONTACT_EMAIL` under Actions **Variables** to a
   working contact address so Crossref can identify the polite client.
5. Optionally set `LLM_PROVIDER` (`gemini` or `anthropic`), `RESEARCH_MODEL`,
   `MAX_ENRICH`, `MAX_SCREEN`, `MODEL_CALL_BUDGET` under **Variables**.
6. Manually run **Research Intelligence** with `dry_run=true` and `limit=1`.
   Inspect logs for HTTP source errors, screening count and model errors.
7. Run again with `dry_run=false`; inspect **Build**, **Commit**, and the Vercel
   deployment corresponding to the new commit. No new articles is an acceptable
   outcome if no papers meet the editorial threshold.

### Defaults

| Knob | Value | Explanation |
|---|---|---|
| Providers | Gemini first, then Anthropic | One key required. CLI `--provider` overrides variable. |
| Models | `gemini-3.8-flash`, `claude-sonnet-5-5` | May be replaced with `RESEARCH_MODEL` as accounts and access change. |
| `--since` | 45 days ago | Overlap late-indexed records, GitHub schedule delays, DOI dedupe. |
| `MAX_ENRICH` | 80 | Limit requests to backfill abstracts. |
| `MAX_SCREEN` | 36 | Score the newest readable candidates. |
| Screening batch size | 12 | Smaller batches limit response size and isolate failures. |
| `--limit` | 3 | Max articles written per run (1–20). |
| `MODEL_CALL_BUDGET` | 18 | Attempted model API calls including retries. |
| Min relevance | 6/10 | Editorial floor. |
| Min abstract | 350 characters | Must contain substantive source evidence. |

Models, request quotas and pricing change. Verify the provider's available model IDs,
quotas and pricing. A paid subscription to a chat app is NOT a model API key. This
pipeline does not scrape paywalled articles and writes from metadata/abstracts only.
Any numerical or experimental claim in a generated summary should be editorially
reviewed before broad redistribution.

## Local checks

```bash
npm ci
npm run test:research
npm run research:ingest -- --discover-only --verbose
# put a valid model key in your local environment (never commit .env files)
npm run research:ingest -- --dry-run --limit 1 --verbose
npm run lint
npm run build
```

`--discover-only` makes live public index API requests and requires no model key.
`--dry-run` exercises provider calls but writes no files and still consumes provider
quota. For a manual date range, pass `--since 2026-09-01`. **Do not reset the ledger
unless intentionally re-screening old rejects** (`--reset-ledger`). Already published
(non-sample) DOI files are checked separately to prevent duplicates.

## Diagnosis

| Symptom | Check / remedy |
|---|---|
| Site shows only sample/demo cards | Confirm Actions executed, an article passed relevance, a JSON file was committed, and Vercel deployed that commit. Sample files remain checked in intentionally. |
| Action never runs | GitHub scheduled jobs run on the default branch and may be delayed. Trigger `workflow_dispatch` manually; check Actions are enabled. |
| “No model API key found” | Configure a repository **secret** (not Vercel env vars), with correct name. |
| 401 or invalid model | Verify key ownership, selected `LLM_PROVIDER`, `RESEARCH_MODEL` and API access. |
| 429 or exhausted quota | Reduce `MAX_SCREEN`, `--limit` and request budget, or use an account/model with sufficient allowance; wait for actual quota reset. |
| 0 candidates / missing abstracts | Compare logs per discovery source; avoid confusing upstream HTTP errors with no papers. Enrichment is limited to 80 recent candidates. |
| Missing/invalid screening entries | Output DOI/category/score validation rejects them; those candidates are not ledgered and will be reconsidered next run. |
| Article JSON committed but not displayed | Check build/deploy status, JSON schema, `draft`, `content/research`, and file-name/slug. See `src/lib/research/articles.ts`. |
| Git push rejected | Set `contents: write`, enable Actions write access, and check branch rules/default branch. |

This is an automated *research discovery and summarisation* workflow, not a general
web-browsing research agent. Index results can be delayed, incomplete or incorrect;
publishing from an abstract cannot replace checking the original study.
