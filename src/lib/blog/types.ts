// ── Kai Blogs — content schema ──────────────────────────────────────────────
// A post is one Markdown file in `content/blog/`, with a short frontmatter
// block on top. Only `title` and `date` are required; everything else has a
// sensible default, so a new thought can be published with four lines of
// header and whatever you want to say underneath.
//
//   ---
//   title: On reading papers slowly
//   date: 2026-09-21
//   excerpt: One line for the index. Optional — the first paragraph is used otherwise.
//   tags: [genomics, method]
//   ---

export interface BlogPost {
  slug: string
  title: string
  /** ISO date string, e.g. "2026-09-21" */
  date: string
  /** For the index. Falls back to the first paragraph when not written. */
  excerpt: string
  /** The excerpt only when the author wrote one — shown as the post's stand-first. */
  dek?: string
  tags: string[]
  author: string
  /** Optional cover image, a path under /public or an absolute URL. */
  cover?: string
  /** Pins this post as the lead on the index. Otherwise the newest leads. */
  featured: boolean
  /** Hidden in production; shown with a badge under `npm run dev`. */
  draft: boolean
  /** Raw Markdown body, frontmatter removed. */
  body: string
  readingTime: string
}
