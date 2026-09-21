'use client'

import { useEffect, useRef } from 'react'

/**
 * A hairline of oxblood across the top of the viewport that fills as the
 * reader moves through the post. Written straight to the element's transform
 * inside a rAF rather than through state, so scrolling never re-renders React.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = document.getElementById(targetId)
    const bar = barRef.current
    if (!target || !bar) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = target.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1
      bar.style.transform = `scaleX(${progress})`
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [targetId])

  return (
    <div
      ref={barRef}
      aria-hidden
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 2, zIndex: 300,
        background: 'var(--accent)', transform: 'scaleX(0)', transformOrigin: '0 50%',
      }}
    />
  )
}
