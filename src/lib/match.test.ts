import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models'
import { describe, expect, it } from 'vitest'
import { matchStream } from './match'

const audio = (Index: number, s: Partial<MediaStream>): MediaStream => ({ Index, Type: 'Audio', ...s })
const sub = (Index: number, s: Partial<MediaStream>): MediaStream => ({ Index, Type: 'Subtitle', ...s })

describe('matchStream', () => {
  const ref = audio(2, { Language: 'fra', Title: 'Français', Codec: 'ac3' })

  it('matches the exact same track even at another index', () => {
    const eps = [audio(1, { Language: 'eng', Codec: 'aac' }), audio(3, { Language: 'fra', Title: 'Français', Codec: 'ac3' })]
    expect(matchStream(ref, eps)).toBe(3)
  })

  it('prefers title + language over a language-only hit', () => {
    const eps = [
      audio(1, { Language: 'fra', Title: 'Commentary', Codec: 'ac3' }),
      audio(2, { Language: 'fra', Title: 'Français', Codec: 'aac' }),
    ]
    expect(matchStream(ref, eps)).toBe(2)
  })

  it('falls back to language when titles differ everywhere', () => {
    const eps = [audio(1, { Language: 'eng' }), audio(4, { Language: 'fra', Title: 'VF' })]
    expect(matchStream(ref, eps)).toBe(4)
  })

  it('keeps forced subtitles apart from full ones', () => {
    const forced = sub(5, { Language: 'fra', IsForced: true })
    const eps = [sub(3, { Language: 'fra' }), sub(4, { Language: 'fra', IsForced: true })]
    expect(matchStream(forced, eps)).toBe(4)
  })

  it('breaks ties with the reference index', () => {
    const r = sub(4, { Language: 'eng' })
    expect(matchStream(r, [sub(3, { Language: 'eng' }), sub(4, { Language: 'eng' })])).toBe(4)
  })

  it('never crosses stream types', () => {
    expect(matchStream(ref, [sub(2, { Language: 'fra', Title: 'Français' })])).toBeNull()
  })

  it('returns null when nothing matches', () => {
    expect(matchStream(ref, [audio(1, { Language: 'eng' })])).toBeNull()
  })

  it('applies the keyword filter', () => {
    const r = sub(3, { Language: 'eng' })
    const eps = [sub(3, { Language: 'eng', Title: 'Full' }), sub(4, { Language: 'eng', Title: 'SDH' })]
    expect(matchStream(r, eps, 'sdh')).toBe(4)
    expect(matchStream(r, eps, 'nope')).toBeNull()
  })
})
