#!/usr/bin/env bash
# Disposable Jellyfin for end-to-end tests: one series (3 episodes, 2 audio + 2 subtitle tracks each).
# Usage: e2e/jellyfin.sh up | down
set -euo pipefail

IMAGE="${JELLYFIN_IMAGE:-jellyfin/jellyfin:12.3}"
PORT="${JELLYFIN_PORT:-8199}"
NAME=pastafinn-e2e
# Inside the repo: macOS temp folders are not reliably shared with Docker Desktop's VM.
DIR="$(cd "$(dirname "$0")" && pwd)/.data"
URL="http://localhost:$PORT"
JSON='Content-Type: application/json'

down() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  # files written by the container are root-owned: remove them from inside a container
  docker run --rm -v "$DIR:/d" --entrypoint sh "$IMAGE" -c 'rm -rf /d/*' >/dev/null 2>&1 || true
  rm -rf "$DIR"
}

media() {
  local show="$DIR/media/Test Show/Season 01"
  mkdir -p "$show"
  printf '1\n00:00:00,000 --> 00:00:09,000\nHello\n' >"$DIR/media/en.srt"
  printf '1\n00:00:00,000 --> 00:00:09,000\nBonjour\n' >"$DIR/media/fr.srt"
  for e in 1 2 3; do
    docker run --rm -v "$DIR/media:/m" --entrypoint /usr/lib/jellyfin-ffmpeg/ffmpeg "$IMAGE" -loglevel error -y \
      -f lavfi -i testsrc=size=320x240:rate=10 -f lavfi -i sine=f=440 -f lavfi -i sine=f=880 -i /m/en.srt -i /m/fr.srt -t 10 \
      -map 0 -map 1 -map 2 -map 3 -map 4 -c:v libx264 -preset ultrafast -c:a:0 aac -c:a:1 ac3 -c:s srt \
      -metadata:s:a:0 language=eng -metadata:s:a:0 title=English -metadata:s:a:1 language=fre -metadata:s:a:1 title=Français \
      -metadata:s:s:0 language=eng -metadata:s:s:1 language=fre -metadata:s:s:1 'title=Français complet' \
      -disposition:a:0 default -disposition:s:0 0 "/m/Test Show/Season 01/Test Show - S01E0$e.mkv"
  done
}

wait_for() { # url, expected status
  for _ in $(seq 120); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' "$1")" = "$2" ] && return 0
    sleep 1
  done
  echo "timeout waiting for $1" >&2
  return 1
}

up() {
  down
  media
  # No config volume: the server state dies with the container, so every run starts from a fresh wizard.
  docker run -d --name "$NAME" -p "$PORT:8096" -v "$DIR/media:/media:ro" "$IMAGE" >/dev/null
  wait_for "$URL/Startup/Configuration" 200
  curl -sf -X POST "$URL/Startup/Configuration" -H "$JSON" -d '{"UICulture":"en-US","MetadataCountryCode":"US","PreferredMetadataLanguage":"en"}'
  curl -sf "$URL/Startup/User" >/dev/null
  curl -sf -X POST "$URL/Startup/User" -H "$JSON" -d '{"Name":"e2e","Password":"e2e"}'
  curl -sf -X POST "$URL/Startup/Complete"

  local auth='MediaBrowser Client="e2e", Device="cli", DeviceId="e2e-setup", Version="1"'
  local token
  token=$(curl -sf -X POST "$URL/Users/AuthenticateByName" -H "$JSON" -H "Authorization: $auth" -d '{"Username":"e2e","Pw":"e2e"}' |
    sed -E 's/.*"AccessToken":"([^"]+)".*/\1/')
  auth="$auth, Token=\"$token\""
  # The 10 s test clips are below Jellyfin's 300 s minimum for resume points: lift it so tests can set one.
  curl -sf "$URL/System/Configuration" -H "Authorization: $auth" | sed -E 's/"MinResumeDurationSeconds":[0-9]+/"MinResumeDurationSeconds":0/' |
    curl -sf -X POST "$URL/System/Configuration" -H "Authorization: $auth" -H "$JSON" -d @-
  # Local metadata only: no network lookups, so names and timings stay deterministic.
  curl -sf -X POST "$URL/Library/VirtualFolders?name=Series&collectionType=tvshows&refreshLibrary=true" -H "Authorization: $auth" -H "$JSON" \
    -d '{"LibraryOptions":{"PathInfos":[{"Path":"/media"}],"MetadataSavers":[],"DisabledLocalMetadataReaders":[],"TypeOptions":[{"Type":"Series","MetadataFetchers":[],"ImageFetchers":[]},{"Type":"Season","MetadataFetchers":[],"ImageFetchers":[]},{"Type":"Episode","MetadataFetchers":[],"ImageFetchers":[]}]}}'

  for _ in $(seq 120); do
    if curl -sf "$URL/Items?Recursive=true&IncludeItemTypes=Episode" -H "Authorization: $auth" | grep -q '"TotalRecordCount":3'; then
      echo "Jellyfin ready on $URL"
      return 0
    fi
    sleep 1
  done
  echo "library scan did not finish" >&2
  return 1
}

"${1:-up}"
