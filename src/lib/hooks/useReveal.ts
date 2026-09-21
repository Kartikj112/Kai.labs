'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Per-element scroll reveal, owned by React state.
 *
 * Pair it with the `.reveal` class and add `visible` when it returns true.
 * Prefer this over `useScrollReveal` for anything that can mount after the
 * page does — a filtered grid, a list that grows. The global hook queries the
 * DOM once, so elements rendered later never get observed and stay at
 * `opacity: 0` forever: present and clickable, but invisible.
 */
export function useReveal<T extends Element>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // No IntersectionObserver (old browser, or a test environment): reveal
    // immediately rather than leaving the element permanently invisible.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return [ref, visible] as const
}
