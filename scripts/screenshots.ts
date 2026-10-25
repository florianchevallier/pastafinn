// Regenerates the README images: banner, screenshots and demo GIF.
// Builds a fictional library (artwork rendered from HTML, multi-language MKVs), serves it with a
// throwaway Jellyfin in Docker, then drives the real app with Playwright.
// Needs Docker, ffmpeg and cwebp. Run with: npm run screenshots
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { type Browser, chromium, type Locator, type Page } from '@playwright/test'
import { backdrop, banner, HERO, logo, MOVIES, poster, SERIES, type Title } from './demo/catalog.ts'

const ROOT = new URL('..', import.meta.url).pathname
const MEDIA = `${ROOT}e2e/.demo-media`
const SHOTS = `${ROOT}docs/screenshots`
const TMP = `${ROOT}e2e/.demo-tmp`
const JELLYFIN_PORT = '8198'
const APP = 'http://localhost:5198'
const IMAGE = 'jellyfin/jellyfin:12.3'

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const pad = (n: number) => String(n).padStart(2, '0')

// --- media -------------------------------------------------------------------

interface Track {
  lang: string
  title: string
  codec?: string
  channels?: number
  disposition?: string
  srt?: string
}

const SUBS: Record<string, string> = {
  en: 'The lamp has to burn until morning.',
  'en-sdh': '[waves crashing] The lamp has to burn until morning.',
  fr: 'La lampe doit brûler jusqu’au matin.',
  'fr-forced': '[Le capitaine parle en norvégien]',
  de: 'Die Lampe muss bis zum Morgen brennen.',
  ja: '灯りは朝まで消してはならない。',
}

const HERO_AUDIO: Track[] = [
  { lang: 'eng', title: 'English', codec: 'eac3', channels: 6, disposition: 'default' },
  { lang: 'fre', title: 'Français', codec: 'ac3', channels: 6 },
  { lang: 'ger', title: 'Deutsch', codec: 'aac', channels: 2 },
]
const HERO_SUBS: Track[] = [
  { lang: 'eng', title: 'English', srt: 'en' },
  { lang: 'eng', title: 'English (SDH)', srt: 'en-sdh', disposition: 'hearing_impaired' },
  { lang: 'fre', title: 'Français', srt: 'fr' },
  { lang: 'fre', title: 'Français (forcés)', srt: 'fr-forced', disposition: 'forced' },
  { lang: 'ger', title: 'Deutsch', srt: 'de' },
  { lang: 'jpn', title: '日本語', srt: 'ja' },
]
const SIMPLE_AUDIO = HERO_AUDIO.slice(0, 2)
const SIMPLE_SUBS = [HERO_SUBS[0], HERO_SUBS[2]]

/** Encodes a 10 s MKV with the given tracks, using the ffmpeg shipped in the Jellyfin image. */
function mkv(file: string, audio: Track[], subs: Track[]) {
  const args = ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=640x360:rate=24']
  for (const i of audio.keys()) args.push('-f', 'lavfi', '-i', `sine=f=${330 + i * 110}`)
  for (const s of subs) args.push('-i', `/m/.subs/${s.srt}.srt`)
  args.push('-t', '10', '-map', '0')
  // inputs: 0 = video, then one per audio track, then one per subtitle file
  for (let i = 1; i <= audio.length + subs.length; i++) args.push('-map', String(i))
  args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-c:s', 'srt')
  audio.forEach((a, i) => {
    args.push(`-c:a:${i}`, a.codec ?? 'aac', `-ac:a:${i}`, String(a.channels ?? 2))
    args.push(`-metadata:s:a:${i}`, `language=${a.lang}`, `-metadata:s:a:${i}`, `title=${a.title}`)
    args.push(`-disposition:a:${i}`, a.disposition ?? '0')
  })
  subs.forEach((s, i) => {
    args.push(`-metadata:s:s:${i}`, `language=${s.lang}`, `-metadata:s:s:${i}`, `title=${s.title}`)
    args.push(`-disposition:s:${i}`, s.disposition ?? '0')
  })
  args.push(`/m/${file}`)
  execFileSync('docker', ['run', '--rm', '-v', `${MEDIA}:/m`, '--entrypoint', '/usr/lib/jellyfin-ffmpeg/ffmpeg', IMAGE, ...args])
}

async function art(browser: Browser, dir: string, t: Title, withLogo: boolean) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  const shoot = async (html: string, file: string, w: number, h: number, transparent = false) => {
    await page.setViewportSize({ width: w, height: h })
    await page.setContent(html)
    await page.screenshot({
      path: `${dir}/${file}`,
      type: transparent ? 'png' : 'jpeg',
      quality: transparent ? undefined : 90,
      omitBackground: transparent,
    })
  }
  await shoot(poster(t), 'poster.jpg', 600, 900)
  await shoot(backdrop(t), 'backdrop.jpg', 1920, 1080)
  if (withLogo) await shoot(logo(t), 'logo.png', 1200, 300, true)
  await page.close()
}

async function buildLibrary(browser: Browser) {
  rmSync(MEDIA, { recursive: true, force: true })
  mkdirSync(`${MEDIA}/.subs`, { recursive: true })
  for (const [name, text] of Object.entries(SUBS))
    writeFileSync(`${MEDIA}/.subs/${name}.srt`, `1\n00:00:00,500 --> 00:00:09,000\n${text}\n`)

  let episodes = 0
  for (const t of SERIES) {
    const folder = `shows/${t.name} (${t.year})`
    mkdirSync(`${MEDIA}/${folder}`, { recursive: true })
    writeFileSync(
      `${MEDIA}/${folder}/tvshow.nfo`,
      `<?xml version="1.0" encoding="UTF-8"?><tvshow><title>${xml(t.name)}</title><year>${t.year}</year><plot>${xml(t.plot)}</plot></tvshow>`,
    )
    await art(browser, `${MEDIA}/${folder}`, t, t === HERO)
    const seasons = t.seasons ?? [['Pilot']]
    for (const [s, titles] of seasons.entries()) {
      mkdirSync(`${MEDIA}/${folder}/Season ${pad(s + 1)}`, { recursive: true })
      for (const [e, title] of titles.entries()) {
        const base = `${folder}/Season ${pad(s + 1)}/${t.name} - S${pad(s + 1)}E${pad(e + 1)}`
        // One episode ships without full French subtitles (only forced ones), to show a missing match.
        const subs = t === HERO ? HERO_SUBS.filter((x) => !(s === 0 && e === 3 && x.srt === 'fr')) : SIMPLE_SUBS
        mkv(`${base}.mkv`, t === HERO ? HERO_AUDIO : SIMPLE_AUDIO, subs)
        writeFileSync(
          `${MEDIA}/${base}.nfo`,
          `<?xml version="1.0" encoding="UTF-8"?><episodedetails><title>${xml(title)}</title><season>${s + 1}</season><episode>${e + 1}</episode></episodedetails>`,
        )
        episodes++
      }
    }
  }
  for (const t of MOVIES) {
    const folder = `movies/${t.name} (${t.year})`
    mkdirSync(`${MEDIA}/${folder}`, { recursive: true })
    writeFileSync(
      `${MEDIA}/${folder}/movie.nfo`,
      `<?xml version="1.0" encoding="UTF-8"?><movie><title>${xml(t.name)}</title><year>${t.year}</year><plot>${xml(t.plot)}</plot></movie>`,
    )
    await art(browser, `${MEDIA}/${folder}`, t, false)
    mkv(`${folder}/${t.name} (${t.year}).mkv`, SIMPLE_AUDIO, SIMPLE_SUBS)
  }
  return episodes
}

// --- capture -------------------------------------------------------------------

/** A visible pointer for the GIF: Playwright videos do not show the mouse. */
const CURSOR = `addEventListener('DOMContentLoaded', () => {
  const c = document.createElement('div')
  c.style.cssText = 'position:fixed;z-index:99999;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(233,190,85,.35);border:2px solid #e9be55;pointer-events:none;transition:transform .15s'
  document.body.append(c)
  addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px' })
  addEventListener('mousedown', () => { c.style.transform = 'scale(.7)' })
  addEventListener('mouseup', () => { c.style.transform = '' })
})`

/** Moves the pointer to an element the way a person would, then clicks. */
async function glide(page: Page, target: Locator) {
  const box = await target.boundingBox()
  if (!box) throw new Error('target not visible')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 24 })
  await page.waitForTimeout(250)
  await target.click()
  await page.waitForTimeout(500)
}

async function imagesLoaded(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(() => [...document.images].every((i) => i.complete))
  await page.waitForTimeout(400)
}

async function signIn(page: Page) {
  await page.goto(APP)
  await page.getByLabel('Server address').fill(`localhost:${JELLYFIN_PORT}`)
  await page.getByRole('button', { name: 'Connect' }).click()
  await page.getByLabel('Username').fill('alex')
  await page.getByRole('textbox', { name: 'Password' }).fill('e2e')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('heading', { name: 'Libraries' }).waitFor()
}

function webp(name: string, width: number) {
  execFileSync('cwebp', ['-quiet', '-q', '86', '-resize', String(width), '0', `${TMP}/${name}.png`, '-o', `${SHOTS}/${name}.webp`])
}

async function waitFor(url: string) {
  for (let i = 0; i < 120; i++) {
    if (
      await fetch(url).then(
        (r) => r.ok,
        () => false,
      )
    )
      return
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`${url} did not come up`)
}

async function main() {
  const browser = await chromium.launch()
  mkdirSync(SHOTS, { recursive: true })
  rmSync(TMP, { recursive: true, force: true })
  mkdirSync(TMP, { recursive: true })

  // Banner, rendered with the app's own font (inlined: a setContent page cannot load file:// fonts).
  const geist = readFileSync(`${ROOT}node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2`).toString('base64')
  const bannerPage = await browser.newPage({ viewport: { width: 1600, height: 560 } })
  await bannerPage.setContent(banner(`data:font/woff2;base64,${geist}`))
  await bannerPage.evaluate(() => document.fonts.ready)
  await bannerPage.waitForTimeout(300)
  await bannerPage.screenshot({ path: `${TMP}/banner.png` })
  webp('banner', 1600)

  const episodes = await buildLibrary(browser)
  execFileSync('bash', ['e2e/jellyfin.sh', 'up'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      MEDIA_DIR: MEDIA,
      EXPECTED_EPISODES: String(episodes),
      JELLYFIN_PORT,
      JELLYFIN_NAME: 'pastafinn-demo',
      JELLYFIN_USER: 'alex',
      JELLYFIN_SERVER_NAME: 'Home',
    },
  })
  const vite = spawn('npx', ['vite', '--port', '5198', '--strictPort'], { cwd: ROOT, stdio: 'ignore' })

  try {
    await waitFor(APP)
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      locale: 'en-US',
      colorScheme: 'dark',
    })
    const page = await desktop.newPage()

    await page.goto(APP)
    await page.getByLabel('Server address').waitFor()
    await page.screenshot({ path: `${TMP}/login.png` })
    await signIn(page)

    await page.getByRole('link', { name: 'Series' }).click()
    await page.getByRole('heading', { name: 'Series' }).waitFor()
    await imagesLoaded(page)
    await page.screenshot({ path: `${TMP}/library.png` })
    const libraryUrl = page.url()

    await page.getByRole('link', { name: /Harbor Lights/ }).click()
    await page.getByRole('group', { name: 'Audio' }).waitFor()
    await imagesLoaded(page)
    const audio = page.getByRole('group', { name: 'Audio' })
    const subtitles = page.getByRole('group', { name: 'Subtitles' })
    await audio.getByText('Français', { exact: true }).click()
    await subtitles.getByText('Français', { exact: true }).click()
    await page.getByText('Whole series').click()
    await page.mouse.move(0, 0)
    await page.waitForTimeout(500)
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${TMP}/title.png`, fullPage: true })

    await page.getByRole('button', { name: /^Apply to/ }).click()
    await page.getByText(/applied ·/).waitFor()
    await page.waitForTimeout(400)
    await page.evaluate(() => scrollTo(0, 0))
    await page.waitForTimeout(300)
    await page.screenshot({ path: `${TMP}/applied.png`, fullPage: true })
    const titleUrl = page.url()
    const state = await desktop.storageState()

    // Demo GIF: pick German audio and English SDH subtitles for the whole series.
    const recording = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
      colorScheme: 'dark',
      storageState: state,
      recordVideo: { dir: TMP, size: { width: 1280, height: 800 } },
    })
    await recording.addInitScript(CURSOR)
    const rec = await recording.newPage()
    await rec.goto(libraryUrl)
    await rec.getByRole('heading', { name: 'Series' }).waitFor()
    await imagesLoaded(rec)
    await glide(rec, rec.getByRole('link', { name: /Harbor Lights/ }))
    await imagesLoaded(rec)
    await rec.waitForTimeout(600)
    await glide(rec, rec.getByRole('group', { name: 'Audio' }).getByText('Deutsch', { exact: true }))
    await glide(rec, rec.getByRole('group', { name: 'Subtitles' }).getByText('English (SDH)'))
    await glide(rec, rec.getByText('Whole series'))
    await rec.waitForTimeout(800)
    await glide(rec, rec.getByRole('button', { name: /^Apply to/ }))
    await rec.getByText(/applied ·/).waitFor()
    await rec.waitForTimeout(2200)
    const video = await rec.video()?.path()
    await recording.close()
    if (video) {
      execFileSync('ffmpeg', [
        '-loglevel',
        'error',
        '-y',
        '-ss',
        '0.8',
        '-i',
        video,
        '-vf',
        'fps=14,scale=1000:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle',
        `${SHOTS}/demo.gif`,
      ])
    }

    // Phone: the same title page, now on German / English SDH.
    const phone = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      locale: 'en-US',
      colorScheme: 'dark',
      storageState: state,
    })
    const mobile = await phone.newPage()
    await mobile.goto(titleUrl)
    await mobile.getByRole('group', { name: 'Audio' }).waitFor()
    await imagesLoaded(mobile)
    await mobile.evaluate(() => scrollTo(0, 0))
    await mobile.waitForTimeout(300)
    await mobile.screenshot({ path: `${TMP}/mobile.png` })

    for (const [name, width] of [
      ['login', 1600],
      ['library', 1600],
      ['title', 1600],
      ['applied', 1600],
      ['mobile', 780],
    ] as const)
      webp(name, width)
  } finally {
    vite.kill()
    await browser.close()
    execFileSync('bash', ['e2e/jellyfin.sh', 'down'], { cwd: ROOT, env: { ...process.env, JELLYFIN_NAME: 'pastafinn-demo' } })
    rmSync(TMP, { recursive: true, force: true })
  }
  console.log(`README images written to ${SHOTS}`)
}

await main()
