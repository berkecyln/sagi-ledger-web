#!/bin/sh
#
# Local PocketBase
#
# Runs the dev database in Docker on 127.0.0.1:8090, data kept in a volume.
#
# Commands:
#    up (build the image, start the container if it is not running)
#    down (stop the container, keep the data)
#    reset (delete the container and its data, start fresh)
#

set -e
cd "$(dirname "$0")"

NAME=sagi-pb-dev
URL=http://127.0.0.1:8090

# Build the image and start the container
up() {
  docker build -q -t sagi-pb . >/dev/null
  if [ -z "$(docker ps -q -f name="^$NAME$")" ]; then
    docker start "$NAME" >/dev/null 2>&1 \
      || docker run -d --name "$NAME" -v "$NAME:/pb/pb_data" -p 127.0.0.1:8090:8090 sagi-pb >/dev/null
  fi
  # Wait until the server answers
  timeout 30 sh -c "until curl -sf $URL/api/health >/dev/null; do sleep 0.5; done"
  echo "PocketBase running at $URL"
}

case "$1" in
  up)
    up
    ;;
  down)
    docker stop "$NAME" >/dev/null && echo "PocketBase stopped, data kept"
    ;;
  reset)
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    docker volume rm -f "$NAME" >/dev/null
    up
    ;;
  *)
    echo "Usage: pb.sh up | down | reset" >&2
    exit 1
    ;;
esac
