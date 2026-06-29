// ── Kai Exchange — email templates ───────────────────────────────────────────
// Plain, broadly-compatible HTML (light background, inline styles).

function siteUrl(): string {
  return (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')
}

function fmtWhen(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  return `${date} · ${time} IST`
}

const OXBLOOD = '#A63D40'

function shell(heading: string, bodyHtml: string): string {
  return `
  <div style="margin:0;padding:32px 16px;background:#f5f2eb;font-family:Helvetica,Arial,sans-serif;color:#1a1413;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e6ddd4;border-radius:14px;overflow:hidden;">
      <div style="padding:22px 28px;border-bottom:1px solid #eee;">
        <span style="font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">KAI<span style="color:${OXBLOOD};">.</span>EXCHANGE</span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 18px;font-size:22px;font-weight:600;line-height:1.25;">${heading}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:18px 28px;border-top:1px solid #eee;font-size:11px;color:#8a8079;">
        Kai Exchange · a Kai Labs initiative
      </div>
    </div>
  </div>`
}

function button(href: string, label: string): string {
  if (!href) return ''
  return `<a href="${href}" style="display:inline-block;margin-top:8px;padding:11px 20px;background:${OXBLOOD};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;">${label}</a>`
}

export function workshopApprovedEmail(w: {
  host_name: string; title: string; slug: string; starts_at: string
}): { subject: string; html: string } {
  const link = siteUrl() ? `${siteUrl()}/exchange/workshops/${w.slug}` : ''
  const body = `
    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">Hi ${w.host_name},</p>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">Good news — your workshop has been approved and is now listed on Kai Exchange.</p>
    <p style="margin:0 0 6px;font-size:15px;font-weight:600;">${w.title}</p>
    <p style="margin:0 0 18px;font-size:13px;color:#6b6259;">${fmtWhen(w.starts_at)}</p>
    ${button(link, 'View your workshop')}
    <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#6b6259;">Attendees can now apply. You'll be able to review applications as they come in.</p>`
  return { subject: `Your Kai Exchange workshop is approved: ${w.title}`, html: shell('Your workshop is approved', body) }
}

export function applicationApprovedEmail(
  app: { applicant_name: string },
  w: { title: string; slug: string; starts_at: string; meet_link: string | null }
): { subject: string; html: string } {
  const joinHref = w.meet_link || (siteUrl() ? `${siteUrl()}/exchange/workshops/${w.slug}` : '')
  const joinLabel = w.meet_link ? 'Join the session' : 'View workshop details'
  const body = `
    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">Hi ${app.applicant_name},</p>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">You're in! Your application to the following workshop has been approved.</p>
    <p style="margin:0 0 6px;font-size:15px;font-weight:600;">${w.title}</p>
    <p style="margin:0 0 18px;font-size:13px;color:#6b6259;">${fmtWhen(w.starts_at)}</p>
    ${button(joinHref, joinLabel)}
    <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#6b6259;">See you there.</p>`
  return { subject: `You're in: ${w.title}`, html: shell("You're approved 🎉", body) }
}
