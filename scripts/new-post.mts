/**
 * Kai Blogs — start a new post.
 *
 *   npm run blog:new -- "On reading papers slowly"
 *
 * Creates content/blog/<slug>.md with today's date and `draft: true`, so it
 * appears at /blog/<slug> under `npm run dev` but not on the live site. When
 * it's ready, delete the draft line (or set it to false) and push.
 */
import fs from 'node:fs'
import path from 'node:path'

const title = process.argv.slice(2).join(' ').trim()
if (!title) {
  console.error('Usage: npm run blog:new -- "Your post title"')
  process.exit(1)
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .split('-')
  .slice(0, 8)
  .join('-')

const dir = path.join(process.cwd(), 'content', 'blog')
const file = path.join(dir, `${slug}.md`)
if (fs.existsSync(file)) {
  console.error(`✗ content/blog/${slug}.md already exists`)
  process.exit(1)
}

const today = new Date().toISOString().slice(0, 10)
const quoted = title.includes(':') ? `"${title.replace(/"/g, '\\"')}"` : title

fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(
  file,
  `---
title: ${quoted}
date: ${today}
excerpt:
tags: []
draft: true
---

Start writing here.
`,
  'utf-8'
)

console.log(`✓ content/blog/${slug}.md`)
console.log(`  Preview: npm run dev → http://localhost:3000/blog/${slug}`)
console.log(`  Publish: remove "draft: true", commit, push.`)
