import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getAllPosts, getPostBySlug } from '@/lib/blog/posts'
import { formatDate } from '@/lib/research/helpers'
import { founderName, founderRole } from '@/lib/data/about'
import { Markdown } from '@/components/blog/Markdown'
import { ReadingProgress } from '@/components/blog/ReadingProgress'
import { SITE_URL } from '@/lib/site-config'
import type { BlogPost } from '@/lib/blog/types'

interface Props {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Kai Blogs — Kai Labs' }

  const url = `${SITE_URL}/blog/${post.slug}`
  const cover = post.cover ? (post.cover.startsWith('http') ? post.cover : `${SITE_URL}${post.cover}`) : undefined

  return {
    title: `${post.title} — Kai Blogs`,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    robots: post.draft ? { index: false } : undefined,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url,
      publishedTime: post.date,
      authors: [post.author],
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: cover ? 'summary_large_image' : 'summary',
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  // Posts are newest-first, so the next index is the older post.
  const all = getAllPosts()
  const at = all.findIndex((p) => p.slug === post.slug)
  const newer = at > 0 ? all[at - 1] : undefined
  const older = at < all.length - 1 ? all[at + 1] : undefined
  const isFounder = post.author === founderName

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <ReadingProgress targetId="post-body" />

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="blog-pad" style={{ padding: '140px 40px 0', maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/blog" className="blog-back">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
            <path d="M5 1L1 5L5 9M1 5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          All posts
        </Link>

        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26, flexWrap: 'wrap' }}>
          <span className="pixel-label" style={{ color: 'var(--accent)' }}>Kai Blogs</span>
          <span aria-hidden style={{ width: 24, height: 1, background: 'var(--border-color)' }} />
          <span className="pixel-label" style={{ color: 'var(--muted)' }}>{post.readingTime}</span>
          {post.draft && <span className="sample-badge">Draft · dev only</span>}
        </div>

        <h1
          className="animate-fade-up"
          style={{
            fontFamily: 'var(--font-pixel-display), ui-monospace, monospace',
            fontWeight: 500, fontSize: 'clamp(36px, 6vw, 76px)', lineHeight: 1.05,
            letterSpacing: 0, maxWidth: 960, marginBottom: 28, animationDelay: '0.1s',
            overflowWrap: 'break-word',
          }}
        >
          {post.title}
        </h1>

        {post.dek && (
          <p
            className="animate-fade-up"
            style={{
              fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif',
              fontSize: 'clamp(20px, 2vw, 26px)', lineHeight: 1.45, color: 'var(--muted)',
              maxWidth: 760, marginBottom: 40, animationDelay: '0.15s',
            }}
          >
            {post.dek}
          </p>
        )}

        <div
          className="animate-fade-up"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap',
            padding: '24px 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)',
            animationDelay: '0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {isFounder && (
              <span style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                <Image src="/Kartik.jpg" alt="" fill sizes="44px" style={{ objectFit: 'cover' }} />
              </span>
            )}
            <div>
              <p style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontSize: 19, lineHeight: 1.2 }}>
                {post.author}
              </p>
              {isFounder && (
                <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.08em', marginTop: 4 }}>
                  {founderRole}
                </p>
              )}
            </div>
          </div>
          <time dateTime={post.date} style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.06em' }}>
            {formatDate(post.date)}
          </time>
        </div>
      </header>

      {post.cover && (
        <div className="blog-pad" style={{ maxWidth: 1100, margin: '48px auto 0', padding: '0 40px' }}>
          <div className="blog-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.cover} alt="" />
          </div>
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="blog-body-grid blog-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 40px 0' }}>
        <aside className="blog-aside">
          <div style={{ position: 'sticky', top: 110, display: 'flex', flexDirection: 'column', gap: 28 }}>
            {post.tags.length > 0 && (
              <div>
                <p className="pixel-label pixel-label--sm" style={{ color: 'var(--muted)', marginBottom: 12 }}>Filed under</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {post.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            )}
            <div>
              <p className="pixel-label pixel-label--sm" style={{ color: 'var(--muted)', marginBottom: 10 }}>Published</p>
              <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 12, color: 'var(--text)', letterSpacing: '0.04em' }}>
                {formatDate(post.date)}
              </p>
            </div>
          </div>
        </aside>

        <article id="post-body" style={{ minWidth: 0 }}>
          <Markdown source={post.body} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 72 }}>
            <span aria-hidden style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
            <span className="pixel-label pixel-label--sm" style={{ color: 'var(--accent)' }}>End</span>
            <span aria-hidden style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          </div>
        </article>
      </div>

      {/* ── Keep reading ─────────────────────────────────────────── */}
      <nav aria-label="More posts" className="blog-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 40px 140px' }}>
        {(older || newer) && (
          <div className="blog-pager">
            {older ? <PagerCard post={older} direction="Older" /> : <span />}
            {newer ? <PagerCard post={newer} direction="Newer" align="right" /> : <span />}
          </div>
        )}
        <div style={{ marginTop: 48 }}>
          <Link href="/blog" className="btn-ghost">← All posts</Link>
        </div>
      </nav>
    </main>
  )
}

function PagerCard({ post, direction, align = 'left' }: { post: BlogPost; direction: string; align?: 'left' | 'right' }) {
  return (
    <Link href={`/blog/${post.slug}`} className={`blog-pager-card${align === 'right' ? ' blog-pager-card--right' : ''}`}>
      <span className="pixel-label pixel-label--sm" style={{ color: 'var(--accent)' }}>
        {direction === 'Older' ? '← ' : ''}{direction}{direction === 'Newer' ? ' →' : ''}
      </span>
      <span style={{ fontFamily: 'var(--font-display), Cormorant Garamond, Georgia, serif', fontSize: 24, lineHeight: 1.25 }}>
        {post.title}
      </span>
      <span style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em' }}>
        {formatDate(post.date)} · {post.readingTime}
      </span>
    </Link>
  )
}
