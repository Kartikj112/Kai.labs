'use client'

import { useState } from 'react'
import type { PublicGalleryAsset } from '@/lib/social/asset-loader'
import type { CuratedLinkedInPost } from '@/lib/social/linkedin'

type ReaderItem =
  | { kind: 'post'; key: string; title: string; summary: string; label: string; url: string; embed: string }
  | { kind: 'pdf'; key: string; title: string; summary: string; label: string; url: string; embed: string }

/** A small, hand-curated LinkedIn shelf + a local PDF reader, with no API/scraping. */
export function LinkedInShowcase({
  posts,
  pdfs,
  profileUrl,
}: {
  posts: CuratedLinkedInPost[]
  pdfs: PublicGalleryAsset[]
  profileUrl: string
}) {
  const items: ReaderItem[] = [
    ...pdfs.map((pdf) => ({
      kind: 'pdf' as const,
      key: `pdf:${pdf.fileName}`,
      title: pdf.title,
      summary: 'Original slide deck · Read every page here on Kai Labs.',
      label: 'PDF carousel',
      url: pdf.src,
      embed: pdf.src + '#view=FitH',
    })),
    ...posts.map((post) => ({
      kind: 'post' as const,
      key: `linkedin:${post.id}`,
      title: post.title,
      summary: post.summary,
      label: post.label,
      url: post.url,
      embed: post.embedUrl,
    })),
  ]
  const [activeKey, setActiveKey] = useState<string | null>(items[0]?.key ?? null)
  const selected = items.find((item) => item.key === activeKey) ?? items[0]

  return (
    <section className="social-showcase" aria-labelledby="social-showcase-heading">
      <div className="social-showcase-heading">
        <div>
          <span className="pixel-label social-eyebrow">From the network / 01</span>
          <h2 id="social-showcase-heading" className="social-section-title">Ideas in <em>slides &amp; stories.</em></h2>
          <p className="social-description">
            Research notes, scientific stories and visual explainers shared on LinkedIn.
            Select a post to read it here, or explore original PDF carousels slide by slide.
          </p>
        </div>
        <a className="social-profile-link" href={profileUrl} target="_blank" rel="noopener noreferrer">
          View LinkedIn profile <span aria-hidden>↗</span>
        </a>
      </div>

      {items.length === 0 ? (
        <div className="social-empty">
          <span className="pixel-label">Visual notes / Coming soon</span>
          <p>Explore the latest science stories on LinkedIn. Curated posts and original PDF carousels will appear here.</p>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer">Browse posts on LinkedIn ↗</a>
        </div>
      ) : (
        <div className="social-showcase-grid">
          <div className="social-shelf" aria-label="Select a LinkedIn post or PDF carousel">
            <span className="pixel-label social-shelf-label">The reading shelf <span>{String(items.length).padStart(2, '0')}</span></span>
            <div className="social-shelf-list">
              {items.map((item, index) => (
                <button
                  className={`social-shelf-item${selected?.key === item.key ? ' is-current' : ''}`}
                  key={item.key}
                  type="button"
                  onClick={() => setActiveKey(item.key)}
                  aria-pressed={selected?.key === item.key}
                  aria-controls="social-reader-panel"
                >
                  <span className="social-shelf-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="social-shelf-body">
                    <span className="social-shelf-type">{item.label}</span>
                    <span className="social-shelf-title">{item.title}</span>
                    <span className="social-shelf-summary">{item.summary}</span>
                  </span>
                  <span className="social-shelf-arrow" aria-hidden>↗</span>
                </button>
              ))}
            </div>
            <p className="social-shelf-note">
              LinkedIn embeds may be limited by browser privacy settings. Locally hosted PDFs open without a LinkedIn account.
            </p>
          </div>

          <div className="social-reader" id="social-reader-panel" aria-live="off">
            <div className="social-reader-top">
              <span className="pixel-label">Reading window / {selected?.kind === 'pdf' ? 'Original PDF' : 'LinkedIn'}</span>
              <span className="social-reader-indicator" aria-hidden><i /> Kai Labs</span>
            </div>
            {selected && (
              <>
                <div className="social-reader-frame-wrap" key={selected.key}>
                  <iframe
                    className="social-reader-frame"
                    src={selected.embed}
                    title={selected.kind === 'pdf' ? `PDF carousel: ${selected.title}` : `LinkedIn post: ${selected.title}`}
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className="social-reader-footer">
                  <div>
                    <span className="social-reader-caption">{selected.kind === 'pdf' ? 'Original presentation' : 'LinkedIn / Public post'}</span>
                    <h3>{selected.title}</h3>
                  </div>
                  <a href={selected.url} target="_blank" rel="noopener noreferrer">
                    {selected.kind === 'pdf' ? 'Open full PDF' : 'Open original post'} <span aria-hidden>↗</span>
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
