import assert from 'node:assert/strict'
import test from 'node:test'
import { getFeaturedArticle, isPublicResearchArticle, shouldRenderResearchImage } from '../src/lib/research/helpers.ts'
import type { ResearchArticle } from '../src/lib/research/types.ts'

function article(slug: string, overrides: Partial<ResearchArticle> = {}): ResearchArticle {
  return {
    slug, title: slug, date: '2026-10-07', category: 'Genomics',
    excerpt: 'Genome science paper', heroImage: { src: '/test.jpg', alt: 'Test' },
    ...overrides,
  }
}

test('sample entries, old Sample Entry journals, and drafts cannot enter the public feed', () => {
  assert.equal(isPublicResearchArticle(article('sample', { isSample: true })), false)
  assert.equal(isPublicResearchArticle(article('old-demo', { journal: 'Kai Research Digest — Sample Entry' })), false)
  assert.equal(isPublicResearchArticle(article('draft', { draft: true })), false)
  assert.equal(isPublicResearchArticle(article('real', { doi: '10.1016/j.example' })), true)
  assert.equal(isPublicResearchArticle(article('malformed-journal', { journal: 7 as unknown as string })), true)
})

test('a legacy pinned demo can never displace actual published research', () => {
  const samples = [
    article('pinned-demo', { featured: true, isSample: true }),
    article('new-real', { date: '2026-10-08', doi: '10.1234/new' }),
    article('older-real', { date: '2026-10-07', doi: '10.1234/old' }),
  ]
  assert.equal(getFeaturedArticle(samples)?.slug, 'new-real')
  assert.equal(getFeaturedArticle(samples.slice(0, 1)), undefined)
  assert.equal(getFeaturedArticle([
    ...samples, article('editor-pick', { featured: true, doi: '10.1234/featured' }),
  ])?.slug, 'editor-pick')
})

test('generic category art never displaces citation previews on listing and detail pages', () => {
  assert.equal(shouldRenderResearchImage({ src: '/research/images/_defaults/bgc-discovery.jpg', alt: 'decorative' }, true), false)
  assert.equal(shouldRenderResearchImage({ src: '/research/images/papers/verified.webp', alt: 'genuine figure', kind: 'paper-figure' }, true), true)
  assert.equal(shouldRenderResearchImage({ src: '/research/images/papers/missing.webp', alt: 'genuine figure' }, false), false)
  assert.equal(shouldRenderResearchImage({ src: '/editor-approved-image.jpg', alt: 'editor illustration' }, true), true)
})
