'use client'

import Link from 'next/link'

/**
 * Slim sticky header for the Decision Engine pages. Gives every engine
 * route a way home (the main site nav isn't rendered here).
 */
export function EngineHeader() {
  return (
    <header className="engine-header">
      <Link href="/" className="engine-header-logo">
        <span className="eh-back">←</span>
        KAI<span style={{ color: 'var(--accent)' }}>.</span>GENOMICS
      </Link>
    </header>
  )
}
