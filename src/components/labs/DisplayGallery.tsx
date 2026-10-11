'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { PublicGalleryAsset } from '@/lib/social/asset-loader'

const CHANGE_MS = 6400
const FADE_MS = 850

function subscribeToReducedMotion(notify: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
function reducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Accessible, responsive crossfade gallery. Only current and outgoing images render. */
export function DisplayGallery({ photos }: { photos: PublicGalleryAsset[] }) {
  const [index, setIndex] = useState(0)
  const [outgoing, setOutgoing] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  const reduceMotion = useSyncExternalStore(subscribeToReducedMotion, reducedMotionSnapshot, () => false)
  const touchStart = useRef<number | null>(null)
  const indexRef = useRef(0)
  const clearOutgoing = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goTo = useCallback((next: number) => {
    if (photos.length < 2) return
    const current = indexRef.current
    const destination = (next + photos.length) % photos.length
    if (current === destination) return
    if (clearOutgoing.current) clearTimeout(clearOutgoing.current)
    setOutgoing(reduceMotion ? null : current)
    indexRef.current = destination
    setIndex(destination)
    if (!reduceMotion) clearOutgoing.current = setTimeout(() => setOutgoing(null), FADE_MS)
  }, [photos.length, reduceMotion])

  const goRelative = useCallback((step: number) => {
    goTo(indexRef.current + step)
  }, [goTo])

  useEffect(() => {
    if (reduceMotion || paused || photos.length < 2) return
    const timer = window.setInterval(() => {
      if (!document.hidden) goRelative(1)
    }, CHANGE_MS)
    return () => window.clearInterval(timer)
  }, [goRelative, paused, photos.length, reduceMotion])

  useEffect(() => () => {
    if (clearOutgoing.current) clearTimeout(clearOutgoing.current)
  }, [])

  const photo = photos[index]

  return (
    <section className="moments-section" aria-labelledby="moments-title">
      <div className="moments-heading">
        <div>
          <span className="pixel-label moments-eyebrow">Behind the scenes / Kai Labs</span>
          <h2 id="moments-title" className="moments-title">Made of <em>moments.</em></h2>
        </div>
        <p>Workshops, discoveries, collaborations and the people behind the science. A living glimpse into what we do.</p>
      </div>
      {photo ? (
        <div
          className="moments-stage"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
          }}
          onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return
            const end = event.changedTouches[0]?.clientX ?? touchStart.current
            const delta = end - touchStart.current
            touchStart.current = null
            if (Math.abs(delta) > 44) goRelative(delta < 0 ? 1 : -1)
          }}
          aria-roledescription="carousel"
          aria-label="Highlights from Kai Labs"
        >
          <div className="moments-image-view" aria-hidden>
            {outgoing !== null && outgoing !== index && photos[outgoing] && (
              <Image
                key={`out-${photos[outgoing].src}`}
                src={photos[outgoing].src}
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 1100px"
                className="moments-image moments-image--outgoing"
              />
            )}
            <Image
              key={`in-${photo.src}`}
              src={photo.src}
              alt=""
              fill
              sizes="(max-width: 760px) 100vw, 1100px"
              priority={index === 0}
              className={`moments-image${outgoing !== null ? ' moments-image--incoming' : ''}`}
            />
            <div className="moments-gradient" />
          </div>
          <div className="moments-overlay">
            <div className="moments-caption">
              <span className="pixel-label">Field notes / {String(index + 1).padStart(2, '0')}</span>
              <p key={photo.src}>{photo.title}</p>
            </div>
            <div className="moments-controls">
              <span className="pixel-num" aria-live="polite" aria-atomic="true">
                {String(index + 1).padStart(2, '0')} <span className="moments-counter-rule">/</span> {String(photos.length).padStart(2, '0')}
              </span>
              {photos.length > 1 && (
                <div className="moments-nav-buttons">
                  <button type="button" onClick={() => goRelative(-1)} aria-label="Previous photo">←</button>
                  <button type="button" onClick={() => goRelative(1)} aria-label="Next photo">→</button>
                </div>
              )}
            </div>
          </div>
          {photos.length > 1 && (
            <div className="moments-progress" aria-label={`Photo ${index + 1} of ${photos.length}`}>
              {photos.map((entry, i) => (
                <button
                  key={entry.src}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show photo ${i + 1}: ${entry.title}`}
                  aria-current={index === i ? 'true' : undefined}
                  className={index === i ? 'is-current' : ''}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="moments-empty">
          <span className="pixel-label">Kai Labs / Our story in photographs</span>
          <p>The gallery is taking shape. Photos of our workshops, people and milestones will appear here.</p>
        </div>
      )}
    </section>
  )
}
