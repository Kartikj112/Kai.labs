# Research Intelligence — scientific paper images

## Design

The image script runs in **two** workflows: after the weekly AI ingester **and**
in a standalone `Research Paper Previews` Action triggered by relevant human pushes
or manual dispatch. New deployments no longer wait for the AI agent. The image step **does not call
the AI model**. It looks up the published article DOI through Europe PMC's JSON
search API, requiring a matching DOI, `isOpenAccess=Y`, and a valid PMCID.
It then downloads OA full-text **JATS XML** through the public Europe PMC REST API.

The script explicitly checks the **article's** `<article-meta><permissions><license>`
record for Creative Commons **CC BY, CC BY-SA (3.0/4.0/2.0), or CC0**. Other
licences (including NC, ND, absent, unclear, or custom terms) are **not** assumed
reusable. It refuses figures carrying separate permissions/copyright statements
or captions identifying third-party material, including explicit BioRender credits. These are automated, conservative
checks; a human should still review licence and attribution before publication.

The agent ranks in-article `<fig>` elements, preferring graphical abstracts and
workflow illustrations, then tries their `<graphic xlink:href>` binary names from
known Europe PMC/PMC article figure endpoints. Not every OA full-text record
exposes downloadable figure binaries at these endpoints. Publisher site previews,
PDF screenshots and AI-synthesised "figures" are **not** scraped or reproduced:
those routes either have unreliable access or unclear redistribution rights.

When a valid preview is obtained, Pillow transcodes it to WebP, caps it at
1200 × 900 pixels / 900 KiB, and commits it to:

- `public/research/images/papers/<article-slug>.webp`
- `content/research/<article-slug>.json` → `heroImage` with the WebP source,
  caption, authors' credit, original article/figure URL and CC licence URL.

The site switches to **contain** rather than **cover** for real paper figures so
labels and axes are not cropped. Attribution, the original-figure link, and the
licence link are displayed beneath the hero on the article detail page.

If anything fails (no PMC OA full text, incompatible licence, no bin file,
failed API call, invalid image, oversize image, etc.), it leaves the JSON
unchanged; **the site renders a paper-specific citation cover using the article
title, journal, year, author and DOI.** This is NOT a figure or PDF screenshot.
It replaces legacy category illustrations everywhere on the public research UI. Research articles are always
published even when artwork is unavailable.

## Enabling and backfilling

**No new secrets and no Vercel environment variables** are required.
GitHub Actions installs Python 3.12 + Pillow and invokes image enrichment after
research ingestion, before the Next.js build and content/image commit.
Standalone pushes, manually triggered preview runs, and the weekly ingester examine existing
articles (including ones produced by earlier runs). The source ZIP did **not**
include the real articles present on your current default branch: preserve
those existing JSON files when committing updated code. Once on the branch,
Actions can enrich them on subsequent scheduled/manual real runs.

The script prioritises newest papers. The weekly ingestion Action defaults to 12
lookups (`IMAGE_LOOKUP_LIMIT` variable); the standalone preview Action defaults
to 40, adjustable by manual input. It keeps a retry ledger in
`content/.research-image-checks.json` to avoid repeated lookups for unsuccessful
papers within 30 days (temporary API failures retry after 1 day). A whole run has a ~210 second image-work ceiling and
individual figure retrieval is bounded. Images are stored with the project:
there are no live hotlinks or third-party requests from visitors' browsers.

Manual commands:

```bash
python3 -m pip install -r scripts/research-images-requirements.txt
python3 scripts/research_images.py --backfill --limit 12
python3 scripts/research_images.py --backfill --slug an-existing-article-slug
python3 scripts/research_images.py --backfill --force --limit 8
python3 scripts/research_images.py --backfill --dry-run --limit 3
python3 -m unittest discover -s scripts -p research_images_test.py -v
```

`--force` bypasses the check ledger and will attempt to replace a previously
successful preview. `--dry-run` makes requests but never alters assets,
articles, or the check ledger. `--slug` limits work to one article.

## Diagnosing missing visuals

1. Check the "Find reusable paper figures" step in GitHub Actions logs.
2. Check the actual DOI resolves to a Europe PMC OA PMCID. Not every journal,
   paper or repository copy is in that subset.
3. Verify explicit compatible article and **figure** reuse terms. Never
   bypass the CC restrictions to populate a card.
4. Check whether a suitable `<fig><graphic>` exists and whether the figure
   download endpoint actually serves an image with sufficient resolution.
5. If an image is found, confirm the *same commit* contains both the WebP
   and changed JSON, and Vercel successfully built that commit.
6. `content/.research-image-checks.json` records unsuccessful attempts. Force
   a single recheck with `--slug ... --force` locally or wait 30 days.

A citation-cover card means no licensed paper figure is available in the
current deployed JSON or its referenced file is absent; it is the intentional
truthful fallback, not proof the AI ingester failed. The old generic category
art is never presented as the paper’s figure. Tests use mocked API payloads
and generated local test images. The final code was not live-tested against
Europe PMC from this offline packaging environment, so actual retrieval
coverage will only be known from Actions logs after deployment.

## Why screenshots showed old generic illustrations (2026-10-09 repair)

1. The former image pipeline searched **only** Europe PMC OA JATS records with
   an explicit CC licence and downloadable graphics; many DOIs do not qualify.
2. Until a **weekly ingestion run** or manual dispatch, the image step would not
   run at all after pushing the new image code.
3. Its previous fallback left the generated category illustration unchanged,
   so the website appeared to be ignoring the update even after a lookup.
4. The uploaded source ZIP predates later Actions-created `content/research/`
   articles. Their JSON is only in the remote branch, **not in this archive**.

**Now:** on the first deploy of the updated UI, paper-specific citation covers
replace those placeholders. A separate image Action attempts genuine figures
on relevant pushes without an AI key. Since the past failure ledger might
suppress rechecks for 30 days, the image extractor's cache version was bumped
so older negative decisions are attempted anew once. Actual figure coverage
still depends on accessible assets and rights; no licence is invented.

Check the separate `Research Paper Previews` workflow logs for a per-paper reason.
If it publishes WebP files but Vercel remains unchanged, compare the Vercel
production SHA to the image bot's commit SHA and use the optional
`VERCEL_DEPLOY_HOOK` secret if necessary.
