# Kai Labs update — LinkedIn shelf + homepage photo gallery (2026-10-11)

## What is ready

- **Kai Blogs:** “Ideas in slides & stories” reading shelf with three real, publicly indexed LinkedIn post links from the provided profile, selectable LinkedIn embeds, and always-visible original-post links.
- **Your own PDF carousels:** Drop `.pdf` files into `public/LinkedIn_carousels/` and commit; they appear automatically in Kai Blogs on the next Vercel deployment, with a native in-page viewer and an Open PDF fallback. The archive contains no PDF files because none were supplied.
- **Homepage:** “Made of moments” gallery. Drop any `.jpg`/`.jpeg` files into `public/Display_pictures/`, commit, and redeploy. Files appear without editing components or a manifest. Crossfade, previous/next controls, touch swipes, focus/hover pause, reduced-motion support, and mobile layouts are built in. The archive contains no gallery photos because none were supplied.
- Updated `README.md` and `docs/ARCHITECTURE.md`, plus a hands-on operator guide in `docs/LINKEDIN-AND-HOMEPAGE-GALLERY.md`.

## Accurate limitations

- LinkedIn does **not** provide an unrestricted public personal-post feed; this feature uses curated post URLs, not background scraping or an automatically syncing LinkedIn API. It respects posts' public visibility and LinkedIn's embed restrictions.
- Some LinkedIn posts and document viewers cannot be embedded. Browser extensions and privacy settings can also block iframes. The **Open original post** link remains available; hosting your own PDF provides the most dependable on-site reading experience.
- The folders are scanned during Next.js rendering/build, **not live-watched**. Adding a file to GitHub only changes the public site after Vercel deploys that commit.
- Images or PDFs are not packaged because they were not supplied. The showcase is wired and will display them once you commit files into the respective folders.
- This archive is derived from the most recent ZIP shared in this conversation, which predates research articles published by GitHub Actions. **Do not delete newer `content/research/*.json` entries on your remote branch.** Keep existing original font assets in your repository as well.

## Quick checks

```bash
npm run test:social     # 7 new tests for filenames, URLs and post validation
npm run test:research   # 8 existing tests
python3 -m unittest scripts/research_images_test.py -q  # 10 existing tests
npm run build           # final build check on a machine with installed dependencies
```

The three LinkedIn links were verified as indexed public posts; in-site iframe behaviour still depends on LinkedIn/browser policies. The complete Next.js production build could not be executed in the packaging environment because npm dependencies could not be downloaded.
