# Open task — move display headings to Geist Pixel Circle

**Status:** not started. Investigated and specced only.
**Raised:** 10 Sep 2026, at the end of the session that shipped Geist Pixel Square.
**To resume:** point Claude at this file — "read `docs/geist-display-type.md` and implement it".

---

## The ask

The large headings across the site — `KaiLabs`, `Kai Genomics`, `Decode the invisible
microbiome.`, and every other H1/H2-tier heading — should render in **Geist Pixel Circle**,
not Cormorant Garamond.

This is a deliberate reversal of the scoping decision made when Geist Pixel was introduced.
That pass confined the pixel face to small metadata (eyebrows, step counters, index numerals)
and left Cormorant on all display type. The brief now is the opposite for the big tier.

---

## Current state (verified, not assumed)

`--font-display` (Cormorant Garamond) is referenced **48 times across 29 files**. Split by
rendered size:

- **23 usages at ≥28px** — the display tier. This is what changes.
- **25 usages below 28px** — card titles, publication rows, sidebar values, stat figures.
  These should almost certainly **stay Cormorant** (see "Where to stop", below).

### The 23 display-tier usages

| px (max) | Size declaration | File:line |
|---:|---|---|
| 184 | `clamp(64px, 13vw, 184px)` | `src/app/(site)/page.tsx:48` — **KaiLabs** |
| 120 | `clamp(44px, 9vw, 120px)` | `src/components/sections/Hero/Hero.tsx:60` — **Decode the invisible microbiome.** |
| 104 | `clamp(48px, 9vw, 104px)` | `src/components/labs/ComingSoon.tsx:33` |
| 104 | `clamp(48px, 9vw, 104px)` | `src/app/(site)/tools/page.tsx:20` |
| 96 | `clamp(42px, 8vw, 96px)` | `src/components/sections/Contact/Contact.tsx:62` |
| 88 | `clamp(40px, 7vw, 88px)` | `src/components/sections/Workshops/WorkshopDetail.tsx:53` |
| 84 | `clamp(42px, 7vw, 84px)` | `src/app/(site)/research/page.tsx:33` |
| 82 | `clamp(40px, 6.5vw, 82px)` | `src/app/(site)/about/page.tsx:32` |
| 72 | `clamp(36px, 6vw, 72px)` | `src/components/sections/Workshops/Workshops.tsx:25` |
| 68 | `clamp(36px, 6vw, 68px)` | `src/components/sections/LecturerApplication/LecturerApplication.tsx:81` |
| 66 | `clamp(38px, 6vw, 66px)` | `src/app/(site)/exchange/host/page.tsx:18` |
| 64 | `clamp(32px, 5vw, 64px)` | `src/components/sections/Publications/Publications.tsx:16` |
| 64 | `clamp(32px, 5vw, 64px)` | `src/components/sections/About/About.tsx:55` |
| 64 | `clamp(32px, 5.4vw, 64px)` | `src/app/(site)/research/[slug]/page.tsx:91` |
| 62 | `clamp(34px, 6vw, 62px)` | `src/app/(site)/exchange/workshops/[slug]/page.tsx:70` |
| 60 | `clamp(34px, 6vw, 60px)` | `src/app/(site)/exchange/apply/[slug]/page.tsx:31` |
| 44 | `44` | `src/app/admin/(protected)/page.tsx:34` |
| 42 | `clamp(28px, 3.2vw, 42px)` | `src/components/research/FeaturedResearch.tsx:72` |
| 34 | `34` | `src/app/(site)/about/page.tsx:148` (founder name) |
| 34 | `clamp(22px, 3.4vw, 34px)` | `src/app/(site)/about/page.tsx:54` (mission statement) |
| 28 | `28` | `src/components/labs/FeatureCard.tsx:62` |
| 28 | `28px` | `src/app/globals.css:849` |
| 28 | `28` | `src/app/globals.css:660` |

Also relevant: `.node-title` in `src/app/engine/engine.css` (`clamp(26px, 5vw, 44px)`) is the
Decision Engine's heading and is hard-coded to `'Cormorant Garamond'` rather than the token.

---

## Blockers and decisions needed

### 1. Geist Pixel Circle is not in the repo

Only `GeistPixel-Square.woff2` was vendored. The `geist` npm package was uninstalled after
vendoring, so Circle has to be re-obtained:

```bash
npm i geist                      # temporary
cp node_modules/geist/dist/fonts/geist-pixel/GeistPixel-Circle.woff2 src/app/fonts/
npm uninstall geist
```

Then declare it alongside the existing Square face in `src/app/layout.tsx`:

```ts
const geistPixelCircle = localFont({
  src: './fonts/GeistPixel-Circle.woff2',
  variable: '--font-geist-pixel-circle',
  weight: '500',
  display: 'swap',
  fallback: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  adjustFontFallback: false,
})
```

…add `geistPixelCircle.variable` to the `<html>` className, and add a
`--font-pixel-display: var(--font-geist-pixel-circle)` token in `globals.css`.

**Do not reference the literal family name `'Geist Pixel Circle'`.** `next/font` registers
the face under a hashed name; the literal silently falls back to the platform monospace,
which on Windows is Consolas and looks plausible enough to pass a visual check. This exact
mistake shipped once already in this project. Verify by measuring rendered text width against
a guaranteed-missing family — computed style and `font-family` inspection both report the
*declared* stack and will look correct even when the font is broken.

### 2. There is no italic — this is the significant design decision

13 headings set an accent word in Cormorant **italic**:

```
src/app/(site)/page.tsx:54                      Kai<em>Labs</em>
src/components/sections/Hero/Hero.tsx:73        <em>invisible</em>
src/components/sections/Workshops/Workshops.tsx:37   <em>next generation</em>
src/components/sections/Contact/Contact.tsx:70  <em>science</em>
src/components/sections/About/About.tsx:66      <em>algorithm.</em>
src/components/sections/Publications/Publications.tsx:24  <em>microbial genomics.</em>
src/app/(site)/research/page.tsx:40             <em>Research Intelligence.</em>
src/app/(site)/tools/page.tsx:25                <em>tools</em>
src/app/(site)/exchange/page.tsx:28             <em>scientists.</em>
src/app/(site)/exchange/host/page.tsx:19        <em>workshop</em>
src/app/(site)/exchange/apply/[slug]/page.tsx:32  <em>attend</em>
src/components/sections/LecturerApplication/LecturerApplication.tsx:88  <em>Satellite Lecturer</em>
src/components/sections/Workshops/WorkshopDetail.tsx:61  <em>{word}</em>
```

Geist Pixel ships **one weight (500) and no italic**. A synthetic oblique on a bitmap face
looks broken — the pixel grid shears. So the accent word currently carries *two* signals
(italic + oxblood) and would drop to *one* (oxblood only). Confirmed visually in the specimen.

Options, in the order I'd suggest trying them:

- **(a) Colour only.** Simplest. Accent word is just oxblood. Slight loss of emphasis.
- **(b) Colour + a second pixel variant.** Set the accent word in Geist Pixel **Line** or
  **Grid** against Circle for the rest. Different texture, same grid — this is what the five
  shape variants are *for*, and it is the most idiomatic use of the family.
- **(c) Keep Cormorant italic for accent words only.** Mixed-face heading. Can look
  deliberate or can look like a bug; needs to be seen.
- **(d) Colour + underline/strike or a background block.** Heaviest-handed.

**(b) is the interesting one** and is worth prototyping first.

### 3. Metrics will need retuning

Geist Pixel is monospaced. Measured against Georgia at identical size, Circle runs **0–7%
wider**:

| String | Size | Circle | Georgia | Δ |
|---|---:|---:|---:|---|
| `KaiLabs` | 184px | 692px | 661px | +5% |
| `Decode the` | 120px | 629px | 592px | +6% |
| `microbiome.` | 120px | 670px | 672px | 0% |
| `Research Intelligence.` | 84px | 881px | 820px | +7% |
| `Hands-on training` | 72px | 621px | 590px | +5% |

Caveat: Georgia is a *proxy*. Cormorant is a narrower, higher-contrast serif than Georgia, so
the real delta against Cormorant will be larger than these numbers. Re-measure against the
actual loaded Cormorant before finalising the clamps.

Concretely, expect to:

- Reduce the `vw` term and the max in each `clamp()` — start around −8% and check.
- Revisit `letterSpacing`. The headings use `-0.02em` to `-0.04em` (tightening a serif).
  A pixel face on a fixed grid generally wants `0` or slightly positive; negative tracking
  will collide the glyph cells.
- Revisit `lineHeight`. `0.92` is set for Cormorant's small x-height and long descenders.
  Geist Pixel has a large x-height and short descenders — `0.92` will look cramped; expect
  `1.0`–`1.1`.
- Check the narrow breakpoint (~400px) specifically. The clamp *minimums* (44–64px) are where
  a monospace face is most likely to overflow, not the maximums.

### 4. Where to stop

The 25 sub-28px Cormorant usages are a real fork in the road, and it's a taste call:

- **Keep them Cormorant** → the site retains a serif voice and gains a pixel display voice.
  Three-face hierarchy stays legible. *This is my recommendation.*
- **Convert everything** → Cormorant leaves the site entirely. Cleaner, more uniform, more
  "terminal", but loses the editorial warmth that currently distinguishes Kai Labs from
  every other dark-mode dev-tool site.

Worth deciding explicitly before starting, because it changes whether `--font-display` is
*re-pointed* (global, one-line) or whether a *new* `--font-pixel-display` token is introduced
and applied to 23 sites (surgical).

---

## Verified findings from the specimen

Rendered Circle at 88px against the real headline strings:

- **It looks good at display size.** The circular-dot texture is clearly visible and
  attractive at 88px+. `KaiLabs` and `Decode the invisible microbiome.` both read well.
- **Glyph coverage is complete** for everything the site uses: em dash, middle dot,
  ampersand, right single quote, ×, é, ü, digits, parentheses, brackets, slash. No `.notdef`
  boxes.
- **The texture fades below ~40px.** At 40px Circle reads as a fairly plain monospace and the
  pixel character is largely lost. This *supports* confining Circle to the display tier —
  using it at 20–28px buys the legibility cost without the visual payoff.

---

## Suggested order of work

1. Vendor `GeistPixel-Circle.woff2`, declare it, add the token. Verify it actually paints
   (width measurement, not computed style).
2. Prototype on **two** headings only — `page.tsx:48` (KaiLabs) and `Hero.tsx:60` (Decode the
   invisible microbiome) — and settle the italic question (§2) and the metrics (§3) there.
3. Screenshot at 1440px, 900px and 400px before rolling out.
4. Once the treatment is agreed, apply to the remaining 21 display-tier sites.
5. Decide §4 (sub-28px) explicitly.
6. Update the Typography section of `README.md` — it currently documents the *old* rule
   ("display carries meaning, mono carries content, pixel carries metadata") and states that
   the pixel face is never used for headlines. That will be wrong after this change.
7. `npm run build && npm run lint`, then visual check on the deploy.

---

## Reference

- Geist Pixel ships five shape variants: Square (in use), **Circle** (wanted), Grid, Line,
  Triangle. All single weight 500, all no italic, all ~28 KB.
- Source: `node_modules/geist/dist/fonts/geist-pixel/` after `npm i geist`.
- Licence: SIL OFL. `src/app/fonts/GeistPixel-LICENSE.txt` already covers the family; no new
  licence file needed when adding Circle.
- Existing Square setup to mirror: `src/app/layout.tsx` (declaration), `src/app/globals.css`
  (`--font-pixel`, `.pixel-label`, `.pixel-num`), `src/app/engine/engine.css` (engine labels).
