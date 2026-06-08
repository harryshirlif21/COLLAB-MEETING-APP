#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"

if [[ ! -f ".env" ]]; then
  echo "Missing .env file. Create it from .env.example and set DOCKERHUB_USERNAME."
  exit 1
fi

docker compose -f "${COMPOSE_FILE}" pull
docker compose -f "${COMPOSE_FILE}" up -d
docker compose -f "${COMPOSE_FILE}" ps
