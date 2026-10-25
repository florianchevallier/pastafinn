import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { Loader2, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { EmptyState, ErrorNote } from '@/components/States'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/lib/i18n'
import { imageUrl, useApi } from '@/lib/jellyfin'
import { useLibraryItems } from '@/lib/queries'

/** Debounced search box kept in the URL (`?q=`), so reload and back keep it. */
export function SearchField({ q, label, className }: { q: string; label: string; className?: string }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState(q)
  const [seenQ, setSeenQ] = useState(q)
  // The URL changed without typing (back button, logo link): show it, or the debounce would write the old text back.
  if (q !== seenQ) {
    setSeenQ(q)
    if (q !== draft.trim()) setDraft(q)
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (draft.trim() !== q) void navigate({ to: '.', search: draft.trim() ? { q: draft.trim() } : {}, replace: true })
    }, 250)
    return () => clearTimeout(id)
  }, [draft, q, navigate])

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        aria-label={label}
        placeholder={label}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="h-10 pl-9"
      />
    </div>
  )
}

/** Series and movies of one library, or of all of them without `libraryId`, with infinite scroll. */
export function TitleGrid({ libraryId, q }: { libraryId?: string; q: string }) {
  const { t } = useI18n()
  const items = useLibraryItems(libraryId, q)
  const sentinel = useRef<HTMLDivElement>(null)

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = items
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && !isFetchingNextPage && fetchNextPage(), { rootMargin: '800px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const all = items.data?.pages.flatMap((p) => p.Items ?? []) ?? []

  if (items.isPending)
    return (
      <PosterGrid>
        {SKELETONS.map((n) => (
          <li key={n}>
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </li>
        ))}
      </PosterGrid>
    )
  if (items.isError) return <ErrorNote error={items.error} onRetry={() => items.refetch()} />
  if (all.length === 0) return <EmptyState>{q ? t('library.noResults', { q }) : t('library.empty')}</EmptyState>
  return (
    <>
      <PosterGrid>
        {all.map((item) => (
          <Poster key={item.Id} item={item} />
        ))}
      </PosterGrid>
      <div ref={sentinel} className="flex justify-center py-8">
        {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label={t('common.loading')} />}
      </div>
    </>
  )
}

const SKELETONS = Array.from({ length: 12 }, (_, i) => i)

function PosterGrid({ children }: { children: React.ReactNode }) {
  return <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{children}</ul>
}

function Poster({ item }: { item: BaseItemDto }) {
  const { api } = useApi()
  const src = item.ImageTags?.Primary ? imageUrl(api, item.Id!, 'Primary', { maxWidth: 320, quality: 85 }) : null
  return (
    // content-visibility keeps very large libraries cheap to render
    <li className="[content-visibility:auto] [contain-intrinsic-size:auto_320px]">
      <Link to="/title/$itemId" params={{ itemId: item.Id! }} className="group block rounded-lg">
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-card">
          {src ? (
            <img
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition duration-500 ease-out-expo group-hover:scale-[1.04]"
            />
          ) : (
            <span aria-hidden className="grid size-full place-items-center p-3 text-center text-sm text-muted-foreground">
              {item.Name}
            </span>
          )}
          <span className="absolute inset-0 rounded-lg ring-primary/0 ring-inset transition group-hover:ring-2 group-hover:ring-primary/70" />
        </div>
        <p className="mt-2 truncate text-sm font-medium">{item.Name}</p>
        {item.ProductionYear && <p className="text-xs text-muted-foreground tabular">{item.ProductionYear}</p>}
      </Link>
    </li>
  )
}
