'use client'

import { useCursor } from '@/lib/hooks/useCursor'

export function CustomCursor() {
  useCursor()

  return (
    <>
      <div id="cursor" className="cursor" aria-hidden="true" />
      <div id="cursor-ring" className="cursor-ring" aria-hidden="true" />
    </>
  )
}
