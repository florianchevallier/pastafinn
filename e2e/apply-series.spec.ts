import { type APIRequestContext, expect, test } from '@playwright/test'

const JELLYFIN = 'http://localhost:8199'
const AUTH = 'MediaBrowser Client="e2e", Device="cli", DeviceId="e2e-check", Version="1"'
/** Halfway through a 10 s clip, in ticks (100 ns). */
const HALFWAY = 50_000_000

async function login(request: APIRequestContext) {
  const res = await request.post(`${JELLYFIN}/Users/AuthenticateByName`, {
    headers: { Authorization: AUTH },
    data: { Username: 'e2e', Pw: 'e2e' },
  })
  const { AccessToken, User } = await res.json()
  return { headers: { Authorization: `${AUTH}, Token="${AccessToken}"` }, userId: User.Id as string }
}

/** Every episode as Jellyfin sees it for the test user, sorted S01E01 → S01E03. */
async function episodes(request: APIRequestContext) {
  const { headers, userId } = await login(request)
  const res = await request.get(
    `${JELLYFIN}/Items?userId=${userId}&IncludeItemTypes=Episode&Recursive=true&SortBy=IndexNumber&Fields=MediaSources`,
    { headers },
  )
  const sessions = await (await request.get(`${JELLYFIN}/Sessions`, { headers })).json()
  return { items: (await res.json()).Items, sessions }
}

/** Plays S01E02 halfway from another client, so it has a resume point the app must not touch. */
async function watchHalfOf(request: APIRequestContext, itemId: string) {
  const { headers } = await login(request)
  const body = { ItemId: itemId, PositionTicks: HALFWAY, IsPaused: true }
  await request.post(`${JELLYFIN}/Sessions/Playing/Progress`, { headers, data: body })
  await request.post(`${JELLYFIN}/Sessions/Playing/Stopped`, { headers, data: body })
}

test('sets French audio and full French subtitles for a whole series without touching watched state', async ({ page, request }) => {
  await page.goto('/')
  await page.getByLabel('Server address').fill('localhost:8199')
  await page.getByRole('button', { name: 'Connect' }).click()
  await page.getByLabel('Username').fill('e2e')
  await page.getByRole('textbox', { name: 'Password' }).fill('e2e')
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.getByRole('searchbox', { name: 'Search a series or a movie' }).fill('test sh')
  await page.getByRole('link', { name: /Test Show/ }).click()

  const audio = page.getByRole('group', { name: 'Audio' })
  const subtitles = page.getByRole('group', { name: 'Subtitles' })
  // Starting point: Jellyfin plays the default English track, subtitles off.
  await expect(audio.getByRole('radio', { name: /^English/ })).toBeChecked()
  await expect(subtitles.getByRole('radio', { name: /^Off/ })).toBeChecked()

  // Someone watches half of S01E02 on another device while the page is open:
  // the page's copy of its resume point is now stale and must not be written back.
  await watchHalfOf(request, (await episodes(request)).items[1].Id)
  const before = await episodes(request)
  const watchState = (list: Array<{ UserData: Record<string, unknown> }>) =>
    list.map((ep) => [ep.UserData.Played, ep.UserData.PlayCount, ep.UserData.PlaybackPositionTicks])
  expect(before.items[1].UserData.PlaybackPositionTicks).toBe(HALFWAY)

  await audio.getByText('Français', { exact: true }).click()
  await subtitles.getByText('Français complet').click()
  await page.getByText('Whole series').click()
  await page.getByRole('button', { name: 'Apply to 3 episodes' }).click()

  await expect(page.getByText('3 applied · 0 already set · 0 without a match · 0 failed')).toBeVisible()

  const { items, sessions } = await episodes(request)
  expect(items.map((ep: { MediaSources: Array<Record<string, number>> }) => ep.MediaSources[0].DefaultAudioStreamIndex)).toEqual([2, 2, 2])
  expect(items.map((ep: { MediaSources: Array<Record<string, number>> }) => ep.MediaSources[0].DefaultSubtitleStreamIndex)).toEqual([
    4, 4, 4,
  ])
  // Watched state, play count and resume points are exactly as before, including the half-watched episode.
  expect(watchState(items)).toEqual(watchState(before.items))
  // The final stop cleared our "now playing" entry.
  expect(sessions.filter((s: { NowPlayingItem?: unknown }) => s.NowPlayingItem)).toHaveLength(0)

  // Back on the page, the menu now starts from the remembered tracks and has nothing left to do.
  await page.reload()
  await expect(audio.getByRole('radio', { name: /^Français/ })).toBeChecked()
  await expect(subtitles.getByRole('radio', { name: /^Français complet/ })).toBeChecked()
  await expect(page.getByRole('button', { name: /^Apply/ })).toBeDisabled()
})
