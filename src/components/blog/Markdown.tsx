// ── Kai Blogs — Markdown renderer ───────────────────────────────────────────
//
// A small, dependency-free subset of Markdown, rendered straight to React
// elements. There is no HTML string and no dangerouslySetInnerHTML anywhere,
// so nothing in a post can inject markup — it can only ever produce the
// elements listed below.
//
// Blocks:  ## / ### / #### headings, paragraphs, > quotes, - and 1. lists,
//          ``` fenced code, --- rules, ![alt](src "caption") figures
// Inline:  **bold**, *italic* / _italic_, `code`, [links](url)

import type { ReactNode } from 'react'

type Block =
  | { kind: 'heading'; level: 2 | 3 | 4; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'rule' }
  | { kind: 'figure'; alt: string; src: string; caption?: string }

const RE = {
  fence: /^```\s*([\w+-]*)\s*$/,
  heading: /^(#{1,4})\s+(.*)$/,
  rule: /^(-{3,}|\*{3,}|_{3,})\s*$/,
  figure: /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/,
  quote: /^>\s?/,
  bullet: /^\s*[-*+]\s+/,
  numbered: /^\s*\d+[.)]\s+/,
}

function startsBlock(line: string): boolean {
  return (
    RE.fence.test(line) || RE.heading.test(line) || RE.rule.test(line) ||
    RE.figure.test(line) || RE.quote.test(line) || RE.bullet.test(line) || RE.numbered.test(line)
  )
}

export function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    const fence = line.match(RE.fence)
    if (fence) {
      const code: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++])
      i++ // closing fence
      blocks.push({ kind: 'code', lang: fence[1], code: code.join('\n') })
      continue
    }

    const heading = line.match(RE.heading)
    if (heading) {
      // The post title is the page's only h1, so a `#` in the body is an h2.
      const level = Math.min(4, Math.max(2, heading[1].length)) as 2 | 3 | 4
      blocks.push({ kind: 'heading', level, text: heading[2].trim() })
      i++
      continue
    }

    if (RE.rule.test(line)) { blocks.push({ kind: 'rule' }); i++; continue }

    const figure = line.match(RE.figure)
    if (figure) {
      blocks.push({ kind: 'figure', alt: figure[1], src: figure[2], caption: figure[3] })
      i++
      continue
    }

    if (RE.quote.test(line)) {
      const text: string[] = []
      while (i < lines.length && RE.quote.test(lines[i])) text.push(lines[i++].replace(RE.quote, ''))
      blocks.push({ kind: 'quote', text: text.join(' ').trim() })
      continue
    }

    const ordered = RE.numbered.test(line)
    if (ordered || RE.bullet.test(line)) {
      const marker = ordered ? RE.numbered : RE.bullet
      const items: string[] = []
      while (i < lines.length && lines[i].trim()) {
        if (marker.test(lines[i])) items.push(lines[i].replace(marker, ''))
        else if (/^\s+/.test(lines[i]) && items.length) items[items.length - 1] += ` ${lines[i].trim()}`
        else break
        i++
      }
      blocks.push({ kind: 'list', ordered, items })
      continue
    }

    const text: string[] = []
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) text.push(lines[i++].trim())
    blocks.push({ kind: 'paragraph', text: text.join(' ') })
  }

  return blocks
}

// ── Inline ──────────────────────────────────────────────────────────────────

// Order matters: code first, so nothing inside backticks is interpreted.
// Underscore italics need word boundaries or snake_case names would italicise.
const INLINE =
  /(`[^`]+`)|(\[[^\]]+\]\([^)\s]+\))|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*)|((?<!\w)_[^_\s][^_]*_(?!\w))/

/** Only schemes that can't execute. Anything else becomes an inert anchor. */
function safeHref(href: string): string {
  return /^(https?:|mailto:|\/|#)/i.test(href) ? href : '#'
}

function inline(text: string, keyPrefix = ''): ReactNode[] {
  const out: ReactNode[] = []
  let rest = text
  let n = 0

  while (rest) {
    const m = rest.match(INLINE)
    if (!m || m.index === undefined) { out.push(rest); break }
    if (m.index > 0) out.push(rest.slice(0, m.index))

    const token = m[0]
    const key = `${keyPrefix}${n++}`

    if (token.startsWith('`')) {
      out.push(<code key={key}>{token.slice(1, -1)}</code>)
    } else if (token.startsWith('[')) {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)!
      const external = /^https?:/i.test(href)
      out.push(
        <a
          key={key}
          href={safeHref(href)}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {inline(label, `${key}-`)}
        </a>
      )
    } else if (token.startsWith('**')) {
      out.push(<strong key={key}>{inline(token.slice(2, -2), `${key}-`)}</strong>)
    } else {
      out.push(<em key={key}>{inline(token.slice(1, -1), `${key}-`)}</em>)
    }

    rest = rest.slice(m.index + token.length)
  }

  return out
}

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_[\]()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Render ──────────────────────────────────────────────────────────────────

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source)

  return (
    <div className="blog-prose">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'heading': {
            const Tag = `h${block.level}` as 'h2' | 'h3' | 'h4'
            return <Tag key={i} id={headingId(block.text)}>{inline(block.text)}</Tag>
          }
          case 'paragraph':
            return <p key={i}>{inline(block.text)}</p>
          case 'quote':
            return <blockquote key={i}><p>{inline(block.text)}</p></blockquote>
          case 'list': {
            const List = block.ordered ? 'ol' : 'ul'
            return (
              <List key={i}>
                {block.items.map((item, j) => <li key={j}>{inline(item, `${j}-`)}</li>)}
              </List>
            )
          }
          case 'code':
            return (
              <pre key={i} data-lang={block.lang || undefined}>
                <code>{block.code}</code>
              </pre>
            )
          case 'rule':
            return <hr key={i} />
          case 'figure':
            return (
              <figure key={i}>
                {/* Plain <img>: post images can be any size or host, and
                    next/image would need dimensions the author never wrote. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={safeHref(block.src)} alt={block.alt} loading="lazy" />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            )
        }
      })}
    </div>
  )
}
