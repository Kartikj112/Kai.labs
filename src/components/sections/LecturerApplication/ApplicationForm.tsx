'use client'

import { useRef, useState } from 'react'

const FORM_ACTION =
  'https://docs.google.com/forms/d/e/1FAIpQLSfKaREgG42EZN1LNpkXbfy6Zw_gVchghcFqUU3M071usB5qRg/formResponse'

export function ApplicationForm() {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState(false)
  const formRef                     = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    // Let native POST to hidden iframe proceed — do NOT preventDefault
    if (!formRef.current?.checkValidity()) {
      e.preventDefault()
      formRef.current?.reportValidity()
      return
    }

    setSuccess(false)
    setError(false)
    setSubmitting(true)

    // Show success after 1.5 s (cross-origin iframe fires but is unreadable)
    setTimeout(() => {
      setSuccess(true)
      setSubmitting(false)
      formRef.current?.reset()
    }, 1500)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border-color)',
    color: 'var(--text)',
    fontFamily: 'var(--font-mono), DM Mono, monospace',
    fontSize: 13,
    padding: '14px 16px',
    outline: 'none',
    transition: 'border-color 0.3s, background 0.3s',
    appearance: 'none' as const,
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono), DM Mono, monospace',
    fontSize: 11, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--text)',
    display: 'flex', alignItems: 'center', gap: 8,
  }

  const hintStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono), DM Mono, monospace',
    fontSize: 10, color: 'var(--muted)', lineHeight: 1.6, marginTop: 4,
  }

  const focusStyle = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = 'rgba(184,245,200,.4)'
      e.target.style.background  = 'var(--hover)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      e.target.style.borderColor = 'var(--border-color)'
      e.target.style.background  = 'var(--surface)'
    },
  }

  return (
    <>
      {/* Hidden iframe target for Google Forms POST */}
      <iframe name="hidden_iframe" id="hidden_iframe" style={{ display: 'none' }} aria-hidden="true" />

      <form
        ref={formRef}
        action={FORM_ACTION}
        method="POST"
        target="hidden_iframe"
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        {/* Full Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle} htmlFor="fullName">
            Full Name <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="entry.1826661602"
            style={inputStyle}
            placeholder="Your full name"
            required
            {...focusStyle}
          />
        </div>

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle} htmlFor="email">
            Email Address <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            type="email"
            id="email"
            name="entry.1733648208"
            style={inputStyle}
            placeholder="your.email@example.com"
            required
            {...focusStyle}
          />
          <p style={hintStyle}>We'll use this to contact you about your application.</p>
        </div>

        {/* Institution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle} htmlFor="institution">
            Current Institution / Affiliation
          </label>
          <input
            type="text"
            id="institution"
            name="entry.177539739"
            style={inputStyle}
            placeholder="University, research institute, or company"
            {...focusStyle}
          />
        </div>

        {/* Position */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle} htmlFor="position">
            Current Position
          </label>
          <select
            id="position"
            name="entry.119414553"
            style={{ ...inputStyle, cursor: 'pointer' }}
            {...focusStyle}
          >
            <option value="">Select your current position</option>
            <option value="Undergraduate Student">Undergraduate Student</option>
            <option value="Master's Student">Master&apos;s Student</option>
            <option value="PhD Candidate">PhD Candidate</option>
            <option value="Postdoctoral Researcher">Postdoctoral Researcher</option>
            <option value="Research Associate/Scientist">Research Associate / Scientist</option>
            <option value="Faculty/Professor">Faculty / Professor</option>
            <option value="Industry Professional">Industry Professional</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Specialization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle} htmlFor="specialization">
            Area of Specialization <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            type="text"
            id="specialization"
            name="entry.1842851270"
            style={inputStyle}
            placeholder="e.g., Metagenomics, Phylogenetics, RNA-seq Analysis"
            required
            {...focusStyle}
          />
          <p style={hintStyle}>What specific area(s) would you teach?</p>
        </div>

        {/* Experience */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle} htmlFor="experience">
            Relevant Experience <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <select
            id="experience"
            name="entry.808288308"
            style={{ ...inputStyle, cursor: 'pointer' }}
            required
            {...focusStyle}
          >
            <option value="">Select years of experience</option>
            <option value="Less than 1 Year">Less than 1 Year</option>
            <option value="1 - 2 Years">1 – 2 Years</option>
            <option value="3 - 5 Years">3 – 5 Years</option>
            <option value="5 - 10 Years">5 – 10 Years</option>
            <option value="10+ Years">10+ Years</option>
          </select>
        </div>

        {/* Topics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={labelStyle} htmlFor="topics">
            Proposed Workshop Topics <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <textarea
            id="topics"
            name="entry.22221171"
            style={{ ...inputStyle, minHeight: 120, lineHeight: '1.8', resize: 'vertical' }}
            placeholder="Describe the workshop(s) you'd like to design and deliver..."
            required
            {...focusStyle}
          />
          <p style={hintStyle}>Be as specific as possible. Mention tools, datasets, and learning outcomes.</p>
        </div>

        {/* Consent checkbox */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            id="consent"
            name="entry.1153436918"
            value="Yes, I consent."
            required
            style={{
              width: 18, height: 18,
              border: '1px solid var(--border-color)',
              background: 'var(--surface)',
              cursor: 'pointer', flexShrink: 0, marginTop: 2,
              accentColor: 'var(--accent)',
            }}
          />
          <label
            htmlFor="consent"
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 12, lineHeight: 1.6,
              color: 'var(--muted)', cursor: 'pointer',
            }}
          >
            I consent to Kai Genomics storing and using my information to evaluate this application and contact me regarding satellite lecturer opportunities.
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="submitBtn"
          disabled={submitting}
          style={{
            background: submitting ? 'var(--muted)' : 'var(--accent)',
            color: '#050507',
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 11, letterSpacing: '0.15em',
            textTransform: 'uppercase', padding: '16px 40px',
            border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'background 0.3s, transform 0.2s',
            width: '100%', marginTop: 16,
            opacity: submitting ? 0.4 : 1,
          }}
          onMouseEnter={e => {
            if (!submitting) {
              e.currentTarget.style.background = 'var(--accent2)'
              e.currentTarget.style.transform  = 'translateY(-2px)'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--accent)'
            e.currentTarget.style.transform  = 'translateY(0)'
          }}
        >
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>

        {/* Success */}
        {success && (
          <div style={{
            padding: '20px 24px', borderRadius: 4,
            background: 'rgba(184,245,200,.08)',
            border: '1px solid rgba(184,245,200,.2)',
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 12, lineHeight: 1.8, color: 'var(--accent)',
          }}>
            Application received — thank you! We'll be in touch within a few days.
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '20px 24px', borderRadius: 4,
            background: 'rgba(255,106,42,.08)',
            border: '1px solid rgba(255,106,42,.2)',
            fontFamily: 'var(--font-mono), DM Mono, monospace',
            fontSize: 12, lineHeight: 1.8, color: '#ff6a2a',
          }}>
            Something went wrong. Please try again or email us directly.
          </div>
        )}
      </form>
    </>
  )
}
