'use client'

import { useState, useEffect } from 'react'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/sections/Hero/Hero'
import { Workshops } from '@/components/sections/Workshops/Workshops'
import { WorkshopDetail } from '@/components/sections/Workshops/WorkshopDetail'
import { About } from '@/components/sections/About/About'
import { Publications } from '@/components/sections/Publications/Publications'
import { LecturerApplication } from '@/components/sections/LecturerApplication/LecturerApplication'
import { Contact } from '@/components/sections/Contact/Contact'
import { useScrollReveal } from '@/lib/hooks/useScrollReveal'
import type { Workshop } from '@/lib/types'

export default function Home() {
  const [activeWorkshop, setActiveWorkshop] = useState<Workshop | null>(null)

  // Re-run reveal observer whenever the view changes
  useScrollReveal()

  // Lock body scroll when detail is open
  useEffect(() => {
    document.body.style.overflow = activeWorkshop ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [activeWorkshop])

  const openWorkshop = (workshop: Workshop) => {
    setActiveWorkshop(workshop)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeWorkshop = () => {
    setActiveWorkshop(null)
    // Scroll to the workshops section after closing
    setTimeout(() => {
      document.getElementById('workshops')?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  return (
    <>
      <Nav activeDetail={activeWorkshop} onBack={closeWorkshop} />

      {/* ── Detail overlay ─────────────────────────────────────────────────── */}
      {activeWorkshop && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            overflowY: 'auto',
            background: 'var(--bg)',
          }}
        >
          <WorkshopDetail workshop={activeWorkshop} />
        </div>
      )}

      {/* ── Main page ─────────────────────────────────────────────────────── */}
      <main>
        <Hero />
        <Workshops onOpenWorkshop={openWorkshop} />
        <About />
        <Publications />
        <LecturerApplication />
        <Contact />
      </main>

      <Footer />
    </>
  )
}
