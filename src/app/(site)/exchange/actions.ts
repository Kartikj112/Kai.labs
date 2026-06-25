'use server'

import { createWorkshopSubmission, createApplication } from '@/lib/exchange/db'
import type { SubmitResult, SkillLevel } from '@/lib/exchange/types'

const SKILLS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'all']

function str(fd: FormData, key: string): string {
  return (fd.get(key) as string | null)?.trim() ?? ''
}

function toSkill(v: string): SkillLevel {
  return (SKILLS as string[]).includes(v) ? (v as SkillLevel) : 'all'
}

function toIso(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export async function submitWorkshopAction(
  _prev: SubmitResult | null,
  fd: FormData
): Promise<SubmitResult> {
  const title = str(fd, 'title')
  const description = str(fd, 'description')
  const hostName = str(fd, 'hostName')
  const startsAt = toIso(str(fd, 'startsAt'))
  const durationMin = parseInt(str(fd, 'durationMin') || '60', 10)
  const maxAttendees = parseInt(str(fd, 'maxAttendees') || '30', 10)

  if (!title || !description || !hostName || !startsAt) {
    return { ok: false, reason: 'invalid', message: 'Please fill in your name, the title, a description, and a date/time.' }
  }
  if (new Date(startsAt).getTime() < Date.now()) {
    return { ok: false, reason: 'invalid', message: 'Please choose a date and time in the future.' }
  }

  return createWorkshopSubmission({
    hostName,
    institution: str(fd, 'institution'),
    hostBio: str(fd, 'hostBio'),
    title,
    description,
    category: str(fd, 'category') || 'Other',
    startsAt,
    durationMin: Number.isFinite(durationMin) ? durationMin : 60,
    skill: toSkill(str(fd, 'skill')),
    maxAttendees: Number.isFinite(maxAttendees) ? maxAttendees : 30,
  })
}

export async function submitApplicationAction(
  _prev: SubmitResult | null,
  fd: FormData
): Promise<SubmitResult> {
  const slug = str(fd, 'slug')
  const applicantName = str(fd, 'applicantName')
  const applicantEmail = str(fd, 'applicantEmail')

  if (!slug || !applicantName || !applicantEmail) {
    return { ok: false, reason: 'invalid', message: 'Please provide your name and email.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) {
    return { ok: false, reason: 'invalid', message: 'Please enter a valid email address.' }
  }

  return createApplication({
    slug,
    applicantName,
    applicantEmail,
    institution: str(fd, 'institution'),
    experience: toSkill(str(fd, 'experience')),
    motivation: str(fd, 'motivation'),
  })
}
