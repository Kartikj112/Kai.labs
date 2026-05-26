import type { Publication, SatelliteInstructor, StatRow } from '@/lib/types'

// ── Publications ─────────────────────────────────────────────────────────────
export const publications: Publication[] = [
  {
    year: '2025',
    title:
      'Antimicrobial Potential of Marine Sponge-Associated Bacillus velezensis and Stutzerimonas from the Indian Coast: Genome Mining and Metabolite Profiling',
    href: 'https://link.springer.com/article/10.1007/s00284-025-04262-6',
  },
  {
    year: '2025',
    title:
      'Genome Assembly, Analysis, and Mining of Kocuria flava NIO_001: A Thiopeptide Antibiotic Synthesizing Bacterium Isolated from Marine Sponge',
    href: 'https://cdnsciencepub.com/doi/10.1139/gen-2024-0162',
  },
  {
    year: '2026',
    title:
      'Genomic Insights: An Information-Guided Approach to Marine Natural Product Discovery',
    href: 'https://www.sciencedirect.com/science/chapter/editedvolume/abs/pii/B9780443267710000035',
  },
]

// ── Satellite Instructors ────────────────────────────────────────────────────
export const satelliteInstructors: SatelliteInstructor[] = [
  {
    id: 'tbd1',
    name: 'Instructor I',
    expertise: 'Expertise area to be announced',
    photoSrc: '/shlok.png',
    intro:
      'Research scholar with five years of marine biology experience, specializing in multi-omics approaches for bioprospecting and ecological studies of marine invertebrates.',
    skills: ['Transcriptomics', 'Metagenomics', 'Peptide Discovery', 'Field Ecology', 'Python/R', 'Bioinformatics'],
    links: [
      { label: 'LinkedIn Profile', href: 'https://www.linkedin.com/in/shlok-chitre-115624155/', type: 'linkedin' },
      { label: 'chitre.shlok@gmail.com', href: 'mailto:chitre.shlok@gmail.com', type: 'email' },
      { label: 'GitHub Profile', href: 'https://github.com/shlokchitre', type: 'github' },
    ],
  },
  {
    id: 'tbd2',
    name: 'Instructor II',
    expertise: 'Expertise area to be announced',
    isTbd: true,
    badge: 'Coming Soon',
  },
  {
    id: 'tbd3',
    name: 'Instructor III',
    expertise: 'Expertise area to be announced',
    isTbd: true,
    badge: 'Coming Soon',
  },
]

// ── About Stats ──────────────────────────────────────────────────────────────
export const aboutStats: StatRow[] = [
  { label: 'Experience', value: '5+', unit: 'years' },
  { label: 'Publications', value: '3', unit: 'papers' },
  { label: 'Specialisation', value: 'Marine Microbiomes', align: 'right', smallValue: true },
  { label: 'Institution', value: 'CSIR–NIO Goa, India', align: 'right', smallValue: true },
  { label: 'Timezone', value: 'IST', unit: 'UTC +5:30' },
]
