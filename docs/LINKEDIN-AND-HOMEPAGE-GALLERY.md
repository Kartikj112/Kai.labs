# LinkedIn showcase and Kai Labs photo gallery

_Last reviewed 2026-10-11. Both features are part of the static Next.js site. No account credentials, LinkedIn API tokens, or new runtime services are required._

## Kai Blogs — “Ideas in slides & stories”

Visit `/blog`. The new LinkedIn section has a selectable reading shelf on the left and a reading window on the right (stacked on narrow screens). A selection can be:

- a **public LinkedIn post** rendered with LinkedIn's official embed URL (including document posts when LinkedIn makes the viewer available);
- an **original PDF carousel** that you own, served from this website and shown in the in-page PDF viewer.

On mobile, the reading shelf is horizontally scrollable, and the reader is full width. Every entry has an external/open PDF link in case the embedded viewer is blocked or incompatible with that device. There is **no automatic LinkedIn account feed**: the profile page does not offer a stable public API for this, and we do not scrape a personal account.

### Add more public LinkedIn posts

Edit `content/social/linkedin-posts.json` and add entries in this shape:

```json
{
  "title": "A short descriptive headline",
  "summary": "One sentence on what readers will find.",
  "label": "Science stories",
  "url": "https://www.linkedin.com/posts/your-profile_some-text-activity-1234567890123456789-ABCD"
}
```

All four fields are strings; `title` and `url` are required. **Use the URL of a specific public post**, not your LinkedIn profile URL. The app extracts its activity ID, checks that the URL is HTTPS and on `linkedin.com`, deduplicates IDs, and builds the official iframe address. The current JSON is seeded with three publicly indexed posts from the supplied profile.

To find a usable post, open it on LinkedIn desktop, choose **••• → Embed this post** (if offered), and copy the original public post link or the URL from the iframe. LinkedIn may disable embedding for some posts, or privacy/ad blockers may prevent the iframe from loading. Visitors can always select **Open original post**. Posts that are deleted or changed to a non-public audience can disappear from the reader. Public document posts can be embedded, subject to LinkedIn's reader limitations.

### Add original PDF carousels (no JSON editing required)

Place your own PDFs in `public/LinkedIn_carousels/`:

```text
public/LinkedIn_carousels/
  Genome-Mining-Explained.pdf
  A-Guide-to-BGCs.pdf
```

Every `.pdf` file in this folder (case insensitive) is automatically shown at the top of the reading shelf after you **commit and Vercel deploys**. Its filename becomes a readable title. The site uses the browser's built-in PDF rendering; iOS/Android support can vary, so the **Open full PDF** link remains available. PDFs are public static files: **only place material you have rights to publish, and avoid private/sensitive content**. Prefer compressed PDFs for good loading speeds; large PDFs load only after a reader selects them. You can link the matching LinkedIn post separately in the JSON.

The PDF is hosted on Kai Labs. The public LinkedIn posts are displayed from LinkedIn's servers; we do not download or mirror post contents.

## Homepage — “Made of moments”

Create/keep this folder in the repository (the ZIP includes it with a `.gitkeep` file):

```text
public/Display_pictures/
  First-Workshop.jpg
  Team-at-work.jpeg
  Research-Achievement.JPG
```

Every top-level `.jpg` or `.jpeg` (case insensitive) appears in the homepage gallery, sorted naturally by filename (`01`, `02`, `10`, etc.). Files in nested directories, symlinks, and other formats are ignored. The human-readable filename appears as its caption (for example, `Lab-Workshop-2026.jpg` becomes `Lab Workshop 2026`). Numeric camera filenames become a generic caption; descriptive filenames produce better captions.

**How updating works:** Commit the images to your GitHub default branch. Vercel must build a new deployment for the static listing to update. Merely putting a file on your local machine will not update production. There is no backend watcher or upload API. This design avoids runtime file enumeration and database/API requirements.

The gallery uses locally served images with Next.js optimizations, one image at a time plus the outgoing image during a fade, and a 6.4-second automatic interval. Visitors can use the previous/next buttons, progress controls and touch swipes. It pauses while hovered/focused, skips background tabs, and honours reduced-motion preferences (no automatic progression). If the folder is empty, a small editorial placeholder describes the intended future content; no example images are falsely represented as real achievements.

### Recommendations for photos

- Use landscape photos where possible; the viewport crops with `object-fit: cover` to keep a clean edge-to-edge gallery.
- Keep text and faces away from the extreme edges. For photo credits or captions, use descriptive filenames.
- Compress source images to roughly 1600–2400px wide and ideally under 1–2 MB each, preserving useful detail.
- Only publish workshop/attendee photos with appropriate consent. Avoid any confidential research or personal information.
- Git can store photos, but hundreds of multi-megabyte images will make the repository heavy. Consider object storage/CDN if the collection grows substantially.

## Implementation boundaries

| Feature | Source of truth | Server phase | Browser phase |
|---|---|---|---|
| Public LinkedIn posts | `content/social/linkedin-posts.json` | parse/validate, derive iframe URL | show selected external embed |
| Own PDF carousels | `public/LinkedIn_carousels/*.pdf` | scan folder, create metadata | selected browser PDF viewer |
| Achievements gallery | `public/Display_pictures/*.{jpg,jpeg}` | scan folder, create sorted metadata | responsive crossfade and controls |

Files: `src/lib/social/{linkedin,asset-loader}.ts`, `src/components/social/LinkedInShowcase.tsx`, `src/components/labs/DisplayGallery.tsx`, `/blog` and `/` route files, and `src/app/globals.css`. Tests: `npm run test:social`.

These components require no secrets. **LinkedIn does not supply a complete, continuously synced personal-post feed** without relevant API authorization. The curated file is intentional and should not be replaced with an automated LinkedIn scraper.
