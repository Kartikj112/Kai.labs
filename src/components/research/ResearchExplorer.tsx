'use client'

import { useMemo, useState } from 'react'
import { FeaturedResearch } from './FeaturedResearch'
import { CategoryFilter } from './CategoryFilter'
import { ResearchCard } from './ResearchCard'
import { getFeaturedArticle } from '@/lib/research/helpers'
import type { LoadedResearchArticle } from '@/lib/research/types'

interface ResearchExplorerProps {
  articles: LoadedResearchArticle[]
  categories: string[]
}

export function ResearchExplorer({ articles, categories }: ResearchExplorerProps) {
  const [activeCategory, setActiveCategory] = useState('All')

  const featured = useMemo(() => getFeaturedArticle(articles), [articles])

  const filtered = useMemo(
    () => (activeCategory === 'All' ? articles : articles.filter((a) => a.category === activeCategory)),
    [articles, activeCategory]
  )

  if (articles.length === 0) {
    return (
      <div
        style={{
          border: '1px dashed var(--border-color)', borderRadius: 14,
          padding: '56px 32px', textAlign: 'center',
        }}
      >
        <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13, color: 'var(--muted)', lineHeight: 1.9 }}>
          No research articles published yet. New analyses will appear here automatically
          as they&apos;re added to <code>content/research/</code>.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 64 }}>
      {featured && <FeaturedResearch article={featured} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <CategoryFilter categories={categories} active={activeCategory} onSelect={setActiveCategory} />

        {filtered.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-mono), DM Mono, monospace', fontSize: 13, color: 'var(--muted)' }}>
            No articles in this category yet.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 24,
            }}
          >
            {filtered.map((article, i) => (
              <ResearchCard key={article.slug} article={article} revealDelay={((i % 3) + 1) as 1 | 2 | 3} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
