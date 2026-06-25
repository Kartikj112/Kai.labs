// ── Kai Labs — About content ─────────────────────────────────────────────────

export const aboutLede =
  'Kai Labs is a scientific ecosystem for computational biology — a home for research, education, and the tools that connect them.'

export const missionStatement =
  'We build the research, the teaching, and the open tools that make computational biology more rigorous, more reproducible, and more accessible — so that good science is limited by curiosity, not by resources.'

export interface Pillar {
  index: string
  name: string
  blurb: string
  href: string
}

export const pillars: Pillar[] = [
  {
    index: '01',
    name: 'Kai Genomics',
    blurb: 'Research and bioinformatics education — workshops, publications, and an interactive decision engine.',
    href: '/genomics',
  },
  {
    index: '02',
    name: 'Kai Exchange',
    blurb: 'A free platform where scientists teach scientists. Host or attend community workshops — no paywalls.',
    href: '/exchange',
  },
  {
    index: '03',
    name: 'Research',
    blurb: 'Open questions across genomics, natural-product discovery, peptide design, and origin-of-life theory.',
    href: '/research',
  },
  {
    index: '04',
    name: 'Tools',
    blurb: 'Interactive computational-biology tools, starting with the Kai Decision Engine.',
    href: '/tools',
  },
]

export interface Principle {
  title: string
  body: string
}

export const principles: Principle[] = [
  {
    title: 'Open by default',
    body: 'Knowledge and tools should be shared. Community-driven education and reproducible workflows sit at the centre of what we build.',
  },
  {
    title: 'Rigour over hype',
    body: 'Methods are chosen because they are correct for the data — not because they are fashionable. Honest limitations are part of every result.',
  },
  {
    title: 'Wet-lab meets code',
    body: 'The best computational biology stays grounded in real experiments. We bridge microbiology at the bench with data-driven analysis.',
  },
]

// Founder bio — mirrors the Kai Genomics about section.
export const founderName = 'Kartik Juyal'
export const founderRole = 'Founder · Computational Biologist'
export const founderBio: string[] = [
  'Kartik is a computational biologist and bioinformatics researcher based in Goa, India. Currently a Project Associate II and PhD candidate at the CSIR–National Institute of Oceanography, he leads research on marine sponge-associated microbial communities for drug discovery.',
  'A self-taught computational biologist, he bridges wet-lab microbiology with data-driven genomic analysis — spanning genome mining, metagenomics, and the discovery of novel antimicrobial compounds, with results published in peer-reviewed journals.',
  'Kai Labs grew out of that work: a place to teach the methods openly, build tools others can use, and pursue the research questions that sit at the edge of genomics and the origin of life.',
]
