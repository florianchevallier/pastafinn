import type { Api } from '@jellyfin/sdk/lib/api'
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { Jellyfin } from '@jellyfin/sdk/lib/jellyfin'
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api'
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api'
import { getUserDataApi } from '@jellyfin/sdk/lib/utils/api/user-data-api'
import { isAxiosError } from 'axios'
import { useSyncExternalStore } from 'react'

export interface Session {
  serverUrl: string
  serverName: string
  accessToken: string
  userId: string
  userName: string
}

const SESSION_KEY = 'pastafinn.session'
const DEVICE_KEY = 'pastafinn.device'

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function deviceId() {
  let id = read<string>(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    try {
      localStorage.setItem(DEVICE_KEY, JSON.stringify(id))
    } catch {
      // a fresh id per visit is acceptable
    }
  }
  return id
}

const jellyfin = new Jellyfin({
  clientInfo: { name: 'PastaFinn', version: __APP_VERSION__ },
  deviceInfo: { name: `PastaFinn (${navigator.userAgent.includes('Mobile') ? 'mobile' : 'browser'})`, id: deviceId() },
})

// --- session store ---------------------------------------------------------

let session: Session | null = read<Session>(SESSION_KEY)
let api: Api | null = session ? jellyfin.createApi(session.serverUrl, session.accessToken) : null
const listeners = new Set<() => void>()

export function setSession(next: Session | null) {
  session = next
  api = next ? jellyfin.createApi(next.serverUrl, next.accessToken) : null
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // session lives in memory only
  }
  for (const l of listeners) l()
}

export const getSession = () => session

export function useSession() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => session,
  )
}

/** The API bound to the current session. Only call from signed-in screens. */
export function useApi(): { api: Api; session: Session } {
  const s = useSession()
  if (!s || !api) throw new Error('Not signed in')
  return { api, session: s }
}

export async function signOut() {
  const current = api
  setSession(null)
  // best effort: revoke the token server-side
  if (current)
    await getSessionApi(current)
      .reportSessionEnded()
      .catch(() => {})
}

// --- errors ----------------------------------------------------------------

export type ErrorKind = 'network' | 'auth' | 'generic'

export function classifyError(err: unknown): ErrorKind {
  if (isAxiosError(err)) {
    if (err.response?.status === 401) return 'auth'
    if (!err.response) return 'network'
  }
  return 'generic'
}

/**
 * Browsers silently block http:// calls from an https:// page, so server discovery just finds nothing.
 * An explicit http:// address or a LAN host is then the likely cause, worth saying instead of "not found".
 */
export function mayBeMixedContent(address: string, pageProtocol = location.protocol) {
  if (pageProtocol !== 'https:') return false
  const a = address.trim().toLowerCase()
  if (a.startsWith('https://')) return false
  return a.startsWith('http://') || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|[^/:]+\.local\b)/.test(a)
}

// --- auth ------------------------------------------------------------------

/** Resolves user input ("my.server:8096") to a reachable server, or null. */
export async function findServer(input: string) {
  const candidates = await jellyfin.discovery.getRecommendedServerCandidates(input.trim())
  const best = jellyfin.discovery.findBestServer(candidates)
  return best?.systemInfo ? { url: best.address, name: best.systemInfo.ServerName ?? best.address } : null
}

function toSession(
  serverUrl: string,
  serverName: string,
  result: { AccessToken?: string | null; User?: { Id?: string; Name?: string | null } | null },
): Session {
  if (!result.AccessToken || !result.User?.Id) throw new Error('Incomplete authentication response')
  return { serverUrl, serverName, accessToken: result.AccessToken, userId: result.User.Id, userName: result.User.Name ?? '' }
}

export async function signInWithPassword(serverUrl: string, serverName: string, username: string, password: string) {
  const anon = jellyfin.createApi(serverUrl)
  const { data } = await getAuthenticationApi(anon).authenticateUserByName({
    authenticateUserByName: { Username: username, Pw: password },
  })
  setSession(toSession(serverUrl, serverName, data))
}

/** Starts Quick Connect; returns the code to show and a poller that resolves once approved. */
export async function startQuickConnect(serverUrl: string, serverName: string, signal: AbortSignal) {
  const auth = getAuthenticationApi(jellyfin.createApi(serverUrl))
  const { data: enabled } = await auth.getQuickConnectEnabled()
  if (!enabled) return null
  const { data } = await auth.initiateQuickConnect()
  const secret = data.Secret!
  const done = (async () => {
    while (!signal.aborted) {
      await new Promise((r) => setTimeout(r, 2500))
      const { data: state } = await auth.getQuickConnectState({ secret }, { signal })
      if (state.Authenticated) {
        const { data: result } = await auth.authenticateWithQuickConnect({ quickConnectDto: { Secret: secret } })
        setSession(toSession(serverUrl, serverName, result))
        return
      }
    }
  })()
  return { code: data.Code!, done }
}

// --- writing tracks ----------------------------------------------------------

/**
 * The item's resume position as the server has it right now. Read just before each write:
 * the page's copy can be hours old, and sending it back would rewind or overwrite a newer resume point.
 */
async function resumePosition(api: Api, item: BaseItemDto) {
  const { data } = await getUserDataApi(api).getItemUserData({ itemId: item.Id! })
  return data.PlaybackPositionTicks ?? 0
}

/**
 * Stores the remembered audio/subtitle stream for one item (per user).
 * Jellyfin has no endpoint for this; it persists the tracks reported in a playback check-in.
 * We report the item's own resume position so watched state and resume point stay put
 * (and Jellyfin 10.10/10.11 only save a check-in that carries a position).
 */
export async function rememberTracks(api: Api, item: BaseItemDto, audioIndex: number | null, subtitleIndex: number) {
  await getSessionApi(api).reportPlaybackProgress({
    playbackProgressInfo: {
      ItemId: item.Id!,
      MediaSourceId: item.MediaSources?.[0]?.Id ?? item.Id!,
      AudioStreamIndex: audioIndex,
      SubtitleStreamIndex: subtitleIndex,
      PositionTicks: await resumePosition(api, item),
      IsPaused: true,
      CanSeek: false,
    },
  })
}

/** Clears the "now playing" entry our check-ins leave on the session. */
export async function endCheckIns(api: Api, item: BaseItemDto) {
  await getSessionApi(api).reportPlaybackStopped({
    playbackStopInfo: {
      ItemId: item.Id!,
      MediaSourceId: item.MediaSources?.[0]?.Id ?? item.Id!,
      // Never omit: a stop without position marks the item as watched.
      PositionTicks: await resumePosition(api, item),
    },
  })
}

// --- images ------------------------------------------------------------------

/** Image URL without the SDK's ImageApi class, which alone weighs more than the rest of the app. */
export function imageUrl(
  api: Api,
  itemId: string,
  type: 'Primary' | 'Backdrop' | 'Logo',
  params: Record<string, string | number | undefined | null>,
) {
  const query = new URLSearchParams(Object.entries(params).flatMap(([k, v]) => (v == null ? [] : [[k, String(v)]])))
  return `${api.basePath}/Items/${itemId}/Images/${type}?${query}`
}
