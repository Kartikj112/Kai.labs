import Link from 'next/link'
import { listPendingApplications, type AdminApplication } from '@/lib/exchange/admin-db'
import { approveApplicationAction, rejectApplicationAction } from '../../actions'

export const dynamic = 'force-dynamic'

function Row({ a }: { a: AdminApplication }) {
  return (
    <article style={{ padding: '24px', border: '1px solid var(--border-color)', borderRadius: 14, background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <h3 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: 21, lineHeight: 1.2 }}>
          {a.applicant_name}
        </h3>
        <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10.5, color: 'var(--accent)', letterSpacing: '0.06em' }}>
          {a.experience}
        </span>
      </div>
      <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>
        {a.applicant_email}{a.institution ? ` · ${a.institution}` : ''}
      </p>
      <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
        Applying to: <span style={{ color: 'var(--text)' }}>{a.workshops?.title ?? 'Unknown workshop'}</span>
      </p>
      {a.motivation && (
        <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12.5, color: 'var(--text)', lineHeight: 1.8, marginBottom: 20, whiteSpace: 'pre-line' }}>
          &ldquo;{a.motivation}&rdquo;
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <form action={approveApplicationAction}>
          <input type="hidden" name="id" value={a.id} />
          <button type="submit" className="btn-primary">Approve</button>
        </form>
        <form action={rejectApplicationAction}>
          <input type="hidden" name="id" value={a.id} />
          <button type="submit" className="btn-ghost">Reject</button>
        </form>
      </div>
    </article>
  )
}

export default async function AdminApplicationsPage() {
  const items = await listPendingApplications()

  return (
    <div>
      <Link href="/admin" style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, letterSpacing: '0.1em', color: 'var(--muted)', textDecoration: 'none' }}>
        ← Overview
      </Link>
      <h1 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: 40, letterSpacing: '-0.02em', margin: '16px 0 28px' }}>
        Pending applications{items.length > 0 ? ` (${items.length})` : ''}
      </h1>

      {items.length === 0 ? (
        <div className="kx-note" style={{ maxWidth: 560 }}>Nothing pending. Attendee applications will appear here for review.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {items.map((a) => <Row key={a.id} a={a} />)}
        </div>
      )}
    </div>
  )
}
