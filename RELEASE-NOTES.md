# Kai Labs — science-figure enrichment release (2026-10-09)

This is the **complete repository source**, not a patch. It contains the
previously repaired research feed, the live workshop badge/registration link,
and the new research-image enrichment workflow.

## New behaviour

- GitHub Actions runs a rights-checked image lookup after research ingestion.
- Only explicitly reusable Europe PMC OA figures are downloaded and committed
  as optimised WebP files, with image credits/licence on article pages.
- Graphical abstracts and scientific workflow diagrams are ranked first.
- Existing real-paper articles are backfilled incrementally on future runs.
- Failures preserve the original category artwork and **never suppress a paper**.
- Paper figures use `object-fit: contain` so scientific axes and labels aren't cropped.
- Offline unit tests cover licensing, safe URLs, image validation and backfill.

## Publishing this ZIP

Commit this repository's files to the existing GitHub default branch attached
to Vercel. **Keep real `content/research/*.json` files already produced by
GitHub Actions on that branch.** The previously supplied snapshot did not
contain them; the current ZIP does not recreate or replace those missing
publications. Do not wipe the existing `content/research/` folder to install
these changes.

A subsequent real (non-dry-run) Research Intelligence Actions run will attempt
to enrich both old and new papers; no new API keys are needed for images.
Review the `Find reusable paper figures and backfill older articles` logs for
per-paper decisions, and verify Vercel deployed the resulting commit.

Open-access status alone is **not** permission to republish arbitrary figures.
This workflow checks explicit CC licences and returns to normal artwork when
reuse or image availability cannot be established.

See `docs/RESEARCH-IMAGES.md` and `docs/ARCHITECTURE.md` for details.
