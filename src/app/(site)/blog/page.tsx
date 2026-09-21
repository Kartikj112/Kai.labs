import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog/posts'
import { formatDate } from '@/lib/research/helpers'
import type { BlogPost } from '@/lib/blog/types'

export const metadata: Metadata = {
  title: 'Kai Blogs — Kai Labs',
  description:
    'Thoughts, ideas, and working notes from Kai Labs — on computational biology, the craft of research, and what we are building next.',
}

export default function BlogIndexPage() {
  const posts = getAllPosts()
  const lead = posts.find((p) => p.featured) ?? posts[0]
  const rest = posts.filter((p) => p !== lead)

  return (
    <main style={{ paddingTop: 64 }}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: '120px 40px 72px', maxWidth: 1200, margin: '0 auto' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 30% 42% at 68% 34%, var(--accent-soft) 0%, transparent 100%)',
          }}
        />

        <span
          className="animate-fade-up pixel-label"
          style={{ display: 'block', fontSize: 12, letterSpacing: '0.2em', color: 'var(--accent)', position: 'relative' }}
        >
          Kai Labs · Notes from the Lab
        </span>

        <h1
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-pixel-display), ui-monospace, monospace',
            fontWeight: 500, fontSize: 'clamp(56px, 11vw, 150px)', lineHeight: 1.04,
            letterSpacing: 0, margin: '28px 0 32px', position: 'relative', animationDelay: '0.1s',
          }}
        >
          Kai<span style={{ color: 'var(--accent)' }}>Blogs</span>
        </h1>

        <div
          className="animate-fade-up blog-hero-row"
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            gap: 40, flexWrap: 'wrap', position: 'relative', animationDelay: '0.2s',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 14, color: 'var(--muted)', letterSpacing: '0.04em', lineHeight: 1.9, maxWidth: 580,
            }}
          >
            Thoughts, ideas, and working notes — on computational biology, the craft of
            research, and what we&apos;re building next. Written slowly, published when ready.
          </p>

          {posts.length > 0 && (
            <div style={{ display: 'flex', gap: 36 }}>
              <Stat value={String(posts.length).padStart(2, '0')} label={posts.length === 1 ? 'Post' : 'Posts'} />
              <Stat value={shortDate(posts[0].date)} label="Latest" />
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: '0 40px 140px', maxWidth: 1200, margin: '0 auto' }}>
        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <LeadPost post={lead!} />

            {rest.length > 0 && (
              <div style={{ marginTop: 96 }}>
                <div
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                    marginBottom: 8,
                  }}
                >
                  <span className="pixel-label" style={{ color: 'var(--muted)' }}>Archive</span>
                  <span className="pixel-num" style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {String(rest.length).padStart(2, '0')}
                  </span>
                </div>

                <div>
                  {rest.map((post, i) => (
                    <PostRow key={post.slug} post={post} index={i + 2} delay={Math.min(i, 6) * 0.06} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}

function shortDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="pixel-num" style={{ fontSize: 22, color: 'var(--text)' }}>{value}</span>
      <span className="pixel-label pixel-label--sm" style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  )
}

function DraftBadge() {
  return <span className="sample-badge">Draft · dev only</span>
}

function LeadPost({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-lead animate-fade-up" style={{ animationDelay: '0.3s' }}>
      {post.cover && (
        <div className="blog-lead-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover} alt="" />
        </div>
      )}

      <div className="blog-lead-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="pixel-label" style={{ color: 'var(--accent)' }}>
            {post.featured ? 'Featured' : 'Latest'}
          </span>
          <span className="pixel-num" style={{ fontSize: 12, color: 'var(--muted)' }}>01</span>
          <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', lineHeight: 1.8 }}>
            {formatDate(post.date)}
            <br />
            {post.readingTime}
          </span>
          {post.draft && <span><DraftBadge /></span>}
        </div>

        <div>
          <h2
            className="blog-lead-title"
            style={{
              fontFamily: 'var(--font-pixel-display), ui-monospace, monospace',
              fontWeight: 500, fontSize: 'clamp(30px, 4.2vw, 56px)', lineHeight: 1.06,
              letterSpacing: 0, marginBottom: 24,
            }}
          >
            {post.title}
          </h2>

          <p
            style={{
              fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(19px, 1.7vw, 23px)', lineHeight: 1.5, color: 'var(--muted)',
              maxWidth: 680, marginBottom: 32,
            }}
          >
            {post.excerpt}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <Tags tags={post.tags} />
            <span className="blog-read-link">Read the post →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function PostRow({ post, index, delay }: { post: BlogPost; index: number; delay: number }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="blog-row animate-fade-up"
      style={{ animationDelay: `${0.35 + delay}s` }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span className="pixel-num" style={{ fontSize: 12, color: 'var(--accent)' }}>
          {String(index).padStart(2, '0')}
        </span>
        <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em' }}>
          {formatDate(post.date)}
        </span>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <h3
            className="blog-row-title"
            style={{
              fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
              fontWeight: 400, fontSize: 'clamp(24px, 2.4vw, 30px)', lineHeight: 1.2, letterSpacing: '-0.01em',
            }}
          >
            {post.title}
          </h3>
          {post.draft && <DraftBadge />}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12.5, color: 'var(--muted)',
            lineHeight: 1.85, maxWidth: 640, marginBottom: 16,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
        >
          {post.excerpt}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {post.readingTime}
          </span>
          <Tags tags={post.tags.slice(0, 3)} />
        </div>
      </div>

      <span className="blog-row-arrow" aria-hidden>→</span>
    </Link>
  )
}

function Tags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {tags.map((t) => <span key={t} className="tag">{t}</span>)}
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="animate-fade-up"
      style={{
        border: '1px dashed var(--border-color)', borderRadius: 14,
        padding: '72px 32px', textAlign: 'center', animationDelay: '0.3s',
      }}
    >
      <span className="pixel-label" style={{ display: 'block', color: 'var(--accent)', marginBottom: 18 }}>
        Coming soon
      </span>
      <p style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontSize: 26, lineHeight: 1.35, maxWidth: 520, margin: '0 auto' }}>
        The first essay is on its way.
      </p>
      {process.env.NODE_ENV !== 'production' && (
        <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12, color: 'var(--muted)', lineHeight: 1.9, marginTop: 20 }}>
          Add a Markdown file to <code>content/blog/</code> — or run <code>npm run blog:new -- &quot;Your title&quot;</code>.
        </p>
      )}
    </div>
  )
}
