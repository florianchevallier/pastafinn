import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models'
import { describe, expect, it } from 'vitest'
import { SUBTITLES_OFF } from './match'
import { planFor } from './plan'

const streams: MediaStream[] = [
  { Index: 1, Type: 'Audio', Language: 'eng', Codec: 'aac' },
  { Index: 2, Type: 'Audio', Language: 'fra', Codec: 'ac3' },
  { Index: 3, Type: 'Subtitle', Language: 'eng' },
  { Index: 4, Type: 'Subtitle', Language: 'fra' },
]
const ep = (
  Id: string,
  s = streams,
  extra: Partial<BaseItemDto> = {},
  defaults = { a: 1, s: undefined as number | undefined },
): BaseItemDto => ({
  Id,
  RunTimeTicks: 1e10,
  MediaSources: [{ Id, MediaStreams: s, DefaultAudioStreamIndex: defaults.a, DefaultSubtitleStreamIndex: defaults.s }],
  ...extra,
})

describe('planFor', () => {
  const ref = ep('e1')
  const choice = { reference: ref, audio: 2, subtitle: 4, keyword: '' }

  it('applies matched tracks to every target', () => {
    const plan = planFor(choice, [ref, ep('e2')])
    expect(plan.map((p) => [p.status, p.audio, p.subtitle])).toEqual([
      ['apply', 2, 4],
      ['apply', 2, 4],
    ])
  })

  it('reports episodes already set as unchanged', () => {
    const [p] = planFor(choice, [ep('e2', streams, {}, { a: 2, s: 4 })])
    expect(p.status).toBe('unchanged')
  })

  it('keeps the current audio when only the subtitle matches', () => {
    const engOnly = streams.filter((s) => s.Language === 'eng' || s.Type === 'Subtitle')
    const [p] = planFor(choice, [ep('e2', engOnly)])
    expect(p).toMatchObject({ status: 'apply', audio: 1, subtitle: 4, audioMissing: true, subtitleMissing: false })
  })

  it('flags episodes where nothing matches', () => {
    const [p] = planFor(choice, [ep('e2', [{ Index: 1, Type: 'Audio', Language: 'jpn' }])])
    expect(p.status).toBe('noMatch')
  })

  it('turns subtitles off everywhere', () => {
    const [p] = planFor({ ...choice, subtitle: SUBTITLES_OFF }, [ep('e2', streams, {}, { a: 2, s: 3 })])
    expect(p).toMatchObject({ status: 'apply', subtitle: SUBTITLES_OFF })
  })

  it('skips items without a known runtime', () => {
    const [p] = planFor(choice, [ep('e2', streams, { RunTimeTicks: null })])
    expect(p.status).toBe('noRuntime')
  })
})
