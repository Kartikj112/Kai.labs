// ── Kai Exchange — email (Resend) ────────────────────────────────────────────
// Server-only. Sends transactional email via the Resend REST API with plain
// fetch — no npm dependency. If RESEND_API_KEY / RESEND_FROM aren't set, sending
// is skipped cleanly so approvals still succeed without email configured.

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM)
}

export interface SendResult {
  sent: boolean
  reason?: 'unconfigured' | 'error'
}

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<SendResult> {
  if (!isEmailConfigured()) return { sent: false, reason: 'unconfigured' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
      }),
      cache: 'no-store',
    })
    return { sent: res.ok, reason: res.ok ? undefined : 'error' }
  } catch {
    return { sent: false, reason: 'error' }
  }
}
