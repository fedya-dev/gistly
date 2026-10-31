#!/usr/bin/env bash
# Build & run Gistly on servers where Docker's bridge networking is broken
# (typical on Proxmox LXC hosts). This script:
#   1. builds the image on the host network AND grants the network.host
#      entitlement — needed because recent Docker Compose versions build
#      through BuildKit Bake, which refuses "network: host" unless the
#      entitlement is passed explicitly ("additional privileges requested");
#   2. starts the stack with docker compose (the container itself also runs
#      on the host network, see docker-compose.yml).
#
# Usage:
#   ./deploy.sh                        # build + start
#   ADMIN_PASSWORD=secret ./deploy.sh  # env vars are picked up by compose
#
# On healthy Docker hosts you can still use the classic:
#   docker compose up -d --build
set -euo pipefail

echo "==> Building image (host network + network.host entitlement)"
docker buildx build --allow=network.host --network=host -t gistly:latest .

echo "==> Starting container"
docker compose up -d

echo "==> Done. Gistly should be reachable on http://<server-ip>:3000"
docker compose ps
