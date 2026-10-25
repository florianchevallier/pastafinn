import { Link } from '@tanstack/react-router'
import { Film, Tv } from 'lucide-react'
import { EmptyState, ErrorNote } from '@/components/States'
import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/lib/i18n'
import { imageUrl, useApi } from '@/lib/jellyfin'
import { useLibraries } from '@/lib/queries'

export function HomePage() {
  const { t } = useI18n()
  const { api } = useApi()
  const libraries = useLibraries()

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('home.title')}</h1>
      <div className="mt-6">
        {libraries.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="aspect-[16/9] rounded-xl" />
            ))}
          </div>
        ) : libraries.isError ? (
          <ErrorNote error={libraries.error} onRetry={() => libraries.refetch()} />
        ) : libraries.data.length === 0 ? (
          <EmptyState>{t('home.empty')}</EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {libraries.data.map((lib) => {
              const Icon = lib.CollectionType === 'movies' ? Film : Tv
              const image = lib.ImageTags?.Primary ? imageUrl(api, lib.Id!, 'Primary', { maxWidth: 720, quality: 85 }) : null
              return (
                <li key={lib.Id}>
                  <Link
                    to="/library/$libraryId"
                    params={{ libraryId: lib.Id! }}
                    className="group relative block aspect-[16/9] overflow-hidden rounded-xl border border-border bg-card"
                  >
                    {image && (
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover opacity-70 transition duration-500 ease-out-expo group-hover:scale-[1.03] group-hover:opacity-90"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <span className="absolute bottom-4 left-4 flex items-center gap-2 text-lg font-medium">
                      <Icon className="size-5 text-primary" aria-hidden />
                      {lib.Name}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
