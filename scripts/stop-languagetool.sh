#!/usr/bin/env bash
# Stop the Write-Right LanguageTool container.

CONTAINER_NAME="write-right-languagetool"

if ! command -v docker >/dev/null 2>&1; then
  exit 0
fi

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  docker stop "${CONTAINER_NAME}" >/dev/null
  echo "Stopped ${CONTAINER_NAME}."
else
  echo "${CONTAINER_NAME} is not running."
fi
