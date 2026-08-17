import type { MetadataRoute } from 'next'
import { getAllArticles } from '@/lib/research/articles'
import { SITE_URL } from '@/lib/site-config'

const STATIC_ROUTES = ['', '/genomics', '/exchange', '/research', '/tools', '/about', '/contact']

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

  return [...staticEntries, ...articleEntries]
}
