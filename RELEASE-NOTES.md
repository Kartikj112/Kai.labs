# Kai Labs — paper-preview reliability repair (2026-10-09)

## Why the previous image change appeared ineffective

The earlier figure fetcher had a narrow, licence-safe eligibility requirement,
so figures were often unavailable. It ran only after weekly AI ingestion or a
manual research ingest and left legacy category illustrations displayed. Also,
this ZIP is based on an older source snapshot without the live articles that
GitHub Actions has since published.

## What changes now

- The research index, featured story, and detail pages render a designed **citation
  preview** (real paper title, author, journal, date, DOI) when no eligible real
  figure is available. These are explicitly marked as citation previews and do
  not falsely present fabricated imagery as scientific figures.
- Actual, locally committed, licensed scientific paper figures still replace
  citation covers when available, preserving caption, author and licence links.
- Independent GitHub Action `Research Paper Previews` starts on relevant human
  pushes or via manual dispatch; no Gemini/Claude key is required to backfill.
- Previously cached negative results recheck once (pipeline cache v2).
- GitHub Actions keeps a short diagnosis for inaccessible/restricted papers.
- Figure failures cannot block publishing valid research papers.

## Publishing

Overlay this repository's code on your existing GitHub default branch. Do not
remove real `content/research/*.json` records or the DOI ledger already present
on GitHub; they are absent from the older ZIP snapshot. On the next Vercel build,
citation previews appear automatically even if no action has yet run. The
new Action can then commit approved figures; Vercel must deploy that subsequent
bot commit to display them (`VERCEL_DEPLOY_HOOK` is an optional secret).

## Verification

Offline tests cover paper selection, licence checking, image conversion,
backfill behaviour and suppression of legacy category art. A live OA download
and the full Next.js production build were not possible from the packaging
sandbox and must be observed in GitHub Actions.
