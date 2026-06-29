import Link from 'next/link'
import { listPendingWorkshops, type AdminWorkshop } from '@/lib/exchange/admin-db'
import { approveWorkshopAction, rejectWorkshopAction } from '../../actions'

export const dynamic = 'force-dynamic'

function fmt(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) + ' IST'
}

function Row({ w }: { w: AdminWorkshop }) {
  const meta = [w.category, w.skill, `${w.max_attendees} max`, fmt(w.starts_at)].join('  ·  ')
  return (
    <article style={{ padding: '24px', border: '1px solid var(--border-color)', borderRadius: 14, background: 'var(--surface)' }}>
      <h3 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: 22, lineHeight: 1.2, marginBottom: 6 }}>
        {w.title}
      </h3>
      <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11.5, color: 'var(--muted)', marginBottom: 4 }}>
        {w.host_name}{w.host_institution ? ` · ${w.host_institution}` : ''}{w.host_email ? ` · ${w.host_email}` : ''}
      </p>
      <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.04em', marginBottom: 16 }}>
        {meta}
      </p>
      <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12.5, color: 'var(--text)', lineHeight: 1.8, marginBottom: 20, whiteSpace: 'pre-line' }}>
        {w.description}
      </p>
      {w.host_bio && (
        <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 20 }}>
          Host bio: {w.host_bio}
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <form action={approveWorkshopAction}>
          <input type="hidden" name="id" value={w.id} />
          <button type="submit" className="btn-primary">Approve</button>
        </form>
        <form action={rejectWorkshopAction}>
          <input type="hidden" name="id" value={w.id} />
          <button type="submit" className="btn-ghost">Reject</button>
        </form>
      </div>
    </article>
  )
}

export default async function AdminWorkshopsPage() {
  const items = await listPendingWorkshops()

  return (
    <div>
      <Link href="/admin" style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, letterSpacing: '0.1em', color: 'var(--muted)', textDecoration: 'none' }}>
        ← Overview
      </Link>
      <h1 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: 40, letterSpacing: '-0.02em', margin: '16px 0 28px' }}>
        Pending workshops{items.length > 0 ? ` (${items.length})` : ''}
      </h1>

      {items.length === 0 ? (
        <div className="kx-note" style={{ maxWidth: 560 }}>Nothing pending. New workshop submissions will appear here for review.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {items.map((w) => <Row key={w.id} w={w} />)}
        </div>
      )}
    </div>
  )
}
