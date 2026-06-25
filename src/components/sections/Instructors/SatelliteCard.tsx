'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { SatelliteInstructor } from '@/lib/types'

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
)

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
  </svg>
)

const iconMap = { linkedin: LinkedInIcon, email: EmailIcon, github: GitHubIcon, web: GitHubIcon }

const PersonIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

interface SatelliteCardProps {
  instructor: SatelliteInstructor
  revealDelay?: 1 | 2 | 3
}

export function SatelliteCard({ instructor, revealDelay = 1 }: SatelliteCardProps) {
  const [open, setOpen] = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const toggle = () => {
    if (instructor.isTbd) return
    setOpen((v) => !v)
  }

  const showPhoto = !!instructor.photoSrc && !imgFailed

  return (
    <div
      className={`satellite-card${instructor.isTbd ? ' satellite-tbd' : ''}${open ? ' open' : ''} reveal reveal-delay-${revealDelay}`}
      onClick={toggle}
      role={instructor.isTbd ? undefined : 'button'}
      tabIndex={instructor.isTbd ? undefined : 0}
      aria-expanded={instructor.isTbd ? undefined : open}
      onKeyDown={(e) => {
        if (!instructor.isTbd && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          toggle()
        }
      }}
    >
      {/* Badge */}
      {instructor.badge && (
        <span style={{
          position: 'absolute', top: 14, right: 14,
          fontFamily: 'var(--font-mono), DM Mono, monospace',
          fontSize: 9, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--accent)',
          border: '1px solid rgba(184,245,200,.2)', padding: '4px 8px',
        }}>
          {instructor.badge}
        </span>
      )}

      {/* Photo */}
      <div style={{
        width: 90, height: 90, marginBottom: 24,
        borderRadius: '50%', overflow: 'hidden',
        position: 'relative', border: '1px solid var(--border-color)',
      }}>
        {showPhoto ? (
          <Image
            src={instructor.photoSrc as string}
            alt={instructor.name}
            fill
            sizes="90px"
            style={{ objectFit: 'cover' }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(184,245,200,.03)',
            gap: 8, color: 'var(--muted)',
          }}>
            <PersonIcon />
            <span style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 8, letterSpacing: '0.15em',
              textTransform: 'uppercase', opacity: 0.4,
            }}>Photo</span>
          </div>
        )}
      </div>

      <p style={{
        fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
        fontSize: 20, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 10,
      }}>
        {instructor.name}
      </p>
      <p style={{
        fontFamily: 'var(--font-mono), DM Mono, monospace',
        fontSize: 11, lineHeight: 1.8, color: 'var(--muted)', letterSpacing: '0.04em',
      }}>
        {instructor.expertise}
      </p>

      {/* Expand affordance (clickable cards only) */}
      {!instructor.isTbd && (
        <svg
          className="satellite-chevron"
          width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      {/* Expandable dropdown */}
      {!instructor.isTbd && (
        <div className="satellite-dropdown">
          {instructor.intro && (
            <p style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 11, lineHeight: 1.9, color: 'var(--muted)',
              marginBottom: 20, paddingTop: 16,
              borderTop: '1px solid var(--border-color)',
            }}>
              {instructor.intro}
            </p>
          )}

          {instructor.skills && instructor.skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {instructor.skills.map((skill) => (
                <span key={skill} style={{
                  fontFamily: 'var(--font-mono), DM Mono, monospace',
                  fontSize: 9, letterSpacing: '0.1em',
                  textTransform: 'uppercase', border: '1px solid var(--border-color)',
                  padding: '4px 8px', color: 'var(--accent)',
                  background: 'rgba(184,245,200,.03)',
                }}>
                  {skill}
                </span>
              ))}
            </div>
          )}

          {instructor.links && instructor.links.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {instructor.links.map((link) => {
                const Icon = iconMap[link.type] ?? GitHubIcon
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.type !== 'email' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontFamily: 'var(--font-mono), DM Mono, monospace',
                      fontSize: 10, letterSpacing: '0.08em',
                      color: 'var(--muted)', textDecoration: 'none',
                      transition: 'color 0.3s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
                  >
                    <span style={{ width: 14, height: 14, flexShrink: 0, display: 'inline-flex' }}>
                      <Icon />
                    </span>
                    {link.label}
                  </a>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
