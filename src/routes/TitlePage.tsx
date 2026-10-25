import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useParams, useRouter } from '@tanstack/react-router'
import { cn } from 'cn'
import { ArrowLeft, AudioLines, Captions, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { EpisodeList } from '@/components/EpisodeList'
import { SettingsBanner } from '@/components/SettingsBanner'
import { EmptyState, ErrorNote } from '@/components/States'
import { TrackColumn, type TrackOption } from '@/components/TrackColumn'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { type BatchState, useBatchApply } from '@/hooks/useBatchApply'
import { describeStream, episodeCode } from '@/lib/format'
import { type Lang, type MessageKey, useI18n } from '@/lib/i18n'
import { imageUrl, useApi } from '@/lib/jellyfin'
import { SUBTITLES_OFF } from '@/lib/match'
import { currentTracks, groupBySeason, type PlanEntry, planFor, streamsOf } from '@/lib/plan'
import { useEpisodes, useItem } from '@/lib/queries'

type Scope = 'episode' | 'season' | 'series'

export function TitlePage() {
  const { t } = useI18n()
  const { itemId } = useParams({ from: '/app/title/$itemId' })
  const item = useItem(itemId)
  const isSeries = item.data?.Type === 'Series'
  const episodes = useEpisodes(isSeries ? itemId : undefined)

  if (item.isPending) return <TitleSkeleton />
  if (item.isError)
    return (
      <Page>
        <ErrorNote error={item.error} onRetry={() => item.refetch()} />
      </Page>
    )

  return (
    <>
      <Backdrop item={item.data} />
      <Page>
        <TitleHeader item={item.data} episodes={episodes.data} />
        <div className="mt-6">
          <SettingsBanner />
        </div>
        <div className="mt-8">
          {!isSeries ? (
            <Menu key={item.data.Id} pool={[item.data]} isSeries={false} />
          ) : episodes.isPending ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : episodes.isError ? (
            <ErrorNote error={episodes.error} onRetry={() => episodes.refetch()} />
          ) : episodes.data.length === 0 ? (
            <EmptyState>{t('episodes.none')}</EmptyState>
          ) : (
            <Menu pool={episodes.data} isSeries />
          )}
        </div>
      </Page>
    </>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6">{children}</div>
}

function Backdrop({ item }: { item: BaseItemDto }) {
  const { api } = useApi()
  if (!item.BackdropImageTags?.length) return null
  const src = imageUrl(api, item.Id!, 'Backdrop', { maxWidth: 1920, quality: 80, tag: item.BackdropImageTags[0] })
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-14 h-[78vh] max-h-[52rem] overflow-hidden">
      <img
        src={src}
        alt=""
        className="size-full object-cover object-top opacity-55 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
      />
      {/* vignette: guarantees AA contrast for text whatever the image brightness */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
    </div>
  )
}

function TitleHeader({ item, episodes }: { item: BaseItemDto; episodes?: BaseItemDto[] }) {
  const { t, count } = useI18n()
  const { api } = useApi()
  const router = useRouter()
  const logo = item.ImageTags?.Logo ? imageUrl(api, item.Id!, 'Logo', { maxWidth: 640, tag: item.ImageTags.Logo }) : null
  const seasons = new Set(episodes?.map((e) => e.ParentIndexNumber)).size
  const meta = [
    item.ProductionYear,
    episodes?.length ? count('season', seasons) : null,
    episodes?.length ? count('episode', episodes.length) : null,
  ].filter(Boolean)

  return (
    <header>
      <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => router.history.back()}>
        <ArrowLeft aria-hidden />
        {t('common.back')}
      </Button>
      <div className="mt-6 max-w-2xl">
        {logo ? (
          <h1>
            <img
              src={logo}
              alt={item.Name ?? ''}
              className="max-h-28 max-w-[min(26rem,80vw)] object-contain object-left drop-shadow-[0_2px_12px_rgb(0_0_0/0.5)]"
            />
          </h1>
        ) : (
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">{item.Name}</h1>
        )}
        {meta.length > 0 && <p className="mt-3 text-sm text-muted-foreground tabular">{meta.join(' · ')}</p>}
      </div>
    </header>
  )
}

function streamOptions(item: BaseItemDto, type: 'Audio' | 'Subtitle', lang: Lang, t: (k: MessageKey) => string): TrackOption[] {
  const current = currentTracks(item)
  return streamsOf(item)
    .filter((s) => s.Type === type)
    .map((s) => {
      const d = describeStream(s, lang)
      const flags = [
        s.IsForced && t('menu.forced'),
        s.IsHearingImpaired && t('menu.sdh'),
        s.IsExternal && t('menu.external'),
        s.IsDefault && t('menu.default'),
      ].filter((f): f is string => !!f)
      return {
        value: s.Index!,
        label: d.label,
        detail: d.language,
        tech: d.tech,
        flags,
        current: (type === 'Audio' ? current.audio : current.subtitle) === s.Index,
      }
    })
}

function targetsFor(scope: Scope, reference: BaseItemDto, pool: BaseItemDto[]) {
  if (scope === 'episode') return [reference]
  return scope === 'season' ? pool.filter((e) => e.SeasonId === reference.SeasonId) : pool
}

/** Picks a sensible first reference: the first regular episode that has streams. */
function defaultReference(pool: BaseItemDto[]) {
  return (pool.find((e) => (e.ParentIndexNumber ?? 1) > 0 && streamsOf(e).length) ?? pool[0]).Id!
}

function Menu({ pool, isSeries }: { pool: BaseItemDto[]; isSeries: boolean }) {
  const { t, lang } = useI18n()
  const [refId, setRefId] = useState(() => defaultReference(pool))
  const reference = pool.find((e) => e.Id === refId) ?? pool[0]
  const [picked, setPicked] = useState<{ refId: string; audio: number | null; subtitle: number } | null>(null)
  const [scope, setScope] = useState<Scope>(isSeries ? 'season' : 'episode')
  const [keyword, setKeyword] = useState('')
  const batch = useBatchApply()

  // A new reference resets the cursor to what Jellyfin currently plays for it.
  const tracks = picked && picked.refId === reference.Id ? picked : { refId: reference.Id!, ...currentTracks(reference) }
  const audioOptions = streamOptions(reference, 'Audio', lang, t)
  const subtitleOptions: TrackOption[] = [
    { value: SUBTITLES_OFF, label: t('menu.off'), current: currentTracks(reference).subtitle === SUBTITLES_OFF },
    ...streamOptions(reference, 'Subtitle', lang, t),
  ]
  const audio = tracks.audio ?? audioOptions[0]?.value ?? null

  const plan = planFor({ reference, audio, subtitle: tracks.subtitle, keyword }, targetsFor(isSeries ? scope : 'episode', reference, pool))
  const running = batch.state.running

  function choose(next: { audio?: number; subtitle?: number }) {
    batch.reset()
    setPicked({ refId: reference.Id!, audio: next.audio ?? audio, subtitle: next.subtitle ?? tracks.subtitle })
  }

  function pickReference(id: string) {
    batch.reset()
    setRefId(id)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!running && plan.some((p) => p.status === 'apply')) void batch.run(plan)
  }

  return (
    <div className={cn('grid gap-6', isSeries && 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]')}>
      <form
        onSubmit={submit}
        className="rounded-2xl border border-border bg-background/75 p-5 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.6)] backdrop-blur-xl sm:p-7"
      >
        {isSeries && <ReferencePicker pool={pool} value={reference.Id!} onChange={pickReference} />}

        <div className="grid gap-8 sm:grid-cols-2">
          <TrackColumn
            name="audio"
            legend={t('menu.audio')}
            icon={<AudioLines className="size-4" aria-hidden />}
            options={audioOptions}
            value={audio}
            onChange={(v) => choose({ audio: v })}
            currentLabel={t('menu.current')}
            empty={t('menu.noTracks')}
            disabled={running}
          />
          <TrackColumn
            name="subtitle"
            legend={t('menu.subtitles')}
            icon={<Captions className="size-4" aria-hidden />}
            options={subtitleOptions}
            value={tracks.subtitle}
            onChange={(v) => choose({ subtitle: v })}
            currentLabel={t('menu.current')}
            empty={t('menu.noTracks')}
            disabled={running}
          />
        </div>

        <div className="mt-8 border-t border-border pt-6">
          {isSeries && (
            <ScopePicker
              pool={pool}
              reference={reference}
              scope={scope}
              onScope={(s) => {
                batch.reset()
                setScope(s)
              }}
              keyword={keyword}
              onKeyword={(k) => {
                batch.reset()
                setKeyword(k)
              }}
              disabled={batch.state.running}
            />
          )}
          <div className={cn(isSeries && 'mt-6')} aria-live="polite">
            <BatchFooter state={batch.state} onCancel={batch.cancel} plan={plan} plural={isSeries} />
          </div>
        </div>
      </form>

      {isSeries && (
        <EpisodeList pool={pool} plan={plan} results={batch.state.results} referenceId={reference.Id!} onPickReference={pickReference} />
      )}
    </div>
  )
}

function ReferencePicker({ pool, value, onChange }: { pool: BaseItemDto[]; value: string; onChange: (id: string) => void }) {
  const { t } = useI18n()
  return (
    <div className="mb-6 flex flex-col gap-1.5">
      <label htmlFor="reference" className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {t('menu.reference')}
      </label>
      <select
        id="reference"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-input/30 px-3 text-sm"
      >
        {groupBySeason(pool).map(([season, eps]) => (
          <optgroup key={season} label={eps[0].SeasonName ?? `S${season}`}>
            {eps.map((e) => (
              <option key={e.Id} value={e.Id!}>
                {[episodeCode(e), e.Name].filter(Boolean).join(' · ')}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

function ScopePicker({
  pool,
  reference,
  scope,
  onScope,
  keyword,
  onKeyword,
  disabled,
}: {
  pool: BaseItemDto[]
  reference: BaseItemDto
  scope: Scope
  onScope: (s: Scope) => void
  keyword: string
  onKeyword: (k: string) => void
  disabled: boolean
}) {
  const { t } = useI18n()
  const season = reference.ParentIndexNumber
  const scopes: Array<{ id: Scope; label: string }> = [
    { id: 'episode', label: t('menu.scope.episode') },
    { id: 'season', label: season === 0 ? t('menu.scope.specials') : t('menu.scope.season', { n: season ?? '?' }) },
    { id: 'series', label: t('menu.scope.series') },
  ]
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">{t('menu.applyTo')}</legend>
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-foreground/[0.03] p-1">
        {scopes.map((s) => (
          <label
            key={s.id}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-lg px-2 py-2 text-center text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
              scope === s.id ? 'bg-secondary font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <input type="radio" name="scope" className="sr-only" checked={scope === s.id} onChange={() => onScope(s.id)} />
            <span className="leading-tight">{s.label}</span>
            <span className="text-xs text-muted-foreground tabular">{targetsFor(s.id, reference, pool).length}</span>
          </label>
        ))}
      </div>
      {scope !== 'episode' && (
        <details className="group mt-4 text-sm">
          <summary className="cursor-pointer text-muted-foreground select-none hover:text-foreground">{t('menu.keyword')}</summary>
          <Input
            value={keyword}
            onChange={(e) => onKeyword(e.target.value)}
            aria-label={t('menu.keyword')}
            placeholder={t('menu.keywordPlaceholder')}
            className="mt-2 h-9 max-w-xs"
          />
        </details>
      )}
    </fieldset>
  )
}

/** Apply button before a batch, progress during it, summary after it. */
function BatchFooter({ state, onCancel, plan, plural }: { state: BatchState; onCancel: () => void; plan: PlanEntry[]; plural: boolean }) {
  const { t } = useI18n()
  const { running, done, total, cancelled, results } = state

  if (running) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="mb-2 text-sm tabular">{t('menu.progress', { done, total })}</p>
          <Progress value={total ? (done / total) * 100 : 0} className="h-1.5" />
        </div>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X aria-hidden />
          {t('menu.cancel')}
        </Button>
      </div>
    )
  }

  const outcomes = Object.values(results)
  if (outcomes.length > 0) {
    const n = (s: string) => outcomes.filter((o) => o === s).length
    return (
      <div className="space-y-1 text-sm">
        <p className="tabular">
          {t('menu.summary', { applied: n('applied'), unchanged: n('unchanged'), noMatch: n('noMatch'), failed: n('failed') })}
        </p>
        {cancelled && <p className="text-warning">{t('menu.cancelled')}</p>}
        <p className="text-xs text-pretty text-muted-foreground">{t('settings.previousItem')}</p>
      </div>
    )
  }

  const toApply = plan.filter((p) => p.status === 'apply').length
  const noMatch = plan.filter((p) => p.status === 'noMatch').length
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground tabular">
        {toApply === 0 ? t('menu.nothingToDo') : noMatch > 0 ? `${noMatch} × ${t('episodes.noMatch').toLowerCase()}` : ' '}
      </p>
      <Button type="submit" size="lg" className="h-11 px-6 text-base" disabled={toApply === 0}>
        {plural && toApply > 1 ? t('menu.applyN', { n: toApply }) : t('menu.apply')}
      </Button>
    </div>
  )
}

function TitleSkeleton() {
  return (
    <Page>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="mt-6 h-12 w-80" />
      <Skeleton className="mt-10 h-96 rounded-2xl" />
    </Page>
  )
}
