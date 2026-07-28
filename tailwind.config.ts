import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      // ── Color System ────────────────────────────────────────────────────────
      colors: {
        bg:       'var(--bg)',
        surface:  'var(--surface)',
        surface2: 'var(--surface-2)',
        hover:    'var(--hover)',
        border:   'var(--border-color)',
        text:     'var(--text)',
        muted:    'var(--muted)',
        accent:   'var(--accent)',
        accent2:  'var(--accent2)',
        warning:  '#ff6a2a',
      },

      // ── Spatiomorphic / neomorphic shape system ────────────────────────────
      borderRadius: {
        sm:  'var(--r-sm)',
        md:  'var(--r-md)',
        lg:  'var(--r-lg)',
        xl:  'var(--r-xl)',
        pill:'var(--r-pill)',
      },
      boxShadow: {
        'neo':        '12px 14px 30px var(--shadow-um), -9px -9px 22px var(--shadow-lu)',
        'neo-sm':     '7px 8px 18px var(--shadow-um), -6px -6px 14px var(--shadow-lu)',
        'neo-lift':   '20px 24px 44px var(--shadow-um-2), -10px -10px 28px var(--shadow-lu-2)',
        'neo-inset':  'inset 6px 6px 14px var(--shadow-um), inset -5px -5px 11px var(--shadow-lu)',
        'neo-elevated': '0 22px 48px var(--shadow-um-2), 0 2px 0 var(--shadow-lu) inset',
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono:    ['var(--font-mono)', 'monospace'],
        sans:    ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        '10': '10px',
        '11': '11px',
        '12': '12px',
        '13': '13px',
      },

      letterSpacing: {
        widest2: '0.25em',
        wide2:   '0.2em',
        wide1:   '0.15em',
        wide:    '0.12em',
        normal:  '0.08em',
        slight:  '0.05em',
        tight:   '-0.01em',
        tighter: '-0.02em',
        tightest:'-0.03em',
      },

      lineHeight: {
        hero:    '0.92',
        heading: '1.05',
        tight:   '1.15',
        snug:    '1.3',
        body:    '1.8',
        relaxed: '1.9',
        loose:   '2',
      },

      // ── Spacing ───────────────────────────────────────────────────────────
      spacing: {
        '18':  '72px',
        '22':  '88px',
        '25':  '100px',
        '30':  '120px',
      },

      // ── Animations ────────────────────────────────────────────────────────
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        scrollMove: {
          '0%':   { transform: 'translateY(0)',    opacity: '0.9' },
          '50%':  { transform: 'translateY(10px)', opacity: '1'   },
          '100%': { transform: 'translateY(0)',    opacity: '0.9' },
        },
        revealUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
      },
      animation: {
        'fade-up':     'fadeUp 1s ease forwards',
        'scroll-move': 'scrollMove 1.8s ease-in-out infinite',
        'reveal-up':   'revealUp 0.9s cubic-bezier(0.23, 1, 0.32, 1) forwards',
      },

      // ── Transitions ───────────────────────────────────────────────────────
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },

      // ── Grid ─────────────────────────────────────────────────────────────
      gridTemplateColumns: {
        'workshop': 'repeat(auto-fit, minmax(280px, 1fr))',
        'satellite': 'repeat(auto-fit, minmax(260px, 1fr))',
        'about': '1fr 1fr',
        'detail': '1fr 380px',
        'pub': '70px 1fr auto',
        'lecturer': '1fr 1fr',
      },

      maxWidth: {
        'hero':     '900px',
        'hero-sub': '460px',
        'headline': '700px',
        'pub':      '600px',
        'lecturer': '1200px',
      },
    },
  },
  plugins: [],
}

export default config
