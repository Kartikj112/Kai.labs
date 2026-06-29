// ── Kai Exchange — admin data layer ──────────────────────────────────────────
// Server-only. Uses the Supabase service-role key (bypasses RLS) to review and
// approve submissions. Every function degrades cleanly when the database isn't
// configured: lists return empty, counts return zero, mutations report failure.

import type { SkillLevel } from './types'

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

export interface AdminWorkshop {
  id: string
  slug: string
  title: string
  description: string
  category: string
  host_name: string
  host_institution: string | null
  host_email: string | null
  host_bio: string | null
  starts_at: string
  duration_min: number
  skill: SkillLevel
  max_attendees: number
  status: string
  created_at: string
}

export interface AdminApplication {
  id: string
  applicant_name: string
  applicant_email: string
  institution: string | null
  experience: SkillLevel
  motivation: string | null
  status: string
  created_at: string
  workshops: { title: string; slug: string; starts_at: string; meet_link: string | null } | null
}

export interface AdminCounts {
  pendingWorkshops: number
  pendingApplications: number
  approvedWorkshops: number
}

async function countWhere(path: string): Promise<number> {
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, {
      method: 'GET',
      headers: headers({ Prefer: 'count=exact', Range: '0-0' }),
      cache: 'no-store',
    })
    const range = res.headers.get('content-range') // e.g. "0-0/42" or "*/0"
    const total = range?.split('/')[1]
    return total ? parseInt(total, 10) || 0 : 0
  } catch {
    return 0
  }
}

export async function getAdminCounts(): Promise<AdminCounts> {
  if (!isExchangeConfigured()) {
    return { pendingWorkshops: 0, pendingApplications: 0, approvedWorkshops: 0 }
  }
  const [pendingWorkshops, pendingApplications, approvedWorkshops] = await Promise.all([
    countWhere('workshops?status=eq.pending&select=id'),
    countWhere('applications?status=eq.pending&select=id'),
    countWhere('workshops?status=eq.approved&select=id'),
  ])
  return { pendingWorkshops, pendingApplications, approvedWorkshops }
}

export async function listPendingWorkshops(): Promise<AdminWorkshop[]> {
  if (!isExchangeConfigured()) return []
  try {
    const res = await fetch(
      `${URL}/rest/v1/workshops?status=eq.pending&select=*&order=created_at.desc`,
      { headers: headers(), cache: 'no-store' }
    )
    if (!res.ok) return []
    return (await res.json()) as AdminWorkshop[]
  } catch {
    return []
  }
}

export async function listPendingApplications(): Promise<AdminApplication[]> {
  if (!isExchangeConfigured()) return []
  try {
    const res = await fetch(
      `${URL}/rest/v1/applications?status=eq.pending&select=*,workshops(title,slug,starts_at,meet_link)&order=created_at.desc`,
      { headers: headers(), cache: 'no-store' }
    )
    if (!res.ok) return []
    return (await res.json()) as AdminApplication[]
  } catch {
    return []
  }
}

async function patchStatus(
  table: 'workshops' | 'applications',
  id: string,
  status: string,
  select = '*'
): Promise<Record<string, unknown> | null> {
  if (!isExchangeConfigured()) return null
  try {
    const res = await fetch(
      `${URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}&select=${encodeURIComponent(select)}`,
      {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify({ status, reviewed_at: new Date().toISOString() }),
        cache: 'no-store',
      }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as Record<string, unknown>[]
    return rows[0] ?? null
  } catch {
    return null
  }
}

export function approveWorkshop(id: string) {
  return patchStatus('workshops', id, 'approved') as Promise<AdminWorkshop | null>
}
export function rejectWorkshop(id: string) {
  return patchStatus('workshops', id, 'rejected') as Promise<AdminWorkshop | null>
}
export function approveApplication(id: string) {
  return patchStatus(
    'applications', id, 'approved',
    '*,workshops(title,slug,starts_at,meet_link)'
  ) as Promise<AdminApplication | null>
}
export function rejectApplication(id: string) {
  return patchStatus('applications', id, 'rejected') as Promise<AdminApplication | null>
}
