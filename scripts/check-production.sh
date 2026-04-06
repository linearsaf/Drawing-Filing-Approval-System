#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/root/app/drawing-filing-approval-system"
APP_NAME="drawing-approval-app"
APP_URL="https://drawing.linearsaf.com"
APP_PORT="3001"

cd "$APP_DIR"

echo "=== Git ==="
git branch --show-current
git rev-parse --short HEAD

echo
echo "=== PM2 ==="
pm2 show "$APP_NAME"

echo
echo "=== Local HTTP ==="
curl -I -s "http://127.0.0.1:${APP_PORT}/" | sed -n '1,20p'

echo
echo "=== Public HTTPS ==="
curl -I -s "$APP_URL/" | sed -n '1,20p'
