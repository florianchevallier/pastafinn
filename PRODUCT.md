# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Self-hosters and their household members who watch series on Jellyfin. Each person signs in with their own Jellyfin account and sets their own audio and subtitle tracks: Jellyfin stores the choice per user and per item. Typical scene: before a binge, a show's episodes default to the wrong dub or to no subtitles, and fixing it episode by episode in the player is tedious.

## Product Purpose
Pick the audio and subtitle track once and apply it to an episode, a season or a whole series (or to a movie), so every episode plays with the right tracks in any Jellyfin client. Success means a whole series is fixed in a few clicks, with clear feedback on which episodes matched.

## Positioning
A Jellyfin counterpart to PASTA (Plex), rewritten from scratch. It runs 100% in the browser and talks only to the user's own Jellyfin server. There is no backend and no telemetry.

## Operating Context
- Opened occasionally, often on a desktop, sometimes on a phone from the couch.
- Hosted on GitHub Pages or self-hosted with Docker. An HTTP-only LAN server needs the Docker or local build, because browsers block mixed content.
- The server must allow the app's origin (CORS).

## Capabilities and Constraints
- Sign in with the server URL plus username and password, or with Quick Connect.
- Browse libraries, then series, seasons and episodes (movies too).
- Show the audio and subtitle streams of a reference episode, with the currently remembered tracks highlighted.
- Apply the chosen tracks to an episode, a season or a whole series. Tracks are matched across episodes by title, language and codec, with an optional keyword filter. Progress is shown and can be cancelled, then a summary is shown.
- Write path: `POST /Sessions/Playing/Progress` with the current resume position, plus one `Stopped` at the end of a batch. This was checked on Jellyfin 10.11.0. Items with unknown runtime are skipped.
- The tracks only apply when the user's settings "Remember audio/subtitle selections" are enabled and the subtitle mode is not "None". The UI detects this and offers to fix it.
- UI in English and French, chosen from the browser language with a manual switch.

## Brand Commitments
The name is PastaFinn. It credits PASTA by cglatot as the inspiration, without reusing its code. License: MIT.

## Evidence on Hand
None yet. Never fabricate users, stars or testimonials.

## Product Principles
1. One job, done fast: it fixes tracks, nothing else.
2. Never surprise: no hidden changes to watched state or resume points; say what will happen before a batch and what happened after.
3. Private by construction: the browser talks directly to the user's server.
4. Works on a huge library: virtualized lists and search, no full-library fetches.

## Accessibility & Inclusion
Fully keyboard operable, WCAG 2.2 AA contrast, screen-reader labels on every table and control, reduced-motion support.
