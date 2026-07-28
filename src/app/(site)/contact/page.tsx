'use client'

import { Contact } from '@/components/sections/Contact/Contact'
import { useScrollReveal } from '@/lib/hooks/useScrollReveal'

export default function ContactPage() {
  useScrollReveal()
  return (
    <main style={{ paddingTop: 64 }}>
      <Contact />
    </main>
  )
}
