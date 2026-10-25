import { Check, CircleAlert, CircleMinus, CircleX, ArrowRight, Crosshair } from 'lucide-react'
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import type { PlanEntry } from '@/lib/plan'
import { currentTracks, groupBySeason, streamsOf } from '@/lib/plan'
import { SUBTITLES_OFF } from '@/lib/match'
import { episodeCode, shortStream } from '@/lib/format'
import { useI18n, type Lang } from '@/lib/i18n'
import type { ResultStatus } from '@/hooks/useBatchApply'
import { cn } from '@/lib/utils'

function trackPair(item: BaseItemDto, audio: number | null, subtitle: number, lang: Lang, off: string) {
  const streams = streamsOf(item)
  const a = shortStream(streams.find((s) => s.Index === audio), lang) ?? '—'
  const s = subtitle === SUBTITLES_OFF ? off : (shortStream(streams.find((x) => x.Index === subtitle), lang) ?? '—')
  return `${a} / ${s}`
}

export function EpisodeList({
  pool,
  plan,
  results,
  referenceId,
  onPickReference,
}: {
  pool: BaseItemDto[]
  plan: PlanEntry[]
  results: Record<string, ResultStatus>
  referenceId: string
  onPickReference: (id: string) => void
}) {
  const { t, lang } = useI18n()
  const planById = new Map(plan.map((p) => [p.item.Id!, p]))
  const off = t('menu.off')

  return (
    <section aria-labelledby="episodes-title" className="flex min-h-0 flex-col rounded-2xl border border-border bg-background/60 backdrop-blur-xl lg:max-h-[calc(100dvh-8rem)] lg:sticky lg:top-20">
      <h2 id="episodes-title" className="border-b border-border px-5 py-4 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {t('episodes.title')}
      </h2>
      <div className="min-h-0 overflow-y-auto">
        {groupBySeason(pool).map(([season, eps]) => (
          <div key={season}>
            <h3 className="sticky top-0 z-10 bg-background/95 px-5 py-2 text-sm font-medium backdrop-blur">{eps[0].SeasonName ?? `S${season}`}</h3>
            <ul>
              {eps.map((ep) => {
                const p = planById.get(ep.Id!)
                const result = results[ep.Id!]
                const cur = currentTracks(ep)
                const isRef = ep.Id === referenceId
                return (
                  <li key={ep.Id} className={cn('group flex items-center gap-3 border-t border-border/50 px-5 py-2.5', isRef && 'bg-primary/[0.07]', !p && 'opacity-55')}>
                    <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground tabular">{episodeCode(ep) ?? '—'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{ep.Name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {trackPair(ep, cur.audio, cur.subtitle, lang, off)}
                        {p && p.status === 'apply' && !result && (
                          <>
                            <ArrowRight className="mx-1 inline size-3 text-primary" aria-label={t('episodes.willGet')} />
                            <span className="text-foreground">{trackPair(ep, p.audio, p.subtitle, lang, off)}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <Status plan={p} result={result} />
                    {!isRef && (
                      <button
                        type="button"
                        onClick={() => onPickReference(ep.Id!)}
                        aria-label={`${t('episodes.setReference')}: ${episodeCode(ep) ?? ep.Name}`}
                        title={t('episodes.setReference')}
                        className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 max-lg:opacity-60"
                      >
                        <Crosshair className="size-4" aria-hidden />
                      </button>
                    )}
                    {isRef && <Crosshair className="size-4 shrink-0 text-primary" aria-label={t('menu.reference')} />}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

function Status({ plan, result }: { plan?: PlanEntry; result?: ResultStatus }) {
  const { t } = useI18n()
  const status = result ?? (plan?.status === 'noMatch' ? 'noMatch' : plan?.status === 'noRuntime' ? 'skipped' : undefined)
  if (!status) return null
  const map = {
    applied: { Icon: Check, cls: 'text-success', label: t('episodes.applied') },
    unchanged: { Icon: Check, cls: 'text-muted-foreground', label: t('episodes.unchanged') },
    noMatch: { Icon: CircleAlert, cls: 'text-warning', label: t('episodes.noMatch') },
    skipped: { Icon: CircleMinus, cls: 'text-muted-foreground', label: `${t('episodes.skipped')}: ${t('menu.noRuntime')}` },
    failed: { Icon: CircleX, cls: 'text-destructive', label: t('episodes.failed') },
  }[status]
  return (
    <span title={map.label} className={cn('shrink-0', map.cls)}>
      <map.Icon className="size-4" aria-hidden />
      <span className="sr-only">{map.label}</span>
    </span>
  )
}
