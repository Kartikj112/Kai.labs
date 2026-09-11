# Display type — Geist Pixel Circle

**Status:** done, 11 Sep 2026. The rule now lives in the Typography section of `README.md`;
this file records the decisions and the measurements behind them, which the README doesn't
have room for.

---

## What shipped

Every heading rendered at **40px and up** is Geist Pixel Circle. Cormorant Garamond keeps
everything below that — card titles, publication rows, sidebar values, stat figures, the
About mission statement. The site still has a serif voice; it moved down one level.

`GeistPixel-Circle.woff2` is vendored beside Square in `src/app/fonts/` (28 KB, SIL OFL,
covered by the existing licence file). It's declared in `src/app/layout.tsx` and exposed as
`--font-pixel-display` in `globals.css`, mirroring the `--font-pixel` setup for Square.

## The three decisions

### 1. Accent words: colour only

13 headings set an accent word in Cormorant italic. Geist Pixel ships one weight and no
italic, and a synthetic oblique shears the pixel grid, so `<em>` inside a display heading is
now `fontStyle: 'normal'` and the accent carries oxblood alone.

A specimen compared this against setting the accent in a second pixel variant (Circle body +
Line, Grid or Square accent). Line and Grid are *hollower* than Circle, so the accent read as
less emphasis than the text around it — the opposite of what italic did. Square read as more
and was the strongest of the alternatives, but colour-only was chosen for uniformity. If the
accent ever needs more weight, Square is the variant to reach for and it's already vendored.

### 2. The threshold is 40px, not 28px

Circle's dot texture is only visible above roughly 40px. Below that it flattens into a plain
monospace and stops being distinguishable from DM Mono, which collapses the card hierarchy —
this was visible on the homepage `FeatureCard` titles at 28px and they were reverted.

Also reverted for the same reason, or because they aren't headings:

- `FeatureCard` h3 (28px), `.mobile-menu a` (28px), the About founder name (34px)
- The About mission statement (`clamp(22px, 3.4vw, 34px)`) — 206 characters of prose
- `.contact-watermark` (28vw) — at 1.8% opacity the dot grid resolves into visible speckle
  behind the copy rather than a ghost letterform

### 3. Metrics

Measured against the **actually loaded** Cormorant (not the Georgia proxy used in the
original spec, which understated it badly):

| String | Size | Cormorant | Circle | Δ |
|---|---:|---:|---:|---:|
| `KaiLabs` | 184px | 576 | 692 | +20% |
| `Decode the` | 120px | 525 | 629 | +20% |
| `microbiome.` | 120px | 589 | 670 | +14% |
| `Research Intelligence.` | 84px | 712 | 881 | +24% |
| `Hands-on training` | 72px | 520 | 621 | +19% |

Circle runs 14–24% wider. Despite that, the display headings had 200–350px of headroom at
1440px, so the clamps went **up** about 8% rather than down — the dot texture is the point of
the face and it reads better larger. Per heading: `letterSpacing: 0` (negative tracking
collides the glyph cells) and `lineHeight: 1.04` (the old `0.92` was tuned for Cormorant's
short x-height and long descenders).

Two headings needed individual attention:

- **`/tools` h1** — `Computational` is one unbreakable 13-character word and overflowed at
  400px. Clamp minimum dropped 48px → 40px.
- **About lede** — 126 characters, three times longer than any other headline, inside a
  1000px-capped section. Sized down to `clamp(32px, 5.2vw, 62px)` so it holds roughly the
  line count Cormorant did at 82px.

## Headings the original spec missed

The spec's table of 23 omitted four sites that are display tier by the size rule. Three were
converted: `(site)/exchange/page.tsx:25` (92px), and the two admin `Pending …` h1s at 40px.
Plus `.hub-title` in `engine.css` (the Decision Engine landing h1, hard-coded Cormorant like
`.node-title`).

Not converted: `admin/(protected)/page.tsx:20`, a 52px stat **figure** rather than a heading.
Numerals already have a pixel voice in `.pixel-num` (Square); putting a dashboard stat in
Circle would be a second, competing one.

## Verifying the face actually paints

`next/font` registers the face under a hashed name, so a literal `'Geist Pixel Circle'`
silently falls back to the platform monospace — Consolas on Windows, which looks plausible.
Inspecting `font-family` or computed style reports the *declared* stack and will look correct
even when the font is broken.

Measure rendered text width against a deliberately missing family instead. In the production
build, `KaiLabs — 0123` at 100px: Circle 752.4px, missing-family control 769.7px. Different,
so the face is really painting.

## Verified

- `npm run lint` — clean (one pre-existing GA `next-script-for-ga` warning)
- `npm run build` — passes, 38 static pages
- Production build audited at 400 / 900 / 1440 across 11 routes: no pixel heading overflows
  its box, no page scrolls horizontally

One unrelated pre-existing issue turned up: `/engine` at 400px overflows by 17px from the
decorative `.aurora-field` background div. Not typography, not touched.
