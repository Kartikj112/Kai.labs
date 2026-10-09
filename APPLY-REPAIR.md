# Applying the Research Intelligence visibility repair

**Use a fresh clone of your real GitHub default branch, not an old ZIP overwrite.**

Your October 9 PDF shows genuine articles that were **not** in the older input ZIP.
They may already be checked into the live GitHub repository. The repaired source
snapshot cannot reconstruct those JSON files from a screenshot. Do not delete them.

## Safest installation (patch against current source)

1. Clone your existing GitHub repository locally, or open an existing clone and
   `git pull` its production/default branch (usually `main`). Verify the real JSON
   articles are in `content/research/` before proceeding.
2. Place `Kai-Labs-research-feed-fix.patch` (provided alongside the ZIP) somewhere
   accessible, then, from the repository root, run:

   ```bash
   git apply --check /absolute/path/Kai-Labs-research-feed-fix.patch
   git apply /absolute/path/Kai-Labs-research-feed-fix.patch
   npm ci
   npm run test:research
   npm run build
   git add -A
   git commit -m "Fix Research Intelligence public feed and deployment"
   git push origin HEAD
   ```

   If `git apply --check` reports conflicts, do not force an archive overwrite.
   Incorporate the code changes manually or share the current branch snapshot
   and conflict details so they can be reconciled safely.
3. In Vercel, ensure the production deployment references that new Git commit.
   Hard-refresh `/research`. Only genuine article JSON should appear. If no real
   JSON was actually published on the current branch, the page will show an empty
   state rather than demonstration cards.
4. For future new research, run **GitHub → Actions → Research Intelligence → Run
   workflow** using the default branch and `dry_run=false`. Confirm a real JSON
   file was added, committed and pushed. Confirm a Vercel deployment for that
   commit. If the bot push does not trigger a Vercel deployment, create a
   production Deploy Hook in Vercel and save it as GitHub Actions secret
   `VERCEL_DEPLOY_HOOK` (see `docs/RESEARCH-INTELLIGENCE.md`).

## What changed

- Moved three dummy articles from `content/research` to `examples/research`.
- The server article loader refuses to expose drafts and samples, even when
  legacy files still exist in a separately maintained checkout.
- The featured article selector cannot pin an `isSample` or `Sample Entry` record.
- Publishing to a non-default branch now fails loudly rather than quietly
  leaving production unchanged.
- An **optional** Vercel Deploy Hook can be called after successful GitHub
  Actions publication; it does not replace checking Vercel build success.
- Added regression coverage and updated documentation.

The ZIP is a complete source snapshot for reference and fresh installations;
**it is not a current backup of your remote Actions-generated article files.**
