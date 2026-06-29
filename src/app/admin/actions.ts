'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  ADMIN_COOKIE, adminToken, checkPassword, verifyAdminToken, isAdminConfigured,
} from '@/lib/exchange/auth'
import {
  approveWorkshop, rejectWorkshop, approveApplication, rejectApplication,
} from '@/lib/exchange/admin-db'
import { sendEmail } from '@/lib/email/resend'
import { workshopApprovedEmail, applicationApprovedEmail } from '@/lib/email/templates'

export type LoginState = { error: string } | null

export async function loginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (!isAdminConfigured()) return { error: 'Admin access is not configured on the server yet.' }
  const password = (fd.get('password') as string | null) ?? ''
  if (!checkPassword(password)) return { error: 'Incorrect password.' }

  ;(await cookies()).set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  ;(await cookies()).delete(ADMIN_COOKIE)
  redirect('/admin/login')
}

async function requireAdmin(): Promise<void> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!verifyAdminToken(token)) redirect('/admin/login')
}

function refreshAdmin() {
  revalidatePath('/admin')
  revalidatePath('/admin/workshops')
  revalidatePath('/admin/applications')
  revalidatePath('/exchange')
}

export async function approveWorkshopAction(fd: FormData): Promise<void> {
  await requireAdmin()
  const id = (fd.get('id') as string | null) ?? ''
  if (!id) return
  const w = await approveWorkshop(id)
  if (w?.host_email) {
    const { subject, html } = workshopApprovedEmail({
      host_name: w.host_name, title: w.title, slug: w.slug, starts_at: w.starts_at,
    })
    await sendEmail({ to: w.host_email, subject, html })
  }
  refreshAdmin()
}

export async function rejectWorkshopAction(fd: FormData): Promise<void> {
  await requireAdmin()
  const id = (fd.get('id') as string | null) ?? ''
  if (id) await rejectWorkshop(id)
  refreshAdmin()
}

export async function approveApplicationAction(fd: FormData): Promise<void> {
  await requireAdmin()
  const id = (fd.get('id') as string | null) ?? ''
  if (!id) return
  const a = await approveApplication(id)
  if (a?.applicant_email && a.workshops) {
    const { subject, html } = applicationApprovedEmail(
      { applicant_name: a.applicant_name },
      { title: a.workshops.title, slug: a.workshops.slug, starts_at: a.workshops.starts_at, meet_link: a.workshops.meet_link },
    )
    await sendEmail({ to: a.applicant_email, subject, html })
  }
  refreshAdmin()
}

export async function rejectApplicationAction(fd: FormData): Promise<void> {
  await requireAdmin()
  const id = (fd.get('id') as string | null) ?? ''
  if (id) await rejectApplication(id)
  refreshAdmin()
}
