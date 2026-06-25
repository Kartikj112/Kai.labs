// ── Kai Exchange — shared types ──────────────────────────────────────────────

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all'

export interface WorkshopCard {
  slug: string
  title: string
  hostName: string
  institution: string | null
  category: string
  startsAt: string // ISO timestamp
  durationMin: number
  skill: SkillLevel
  maxAttendees: number
  seatsRemaining: number | null // null = unknown (seed/preview)
}

export interface WorkshopResource {
  label: string
  url: string
}

export interface WorkshopFull extends WorkshopCard {
  description: string
  hostBio: string | null
  meetLink: string | null
  resources: WorkshopResource[]
}

export interface HostInput {
  hostName: string
  institution: string
  hostBio: string
  title: string
  description: string
  category: string
  startsAt: string
  durationMin: number
  skill: SkillLevel
  maxAttendees: number
}

export interface ApplyInput {
  slug: string
  applicantName: string
  applicantEmail: string
  institution: string
  experience: SkillLevel
  motivation: string
}

export type SubmitResult =
  | { ok: true; pending: true }
  | { ok: false; reason: 'unconfigured' | 'invalid' | 'error'; message: string }

export const SKILL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  all: 'All levels',
}

export const CATEGORIES = [
  'Genomics',
  'Metagenomics',
  'Sequencing',
  'Statistics',
  'Drug Discovery',
  'Programming',
  'Reproducibility',
  'Career',
  'Other',
] as const
