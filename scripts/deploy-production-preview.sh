#!/usr/bin/env bash
set -Eeuo pipefail
cd /root/app/drawing-filing-approval-system
PREVIEW_ONLY=1 ALLOW_DIRTY=1 bash scripts/deploy-production.sh
