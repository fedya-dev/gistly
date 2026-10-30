#!/bin/sh
set -e

echo "[gistly] Applying database schema (prisma db push)..."
bunx prisma db push --skip-generate

echo "[gistly] Admin password: value of ADMIN_PASSWORD (default: admin) - change it in production!"
echo "[gistly] Starting Gistly on port ${PORT:-3000}..."
exec bun server.js
