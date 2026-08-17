interface ArticleSectionProps {
  title: string
  paragraphs: string[]
}

export function ArticleSection({ title, paragraphs }: ArticleSectionProps) {
  if (!paragraphs || paragraphs.length === 0) return null

  return (
    <div style={{ marginBottom: 52 }}>
      <p className="detail-section-title">{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              fontFamily: 'var(--font-mono), DM Mono, monospace',
              fontSize: 13, lineHeight: 2, color: 'var(--muted)',
            }}
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  )
}
