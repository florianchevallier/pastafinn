import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind'
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields'
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by'
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api'
import { getShowApi } from '@jellyfin/sdk/lib/utils/api/show-api'
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api'
import { getUserViewApi } from '@jellyfin/sdk/lib/utils/api/user-view-api'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useApi } from './jellyfin'

const PAGE = 60

export function useLibraries() {
  const { api, session } = useApi()
  return useQuery({
    queryKey: ['libraries', session.userId],
    queryFn: async () => {
      const { data } = await getUserViewApi(api).getUserViews({ userId: session.userId })
      return (data.Items ?? []).filter((v) => v.CollectionType === 'tvshows' || v.CollectionType === 'movies' || !v.CollectionType)
    },
  })
}

export function useLibraryItems(libraryId: string | undefined, search: string) {
  const { api, session } = useApi()
  return useInfiniteQuery({
    queryKey: ['library', libraryId, search],
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      const { data } = await getLibraryApi(api).getItems(
        {
          userId: session.userId,
          parentId: libraryId,
          includeItemTypes: [BaseItemKind.Series, BaseItemKind.Movie],
          recursive: true,
          sortBy: [ItemSortBy.SortName],
          searchTerm: search || undefined,
          startIndex: pageParam,
          limit: PAGE,
          fields: [ItemFields.PrimaryImageAspectRatio],
          enableImageTypes: ['Primary'],
          imageTypeLimit: 1,
        },
        { signal },
      )
      return data
    },
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + (p.Items?.length ?? 0), 0)
      return loaded < (last.TotalRecordCount ?? 0) ? loaded : undefined
    },
  })
}

export function useItem(itemId: string) {
  const { api, session } = useApi()
  return useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const { data } = await getLibraryApi(api).getItems({
        userId: session.userId,
        ids: [itemId],
        fields: [ItemFields.MediaSources, ItemFields.Overview],
        enableUserData: true,
      })
      const item = data.Items?.[0]
      if (!item) throw new Error('Item not found')
      return item
    },
  })
}

/** All episodes of a series, with streams and the tracks Jellyfin currently picks for this user. */
export function useEpisodes(seriesId: string | undefined) {
  const { api, session } = useApi()
  return useQuery({
    queryKey: ['episodes', seriesId],
    enabled: !!seriesId,
    queryFn: async () => {
      const { data } = await getShowApi(api).getEpisodes({
        seriesId: seriesId!,
        userId: session.userId,
        fields: [ItemFields.MediaSources],
        enableUserData: true,
        enableImages: false,
      })
      return data.Items ?? []
    },
  })
}

export function useCurrentUser() {
  const { api } = useApi()
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await getUserApi(api).getCurrentUser()).data,
  })
}
