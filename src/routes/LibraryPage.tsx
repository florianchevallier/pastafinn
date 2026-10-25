import { useParams, useSearch } from '@tanstack/react-router'
import { SearchField, TitleGrid } from '@/components/Titles'
import { useI18n } from '@/lib/i18n'
import { useLibraries, useLibraryItems } from '@/lib/queries'

export function LibraryPage() {
  const { t } = useI18n()
  const { libraryId } = useParams({ from: '/app/library/$libraryId' })
  const { q = '' } = useSearch({ from: '/app/library/$libraryId' })
  const library = useLibraries().data?.find((l) => l.Id === libraryId)
  // same query as the grid: React Query shares it
  const total = useLibraryItems(libraryId, q).data?.pages[0]?.TotalRecordCount

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">{library?.Name ?? ' '}</h1>
          {total != null && <p className="mt-1 text-sm text-muted-foreground tabular">{t('library.count', { n: total })}</p>}
        </div>
        <SearchField q={q} label={t('library.search')} className="w-full sm:w-80" />
      </div>
      <div className="mt-8">
        <TitleGrid libraryId={libraryId} q={q} />
      </div>
    </div>
  )
}
