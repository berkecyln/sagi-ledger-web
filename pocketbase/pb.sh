#!/bin/sh
#
# Local PocketBase
#
# Runs PocketBase in Docker, never production.
#
# Commands:
#    up (dev server on 127.0.0.1:8090, data kept in a volume)
#    down (stop the dev server, keep the data)
#    reset (delete the dev server and its data, start fresh)
#    test-up (fresh test server on 127.0.0.1:8091, no data kept)
#    test-down (remove the test server)
#

set -e
cd "$(dirname "$0")"

DEV=sagi-pb-dev
TEST=sagi-pb-test

# Build the image, cached after the first run
build() {
  docker build -q -t sagi-pb . >/dev/null
}

# Wait until the server on a port answers
wait_for() {
  timeout 30 sh -c "until curl -sf http://127.0.0.1:$1/api/health >/dev/null; do sleep 0.5; done"
}

# Start the dev server if it is not running
up() {
  build
  if [ -z "$(docker ps -q -f name="^$DEV$")" ]; then
    docker start "$DEV" >/dev/null 2>&1 \
      || docker run -d --name "$DEV" -v "$DEV:/pb/pb_data" -p 127.0.0.1:8090:8090 sagi-pb >/dev/null
  fi
  wait_for 8090
  echo "PocketBase running at http://127.0.0.1:8090"
}

case "$1" in
  up)
    up
    ;;
  down)
    docker stop "$DEV" >/dev/null && echo "PocketBase stopped, data kept"
    ;;
  reset)
    docker rm -f "$DEV" >/dev/null 2>&1 || true
    docker volume rm -f "$DEV" >/dev/null
    up
    ;;
  test-up)
    build
    docker rm -f "$TEST" >/dev/null 2>&1 || true
    docker run -d --rm --name "$TEST" -p 127.0.0.1:8091:8090 sagi-pb >/dev/null
    wait_for 8091
    ;;
  test-down)
    docker rm -f "$TEST" >/dev/null 2>&1 || true
    ;;
  *)
    echo "Usage: pb.sh up | down | reset | test-up | test-down" >&2
    exit 1
    ;;
esac
