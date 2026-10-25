import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TrackOption {
  value: number
  label: string
  detail?: string | null
  tech?: string | null
  flags?: string[]
  current?: boolean
}

/**
 * One column of the disc menu. Native radios give arrow-key "remote" navigation and
 * screen-reader semantics; a single highlight bar glides to the checked row.
 */
export function TrackColumn({
  name,
  legend,
  icon,
  options,
  value,
  onChange,
  currentLabel,
  empty,
  disabled,
}: {
  name: string
  legend: string
  icon: ReactNode
  options: TrackOption[]
  value: number | null
  onChange: (v: number) => void
  currentLabel: string
  empty: string
  disabled?: boolean
}) {
  const list = useRef<HTMLDivElement>(null)
  const [bar, setBar] = useState<{ top: number; height: number } | null>(null)

  useLayoutEffect(() => {
    const el = list.current?.querySelector<HTMLElement>('[data-checked="true"]')
    setBar(el ? { top: el.offsetTop, height: el.offsetHeight } : null)
  }, [value, options])

  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {icon}
        {legend}
      </legend>
      {options.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div ref={list} className="relative -mx-2">
          {bar && (
            <div
              aria-hidden
              className="absolute inset-x-0 rounded-lg bg-primary/12 ring-1 ring-primary/40 transition-[top,height] duration-300 ease-out-expo"
              style={{ top: bar.top, height: bar.height }}
            />
          )}
          {options.map((o) => {
            const checked = o.value === value
            return (
              <label
                key={o.value}
                data-checked={checked}
                className={cn(
                  'group relative flex items-start gap-2 rounded-lg px-2 py-2.5 transition-colors',
                  'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                  !checked && 'hover:bg-foreground/[0.04]',
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={o.value}
                  checked={checked}
                  onChange={() => onChange(o.value)}
                  className="peer sr-only"
                />
                <ChevronRight
                  aria-hidden
                  className={cn(
                    'mt-0.5 size-4 shrink-0 text-primary transition-[opacity,translate] duration-300 ease-out-expo',
                    checked ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className={cn('flex flex-wrap items-baseline gap-x-2 text-[0.95rem] leading-snug', checked ? 'font-medium text-foreground' : 'text-foreground/85')}>
                    <span className="break-words">{o.label}</span>
                    {o.current && (
                      <span className="text-[0.7rem] font-medium tracking-wide text-primary uppercase">{currentLabel}</span>
                    )}
                  </span>
                  {(o.detail || o.tech || o.flags?.length) && (
                    <span className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                      {o.detail && <span>{o.detail}</span>}
                      {o.tech && <span className="font-mono tabular">{o.tech}</span>}
                      {o.flags?.map((f) => (
                        <span key={f} className="rounded border border-border px-1 leading-4">
                          {f}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </fieldset>
  )
}
