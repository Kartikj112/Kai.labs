import { cn } from '@/lib/utils'

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
  reveal?: boolean
}

export function SectionLabel({ children, className, reveal = true }: SectionLabelProps) {
  return (
    <div className={cn('section-label', reveal && 'reveal', className)}>
      {children}
    </div>
  )
}
