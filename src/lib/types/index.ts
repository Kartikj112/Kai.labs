// ── Workshop ───────────────────────────────────────────────────────────────
export interface WorkshopModule {
  num: string
  name: string
  desc: string
}

export interface WorkshopPrerequisite {
  text: string
}

export interface Workshop {
  id: string
  number: string
  title: string
  description: string
  tags: string[]
  isLive?: boolean
  // Detail page fields
  level: string
  duration: string
  format: string
  overview: string
  prerequisites: WorkshopPrerequisite[]
  modules: WorkshopModule[]
  tools: string[]
}

// ── Publication ────────────────────────────────────────────────────────────
export interface Publication {
  year: string
  title: string
  href: string
}

// ── Satellite Instructor ────────────────────────────────────────────────────
export interface SatelliteLink {
  label: string
  href: string
  type: 'linkedin' | 'email' | 'github' | 'web'
}

export interface SatelliteInstructor {
  id: string
  name: string
  expertise: string
  photoSrc?: string
  intro?: string
  skills?: string[]
  links?: SatelliteLink[]
  isTbd?: boolean
  badge?: string
}

// ── About Stats ────────────────────────────────────────────────────────────
export interface StatRow {
  label: string
  value: string
  unit?: string
  align?: 'left' | 'right'
  smallValue?: boolean
}

// ── Theme ──────────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light'

// ── Interest Vote ──────────────────────────────────────────────────────────
export type VoteType = 'yes' | 'no' | null
