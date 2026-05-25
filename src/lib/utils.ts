/**
 * Lightweight classname merger — joins truthy strings.
 * Drop-in replacement for clsx without adding a dependency.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
