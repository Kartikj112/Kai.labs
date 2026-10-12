# KAI AMP-ASM — Tools integration

This change adds a KAI AMP-ASM card to `/tools` and a stable launch URL at `/tools/amp-agent`. No AMP prediction algorithms are copied into this website.

## Deployment (required)

1. In Vercel, **Add New > Project**, import your separate **Kai-AMP-ASM** GitHub repository.
2. Select **Next.js**, project root `.` (the folder containing its `package.json`), Node >=20, and run the default `npm install` and `npm run build`.
3. Wait for a successful deployment. Confirm `https://YOUR-AMP-PROJECT.vercel.app/api/health` and `https://YOUR-AMP-PROJECT.vercel.app/tools/amp-agent` resolve.
4. In the existing **Kai.labs** Vercel project, navigate to **Settings > Environment Variables**, add:
   `AMP_ASM_APP_URL=https://YOUR-AMP-PROJECT.vercel.app`
   Set it for Production (and Preview if appropriate). **Use only the origin, with no trailing path.**
5. Redeploy Kai.labs after adding the environment variable.
6. Go to `https://kai-genomics.vercel.app/tools`; select the **KAI AMP-ASM** card. The stable `/tools/amp-agent` route redirects to the separate running app.

If no environment variable is configured, the launcher displays a safe setup-pending page rather than redirecting to a guessed address.

## Why separate repositories?

The public website handles discovery and navigation. The separate AMP-ASM deployment owns the analysis UI, ranking API, and source access. Future authenticated back-end API proxies can be added as a separate change; **this integration is a link only**, not a shared auth layer.

## Scientific caution

AMP-ASM v0.2 reports exploratory candidate ranking rather than experimentally validated AMP activity, MIC, toxicity, or novelty. Test live source availability, Vercel build, and abuse-prevention limits before inviting public large-scale usage.
