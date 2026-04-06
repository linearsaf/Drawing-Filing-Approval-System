#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/root/app/drawing-filing-approval-system"
APP_NAME="drawing-approval-app"
APP_URL="https://drawing.linearsaf.com"
APP_PORT="3001"
BRANCH="${BRANCH:-main}"
ALLOW_DIRTY="${ALLOW_DIRTY:-0}"
SKIP_GIT_PULL="${SKIP_GIT_PULL:-0}"
PREVIEW_ONLY="${PREVIEW_ONLY:-0}"
SKIP_DB_PUSH="${SKIP_DB_PUSH:-0}"
BACKUP_DB="${BACKUP_DB:-0}"

log() {
  printf '[deploy] %s\n' "$*"
}

fail() {
  printf '[deploy][error] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

trap 'fail "Deployment aborted at line $LINENO."' ERR

require_cmd git
require_cmd npm
require_cmd pm2
require_cmd curl

cd "$APP_DIR"

log "App dir: $APP_DIR"
log "Branch target: $BRANCH"
log "Flags: ALLOW_DIRTY=$ALLOW_DIRTY SKIP_GIT_PULL=$SKIP_GIT_PULL PREVIEW_ONLY=$PREVIEW_ONLY SKIP_DB_PUSH=$SKIP_DB_PUSH BACKUP_DB=$BACKUP_DB"

if [[ "$ALLOW_DIRTY" != "1" ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    fail "Working tree is dirty. Commit/stash changes first, or rerun intentionally with ALLOW_DIRTY=1. If you only want local deployment without pull, combine with SKIP_GIT_PULL=1."
  fi
fi

CURRENT_BRANCH="$(git branch --show-current)"
CURRENT_COMMIT="$(git rev-parse --short HEAD)"
log "Current branch: $CURRENT_BRANCH"
log "Current commit: $CURRENT_COMMIT"

if [[ "$SKIP_GIT_PULL" != "1" ]]; then
  [[ "$CURRENT_BRANCH" == "$BRANCH" ]] || fail "Current branch is '$CURRENT_BRANCH', expected '$BRANCH'. Switch branch first or override BRANCH=."

  log "Fetching latest origin/$BRANCH"
  git fetch origin "$BRANCH" --prune

  REMOTE_COMMIT="$(git rev-parse --short "origin/$BRANCH")"
  log "Remote commit: $REMOTE_COMMIT"
  log "Incoming commits (HEAD..origin/$BRANCH):"
  git log --oneline --no-decorate HEAD.."origin/$BRANCH" || true

  if [[ "$PREVIEW_ONLY" == "1" ]]; then
    log "Preview only mode: exiting before merge/install/build"
    exit 0
  fi

  log "Fast-forwarding local branch"
  git merge --ff-only "origin/$BRANCH"
else
  log "Skipping git fetch/pull because SKIP_GIT_PULL=1"
  if [[ "$PREVIEW_ONLY" == "1" ]]; then
    log "Preview only mode with SKIP_GIT_PULL=1: nothing else to do"
    exit 0
  fi
fi

log "Installing dependencies"
npm ci

if [[ "$BACKUP_DB" == "1" ]]; then
  log "Creating database backup before schema sync"
  bash scripts/backup-database.sh
else
  log "Skipping database backup (BACKUP_DB=$BACKUP_DB)"
fi

if [[ "$SKIP_DB_PUSH" != "1" ]]; then
  log "Applying database schema via db:push"
  npm run db:push
else
  log "Skipping database schema sync (SKIP_DB_PUSH=1)"
fi

log "Building production bundle"
npm run build

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  log "Restarting existing PM2 app: $APP_NAME"
  pm2 restart ecosystem.config.cjs --only "$APP_NAME" --update-env
else
  log "Starting PM2 app: $APP_NAME"
  pm2 start ecosystem.config.cjs --only "$APP_NAME" --update-env
fi

log "Persisting PM2 process list"
pm2 save

log "Waiting for app warm-up"
sleep 3

log "Checking local app on 127.0.0.1:$APP_PORT"
curl -fsS -I "http://127.0.0.1:${APP_PORT}/" >/dev/null

log "Checking public app on $APP_URL"
curl -fsS -I "$APP_URL/" >/dev/null

log "Deployment complete"
log "Current commit: $(git rev-parse --short HEAD)"
