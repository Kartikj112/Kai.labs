# Research Intelligence — operator guide

## What runs where

A GitHub Actions workflow (`.github/workflows/research-ingest.yml`) runs on Mondays
at 06:00 UTC, or when you select **Actions → Research Intelligence → Run workflow**.
This workflow is the scheduled producer. Vercel only builds and serves the generated
article files. Nothing on the `/research` page directly invokes an LLM or crawls URLs.

## Initial setup

1. Merge these **code** changes into the current default branch connected to Vercel;
   **preserve any real article JSON** already committed there by earlier Actions runs.
   The repair ZIP was made from an older snapshot and is not a backup of those articles.
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
7. Run again on the **default branch** with `dry_run=false`; inspect **Build**, **Commit**,
   and the Vercel production deployment corresponding to the new commit. Manual
   publication from other branches is intentionally rejected.
8. If Actions pushes successfully but Vercel fails to start a new build, create
   a **Vercel Project → Settings → Git → Deploy Hooks** production hook targeting
   the default branch and save its URL to the GitHub Actions **secret**
   `VERCEL_DEPLOY_HOOK`. The workflow will call the hook following a successful
   content push. This is optional if normal Git integration deployments already work.
   Confirm Vercel completes the deployment; a successful hook response is not proof
   that the build completed. No new articles is acceptable if none meet the threshold.

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

## Replacing category artwork with scientific figures

The workflow now runs the licence-aware paper-image step **after ingestion and
before the build**, regardless of whether any new articles were written.
It checks current and older real articles (newest first), and changes their
`heroImage` only after successfully saving an approved local WebP.
No new GitHub secret is needed; `IMAGE_LOOKUP_LIMIT` (optional Actions variable,
default **12**) sets the number of articles it attempts per run. This step
commits `public/research/images/papers/*.webp` **together with** their updated
`content/research/*.json` and the retry ledger. A scheduled run that discovers
no papers can still enrich older ones. Original papers may lack reusable figures;
article ingestion continues with category artwork. Details, licence safeguards
and manual backfill commands: [RESEARCH-IMAGES.md](RESEARCH-IMAGES.md).

## Local checks

```bash
npm ci
npm run test:research
python3 -m pip install -r scripts/research-images-requirements.txt
python3 -m unittest discover -s scripts -p research_images_test.py -v
python3 scripts/research_images.py --backfill --dry-run --limit 2
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
| Site shows sample/demo cards after updating code | Ensure the new Vercel production deployment corresponds to the repaired default-branch commit; the repaired loader excludes samples, even if legacy sample JSON remains on the branch. Hard refresh after deployment. |
| No research cards after repair | The old ZIP contained only demo JSON; the repair archives it under `examples/research/`. Check the **current** GitHub default branch for real `content/research/*.json`. Merge the repair into that latest branch and preserve genuine articles. Never fabricate articles from screenshot text. |
| Real article JSON is in GitHub but not shown on Vercel | Compare commit hashes. Confirm the Vercel production deployment used the same/default-branch commit; if Actions pushes do not cause new Vercel builds, configure the optional production `VERCEL_DEPLOY_HOOK` GitHub Actions secret. |
| Latest research is not featured | The old sample was pinned with `featured: true`. It is now excluded; newest real paper wins unless another real paper has `featured: true`. |
| Action never runs | GitHub scheduled jobs run on the default branch and may be delayed. Trigger `workflow_dispatch` manually; check Actions are enabled. |
| “No model API key found” | Configure a repository **secret** (not Vercel env vars), with correct name. |
| 401 or invalid model | Verify key ownership, selected `LLM_PROVIDER`, `RESEARCH_MODEL` and API access. |
| 429 or exhausted quota | Reduce `MAX_SCREEN`, `--limit` and request budget, or use an account/model with sufficient allowance; wait for actual quota reset. |
| 0 candidates / missing abstracts | Compare logs per discovery source; avoid confusing upstream HTTP errors with no papers. Enrichment is limited to 80 recent candidates. |
| Missing/invalid screening entries | Output DOI/category/score validation rejects them; those candidates are not ledgered and will be reconsidered next run. |
| Article JSON committed but not displayed | Check build/deploy status, JSON schema, `draft`, `content/research`, and file-name/slug. See `src/lib/research/articles.ts`. |
| Git push rejected | Set `contents: write`, enable Actions write access, and check branch rules/default branch. |
| Wrong-branch error | In Actions → Run workflow, choose the default branch for real publication. Dry runs may be started from other branches. |
| Deploy-hook failure | Make sure `VERCEL_DEPLOY_HOOK` is a secret containing the entire URL of a production deploy hook targeting your default branch; use the Vercel dashboard to verify status. |

This is an automated *research discovery and summarisation* workflow, not a general
web-browsing research agent. Index results can be delayed, incomplete or incorrect;
publishing from an abstract cannot replace checking the original study.

## Preservation and visibility rule

`examples/research/*.json` contains the three historical demonstration articles. They are
not syndicated to the public site. `content/research/*.json` is reserved for real papers
published by GitHub Actions. The loader rejects sample/demo markers even if a legacy
file is still present, and the feature-selector also rejects them defensively. This
hides the sample cards, the pinned sample spotlight, direct sample article URLs, and
sample sitemap entries. If the research feed is truly empty, the page tells visitors
so rather than rendering made-up articles.

To verify an existing deployment, look at two independent facts:

1. Does the latest GitHub default-branch commit contain genuine article JSON under
   `content/research/`? (An Actions run completing without committing content is not
   publication.)
2. Did Vercel build and deploy **that** commit? The Next.js site reads local research
   JSON at **build time**, not directly from GitHub at request time.

The user's October 9 PDF showed real article cards alongside old demo cards. Those
real articles were not present in the earlier source ZIP, so they must be preserved
from the live branch before applying these changes.
