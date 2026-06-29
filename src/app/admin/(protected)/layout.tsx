import type { ReactNode } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/exchange/auth'
import { logoutAction } from '../actions'

export const dynamic = 'force-dynamic'

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!verifyAdminToken(token)) redirect('/admin/login')

  const linkStyle = {
    fontFamily: 'var(--font-mono), DM Mono, monospace',
    fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    color: 'var(--muted)', textDecoration: 'none',
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
          padding: '16px 28px', borderBottom: '1px solid var(--border-color)',
          background: 'var(--nav-fade)', backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link href="/admin" style={{ fontFamily: 'var(--font-sans), Syne, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text)', textDecoration: 'none' }}>
            KAI<span style={{ color: 'var(--accent)' }}>.</span>ADMIN
          </Link>
          <nav style={{ display: 'flex', gap: 20 }}>
            <Link href="/admin" style={linkStyle}>Overview</Link>
            <Link href="/admin/workshops" style={linkStyle}>Workshops</Link>
            <Link href="/admin/applications" style={linkStyle}>Applications</Link>
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={linkStyle}>↗ Site</Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost" style={{ fontSize: 11 }}>Sign out</button>
          </form>
        </div>
      </header>

      <main style={{ padding: '40px 28px 100px', maxWidth: 1000, margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
