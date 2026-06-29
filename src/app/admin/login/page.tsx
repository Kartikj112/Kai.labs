'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from '../actions'

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, null)

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-sans), Syne, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
            KAI<span style={{ color: 'var(--accent)' }}>.</span>ADMIN
          </span>
          <p style={{ marginTop: 10, fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em' }}>
            Kai Exchange review console
          </p>
        </div>

        <form action={action} style={{ border: '1px solid var(--border-color)', borderRadius: 14, background: 'var(--surface)', padding: 28 }}>
          <label className="kx-field">
            <span className="kx-label">Password</span>
            <input className="kx-input" name="password" type="password" required autoFocus placeholder="••••••••" />
          </label>

          {state?.error && <div className="kx-note kx-note--err" style={{ marginBottom: 16 }}>{state.error}</div>}

          <button type="submit" className="btn-primary" disabled={pending} style={{ width: '100%', textAlign: 'center', opacity: pending ? 0.7 : 1 }}>
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  )
}
