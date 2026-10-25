import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, TriangleAlert } from 'lucide-react'
import { ErrorNote } from '@/components/States'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useApi } from '@/lib/jellyfin'
import { useCurrentUser } from '@/lib/queries'

/** Warns when the account's settings would make Jellyfin ignore remembered tracks, and fixes them. */
export function SettingsBanner() {
  const { t } = useI18n()
  const { api, session } = useApi()
  const queryClient = useQueryClient()
  const me = useCurrentUser()
  const config = me.data?.Configuration

  const fix = useMutation({
    mutationFn: async () => {
      await getUserApi(api).updateUserConfiguration({
        userId: session.userId,
        userConfiguration: {
          ...config,
          RememberAudioSelections: true,
          RememberSubtitleSelections: true,
          SubtitleMode: config?.SubtitleMode === 'None' ? 'Default' : config?.SubtitleMode,
        },
      })
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      await queryClient.invalidateQueries({ queryKey: ['episodes'] })
      await queryClient.invalidateQueries({ queryKey: ['item'] })
    },
  })

  if (!config) return null
  const forgets = config.RememberAudioSelections === false || config.RememberSubtitleSelections === false
  const subsOff = config.SubtitleMode === 'None'
  if (!forgets && !subsOff) return null

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-warning/35 bg-warning/10 p-4 text-sm sm:flex-row sm:items-center"
    >
      <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden />
      <div className="flex-1 space-y-1">
        {forgets && <p>{t('settings.remember')}</p>}
        {subsOff && <p>{t('settings.subtitleModeNone')}</p>}
        {fix.isError && <ErrorNote error={fix.error} />}
      </div>
      <Button variant="outline" onClick={() => fix.mutate()} disabled={fix.isPending}>
        {fix.isPending && <Loader2 className="animate-spin" aria-hidden />}
        {t('settings.fix')}
      </Button>
    </div>
  )
}
