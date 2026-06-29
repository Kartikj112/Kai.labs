import Link from 'next/link'
import { getAdminCounts, isExchangeConfigured } from '@/lib/exchange/admin-db'
import { isEmailConfigured } from '@/lib/email/resend'

export const dynamic = 'force-dynamic'

function StatCard({ label, value, href, accent }: { label: string; value: number; href?: string; accent?: boolean }) {
  const inner = (
    <div
      style={{
        padding: '26px 24px', border: '1px solid var(--border-color)', borderRadius: 14,
        background: 'var(--surface)', minHeight: 120,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        transition: 'border-color 0.3s',
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontSize: 52, lineHeight: 1, color: accent && value > 0 ? 'var(--accent)' : 'var(--text)' }}>
        {value}
      </span>
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

export default async function AdminDashboard() {
  const configured = isExchangeConfigured()
  const counts = await getAdminCounts()

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: 44, letterSpacing: '-0.02em', marginBottom: 8 }}>
        Review queue
      </h1>
      <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12, color: 'var(--muted)', marginBottom: 36 }}>
        Approve or reject community submissions to Kai Exchange.
      </p>

      {!configured && (
        <div className="kx-note kx-note--warn" style={{ marginBottom: 28, maxWidth: 640 }}>
          <strong>Database not connected.</strong> Set <code>SUPABASE_URL</code> and{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> in your Vercel environment, then run the schema in{' '}
          <code>supabase/schema.sql</code>. Until then the queues are empty and submissions aren&apos;t stored.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 36 }}>
        <StatCard label="Pending workshops" value={counts.pendingWorkshops} href="/admin/workshops" accent />
        <StatCard label="Pending applications" value={counts.pendingApplications} href="/admin/applications" accent />
        <StatCard label="Approved workshops" value={counts.approvedWorkshops} />
      </div>

      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Link href="/admin/workshops" className="btn-primary">Review workshops</Link>
        <Link href="/admin/applications" className="btn-ghost">Review applications →</Link>
      </div>

      <p style={{ marginTop: 40, fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--muted)' }}>
        Email notifications: {isEmailConfigured() ? 'enabled (Resend)' : 'not configured — approvals work, no emails sent'}.
      </p>
    </div>
  )
}
