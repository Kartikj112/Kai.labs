import type { Metadata } from 'next'
import { Cormorant_Garamond, DM_Mono, Syne } from 'next/font/google'
import localFont from 'next/font/local'
import { CustomCursor } from '@/components/ui/CustomCursor'
import { SITE_URL } from '@/lib/site-config'
import '@/app/globals.css'

// ── Font Definitions ─────────────────────────────────────────────────────────
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

// Geist Pixel Square — the instrument-readout voice.
//
// Vendored as a single woff2 rather than imported from the `geist` package:
// `geist/font/pixel` evaluates all five shape variants, so Next preloads
// ~140 KB of fonts when only one is ever used. This is ~28 KB, one preload.
// SIL OFL — license sits next to the file in ./fonts/.
//
// Reserved for small, uppercase, wide-tracked metadata: eyebrows, section
// labels, step counters, index numerals, status pills. Never for headlines
// (that's Cormorant) or prose (that's DM Mono) — a bitmap face stops being
// legible the moment it has to carry a sentence.
const geistPixel = localFont({
  src: './fonts/GeistPixel-Square.woff2',
  variable: '--font-geist-pixel-square',
  weight: '500',
  display: 'swap',
  fallback: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  adjustFontFallback: false,
})

// Geist Pixel Circle — the display voice. Carries every heading at 28px and up.
//
// Circle's dot texture only reads above ~40px; below that it flattens into a
// plain monospace, which is why the display tier is where it lives and why
// Cormorant keeps everything smaller. Same vendoring rationale as Square.
const geistPixelCircle = localFont({
  src: './fonts/GeistPixel-Circle.woff2',
  variable: '--font-geist-pixel-circle',
  weight: '500',
  display: 'swap',
  fallback: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
  adjustFontFallback: false,
})

// ── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Kai Labs — A Scientific Ecosystem',
    template: '%s',
  },
  description:
    'A scientific ecosystem for computational biology, genomics, AI, and community-driven learning. Home of Kai Genomics and Kai Exchange.',
  keywords: [
    'computational biology', 'bioinformatics', 'genomics', 'metagenomics',
    'scientific community', 'workshops', 'AI', 'antimicrobial peptides',
    'natural product discovery', 'Kai Labs', 'Kai Genomics', 'Kai Exchange',
  ],
  authors: [{ name: 'Kartik Juyal' }],
  openGraph: {
    title: 'Kai Labs — A Scientific Ecosystem',
    description: 'Computational biology, genomics, AI, and community-driven learning. Research. Learn. Build.',
    type: 'website',
  },
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // Site is dark-theme only.
      data-theme="dark"
      className={`${cormorant.variable} ${dmMono.variable} ${syne.variable} ${geistPixel.variable} ${geistPixelCircle.variable}`}
    >
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RSLMRHVZN1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RSLMRHVZN1');
            `,
          }}
        />
      </head>
      <body>
        <CustomCursor />
        {children}
      </body>
    </html>
  )
}
