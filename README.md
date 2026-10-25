# PastaFinn

**Set the audio and subtitle tracks of a whole Jellyfin series in one go.**

Your show defaults to the wrong dub, or to no subtitles, and fixing it episode by episode in the player is tedious. PastaFinn shows the tracks of an episode as a disc-style *Languages* menu: pick audio and subtitles once, then apply them to that episode, the season, or the whole series. Every Jellyfin client then starts those episodes with the right tracks. Movies work too.

- Matches tracks across episodes by title, language, codec and forced/SDH flags, with an optional keyword filter (e.g. `SDH`).
- Previews what each episode will get before you apply, then reports what was applied, what was already set, and what had no matching track.
- Never touches watched state, play count or resume position.
- Runs entirely in your browser and talks only to your Jellyfin server. There is no backend and no tracking.
- English and French UI.

> Inspired by [PASTA](https://github.com/cglatot/pasta) by cglatot, the same idea for Plex. PastaFinn is an independent rewrite for Jellyfin and shares no code with it.

## Use it

### Hosted

Open **https://florianchevallier.github.io/pastafinn/**, enter your server address and sign in with your Jellyfin account or Quick Connect.

The hosted page is served over HTTPS, so browsers only let it reach a server that also uses **HTTPS**. For a plain-HTTP server (for example `http://192.168.1.10:8096`), run PastaFinn yourself (below).

### Docker

```sh
docker run -d --name pastafinn -p 8087:8080 ghcr.io/florianchevallier/pastafinn:latest
```

Then open `http://<host>:8087`.

### From source

```sh
npm ci
npm run dev      # http://localhost:5173
npm run build    # static files in dist/, host them anywhere
```

## Requirements

- Jellyfin **10.10 or newer**. Tested on 10.11.0 and 12.3.0.
- In your Jellyfin user settings, **Remember audio selections** and **Remember subtitle selections** must be on (the default), and the subtitle mode must not be *None*. PastaFinn detects this and offers to fix it for you.
- The server must accept requests from the page's origin (CORS). Jellyfin does by default. If you put a reverse proxy in front of it, make sure the proxy does not strip the CORS headers.
- If a Jellyfin app still switches tracks on its own, turn off *Set audio/subtitle track based on previous item* in that app's playback settings.

## How it works

Jellyfin remembers, per user and per item, the audio and subtitle streams last chosen in a player (`UserData.AudioStreamIndex` / `SubtitleStreamIndex`), and uses them the next time the item plays. There is no API to set these directly, so PastaFinn sends the same playback check-in a player would send:

1. `GET /Shows/{id}/Episodes?fields=MediaSources` reads every episode's streams and the tracks Jellyfin currently picks for you.
2. For each episode, `POST /Sessions/Playing/Progress` sends the matched `AudioStreamIndex` and `SubtitleStreamIndex` (`-1` means off), together with the episode's **current** resume position, so watched state, play count and resume point stay as they were.
3. At the end, a single `POST /Sessions/Playing/Stopped` (again with the current position) clears the "now playing" entry. Your dashboard's activity log shows one "finished playing" line.

Why always send the position:
- Jellyfin 10.10 and 10.11 only save a check-in that carries a position.
- Jellyfin auto-stops idle sessions using the last reported position. A check-in without a position would let it mark the item as watched if the tab closed mid-batch.

Side effect to know about: on Jellyfin 12, an episode you are **partway through** gets its "last played" date refreshed, so it can move up in *Continue watching*. Unwatched and finished episodes are untouched.

Episodes whose duration Jellyfin does not know yet are skipped: for those items, Jellyfin would treat any check-in as a full play.

## Development

```sh
npm test         # unit tests (track matching and planning)
npm run lint
npm run build
```

Stack: Vite, React 19 with React Compiler, TypeScript, TanStack Query & Router, Tailwind CSS v4, shadcn/ui (Radix), the official [`@jellyfin/sdk`](https://github.com/jellyfin/jellyfin-sdk-typescript).

## License

[MIT](LICENSE)
