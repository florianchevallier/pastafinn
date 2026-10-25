import type { MediaStream } from '@jellyfin/sdk/lib/generated-client/models'

/** Jellyfin's index for "subtitles off". */
export const SUBTITLES_OFF = -1

const norm = (v: string | null | undefined) => (v ?? '').trim().toLowerCase()

// Each rule is stricter than the next; the first rule with a hit wins.
const RULES: Array<(a: MediaStream, b: MediaStream) => boolean> = [
  (a, b) => norm(a.Title) === norm(b.Title) && norm(a.Language) === norm(b.Language) && norm(a.Codec) === norm(b.Codec),
  (a, b) => norm(a.Title) === norm(b.Title) && norm(a.Language) === norm(b.Language),
  (a, b) => !!a.Title && norm(a.Title) === norm(b.Title),
  (a, b) => !!a.DisplayTitle && norm(a.DisplayTitle) === norm(b.DisplayTitle),
  (a, b) => !!a.Language && norm(a.Language) === norm(b.Language) && !!a.IsHearingImpaired === !!b.IsHearingImpaired,
  (a, b) => !!a.Language && norm(a.Language) === norm(b.Language),
]

/**
 * Finds the stream in `candidates` that best matches `reference` (same type only).
 * `keyword`, when set, restricts candidates to streams whose title contains it.
 * Returns the matching stream index, or null when nothing matches.
 */
export function matchStream(reference: MediaStream, candidates: MediaStream[], keyword = ''): number | null {
  const kw = norm(keyword)
  const pool = candidates.filter(
    (s) =>
      s.Type === reference.Type &&
      // Forced subtitles only cover foreign-language lines: never stand in for full ones, or the reverse.
      !!s.IsForced === !!reference.IsForced &&
      (!kw || norm(s.Title).includes(kw) || norm(s.DisplayTitle).includes(kw)),
  )
  for (const rule of RULES) {
    const hits = pool.filter((s) => rule(reference, s))
    if (hits.length) {
      // Several equal hits (e.g. two French tracks): prefer the same position in the file.
      return (hits.find((s) => s.Index === reference.Index) ?? hits[0]).Index ?? null
    }
  }
  return null
}
