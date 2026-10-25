import type { BaseItemDto, MediaStream } from '@jellyfin/sdk/lib/generated-client/models'
import type { Lang } from './i18n'

const names = new Map<Lang, Intl.DisplayNames>()

function languageName(code: string | null | undefined, lang: Lang): string | null {
  if (!code || code === 'und') return null
  let dn = names.get(lang)
  if (!dn) {
    dn = new Intl.DisplayNames([lang], { type: 'language', fallback: 'none' })
    names.set(lang, dn)
  }
  try {
    const name = dn.of(code)
    return name ? name.charAt(0).toLocaleUpperCase(lang) + name.slice(1) : code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}

const CODECS: Record<string, string> = {
  aac: 'AAC',
  ac3: 'Dolby Digital',
  eac3: 'Dolby Digital+',
  truehd: 'TrueHD',
  dts: 'DTS',
  flac: 'FLAC',
  opus: 'Opus',
  vorbis: 'Vorbis',
  mp3: 'MP3',
  pcm_s16le: 'PCM',
  pcm_s24le: 'PCM',
  subrip: 'SRT',
  srt: 'SRT',
  ass: 'ASS',
  ssa: 'SSA',
  pgssub: 'PGS',
  dvdsub: 'VobSub',
  dvd_subtitle: 'VobSub',
  webvtt: 'WebVTT',
  mov_text: 'TX3G',
}

const codecLabel = (codec: string | null | undefined) => (codec ? (CODECS[codec.toLowerCase()] ?? codec.toUpperCase()) : null)

function channels(s: MediaStream) {
  const layout = s.ChannelLayout?.replace(/\(.*\)/, '')
  if (layout && /^\d/.test(layout)) return layout
  if (s.Channels === 1) return 'Mono'
  if (s.Channels === 2) return 'Stereo'
  return s.Channels ? `${s.Channels}ch` : layout || null
}

/** Main label and technical details for a stream row. */
export function describeStream(s: MediaStream, lang: Lang) {
  const language = languageName(s.Language, lang)
  const title = s.Title?.trim()
  const label = title || language || s.DisplayTitle || `#${s.Index}`
  return {
    label,
    language: title && language && title.toLowerCase() !== language.toLowerCase() ? language : null,
    tech: [codecLabel(s.Codec), s.Type === 'Audio' ? channels(s) : null].filter(Boolean).join(' · '),
  }
}

/** Short label for chips: language code, or title. */
export function shortStream(s: MediaStream | undefined, lang: Lang) {
  if (!s) return null
  return languageName(s.Language, lang) ?? s.Title ?? `#${s.Index}`
}

export function episodeCode(ep: BaseItemDto) {
  const s = ep.ParentIndexNumber
  const e = ep.IndexNumber
  if (s == null || e == null) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `S${pad(s)}E${pad(e)}${ep.IndexNumberEnd ? `–${pad(ep.IndexNumberEnd)}` : ''}`
}
