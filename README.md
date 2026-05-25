# Kai Genomics — Next.js Migration

> Same brand identity. Modern architecture.

A production-grade Next.js 15 rebuild of the Kai Genomics static GitHub Pages website — preserving every visual, typographic, and interactive detail while delivering a scalable, maintainable, component-based codebase.

---

## Stack

| Layer        | Technology                                |
|--------------|-------------------------------------------|
| Framework    | Next.js 15 (App Router)                   |
| Language     | TypeScript (strict)                       |
| Styling      | Tailwind CSS + CSS custom properties      |
| Fonts        | Google Fonts via `next/font` (zero layout shift) |
| Deployment   | Vercel                                    |
| Analytics    | Google Analytics 4                        |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev
# → http://localhost:3000

# 3. Production build
npm run build && npm start
```

---

## Project Structure

```
kai-genomics/
├── public/
│   └── shlok.png                   # Satellite instructor photo
│
├── src/
│   ├── app/
│   │   ├── globals.css             # Design tokens, base styles, animations
│   │   ├── layout.tsx              # Root layout: fonts, metadata, theme script
│   │   └── page.tsx                # Main page — orchestrates all sections
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Nav.tsx             # Fixed navigation + theme toggle + back button
│   │   │   └── Footer.tsx          # Site footer
│   │   │
│   │   ├── ui/
│   │   │   ├── CustomCursor.tsx    # Dot + ring cursor (pointer devices only)
│   │   │   └── SectionLabel.tsx    # Mono-uppercase section eyebrow labels
│   │   │
│   │   └── sections/
│   │       ├── Hero/
│   │       │   ├── Hero.tsx        # Full-viewport hero section
│   │       │   └── DnaCanvas.tsx   # Animated 5-strand DNA helix canvas
│   │       │
│   │       ├── Workshops/
│   │       │   ├── Workshops.tsx       # Workshop grid section
│   │       │   ├── WorkshopCard.tsx    # Individual workshop card
│   │       │   ├── WorkshopDetail.tsx  # Full-page detail view
│   │       │   └── InterestPanel.tsx   # Yes/No interest vote widget
│   │       │
│   │       ├── About/
│   │       │   └── About.tsx       # Instructor bio + stat rows
│   │       │
│   │       ├── Publications/
│   │       │   └── Publications.tsx  # Paper list + satellite instructors grid
│   │       │
│   │       ├── Instructors/
│   │       │   └── SatelliteCard.tsx  # Expandable instructor card
│   │       │
│   │       ├── LecturerApplication/
│   │       │   ├── LecturerApplication.tsx  # Split-layout section
│   │       │   └── ApplicationForm.tsx      # Google Forms-integrated form
│   │       │
│   │       └── Contact/
│   │           └── Contact.tsx     # Contact section + social links
│   │
│   ├── lib/
│   │   ├── data/
│   │   │   ├── workshops.ts        # All 6 workshop definitions (full detail)
│   │   │   └── content.ts          # Publications, satellite instructors, stats
│   │   │
│   │   ├── hooks/
│   │   │   ├── useScrollReveal.ts  # IntersectionObserver-based reveal
│   │   │   ├── useTheme.ts         # Dark/light toggle + localStorage persistence
│   │   │   └── useCursor.ts        # Custom cursor mouse tracking
│   │   │
│   │   ├── types/
│   │   │   └── index.ts            # All shared TypeScript types
│   │   │
│   │   └── utils.ts                # cn() classname helper
│   │
│   └── providers/
│       └── ThemeProvider.tsx       # Syncs theme to DOM on mount
│
├── tailwind.config.ts              # Full design token system
├── tsconfig.json
├── next.config.ts
├── postcss.config.js
├── vercel.json
└── .eslintrc.json
```

---

## Design System

### Color Tokens (CSS custom properties)

| Token            | Dark                      | Light                     |
|------------------|---------------------------|---------------------------|
| `--bg`           | `#050507`                 | `#f5f2eb`                 |
| `--surface`      | `#0c0c10`                 | `#ffffff`                 |
| `--text`         | `#f0ede8`                 | `#111827`                 |
| `--muted`        | `rgba(240,237,232, 0.4)`  | `rgba(17,24,39, 0.62)`    |
| `--accent`       | `#b8f5c8`                 | `#1f8a5b`                 |
| `--accent2`      | `#7de8b0`                 | `#2aa86b`                 |
| `--border-color` | `rgba(255,255,255, 0.07)` | `rgba(15,23,42, 0.10)`    |
| `--hover`        | `#111116`                 | `#f0ebe2`                 |

### Typography

| Role    | Font               | Usage                            |
|---------|--------------------|----------------------------------|
| Display | Cormorant Garamond | Headlines, hero, section titles  |
| Mono    | DM Mono            | Labels, tags, nav, body copy     |
| Sans    | Syne               | Logo, UI elements                |

---

## Theme System

Theme is managed through a `data-theme` attribute on `<html>`:
- Defaults to dark
- Persisted in `localStorage` under key `kai-theme`
- An inline `<script>` in `layout.tsx` applies the saved theme **before first paint** — no flash of wrong theme
- Toggle button in the nav bar

---

## Deployment to Vercel

### One-click
1. Push this repository to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Vercel auto-detects Next.js — click **Deploy**

### CLI
```bash
npm i -g vercel
vercel --prod
```

No environment variables are required for the base site.

---

## Adding Content

### New workshop
Edit `src/lib/data/workshops.ts` — add an entry to the `workshops` array following the existing shape. The card and detail page generate automatically.

### New publication
Edit `src/lib/data/content.ts` — add to the `publications` array.

### New satellite instructor
Edit `src/lib/data/content.ts` — add to the `satelliteInstructors` array. Place the photo in `/public/` and reference it in `photoSrc`.

---

## Future Expansion (Architecture Ready)

The codebase is structured to support:

| Feature                           | Path                                  |
|-----------------------------------|---------------------------------------|
| Scientific blog / MDX content     | `src/app/blog/[slug]/page.tsx`        |
| Genomics education platform       | `src/app/learn/[course]/page.tsx`     |
| Interactive bioinformatics tools  | `src/app/tools/[tool]/page.tsx`       |
| Research showcases                | `src/app/research/page.tsx`           |
| Computational biology dashboards  | `src/app/dashboard/page.tsx`          |
| Workshop registration (Stripe)    | `src/app/api/register/route.ts`       |
| Auth (NextAuth)                   | `src/app/api/auth/[...nextauth]/`     |

Each new section follows the same pattern: `src/lib/data/<feature>.ts` → `src/components/sections/<Feature>/` → `src/app/<route>/page.tsx`.

---

## Scripts

```bash
npm run dev      # Development server with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## License

© Kai Genomics. All rights reserved.
