interface CategoryFilterProps {
  categories: string[]
  active: string
  onSelect: (category: string) => void
}

export function CategoryFilter({ categories, active, onSelect }: CategoryFilterProps) {
  return (
    <div
      className="research-filter-row"
      role="group"
      aria-label="Filter research by category"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}
    >
      {['All', ...categories].map((category) => {
        const isActive = active === category
        return (
          <button
            key={category}
            type="button"
            className={`category-chip${isActive ? ' active' : ''}`}
            aria-pressed={isActive}
            onClick={() => onSelect(category)}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
