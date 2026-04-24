#!/usr/bin/env bash
# Start or resume the LanguageTool Docker container and wait until it's ready.
# Named container keeps state stable across runs (no duplicate containers).

set -e

CONTAINER_NAME="write-right-languagetool"
IMAGE="silviof/docker-languagetool"
PORT=8010
HEALTH_URL="http://localhost:${PORT}/v2/languages"
MAX_WAIT_SECS=60

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is not installed or not on PATH." >&2
  echo "Install Docker Desktop: https://www.docker.com/products/docker-desktop/" >&2
  exit 1
fi

# Free the port if a different Docker container is holding it
OWN_ID=$(docker ps -q --filter "name=^${CONTAINER_NAME}$" 2>/dev/null || true)
OTHERS=$(docker ps -q --filter "publish=${PORT}" 2>/dev/null || true)
for id in $OTHERS; do
  if [ "$id" != "$OWN_ID" ]; then
    NAME=$(docker inspect -f '{{.Name}}' "$id" | sed 's|^/||')
    echo "Stopping other container on port ${PORT}: ${NAME}..."
    docker stop "$id" >/dev/null
  fi
done

# Container lifecycle: reuse -> start -> create
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "LanguageTool already running."
elif docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Starting existing LanguageTool container..."
  docker start "${CONTAINER_NAME}" >/dev/null
else
  echo "Creating LanguageTool container (first-run downloads ~1GB)..."
  docker run -d --name "${CONTAINER_NAME}" -p ${PORT}:${PORT} "${IMAGE}" >/dev/null
fi

# Wait until the API is actually responsive (cold start can take 20-40s)
printf "Waiting for LanguageTool to be ready"
for i in $(seq 1 $MAX_WAIT_SECS); do
  if curl -sf "${HEALTH_URL}" >/dev/null 2>&1; then
    echo " - ready."
    exit 0
  fi
  printf "."
  sleep 1
done

echo ""
echo "LanguageTool did not respond within ${MAX_WAIT_SECS}s." >&2
echo "Check logs with: docker logs ${CONTAINER_NAME}" >&2
exit 1
