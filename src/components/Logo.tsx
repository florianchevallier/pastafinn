import { cn } from '@/lib/utils'

/** A disc seen from above: the menu lives on it. */
export function DiscMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-6', className)}>
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" />
      <circle cx="16" cy="16" r="3.2" fill="var(--primary)" />
      <path d="M16 2a14 14 0 0 1 12.12 7" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-[-0.02em]', className)}>
      <DiscMark />
      <span>
        Pasta<span className="text-primary">Finn</span>
      </span>
    </span>
  )
}
