import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models'
import { matchStream, SUBTITLES_OFF } from './match'

/** Episodes grouped by season number, in server order. */
export function groupBySeason(pool: BaseItemDto[]) {
  const map = new Map<number, BaseItemDto[]>()
  for (const e of pool) {
    const s = e.ParentIndexNumber ?? 0
    map.set(s, [...(map.get(s) ?? []), e])
  }
  return [...map.entries()]
}

export const streamsOf =(item: BaseItemDto): MediaStream[] => item.MediaSources?.[0]?.MediaStreams ?? []

/** Tracks Jellyfin will currently pick for this user (remembered choice, else file/user defaults). */
export function currentTracks(item: BaseItemDto) {
  const source = item.MediaSources?.[0]
  return {
    audio: source?.DefaultAudioStreamIndex ?? null,
    subtitle: source?.DefaultSubtitleStreamIndex ?? SUBTITLES_OFF,
  }
}

export interface Choice {
  reference: BaseItemDto
  /** Index of the chosen audio stream in the reference file, null when the file has no audio. */
  audio: number | null
  /** Index of the chosen subtitle stream in the reference file, or SUBTITLES_OFF. */
  subtitle: number
  keyword: string
}

export type PlanStatus = 'apply' | 'unchanged' | 'noMatch' | 'noRuntime'

export interface PlanEntry {
  item: BaseItemDto
  status: PlanStatus
  audio: number | null
  subtitle: number
  audioMissing: boolean
  subtitleMissing: boolean
}

/** Works out, without touching the server, what applying `choice` does to each target. */
export function planFor(choice: Choice, targets: BaseItemDto[]): PlanEntry[] {
  const refStreams = streamsOf(choice.reference)
  const refAudio = refStreams.find((s) => s.Type === 'Audio' && s.Index === choice.audio)
  const refSub = refStreams.find((s) => s.Type === 'Subtitle' && s.Index === choice.subtitle)

  return targets.map((item) => {
    const current = currentTracks(item)
    const isRef = item.Id === choice.reference.Id
    const streams = streamsOf(item)

    const audioMatch = isRef ? choice.audio : refAudio ? matchStream(refAudio, streams, choice.keyword) : null
    const subMatch =
      choice.subtitle === SUBTITLES_OFF ? SUBTITLES_OFF : isRef ? choice.subtitle : refSub ? matchStream(refSub, streams, choice.keyword) : null

    const audioMissing = !!refAudio && audioMatch === null
    const subtitleMissing = choice.subtitle !== SUBTITLES_OFF && subMatch === null
    // Whatever did not match keeps what Jellyfin picks today.
    const audio = audioMatch ?? current.audio
    const subtitle = subMatch ?? current.subtitle

    let status: PlanStatus = 'apply'
    if (!item.RunTimeTicks) status = 'noRuntime'
    else if ((audioMissing || !refAudio) && subtitleMissing) status = 'noMatch'
    else if (audio === current.audio && subtitle === current.subtitle) status = 'unchanged'

    return { item, status, audio, subtitle, audioMissing, subtitleMissing }
  })
}
