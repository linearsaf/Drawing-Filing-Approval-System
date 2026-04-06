#!/usr/bin/env bash
set -Eeuo pipefail
cd /root/app/drawing-filing-approval-system
SKIP_DB_PUSH=1 bash scripts/deploy-production.sh
