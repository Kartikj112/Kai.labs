import type { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/research/articles'
import { getAllPosts } from '@/lib/blog/posts'
import { ENGINE_MODULES } from '@/lib/engines/registry'
import { SITE_URL } from '@/lib/site-config'

const STATIC_ROUTES = [
  '',
  '/genomics',
  '/exchange',
  '/exchange/host',
  '/research',
  '/blog',
  '/tools',
  '/engine',
  '/about',
  '/contact',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/research' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))

  const articleEntries: MetadataRoute.Sitemap = getAllArticles().map((article) => ({
    url: `${SITE_URL}/research/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const postEntries: MetadataRoute.Sitemap = getAllPosts()
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  // Every live Decision Engine module is its own indexable page — these are
  // the deepest, most searched-for content on the site, so they belong here.
  const engineEntries: MetadataRoute.Sitemap = ENGINE_MODULES.filter(
    (m) => m.status === 'live'
  ).map((m) => ({
    url: `${SITE_URL}/engine/${m.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticEntries, ...articleEntries, ...postEntries, ...engineEntries]
}
