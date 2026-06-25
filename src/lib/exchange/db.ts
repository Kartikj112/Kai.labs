// ── Kai Exchange — data layer ────────────────────────────────────────────────
// Server-only. Talks to Supabase via its REST (PostgREST) API using a fetch
// call — no npm dependency. If the database isn't configured yet, every read
// falls back to seed data and every write reports "unconfigured" cleanly, so
// the site works before and after Supabase is connected.

import type {
  WorkshopCard, WorkshopFull, HostInput, ApplyInput, SubmitResult, SkillLevel,
} from './types'
import { seedWorkshops, findSeedWorkshop } from './seed'

const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export function isExchangeConfigured(): boolean {
  return Boolean(URL && KEY)
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: KEY as string,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

interface Row {
  slug: string
  title: string
  host_name: string
  host_institution: string | null
  host_bio: string | null
  category: string
  starts_at: string
  duration_min: number
  skill: SkillLevel
  max_attendees: number
  description: string
  meet_link: string | null
  resources: { label: string; url: string }[] | null
}

function toFull(r: Row): WorkshopFull {
  return {
    slug: r.slug,
    title: r.title,
    hostName: r.host_name,
    institution: r.host_institution,
    hostBio: r.host_bio,
    category: r.category,
    startsAt: r.starts_at,
    durationMin: r.duration_min,
    skill: r.skill,
    maxAttendees: r.max_attendees,
    seatsRemaining: null,
    description: r.description,
    meetLink: r.meet_link,
    resources: r.resources ?? [],
  }
}

const CARD_COLS =
  'slug,title,host_name,host_institution,category,starts_at,duration_min,skill,max_attendees'

export async function listApprovedWorkshops(): Promise<WorkshopCard[]> {
  if (!isExchangeConfigured()) {
    return seedWorkshops.map(({ description, hostBio, meetLink, resources, ...card }) => card)
  }
  try {
    const res = await fetch(
      `${URL}/rest/v1/workshops?status=eq.approved&select=${CARD_COLS}&order=starts_at.asc`,
      { headers: headers(), cache: 'no-store' }
    )
    if (!res.ok) return []
    const rows = (await res.json()) as Row[]
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      hostName: r.host_name,
      institution: r.host_institution,
      category: r.category,
      startsAt: r.starts_at,
      durationMin: r.duration_min,
      skill: r.skill,
      maxAttendees: r.max_attendees,
      seatsRemaining: null,
    }))
  } catch {
    return []
  }
}

export async function getWorkshop(slug: string): Promise<WorkshopFull | null> {
  if (!isExchangeConfigured()) return findSeedWorkshop(slug) ?? null
  try {
    const res = await fetch(
      `${URL}/rest/v1/workshops?slug=eq.${encodeURIComponent(slug)}&status=eq.approved&select=*&limit=1`,
      { headers: headers(), cache: 'no-store' }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as Row[]
    return rows[0] ? toFull(rows[0]) : null
  } catch {
    return null
  }
}

function slugify(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base || 'workshop'}-${suffix}`
}

export async function createWorkshopSubmission(input: HostInput): Promise<SubmitResult> {
  if (!isExchangeConfigured()) {
    return { ok: false, reason: 'unconfigured', message: 'Hosting opens once the platform launches. Your details were not saved.' }
  }
  try {
    const body = {
      slug: slugify(input.title),
      host_name: input.hostName,
      host_institution: input.institution || null,
      host_bio: input.hostBio || null,
      title: input.title,
      description: input.description,
      category: input.category,
      starts_at: input.startsAt,
      duration_min: input.durationMin,
      skill: input.skill,
      max_attendees: input.maxAttendees,
      status: 'pending',
    }
    const res = await fetch(`${URL}/rest/v1/workshops`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false, reason: 'error', message: 'Could not submit right now. Please try again.' }
    return { ok: true, pending: true }
  } catch {
    return { ok: false, reason: 'error', message: 'Could not submit right now. Please try again.' }
  }
}

export async function createApplication(input: ApplyInput): Promise<SubmitResult> {
  if (!isExchangeConfigured()) {
    return { ok: false, reason: 'unconfigured', message: 'Applications open once the platform launches. Your details were not saved.' }
  }
  try {
    // Resolve workshop id from slug.
    const wRes = await fetch(
      `${URL}/rest/v1/workshops?slug=eq.${encodeURIComponent(input.slug)}&select=id&limit=1`,
      { headers: headers(), cache: 'no-store' }
    )
    const wRows = wRes.ok ? ((await wRes.json()) as { id: string }[]) : []
    const workshopId = wRows[0]?.id
    if (!workshopId) return { ok: false, reason: 'error', message: 'That workshop could not be found.' }

    const body = {
      workshop_id: workshopId,
      applicant_name: input.applicantName,
      applicant_email: input.applicantEmail,
      institution: input.institution || null,
      experience: input.experience,
      motivation: input.motivation || null,
      status: 'pending',
    }
    const res = await fetch(`${URL}/rest/v1/applications`, {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false, reason: 'error', message: 'Could not submit your application. Please try again.' }
    return { ok: true, pending: true }
  } catch {
    return { ok: false, reason: 'error', message: 'Could not submit your application. Please try again.' }
  }
}
