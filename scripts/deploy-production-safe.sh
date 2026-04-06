#!/usr/bin/env bash
set -Eeuo pipefail
cd /root/app/drawing-filing-approval-system
BACKUP_DB=1 bash scripts/deploy-production.sh
