// ── Shared site configuration ────────────────────────────────────────────────
// Set NEXT_PUBLIC_SITE_URL in Vercel's project environment variables to your
// production domain. It's used to build absolute URLs for canonical links,
// Open Graph images, and the sitemap. Falls back to a placeholder in local
// dev so nothing crashes if it isn't set yet.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://kailabs.co'
