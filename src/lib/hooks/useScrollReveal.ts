'use client'

import { useEffect, useRef } from 'react'

/**
 * Attaches an IntersectionObserver to all `.reveal` elements inside the
 * ref'd container (defaults to document if no ref is passed).
 * When an element enters the viewport it gets the `visible` class added,
 * triggering the CSS reveal transition, then is un-observed.
 */
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )

    const elements = document.querySelectorAll('.reveal')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
