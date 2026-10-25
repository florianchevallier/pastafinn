// Fictional demo library for the README screenshots. Every title, plot and artwork here is made up.

export type Motif = 'beam' | 'orchard' | 'lines' | 'moon' | 'horizon' | 'scan' | 'waves' | 'kites'

export interface Title {
  name: string
  year: number
  plot: string
  /** background top, background bottom, accent */
  palette: [string, string, string]
  motif: Motif
  font: string
  /** seasons → episode titles; omitted for movies and one-episode demo series */
  seasons?: string[][]
}

export const HERO: Title = {
  name: 'Harbor Lights',
  year: 2024,
  plot: 'When the last lighthouse keeper on a storm-battered island goes missing, his estranged daughter returns to keep the lamp burning and finds the town has been keeping secrets of its own.',
  palette: ['#0b1d33', '#12384a', '#f4c76a'],
  motif: 'beam',
  font: "'Didot', 'Bodoni 72', 'Playfair Display', serif",
  seasons: [
    ['The Keeper', 'Fog Season', 'Signal Fires', 'Undertow', 'Last Ferry'],
    ['New Lamps', 'The Breakwater', 'Calm Before', 'Spring Tide', 'All Hands'],
  ],
}

export const SERIES: Title[] = [
  HERO,
  {
    name: 'Glass Orchard',
    year: 2022,
    plot: 'Three sisters inherit a greenhouse that grows more than fruit.',
    palette: ['#1e2b22', '#3e5a3f', '#e8d9a8'],
    motif: 'orchard',
    font: "'Futura', 'Avenir Next', sans-serif",
  },
  {
    name: 'Northbound',
    year: 2021,
    plot: 'A night train, eleven strangers and one stop that is not on the map.',
    palette: ['#1b2230', '#3b4a63', '#cfe3f2'],
    motif: 'lines',
    font: "'Avenir Next Condensed', 'Avenir Next', sans-serif",
  },
  {
    name: 'Paper Moons',
    year: 2023,
    plot: 'A failing puppet theatre bets everything on one last show.',
    palette: ['#2a1630', '#6b3550', '#ffc9a3'],
    motif: 'moon',
    font: "'Bodoni 72', 'Didot', serif",
  },
  {
    name: 'The Quiet Year',
    year: 2020,
    plot: 'A village agrees to one year without phones. Nobody agrees on why.',
    palette: ['#3a2416', '#9b5a33', '#f1dcc0'],
    motif: 'horizon',
    font: "'Gill Sans', 'Avenir Next', sans-serif",
  },
  {
    name: 'Salt & Static',
    year: 2025,
    plot: 'A pirate radio DJ broadcasts from a boat just outside the law.',
    palette: ['#0d0d0f', '#3a0d12', '#ff4b3e'],
    motif: 'scan',
    font: "'Futura', 'Avenir Next', sans-serif",
  },
  {
    name: 'Low Tide',
    year: 2019,
    plot: 'Every spring the sea retreats a little further, and the town follows it.',
    palette: ['#0f2a2c', '#2f6b68', '#efe2c4'],
    motif: 'waves',
    font: "'Optima', 'Avenir Next', sans-serif",
  },
  {
    name: 'Kites Over Lyon',
    year: 2022,
    plot: 'Two rival kite makers, one festival, and a very windy summer.',
    palette: ['#14304f', '#3f7fb5', '#ffd166'],
    motif: 'kites',
    font: "'Avenir Next', sans-serif",
  },
]

export const MOVIES: Title[] = [
  {
    name: 'Midnight Ferry',
    year: 2023,
    plot: 'The last crossing of the night carries a passenger nobody saw board.',
    palette: ['#0c1424', '#283c63', '#9ad1ff'],
    motif: 'horizon',
    font: "'Didot', serif",
  },
  {
    name: 'Saltwater',
    year: 2018,
    plot: 'A free diver chases a record her father never broke.',
    palette: ['#082028', '#1d5866', '#bfe9e3'],
    motif: 'waves',
    font: "'Futura', sans-serif",
  },
]

function motif(t: Title, wide: boolean) {
  const [, , accent] = t.palette
  switch (t.motif) {
    case 'beam':
      return `
        <div style="position:absolute;inset:0;background:radial-gradient(1px 1px at 20% 18%,#fff9 50%,transparent),radial-gradient(1px 1px at 70% 9%,#fff8 50%,transparent),radial-gradient(1.5px 1.5px at 85% 30%,#fff7 50%,transparent),radial-gradient(1px 1px at 40% 25%,#fff6 50%,transparent),radial-gradient(1px 1px at 58% 14%,#fff7 50%,transparent)"></div>
        <div style="position:absolute;left:${wide ? 62 : 58}%;top:${wide ? 38 : 34}%;width:${wide ? 150 : 140}%;height:${wide ? 70 : 40}%;transform:translateY(-50%);transform-origin:0 50%;background:conic-gradient(from 80deg at 0 50%,transparent 0deg,${accent}66 8deg,${accent}22 18deg,transparent 22deg);filter:blur(6px);rotate:-8deg"></div>
        <div style="position:absolute;left:${wide ? 62 : 58}%;top:${wide ? 38 : 34}%;width:28px;height:28px;border-radius:50%;translate:-50% -50%;background:${accent};box-shadow:0 0 60px 30px ${accent}88"></div>
        <div style="position:absolute;left:${wide ? 62 : 58}%;top:${wide ? 40 : 36}%;width:${wide ? 46 : 40}px;height:${wide ? 260 : 300}px;translate:-50% 0;background:linear-gradient(90deg,#08121e,#1c2c3c 60%,#08121e);clip-path:polygon(30% 0,70% 0,100% 100%,0 100%)"></div>
        <div style="position:absolute;inset:auto 0 0 0;height:${wide ? 42 : 40}%;background:linear-gradient(#0a2232,#061019);"></div>
        <div style="position:absolute;inset:auto 0 0 0;height:${wide ? 42 : 40}%;background:repeating-linear-gradient(180deg,transparent 0 14px,#ffffff08 14px 15px)"></div>`
    case 'orchard':
      return `<div style="position:absolute;inset:-10%;background:radial-gradient(circle at 50% 50%,${accent}cc 0 26px,transparent 27px) 0 0/90px 90px,radial-gradient(circle at 50% 50%,#ffffff22 0 26px,transparent 27px) 45px 45px/90px 90px;opacity:.55;rotate:-12deg"></div>`
    case 'lines':
      return `<div style="position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 38px,${accent}33 38px 40px)"></div><div style="position:absolute;inset:auto -10% 30% -10%;height:3px;background:${accent};box-shadow:0 0 30px ${accent}"></div>`
    case 'moon':
      return `<div style="position:absolute;right:${wide ? 18 : -12}%;top:${wide ? 12 : 10}%;width:${wide ? 520 : 460}px;height:${wide ? 520 : 460}px;border-radius:50%;background:radial-gradient(circle at 35% 35%,${accent},#d98c7a 60%,#7a3a52);box-shadow:0 0 120px ${accent}55"></div><div style="position:absolute;right:${wide ? 10 : -30}%;top:${wide ? 8 : 6}%;width:${wide ? 420 : 380}px;height:${wide ? 420 : 380}px;border-radius:50%;background:${t.palette[0]}"></div>`
    case 'horizon':
      return `<div style="position:absolute;left:50%;bottom:${wide ? 30 : 34}%;width:${wide ? 700 : 520}px;height:${wide ? 350 : 260}px;translate:-50% 0;border-radius:350px 350px 0 0;background:linear-gradient(${accent},#e07a4f)"></div><div style="position:absolute;inset:auto 0 0 0;height:${wide ? 30 : 34}%;background:repeating-linear-gradient(180deg,${t.palette[1]} 0 18px,${accent}55 18px 21px)"></div>`
    case 'scan':
      return `<div style="position:absolute;inset:0;background:repeating-linear-gradient(180deg,transparent 0 6px,#00000066 6px 9px)"></div><div style="position:absolute;left:-5%;right:-5%;top:44%;height:120px;background:linear-gradient(90deg,transparent,${accent},transparent);filter:blur(24px);opacity:.7"></div>`
    case 'waves':
      return `<div style="position:absolute;left:50%;top:${wide ? 120 : 110}%;width:2400px;height:2400px;translate:-50% -50%;border-radius:50%;background:repeating-radial-gradient(circle,transparent 0 40px,${accent}26 40px 44px)"></div>`
    case 'kites':
      return `
        <div style="position:absolute;left:18%;top:16%;width:180px;height:240px;background:${accent};clip-path:polygon(50% 0,100% 40%,50% 100%,0 40%);rotate:-14deg"></div>
        <div style="position:absolute;left:58%;top:30%;width:120px;height:160px;background:#ff6b6b;clip-path:polygon(50% 0,100% 40%,50% 100%,0 40%);rotate:10deg"></div>
        <div style="position:absolute;left:38%;top:52%;width:90px;height:120px;background:#fff;opacity:.85;clip-path:polygon(50% 0,100% 40%,50% 100%,0 40%);rotate:-4deg"></div>`
  }
}

const page = (w: number, h: number, body: string, bg = 'transparent') =>
  `<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;background:${bg};overflow:hidden">${body}</body></html>`

/** 2:3 poster with title, the way a streaming shelf shows it. */
export function poster(t: Title) {
  const [top, bottom] = t.palette
  return page(
    600,
    900,
    `<div style="position:relative;width:600px;height:900px;overflow:hidden;background:linear-gradient(${top},${bottom});font-family:${t.font};color:#fff">
      ${motif(t, false)}
      <div style="position:absolute;inset:auto 0 0 0;height:55%;background:linear-gradient(transparent,#000a)"></div>
      <div style="position:absolute;left:44px;right:44px;bottom:56px">
        <div style="font-size:${t.name.length > 12 ? 62 : 78}px;line-height:.95;letter-spacing:-.01em;font-weight:600">${t.name}</div>
        <div style="margin-top:18px;font-family:'Avenir Next',sans-serif;font-size:18px;letter-spacing:.32em;text-transform:uppercase;opacity:.8">${t.seasons ? `${t.seasons.length} seasons · ` : ''}${t.year}</div>
      </div>
    </div>`,
  )
}

/** 16:9 backdrop without text, like the fanart Jellyfin shows behind a title. */
export function backdrop(t: Title) {
  const [top, bottom] = t.palette
  return page(
    1920,
    1080,
    `<div style="position:relative;width:1920px;height:1080px;overflow:hidden;background:linear-gradient(${top},${bottom})">${motif(t, true)}</div>`,
  )
}

/** Transparent title logo. */
export function logo(t: Title) {
  return page(
    1200,
    300,
    `<div style="height:300px;display:flex;align-items:center;font-family:${t.font};font-size:150px;font-weight:600;letter-spacing:.02em;color:#f7f1e3;text-shadow:0 4px 30px #0008">${t.name}</div>`,
  )
}

/** Banner at the top of the README. */
export function banner(fontUrl: string) {
  return page(
    1600,
    560,
    `<style>@font-face{font-family:Geist;src:url(${fontUrl})}</style>
    <div style="position:relative;width:1600px;height:560px;overflow:hidden;background:radial-gradient(900px 500px at 78% 120%,#1c2a44,transparent),linear-gradient(#0f131c,#0b0e15);font-family:Geist,sans-serif;color:#f3eee2">
      <svg viewBox="0 0 32 32" style="position:absolute;right:-90px;top:-60px;width:680px;height:680px;opacity:.09"><circle cx="16" cy="16" r="14" fill="none" stroke="#f3eee2" stroke-width="2"/><circle cx="16" cy="16" r="9" fill="none" stroke="#f3eee2" stroke-width="1"/><circle cx="16" cy="16" r="3.2" fill="#e9be55"/></svg>
      <div style="position:absolute;left:120px;top:150px">
        <div style="display:flex;align-items:center;gap:28px">
          <svg viewBox="0 0 32 32" style="width:96px;height:96px"><circle cx="16" cy="16" r="14" fill="none" stroke="#f3eee2" stroke-width="2"/><circle cx="16" cy="16" r="9" fill="none" stroke="#f3eee2" stroke-opacity=".35" stroke-width="1"/><circle cx="16" cy="16" r="3.2" fill="#e9be55"/><path d="M16 2a14 14 0 0 1 12.12 7" fill="none" stroke="#e9be55" stroke-width="2" stroke-linecap="round"/></svg>
          <div style="font-size:120px;font-weight:650;letter-spacing:-.035em">Pasta<span style="color:#e9be55">Finn</span></div>
        </div>
        <div style="margin-top:28px;font-size:40px;color:#b9bfcc;letter-spacing:-.01em">Audio &amp; subtitle tracks for a whole Jellyfin series, in one go.</div>
      </div>
    </div>`,
  )
}
