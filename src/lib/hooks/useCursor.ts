'use client'

import { useEffect } from 'react'

export function useCursor() {
  useEffect(() => {
    // Only activate on fine-pointer devices (mouse / trackpad)
    if (!window.matchMedia('(pointer: fine)').matches) return

    const dot  = document.getElementById('cursor')
    const ring = document.getElementById('cursor-ring')
    if (!dot || !ring) return

    let ringX = 0, ringY = 0

    const onMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e
      dot.style.left  = `${x}px`
      dot.style.top   = `${y}px`
      // Ring follows with a lerp-like CSS transition already applied
      ring.style.left = `${x}px`
      ring.style.top  = `${y}px`
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])
}
