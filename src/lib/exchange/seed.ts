import type { WorkshopFull } from './types'

// Realistic placeholder workshops so Exchange looks alive before the database
// is connected. Once Supabase is configured, real approved workshops replace these.
// Dates are generated relative to "now" so they always read as upcoming.

function inDays(days: number, hour = 16): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const seedWorkshops: WorkshopFull[] = [
  {
    slug: 'metagenomic-assembly-megahit',
    title: 'Metagenomic Assembly from Scratch with MEGAHIT',
    hostName: 'Demo Host',
    institution: 'Kai Labs',
    category: 'Metagenomics',
    startsAt: inDays(7),
    durationMin: 90,
    skill: 'beginner',
    maxAttendees: 40,
    seatsRemaining: 31,
    description:
      'A hands-on walkthrough of co-assembling short-read metagenomes with MEGAHIT — from read QC through contig evaluation. Bring a laptop; example data provided.',
    hostBio: 'Example workshop included with the platform to show how a session looks.',
    meetLink: null,
    resources: [],
  },
  {
    slug: 'antismash-bgc-mining',
    title: 'Mining Biosynthetic Gene Clusters with antiSMASH',
    hostName: 'Demo Host',
    institution: 'Kai Labs',
    category: 'Drug Discovery',
    startsAt: inDays(12),
    durationMin: 75,
    skill: 'intermediate',
    maxAttendees: 30,
    seatsRemaining: 18,
    description:
      'Learn to run antiSMASH on bacterial genomes, read the output, and rank biosynthetic gene clusters by novelty against MIBiG. Ideal for natural-product discovery.',
    hostBio: 'Example workshop included with the platform to show how a session looks.',
    meetLink: null,
    resources: [],
  },
  {
    slug: '16s-qiime2-analysis',
    title: '16S Amplicon Analysis in QIIME2',
    hostName: 'Demo Host',
    institution: 'Kai Labs',
    category: 'Genomics',
    startsAt: inDays(18),
    durationMin: 120,
    skill: 'beginner',
    maxAttendees: 50,
    seatsRemaining: 44,
    description:
      'From raw reads to diversity metrics: denoising with DADA2, taxonomy assignment, and alpha/beta diversity — the full QIIME2 microbiome pipeline.',
    hostBio: 'Example workshop included with the platform to show how a session looks.',
    meetLink: null,
    resources: [],
  },
  {
    slug: 'reproducible-pipelines-nextflow',
    title: 'Reproducible Pipelines with Nextflow & nf-core',
    hostName: 'Demo Host',
    institution: 'Kai Labs',
    category: 'Reproducibility',
    startsAt: inDays(24),
    durationMin: 90,
    skill: 'intermediate',
    maxAttendees: 35,
    seatsRemaining: 22,
    description:
      'Why reproducibility matters and how Nextflow + nf-core deliver it. Run an existing nf-core pipeline and learn the structure to build your own.',
    hostBio: 'Example workshop included with the platform to show how a session looks.',
    meetLink: null,
    resources: [],
  },
]

export function findSeedWorkshop(slug: string): WorkshopFull | undefined {
  return seedWorkshops.find((w) => w.slug === slug)
}
