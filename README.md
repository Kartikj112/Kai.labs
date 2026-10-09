# Kai Labs

> A scientific ecosystem for computational biology — research, education, and open tools.

Next.js 16 (App Router) application covering four things under one roof: **Kai Genomics**
(research and bioinformatics training), **Kai Exchange** (a free peer-to-peer workshop
platform), **Research Intelligence** (a file-based publishing system), and the
**Kai Decision Engine** (21 interactive decision-support modules).

Live at [kai-genomics.vercel.app](https://kai-genomics.vercel.app/).

---

## Stack

| Layer        | Technology                                              |
|--------------|---------------------------------------------------------|
| Framework    | Next.js 16 (App Router, Turbopack)                      |
| Language     | TypeScript, `strict`                                     |
| Styling      | CSS custom properties + Tailwind utilities              |
| Fonts        | `next/font` — Cormorant Garamond, DM Mono, Syne, Geist Pixel (Circle + Square) |
| Database     | Supabase via PostgREST (Kai Exchange only, optional)     |
| Email        | Resend REST API (optional)                               |
| Deployment   | Vercel                                                   |
| Analytics    | Google Analytics 4                                       |

**No runtime dependencies beyond `next`, `react` and `react-dom`.** (`@anthropic-ai/sdk`, `@google/genai`
and `zod` are devDependencies — they are used by the research ingest script in CI and never
reach the browser bundle.) Supabase and Resend are
reached with plain `fetch` against their REST APIs rather than SDKs, and the one non-Google
font is vendored as a single `woff2`. That keeps the dependency surface and the bundle small.

---

## Quick start

```bash
npm install
npm run dev          # → http://localhost:3000

npm run build        # production build (runs engine validation first)
npm start            # serve the production build
npm run lint
npm run validate:engines   # graph-check all 21 decision trees
npm run test:research      # pure research ingest regression tests
```

No environment variables are required. The site renders fully without any: Kai Exchange
falls back to seed data and the admin console reports that it is unconfigured.

**Workshop notice:** `Introduction to Bioinformatics` is now flagged `isLive: true`,
which uses the same LIVE pill as the existing live workshop cards. The detail view's
**Register Now** link points to the attendee-facing `/viewform` variant of the supplied
Google Form. Before launch, confirm that the form is published and accepts responses;
an `/edit` link is owner-only and must not be shared with participants.

---

## Routes

```
/                             Kai Labs landing — ecosystem overview
/genomics                     Kai Genomics — hero, workshops, about, publications, contact
/research                     Research Intelligence index (featured + category filter)
/research/[slug]              Article page, generated from content/research/*.json
/blog                         Kai Blogs index — founder essays and notes
/blog/[slug]                  Blog post, generated from content/blog/*.md
/exchange                     Kai Exchange — approved workshop listing
/exchange/host                Workshop submission form
/exchange/workshops/[slug]    Workshop detail
/exchange/apply/[slug]        Attendee application form
/tools                        Tool index
/engine                       Decision Engine hub — all 21 modules
/engine/[module]              A single decision-engine module
/about  /contact              Static pages
/admin                        Exchange review console (cookie-gated)
/admin/login                  Admin login
/sitemap.xml  /robots.txt     Generated
```

`(site)` is a route group that supplies the shared nav and footer. `/engine` and `/admin`
sit outside it deliberately — the engine runs in a focused, chrome-free reading mode with
its own slim header, and admin has its own shell.

---

## Project structure

```
content/
  research/*.json             REAL, published research articles (written by Actions)
  .processed-dois.json        Ledger of decisions by the GitHub Actions ingest workflow
  blog/*.md                   One Markdown file per Kai Blogs post

public/
  hero-bg.mp4                 Genomics hero background
  Kartik.jpg                  Founder photo
  research/images/            Article hero images
    _defaults/                Per-category fallback art, keyed by slugified category

scripts/
  validate-engines.mts        Graph-validates every decision tree; runs on prebuild
  research-ingest.mts         Finds, screens and writes up new papers; runs weekly in CI
  research-core.mts           Testable DOI, date, abstract and screening validators
  research-core.test.mts      Built-in Node regression tests
  research-feed.test.mts      Guardrails for public feed and featured article selection

examples/
  research/*.json             Retired sample/demo articles; never loaded by the site

supabase/
  schema.sql                  Kai Exchange schema, RLS policies, demo rows

src/
  app/
    layout.tsx                Root layout — fonts, metadata, GA4, custom cursor
    globals.css               Design tokens, base styles, shared components
    fonts/                    Vendored Geist Pixel Circle + Square + their OFL licence
    (site)/                   Pages that share the Kai Labs nav + footer
    engine/                   Decision Engine (own layout + engine.css)
    admin/                    Exchange review console
  components/
    labs/                     Nav, footer, feature cards, initiative badge
    sections/                 Genomics page sections + DecisionEngine renderers
    research/                 Research index and article components
    exchange/                 Exchange forms and cards
    experiments/              InteractiveNetwork canvas background
    ui/                       Custom cursor, section label
  lib/
    engines/                  Decision-tree data, types, registry, loader
    research/                 Article loader (server) + pure helpers (shared)
    exchange/                 Supabase data layer, admin queries, auth, seed
    email/                    Resend client + templates
    data/                     Workshops, publications, about copy
    hooks/                    Scroll reveal, cursor, element size, reduced motion
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the complete system diagram,
runtime boundaries, and the research pipeline's failure modes.

---

## Design system

Dark theme only. The theme toggle was removed; `data-theme="dark"` is fixed on `<html>`.

### Tokens

| Token            | Value                     | Role                          |
|------------------|---------------------------|-------------------------------|
| `--bg`           | `#050507`                 | Page background               |
| `--surface`      | `#0c0c10`                 | Cards, raised panels          |
| `--text`         | `#f0ede8`                 | Primary text                  |
| `--muted`        | `rgba(240,237,232,0.4)`   | Secondary text                |
| `--accent`       | `#C05A5D`                 | Oxblood — primary accent      |
| `--accent2`      | `#A63D40`                 | Deeper oxblood                |
| `--accent-soft`  | `rgba(192,90,93,0.12)`    | Washes, tag backgrounds       |
| `--border-color` | `rgba(255,255,255,0.07)`  | Hairlines                     |
| `--ok/--warn/--err` | `#3FA46A / #F0C060 / #E05050` | Status                 |

### Typography

Five faces, each with one job. The rule that keeps it coherent: **pixel carries the
headline, display carries the sub-headline, mono carries content, pixel carries metadata.**

| Role        | Font               | Used for                                                |
|-------------|--------------------|---------------------------------------------------------|
| Headline    | Geist Pixel Circle | Every heading rendered at 40px and up                    |
| Display     | Cormorant Garamond | Card titles, publication rows, sidebar values, stat figures, sub-headings below 40px |
| Mono        | DM Mono            | Body copy, questions, option labels, nav                 |
| Sans        | Syne               | The `KAI.LABS` wordmark                                  |
| Metadata    | Geist Pixel Square | Eyebrows, section labels, step counters, index numerals, status pills |

**The size threshold is the whole rule.** Geist Pixel Circle's dot texture is only visible
above roughly 40px; below that it flattens into a plain monospace and becomes
indistinguishable from DM Mono, which collapses the hierarchy. So Circle owns the display
tier and Cormorant keeps everything under it — the site still has a serif voice, it has just
moved down one level. Neither pixel face ever carries prose.

Two consequences of Geist Pixel shipping a single weight and **no italic**:

- Accent words in headings (`Kai`**`Labs`**, `Decode the `**`invisible`**` microbiome.`) used
  to carry italic *and* oxblood. They now carry oxblood alone — a synthetic oblique shears
  the pixel grid, so `<em>` inside a display heading is set to `fontStyle: 'normal'`.
- Circle is monospaced and runs **14–24% wider than Cormorant** at the same size. Display
  headings therefore want `letterSpacing: 0` (negative tracking collides the glyph cells)
  and `lineHeight` around `1.04` (Cormorant's `0.92` was tuned for a short x-height and long
  descenders). Check any new heading at ~400px, where the clamp *minimum* is what overflows.

Use the `.pixel-label` / `.pixel-num` helpers in `globals.css` rather than reaching for the
metadata variable directly.

> **Gotcha:** `--font-pixel` and `--font-pixel-display` alias `var(--font-geist-pixel-square)`
> and `var(--font-geist-pixel-circle)`, which `next/font` defines. Referencing a literal
> family name like `'Geist Pixel Circle'` silently falls back to the platform monospace — it
> looks plausible on Windows (Consolas) and is easy to miss. Verify a pixel face is really
> painting by *measuring rendered text width* against a deliberately missing family;
> inspecting `font-family` or computed style reports the declared stack either way.

---

## The Decision Engine

21 live modules, 139 decision steps, across 16 research domains.

| Domain          | Modules                                                    |
|-----------------|------------------------------------------------------------|
| Genomics        | Bacterial WGS Decision Engine (11)                         |
| Sequencing      | Sequencing Strategy Advisor (8)                            |
| Assembly        | Reference Genome Selection (7), Assembly Strategy (6)      |
| Metagenomics    | MAG Recovery Decision Tree (9)                             |
| Functional      | Functional Prediction Wizard (7)                           |
| Statistics      | Differential Abundance Selector (6), Statistical Power (6) |
| Drug discovery  | Genome Mining Wizard (8), AMP / Peptide Discovery (8)      |
| Nanopore        | ONT Basecalling & Filtering Advisor (7)                    |
| Amplicon        | 16S Primer Selection Advisor (6)                           |
| Taxonomy        | dDDH & Novel Species Description (7)                       |
| Submission      | Metadata & MIMARKS Compliance (5)                          |
| Computing       | Computational Resource Estimator (6)                       |
| Publication     | Publication Readiness Checker (5)                          |
| Strategy        | Bioinformatics Method Recommender (5)                      |
| Planning        | Experimental Design Advisor (7)                            |
| Career          | PhD Planner (5), Conference Recommender (4), Career Pathway (6) |

### How a module works

A module is **pure data** — a `Record<string, TreeNode>` in `src/lib/engines/`. There is no
per-module component. `EngineRunner` walks the graph and dispatches each node to a renderer
by `type`:

| Type        | Renders as                                              |
|-------------|---------------------------------------------------------|
| `q`         | Question with selectable options                        |
| `block`     | Hard stop — something must be fixed before continuing    |
| `info`      | Explanatory node with an optional table, caution or code |
| `rec`       | Recommendation with arrow-point bullets                  |
| `ms`        | Multi-select checkboxes                                  |
| `calc`      | Coverage calculator (WGS only)                           |
| `checklist` | Scored, interactive checklist                            |
| `timeline`  | Expandable phase timeline                                |
| `matrix`    | Ranked comparison matrix                                 |
| `summary`   | Terminal node (WGS uses a bespoke summary)               |

Every path ends by routing to the `__hub__` sentinel, which makes `EngineRunner` synthesise
a **workflow summary** — it replays the user's path, collects the tools mentioned along the
way, and renders a printable page with a Markdown download.

### Adding a module

1. Write the tree in `src/lib/engines/` and export it.
2. Register it in `loader.ts` under its module id.
3. Add an entry to `registry.ts` with `status: 'live'` and a `totalSteps` matching the
   tree's `total`.
4. Run `npm run validate:engines`.

No React changes are needed — the page, metadata and static params all generate from the
registry.

### Validation

`scripts/validate-engines.mts` runs automatically before every build and checks that:

- every `next` target resolves to a real node id (or `__hub__`)
- every node is reachable from the start node
- no node's `step` exceeds its `total`, and `total` is consistent within a tree
- the registry's `totalSteps` matches what the tree declares
- every module has a reachable terminal state

A dangling pointer would otherwise surface at runtime as `Unknown node: …` only once a user
walked that exact path.

---

## Research Intelligence

A filesystem CMS with no database and no admin UI. One article is one JSON file in
`content/research/`, matching the `ResearchArticle` interface in `lib/research/types.ts`.
Only `slug`, `title`, `date`, `category`, `excerpt` and `heroImage` are required; every body
section is optional and simply omitted from the page when absent.

An article that fails validation is **skipped with a console warning rather than failing the
build**, so a malformed file from an automation can never take the site down. Setting
`"draft": true` hides an article from the live site. Sample entries (`"isSample": true`,
or a legacy `journal` containing `Sample Entry`) are **always hidden**, including from
featured selection, category filters, article detail URLs, and the sitemap.

The three former demo fixtures are archived in `examples/research/` and are not eligible
for public display. Only genuine generated JSON belongs in `content/research/`. If there
are no real articles yet, the page displays an honest empty state, never fabricated
papers. The sample feature flag can no longer displace newer authentic research.

**IMPORTANT when updating an existing GitHub deployment:** The provided ZIP is based
on the earlier source snapshot; it does **not** include any real article JSON that GitHub
Actions may have committed since that snapshot. Apply code changes to your **current
GitHub default branch** and preserve its `content/research/*.json` and
`content/.processed-dois.json`. Never replace the existing research feed with the
contents of this ZIP. For example, clone/pull the latest GitHub branch first, then
copy the changed source, workflow and docs into it; keep the branch's current genuine
article files. The PDFs/screenshots of live articles are not an export of their JSON.

Images resolve in three steps: the article's own `heroImage` if the file exists, otherwise
the per-category default in `public/research/images/_defaults/<slugified-category>.jpg`,
otherwise an inline SVG placeholder. A new category only needs a matching `.jpg` dropped into
`_defaults/` to get artwork.

`lib/research/articles.ts` is server-only (it uses `fs`); pure logic shared with client
components lives in `lib/research/helpers.ts`. Don't import the former from a client component.

### Autonomous ingest

**The Research Intelligence "agent" runs in GitHub Actions — not on Vercel and not in
visitors' browsers.** `scripts/research-ingest.mts` calls research metadata APIs, uses
Gemini or Claude to score and summarise abstracts, writes
`content/research/<slug>.json`, and commits the changes. Vercel publishes new articles
**only after that commit is pushed and a new deployment succeeds**. There is no live
search performed when someone opens `/research`.

```text
DISCOVER  Crossref + Europe PMC independently, 9 genomics-adjacent research topics
DEDUPE    normalised DOIs; both decision ledger and existing published articles
ENRICH    Europe PMC fills in missing/short Crossref abstracts, bounded concurrency
SCREEN    Gemini OR Anthropic scores limited batches; verify each returned DOI
WRITE     up to --limit evidence-grounded summaries from abstracts + metadata
PERSIST   save article JSON and accepted/rejected DOI decisions
VERIFY    reload from the site's production article loader
PUBLISH   GitHub Action builds and commits to DEFAULT branch → Vercel deploy
          (optional VERCEL_DEPLOY_HOOK if bot commits do not trigger a build)
```

The workflow runs Mondays 06:00 UTC and can be manually dispatched under **Actions →
Research Intelligence → Run workflow**. A quiet week may publish **zero** articles.
The default discovery window is 45 days to cover delayed indexing. Discovery HTTP
requests have timeouts and retries; one upstream provider can fail without blocking
the other. An incomplete model screening result is not treated as a completed
research decision, so its DOI remains eligible next run. Model calls have an explicit
per-run budget; retries consume that budget. This pipeline cannot read paywalled full
text and generated summaries should be editorially checked against the cited DOI.

**Required GitHub setup:** add at least one Actions repository **secret**
(`GEMINI_API_KEY` or `ANTHROPIC_API_KEY`). Give GitHub Actions **Read and write** workflow
permissions so it can push content. Optionally add repository **variables**
`CROSSREF_CONTACT_EMAIL`, `LLM_PROVIDER`, `RESEARCH_MODEL`, `MAX_ENRICH`,
`MAX_SCREEN`, and `MODEL_CALL_BUDGET`. If push commits are not automatically
redeployed by Vercel, create a Vercel **Production Deploy Hook** for the default branch
and save its URL as the GitHub Actions **secret** `VERCEL_DEPLOY_HOOK`. The workflow
invokes it *only after a successful push that changes content*. Manual publishing
runs from other branches now fail fast instead of publishing unseen changes.
Defaults are `gemini-3.8-flash` and
`claude-sonnet-5-5`. Models and provider quota/pricing are subject to change;
chat subscriptions do not substitute for API credentials. Gemini is selected first
when both keys are set, unless `LLM_PROVIDER` selects otherwise.

```bash
npm run test:research
npm run research:ingest -- --discover-only         # Crossref + Europe PMC only; no key
npm run research:ingest -- --dry-run --limit 1     # requires key; does not write
npm run research:ingest -- --limit 1               # writes at most one local article
npm run research:ingest -- --since 2026-09-01      # manual publication lower bound
```

See [`docs/RESEARCH-INTELLIGENCE.md`](docs/RESEARCH-INTELLIGENCE.md) for configuration,
logs, rate limits, failure diagnosis and manual runs. The system-wide architecture
and data flow live in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Kai Blogs

Essays and working notes, published the same way as Research Intelligence: one Markdown
file per post in `content/blog/`, and the push is what publishes.

```bash
npm run blog:new -- "On reading papers slowly"   # creates content/blog/<slug>.md as a draft
npm run dev                                      # preview at /blog/<slug>
# remove `draft: true`, commit, push — Vercel redeploys and it's live
```

Frontmatter needs only `title` and `date`; `excerpt`, `tags: [a, b]`, `cover`, `featured`
and `draft` are optional. Drafts render under `npm run dev` with a badge and are excluded
from production builds and the sitemap. `content/blog/writing-guide.md` is a permanent draft
that demonstrates every supported format.

Markdown is parsed by a small renderer in `components/blog/Markdown.tsx` — headings, quotes,
lists, fenced code, rules, figures, and bold/italic/code/links inline — and emitted as React
elements, never as an HTML string. That keeps the zero-runtime-dependency rule and means a
post cannot inject markup.

---

## Kai Exchange

A free platform where scientists host workshops for other scientists. It **degrades cleanly
when unconfigured** — with no Supabase credentials, listings fall back to seed workshops
(labelled "Preview") and submissions return a clear "not yet live" message rather than
failing.

### Setup

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Set the environment variables below in Vercel.
3. Sign in at `/admin` to review submissions.

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | for Exchange | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | for Exchange | Server-side key; **never expose to the client** |
| `ADMIN_PASSWORD` | for admin | Single shared admin password |
| `RESEND_API_KEY` | optional | Approval emails; skipped if unset |
| `RESEND_FROM` | optional | Verified sender address |
| `NEXT_PUBLIC_SITE_URL` | recommended | Canonical URLs, OG images, sitemap |

Admin auth is a single shared password. The cookie stores an HMAC of a fixed session string
keyed by that password, so the password itself is never written to the cookie and cannot be
derived from it. Comparisons are constant-time, and it **fails closed**: if `ADMIN_PASSWORD`
is unset, nobody can log in.

The schema's RLS policies are defence in depth. The app talks to Postgres with the service
role key from the server only, which bypasses RLS entirely — the policies exist so that even
if the anon key leaked, the public could read approved workshops and insert pending rows,
and nothing else.

---

## Notable implementation details

**InteractiveNetwork** (`components/experiments/InteractiveNetwork/`) is the animated
constellation behind the landing hero. Node, edge and signal state lives in refs and is
mutated in place inside a single `requestAnimationFrame` loop — deliberately outside React's
render cycle, since a 200-node simulation as component state would re-render at 60fps. It
honours `prefers-reduced-motion` by pinning nodes to their anchors.

**Custom cursor** hides the native cursor only after JS confirms a fine pointer *and* the
cursor elements exist. If the script fails, the real cursor stays — the page can never end
up with no visible pointer.

**Font loading** uses `next/font` throughout, so there are no external font requests and no
layout shift.

---

## Deployment

Vercel auto-detects the framework; push and import. `npm run build` runs engine validation
first, so a broken decision tree fails the build rather than reaching production.

Research pages are generated from the **file snapshot at build time**. After a GitHub
Actions publication, compare the commit SHA in GitHub's default branch with the Vercel
production deployment; verify the deployment completed. A successful Actions run alone
is not proof that Vercel has deployed the newly committed JSON. The optional deploy hook
is for integrations that do not rebuild when GitHub Actions pushes with `GITHUB_TOKEN`.

---

## Licence

© Kai Labs. All rights reserved.

Geist Pixel Circle and Square (`src/app/fonts/`) are © 2023 Vercel and basement.studio, used
under the SIL Open Font License 1.1 — the licence text sits beside the font files.
