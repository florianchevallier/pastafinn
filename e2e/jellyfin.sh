#!/usr/bin/env bash
# Disposable Jellyfin, used by the end-to-end tests and the README screenshots.
# Usage: e2e/jellyfin.sh up | down
#
# By default it generates one test series (3 episodes, 2 audio + 2 subtitle tracks each).
# Set MEDIA_DIR to serve a prepared folder instead (shows/ and optionally movies/ inside),
# with EXPECTED_EPISODES set to its episode count.
set -euo pipefail

IMAGE="${JELLYFIN_IMAGE:-jellyfin/jellyfin:12.3}"
PORT="${JELLYFIN_PORT:-8199}"
NAME="${JELLYFIN_NAME:-pastafinn-e2e}"
# Account created by the wizard (its password is always "e2e"), and an optional display name for the server.
USER_NAME="${JELLYFIN_USER:-e2e}"
SERVER_NAME="${JELLYFIN_SERVER_NAME:-}"
# Inside the repo: macOS temp folders are not reliably shared with Docker Desktop's VM.
DIR="$(cd "$(dirname "$0")" && pwd)/.data"
MEDIA="${MEDIA_DIR:-$DIR/media}"
EXPECTED="${EXPECTED_EPISODES:-3}"
URL="http://localhost:$PORT"
JSON='Content-Type: application/json'

down() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  # files written by the container are root-owned: remove them from inside a container
  docker run --rm -v "$DIR:/d" --entrypoint sh "$IMAGE" -c 'rm -rf /d/*' >/dev/null 2>&1 || true
  rm -rf "$DIR"
}

test_media() {
  local show="$DIR/media/shows/Test Show/Season 01"
  mkdir -p "$show"
  printf '1\n00:00:00,000 --> 00:00:09,000\nHello\n' >"$DIR/media/en.srt"
  printf '1\n00:00:00,000 --> 00:00:09,000\nBonjour\n' >"$DIR/media/fr.srt"
  for e in 1 2 3; do
    docker run --rm -v "$DIR/media:/m" --entrypoint /usr/lib/jellyfin-ffmpeg/ffmpeg "$IMAGE" -loglevel error -y \
      -f lavfi -i testsrc=size=320x240:rate=10 -f lavfi -i sine=f=440 -f lavfi -i sine=f=880 -i /m/en.srt -i /m/fr.srt -t 10 \
      -map 0 -map 1 -map 2 -map 3 -map 4 -c:v libx264 -preset ultrafast -c:a:0 aac -c:a:1 ac3 -c:s srt \
      -metadata:s:a:0 language=eng -metadata:s:a:0 title=English -metadata:s:a:1 language=fre -metadata:s:a:1 title=Français \
      -metadata:s:s:0 language=eng -metadata:s:s:1 language=fre -metadata:s:s:1 'title=Français complet' \
      -disposition:a:0 default -disposition:s:0 0 "/m/shows/Test Show/Season 01/Test Show - S01E0$e.mkv"
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

# Local metadata only (NFO files, images next to the media): no network lookups, so runs stay deterministic.
library() { # name, collection type, path in the container, item types
  local types="" t
  for t in $4; do types+="{\"Type\":\"$t\",\"MetadataFetchers\":[],\"ImageFetchers\":[]},"; done
  curl -sf -X POST "$URL/Library/VirtualFolders?name=$1&collectionType=$2&refreshLibrary=true" -H "Authorization: $AUTH" -H "$JSON" \
    -d "{\"LibraryOptions\":{\"PathInfos\":[{\"Path\":\"$3\"}],\"MetadataSavers\":[],\"DisabledLocalMetadataReaders\":[],\"TypeOptions\":[${types%,}]}}"
}

up() {
  down
  [ -n "${MEDIA_DIR:-}" ] || test_media
  # No config volume: the server state dies with the container, so every run starts from a fresh wizard.
  docker run -d --name "$NAME" -p "$PORT:8096" -v "$MEDIA:/media:ro" "$IMAGE" >/dev/null
  wait_for "$URL/Startup/Configuration" 200
  curl -sf -X POST "$URL/Startup/Configuration" -H "$JSON" -d '{"UICulture":"en-US","MetadataCountryCode":"US","PreferredMetadataLanguage":"en"}'
  curl -sf "$URL/Startup/User" >/dev/null
  curl -sf -X POST "$URL/Startup/User" -H "$JSON" -d "{\"Name\":\"$USER_NAME\",\"Password\":\"e2e\"}"
  curl -sf -X POST "$URL/Startup/Complete"

  AUTH='MediaBrowser Client="e2e", Device="cli", DeviceId="e2e-setup", Version="1"'
  local token
  token=$(curl -sf -X POST "$URL/Users/AuthenticateByName" -H "$JSON" -H "Authorization: $AUTH" -d "{\"Username\":\"$USER_NAME\",\"Pw\":\"e2e\"}" |
    sed -E 's/.*"AccessToken":"([^"]+)".*/\1/')
  AUTH="$AUTH, Token=\"$token\""
  # The 10 s test clips are below Jellyfin's 300 s minimum for resume points: lift it so tests can set one.
  curl -sf "$URL/System/Configuration" -H "Authorization: $AUTH" | sed -E -e 's/"MinResumeDurationSeconds":[0-9]+/"MinResumeDurationSeconds":0/' ${SERVER_NAME:+-e "s/\"ServerName\":\"[^\"]*\"/\"ServerName\":\"$SERVER_NAME\"/"} |
    curl -sf -X POST "$URL/System/Configuration" -H "Authorization: $AUTH" -H "$JSON" -d @-

  library Series tvshows /media/shows "Series Season Episode"
  [ -d "$MEDIA/movies" ] && library Movies movies /media/movies "Movie"

  for _ in $(seq 180); do
    if curl -sf "$URL/Items?Recursive=true&IncludeItemTypes=Episode" -H "Authorization: $AUTH" | grep -q "\"TotalRecordCount\":$EXPECTED"; then
      echo "Jellyfin ready on $URL"
      return 0
    fi
    sleep 1
  done
  echo "library scan did not finish" >&2
  return 1
}

"${1:-up}"
