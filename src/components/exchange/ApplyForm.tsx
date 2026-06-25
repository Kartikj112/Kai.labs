'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { submitApplicationAction } from '@/app/(site)/exchange/actions'
import { Field, TextAreaField, SelectField } from './Field'

const EXPERIENCE_OPTS = [
  { value: 'beginner', label: 'New to this topic' },
  { value: 'intermediate', label: 'Some experience' },
  { value: 'advanced', label: 'Experienced' },
]

export function ApplyForm({ slug, title }: { slug: string; title: string }) {
  const [state, action, pending] = useActionState(submitApplicationAction, null)

  if (state?.ok) {
    return (
      <div className="kx-note kx-note--ok" style={{ fontSize: 13 }}>
        <strong style={{ display: 'block', marginBottom: 6 }}>Application submitted ✓</strong>
        Your application to <em>{title}</em> is in the queue. If it&apos;s approved, you&apos;ll
        receive the joining details by email.
        <div style={{ marginTop: 16 }}>
          <Link href="/exchange" className="btn-ghost">← Browse more workshops</Link>
        </div>
      </div>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="slug" value={slug} />

      <div className="kx-row">
        <Field label="Your name" name="applicantName" required placeholder="Jane Doe" />
        <Field label="Email" name="applicantEmail" type="email" required placeholder="you@example.com" />
      </div>

      <Field label="Institution" name="institution" placeholder="University / Lab" />
      <SelectField label="Experience level" name="experience" options={EXPERIENCE_OPTS} defaultValue="beginner" />
      <TextAreaField label="Why do you want to attend? (optional)" name="motivation" rows={4} placeholder="A sentence on what you're hoping to get out of it." />

      {state && !state.ok && (
        <div className={`kx-note ${state.reason === 'unconfigured' ? 'kx-note--warn' : 'kx-note--err'}`}>
          {state.message}
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={pending} style={{ marginTop: 24, opacity: pending ? 0.7 : 1 }}>
        {pending ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  )
}
