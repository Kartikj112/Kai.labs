// ── Kai Labs — Research content ──────────────────────────────────────────────
// Research directions across the ecosystem. Edit freely.

export interface ResearchArea {
  id: string
  index: string
  title: string
  summary: string
  tags: string[]
}

export const researchAreas: ResearchArea[] = [
  {
    id: 'sponge-microbiomes',
    index: '01',
    title: 'Marine Sponge Microbiomes',
    summary:
      'Marine sponges host dense, host-specific microbial communities — holobionts that are among the richest sources of bioactive natural products. We reconstruct these communities from shotgun metagenomes, recover metagenome-assembled genomes (MAGs), and map the metabolic interdependencies that keep many of these microbes uncultivable.',
    tags: ['Metagenomics', 'MAGs', 'Holobiont', 'Indian Ocean'],
  },
  {
    id: 'genome-mining',
    index: '02',
    title: 'Genome Mining & Natural Products',
    summary:
      'Biosynthetic gene clusters (BGCs) encode the enzymes behind antibiotics, antifungals, and other therapeutics. We mine sponge-associated genomes for novel BGCs, rank them by distance from known clusters, and prioritise the most promising candidates for experimental characterisation.',
    tags: ['BGCs', 'antiSMASH', 'NRPS / PKS', 'Drug Discovery'],
  },
  {
    id: 'antimicrobial-peptides',
    index: '03',
    title: 'Antimicrobial Peptides',
    summary:
      'Short, charged peptides offer a route around classical antibiotic resistance. We design and evaluate antimicrobial peptide (AMP) candidates end to end — from sequence and structure prediction through biophysical modelling and activity assessment against priority pathogens.',
    tags: ['AMPs', 'Peptide Design', 'Structure Prediction', 'AMR'],
  },
  {
    id: 'origin-of-life',
    index: '04',
    title: 'Origin of Life & Assembly Theory',
    summary:
      'Alongside applied genomics, an ongoing theoretical thread asks how life-like, self-sustaining chemistry emerges from non-living matter — connecting Markov processes, autocatalytic sets, and Assembly Theory through computational models and simulation.',
    tags: ['Origin of Life', 'Assembly Theory', 'Autocatalysis', 'Theory'],
  },
]
