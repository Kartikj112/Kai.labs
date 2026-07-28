'use client'

import { useCallback, useEffect, useState } from 'react'
import type { VoteType } from '@/lib/types'

interface InterestPanelProps {
  workshopId: string
}

const STORAGE_PREFIX = 'kai-interest-'
const COUNTS_KEY     = 'kai-interest-counts'

function getVote(id: string): VoteType {
  try { return (localStorage.getItem(STORAGE_PREFIX + id) as VoteType) ?? null } catch { return null }
}

function getCounts(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(COUNTS_KEY) ?? '{}') } catch { return {} }
}

export function InterestPanel({ workshopId }: InterestPanelProps) {
  const [vote, setVote]   = useState<VoteType>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const saved = getVote(workshopId)
    const counts = getCounts()
    setVote(saved)
    setCount(counts[workshopId] ?? Math.floor(Math.random() * 30 + 5))
  }, [workshopId])

  const cast = useCallback((v: 'yes' | 'no') => {
    if (vote) return
    const counts = getCounts()
    const next = (counts[workshopId] ?? count) + (v === 'yes' ? 1 : 0)
    counts[workshopId] = next
    try {
      localStorage.setItem(STORAGE_PREFIX + workshopId, v)
      localStorage.setItem(COUNTS_KEY, JSON.stringify(counts))
    } catch { /* noop */ }
    setVote(v)
    if (v === 'yes') setCount(next)
  }, [vote, workshopId, count])

  const reset = useCallback(() => {
    try { localStorage.removeItem(STORAGE_PREFIX + workshopId) } catch { /* noop */ }
    setVote(null)
  }, [workshopId])

  const isVotedYes = vote === 'yes'
  const isVotedNo  = vote === 'no'
  const barWidth   = Math.min(100, (count / 50) * 100)

  return (
    <div style={{ marginBottom: 20 }}>
      {!vote ? (
        <>
          <p style={{
            fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
            fontSize: 26, fontWeight: 300, lineHeight: 1.15,
            letterSpacing: '-0.01em', marginBottom: 8,
          }}>
            Interested in this workshop?
          </p>
          <p style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 28,
          }}>
            Let us know if you'd join
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['yes', 'no'] as const).map((v) => (
              <button
                key={v}
                onClick={() => cast(v)}
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-mono), DM Mono, monospace',
                  fontSize: 11, letterSpacing: '0.2em',
                  textTransform: 'uppercase', padding: '14px 0',
                  border: '1px solid var(--border-color)',
                  background: 'none', color: 'var(--muted)',
                  cursor: 'pointer',
                  transition: 'background 0.25s, color 0.25s, border-color 0.25s, transform 0.2s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.color = v === 'yes' ? 'var(--text)' : 'rgba(255,100,100,.8)'
                  el.style.borderColor = v === 'yes' ? 'var(--accent)' : 'rgba(255,100,100,.5)'
                  el.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.color = 'var(--muted)'
                  el.style.borderColor = 'var(--border-color)'
                  el.style.transform = 'translateY(0)'
                }}
              >
                {v === 'yes' ? 'Yes, I\'d Join' : 'Not Right Now'}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 10, letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isVotedYes ? 'var(--accent)' : 'var(--muted)',
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              width: 14, height: 1,
              background: isVotedYes ? 'var(--accent)' : 'var(--muted)',
              display: 'inline-block', flexShrink: 0,
            }} />
            {isVotedYes ? 'Great — we\'ve noted your interest' : 'Thanks for letting us know'}
          </p>

          {isVotedYes && (
            <>
              {/* Progress bar */}
              <div style={{ background: 'var(--border-color)', height: 2, width: '100%', marginBottom: 14, overflow: 'hidden' }}>
                <div className="interest-bar-fill" style={{ width: `${barWidth}%` }} />
              </div>
              <p style={{
                fontFamily: 'var(--font-mono), DM Mono, monospace',
                fontSize: 10, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--muted)',
                marginBottom: 12, display: 'flex', alignItems: 'baseline', gap: 6,
              }}>
                <span style={{
                  fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
                  fontSize: 26, color: 'var(--accent)', fontWeight: 400,
                }}>
                  {count}
                </span>
                people interested
              </p>
              <p style={{
                fontFamily: 'var(--font-mono), DM Mono, monospace',
                fontSize: 11, lineHeight: 1.8,
                color: 'var(--muted)', letterSpacing: '0.04em', marginBottom: 16,
              }}>
                We launch workshops when demand is sufficient.{' '}
                <strong style={{ color: 'var(--accent)' }}>
                  Contact us
                </strong>{' '}
                to be notified.
              </p>
            </>
          )}

          <button
            onClick={reset}
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 10, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color 0.3s', padding: 0,
              textDecoration: 'underline', textDecorationColor: 'var(--border-color)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--accent)'
              e.currentTarget.style.textDecorationColor = 'var(--accent)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--muted)'
              e.currentTarget.style.textDecorationColor = 'var(--border-color)'
            }}
          >
            Change response
          </button>
        </>
      )}
    </div>
  )
}
