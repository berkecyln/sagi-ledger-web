# Local PocketBase
#
# Same PocketBase release as production, loaded with the production schema.
# Data lives inside the container and is gone when it stops.

FROM alpine:3.22

ARG PB_VERSION=0.40.2
ARG TARGETARCH=amd64

# Download the release and check it against the published checksums
RUN apk add --no-cache ca-certificates unzip \
  && cd /tmp \
  && ZIP="pocketbase_${PB_VERSION}_linux_${TARGETARCH}.zip" \
  && BASE="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}" \
  && wget -q "$BASE/$ZIP" "$BASE/checksums.txt" \
  && grep " $ZIP\$" checksums.txt | sha256sum -c - \
  && unzip -q "$ZIP" pocketbase -d /pb \
  && rm -f /tmp/*

COPY pb_schema.json /pb/pb_schema.json
COPY pb_migrations /pb/pb_migrations

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations"]
