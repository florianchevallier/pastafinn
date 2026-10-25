import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { Loader2, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { EmptyState, ErrorNote } from '@/components/States'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/lib/i18n'
import { imageUrl, useApi } from '@/lib/jellyfin'
import { useLibraries, useLibraryItems } from '@/lib/queries'

export function LibraryPage() {
  const { t } = useI18n()
  const { libraryId } = useParams({ from: '/app/library/$libraryId' })
  const { q = '' } = useSearch({ from: '/app/library/$libraryId' })
  const navigate = useNavigate({ from: '/library/$libraryId' })
  const [draft, setDraft] = useState(q)
  const library = useLibraries().data?.find((l) => l.Id === libraryId)
  const items = useLibraryItems(libraryId, q)
  const sentinel = useRef<HTMLDivElement>(null)

  // Debounced search kept in the URL, so reload and back keep it.
  useEffect(() => {
    const id = setTimeout(() => {
      if (draft.trim() !== q) void navigate({ search: draft.trim() ? { q: draft.trim() } : {}, replace: true })
    }, 250)
    return () => clearTimeout(id)
  }, [draft, q, navigate])

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = items
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && !isFetchingNextPage && fetchNextPage(), { rootMargin: '800px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const all = items.data?.pages.flatMap((p) => p.Items ?? []) ?? []
  const total = items.data?.pages[0]?.TotalRecordCount

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{library?.Name ?? ' '}</h1>
          {total != null && <p className="mt-1 text-sm text-muted-foreground tabular">{t('library.count', { n: total })}</p>}
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            aria-label={t('library.search')}
            placeholder={t('library.search')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      <div className="mt-8">
        {items.isPending ? (
          <PosterGrid>
            {SKELETONS.map((n) => (
              <li key={n}>
                <Skeleton className="aspect-[2/3] rounded-lg" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </li>
            ))}
          </PosterGrid>
        ) : items.isError ? (
          <ErrorNote error={items.error} onRetry={() => items.refetch()} />
        ) : all.length === 0 ? (
          <EmptyState>{q ? t('library.noResults', { q }) : t('library.empty')}</EmptyState>
        ) : (
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
        )}
      </div>
    </div>
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
