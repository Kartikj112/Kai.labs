'use client'

import { useEffect } from 'react'

/**
 * Drives the custom cursor dot + ring.
 *
 * Robustness: the native cursor is only hidden (via the `custom-cursor-active`
 * class on <html>, see globals.css) once this hook confirms a fine pointer AND
 * the cursor elements exist. If JS fails or the device is touch, the real
 * cursor is left untouched — no more invisible mouse on any page.
 */
export function useCursor() {
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)')
    if (!fine.matches) return

    const dot = document.getElementById('cursor')
    const ring = document.getElementById('cursor-ring')
    if (!dot || !ring) return

    const root = document.documentElement
    root.classList.add('custom-cursor-active')

    let raf = 0
    let targetX = window.innerWidth / 2
    let targetY = window.innerHeight / 2
    let ringX = targetX
    let ringY = targetY
    let visible = false

    const show = () => {
      if (visible) return
      visible = true
      dot.style.opacity = '1'
      ring.style.opacity = '1'
    }

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX
      targetY = e.clientY
      dot.style.left = `${targetX}px`
      dot.style.top = `${targetY}px`
      show()

      // Grow the ring over anything clickable for a tactile feel.
      const el = e.target as HTMLElement | null
      const interactive = !!el?.closest(
        'a, button, input, textarea, select, label, [role="button"], summary'
      )
      ring.classList.toggle('cursor-ring--active', interactive)
    }

    // Ring trails the dot with a light lerp.
    const tick = () => {
      ringX += (targetX - ringX) * 0.18
      ringY += (targetY - ringY) * 0.18
      ring.style.left = `${ringX}px`
      ring.style.top = `${ringY}px`
      raf = requestAnimationFrame(tick)
    }

    const onLeave = () => {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
      visible = false
    }
    const onDown = () => ring.classList.add('cursor-ring--down')
    const onUp = () => ring.classList.remove('cursor-ring--down')

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown, { passive: true })
    window.addEventListener('mouseup', onUp, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(tick)

    // If the pointer type changes (e.g. plugging/unplugging a mouse), bail out
    // gracefully and restore the native cursor.
    const onPointerChange = () => {
      if (!fine.matches) {
        root.classList.remove('custom-cursor-active')
        onLeave()
      }
    }
    fine.addEventListener('change', onPointerChange)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      fine.removeEventListener('change', onPointerChange)
      root.classList.remove('custom-cursor-active')
    }
  }, [])
}
