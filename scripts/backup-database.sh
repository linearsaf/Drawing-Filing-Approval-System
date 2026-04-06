#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/root/app/drawing-filing-approval-system"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
BACKUP_DIR="${BACKUP_DIR:-/root/app/_backups/drawing-filing-approval-system/db}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

log() {
  printf '[db-backup] %s\n' "$*"
}

fail() {
  printf '[db-backup][error] %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

require_cmd python3
require_cmd mysqldump
require_cmd gzip

[[ -f "$ENV_FILE" ]] || fail "Env file not found: $ENV_FILE"

DB_EXPORTS="$({ ENV_FILE="$ENV_FILE" python3 <<'PY'
import os
from pathlib import Path

env_file = Path(os.environ['ENV_FILE'])
text = env_file.read_text()
line = next((ln for ln in text.splitlines() if ln.startswith('DATABASE_URL=')), None)
if not line:
    raise SystemExit('DATABASE_URL not found in env file')
url = line.split('=', 1)[1].strip()
if '://' not in url:
    raise SystemExit('DATABASE_URL has invalid format')
rest = url.split('://', 1)[1]
auth, host_db = rest.rsplit('@', 1)
user, password = auth.split(':', 1)
if '/' not in host_db:
    raise SystemExit('DATABASE_URL missing database name')
host_port, db_name = host_db.split('/', 1)
db_name = db_name.split('?', 1)[0]
if ':' in host_port:
    host, port = host_port.rsplit(':', 1)
else:
    host, port = host_port, '3306'
print(f"DB_USER={user}")
print(f"DB_PASSWORD={password}")
print(f"DB_HOST={host}")
print(f"DB_PORT={port}")
print(f"DB_NAME={db_name}")
PY
} )"

eval "$DB_EXPORTS"

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/${TIMESTAMP}__${DB_NAME}.sql.gz"
META_FILE="$BACKUP_DIR/${TIMESTAMP}__${DB_NAME}.meta.txt"
CNF_FILE="$(mktemp)"
trap 'rm -f "$CNF_FILE"' EXIT

cat > "$CNF_FILE" <<CNF
[client]
user=$DB_USER
password=$DB_PASSWORD
host=$DB_HOST
port=$DB_PORT
CNF
chmod 600 "$CNF_FILE"

log "Creating backup: $BACKUP_FILE"
mysqldump \
  --defaults-extra-file="$CNF_FILE" \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --no-tablespaces \
  --set-gtid-purged=OFF \
  "$DB_NAME" | gzip -c > "$BACKUP_FILE"

{
  echo "timestamp=$TIMESTAMP"
  echo "database=$DB_NAME"
  echo "host=$DB_HOST"
  echo "port=$DB_PORT"
  echo "backup_file=$BACKUP_FILE"
} > "$META_FILE"

log "Backup complete"
log "Backup file: $BACKUP_FILE"
