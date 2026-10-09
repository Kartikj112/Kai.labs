# Publishing this source update to the existing Kai Labs GitHub repository

This updated source archive was created from the older repository snapshot shared in
this conversation. It is designed to be **overlaid onto the current GitHub branch**,
not to replace newer generated files. Keep the genuine research article JSON files
already present under `content/research/` and the existing DOI-ledger file.
Those articles were generated *after* the original ZIP and are not available in
this local source archive.

The two local Geist Pixel `.woff2` files used by `src/app/layout.tsx` are not
redistributed with this updated source archive. Preserve the versions already
tracked in your existing GitHub repository under `src/app/fonts/`.

After the updated source is committed, Vercel should show research-specific
citation previews at once. A separate GitHub Actions workflow, **Research Paper
Previews**, will attempt to download reusable figures for genuine articles.
If it commits figure assets, Vercel must deploy that additional commit before
those verified figures can appear. For details, see `docs/RESEARCH-IMAGES.md`.
