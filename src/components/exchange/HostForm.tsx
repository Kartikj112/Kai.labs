'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { submitWorkshopAction } from '@/app/(site)/exchange/actions'
import { Field, TextAreaField, SelectField } from './Field'
import { CATEGORIES } from '@/lib/exchange/types'

const CATEGORY_OPTS = CATEGORIES.map((c) => ({ value: c, label: c }))
const SKILL_OPTS = [
  { value: 'all', label: 'All levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export function HostForm() {
  const [state, action, pending] = useActionState(submitWorkshopAction, null)

  if (state?.ok) {
    return (
      <div className="kx-note kx-note--ok" style={{ fontSize: 13 }}>
        <strong style={{ display: 'block', marginBottom: 6 }}>Submitted for review ✓</strong>
        Thanks for offering to teach. Your workshop is in the approval queue — once it&apos;s
        approved it will appear on the Exchange and you&apos;ll be notified.
        <div style={{ marginTop: 16 }}>
          <Link href="/exchange" className="btn-ghost">← Back to Exchange</Link>
        </div>
      </div>
    )
  }

  return (
    <form action={action}>
      <div className="kx-row">
        <Field label="Your name" name="hostName" required placeholder="Jane Doe" />
        <Field label="Email" name="hostEmail" type="email" required placeholder="you@example.com" />
      </div>

      <Field label="Institution" name="institution" placeholder="University / Lab" />

      <Field label="Workshop title" name="title" required placeholder="e.g. Intro to Metagenomic Assembly" />
      <TextAreaField label="Description" name="description" required rows={5} placeholder="What will attendees learn? What should they bring or know beforehand?" />

      <div className="kx-row">
        <SelectField label="Category" name="category" options={CATEGORY_OPTS} defaultValue="Genomics" />
        <SelectField label="Skill level" name="skill" options={SKILL_OPTS} defaultValue="all" />
      </div>

      <div className="kx-row">
        <Field label="Date & time" name="startsAt" type="datetime-local" required />
        <Field label="Duration (minutes)" name="durationMin" type="number" min={15} max={480} defaultValue="60" />
      </div>

      <div className="kx-row">
        <Field label="Max attendees" name="maxAttendees" type="number" min={1} max={1000} defaultValue="30" />
        <div />
      </div>

      <TextAreaField label="Short bio (optional)" name="hostBio" rows={3} placeholder="A sentence or two about you and your background." />

      {state && !state.ok && (
        <div className={`kx-note ${state.reason === 'unconfigured' ? 'kx-note--warn' : 'kx-note--err'}`}>
          {state.message}
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={pending} style={{ marginTop: 24, opacity: pending ? 0.7 : 1 }}>
        {pending ? 'Submitting…' : 'Submit for review'}
      </button>
    </form>
  )
}
