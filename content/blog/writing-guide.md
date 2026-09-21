---
title: How to write for Kai Blogs
date: 2026-09-21
excerpt: A private reference for every format a post supports. It stays a draft, so it is only ever visible under npm run dev.
tags: [guide, meta]
draft: true
---

Every post is one Markdown file in `content/blog/`. The opening paragraph gets the pixel drop cap automatically, so start with a sentence worth reading. This file is a draft and never reaches the live site — keep it as a reference, or delete it.

## Starting a post

Run `npm run blog:new -- "Your title"`. It creates the file with today's date and `draft: true`. Write, preview at `localhost:3000/blog/<slug>`, then remove the draft line and push. Vercel redeploys and the post is live.

The frontmatter fields:

- **title** and **date** are required. Date is `YYYY-MM-DD`.
- **excerpt** is the line on the index and the stand-first under the title. Leave it empty and the first paragraph is used on the index instead.
- **tags** are written as a list: `[genomics, method]`.
- **cover** is an optional image — put the file in `public/blog/` and write `/blog/your-image.jpg`.
- **featured: true** pins a post to the top of the index.

## Formatting

Headings use `##` and `###`. Text can be **bold**, *italic*, or `inline code`, and [links](https://kai-genomics.vercel.app) open in a new tab when they point off-site.

> A quote renders as a pull quote — set in Cormorant, large, with an oxblood rule. Use it for the one line you want remembered.

### Lists

1. Numbered lists get pixel numerals.
2. They are good for sequences and steps.
3. Keep items to a sentence or two.

#### A small label heading

Four hashes make a small uppercase label — useful for short asides like a "Further reading" block.

---

A line of three dashes makes a section break. Code blocks keep their spacing and show the language in the corner:

```bash
checkm2 predict --input bins/ --output-directory checkm2_out --threads 16
```

Images go on their own line, with an optional caption in quotes:

![Metagenomics illustration](/research/images/_defaults/metagenomics.jpg "Captions sit underneath in small mono type.")

That's everything. Write the way you'd talk to a colleague you respect.
