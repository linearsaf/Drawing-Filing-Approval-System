# Production deploy flow

App production:
- URL: `https://drawing.linearsaf.com`
- App dir: `/root/app/drawing-filing-approval-system`
- PM2 app: `drawing-approval-app`
- Internal port: `127.0.0.1:3001`

## Recommended commands

### 1) Preview incoming update only
```bash
cd /root/app/drawing-filing-approval-system
npm run prod:deploy:preview
```

### 2) Safer deploy (recommended)
Creates DB backup first, then runs normal deploy flow.
```bash
cd /root/app/drawing-filing-approval-system
npm run prod:deploy:safe
```

### 3) App-only deploy (skip db:push)
Use when you know there is no schema change.
```bash
cd /root/app/drawing-filing-approval-system
npm run prod:deploy:app-only
```

### 4) Standard deploy
```bash
cd /root/app/drawing-filing-approval-system
npm run prod:deploy
```

## What standard deploy does
1. checks git working tree
2. `git fetch` + `git merge --ff-only origin/main`
3. `npm ci`
4. optional DB backup (safe mode)
5. `npm run db:push` unless skipped
6. `npm run build`
7. PM2 restart/start
8. local + public health-check

## Important safety notes
- Deploy script **does not run seed**.
- Deploy script **does not intentionally reset database data**.
- `db:push` can still change **schema** if upstream schema changed.
- Safe mode is preferred before production updates because it creates a DB dump first.
- If git working tree is dirty, deploy will abort by default.
- For local-only deploys without pulling new code, use `SKIP_GIT_PULL=1 ALLOW_DIRTY=1 ...` intentionally.

## Extra commands

### Backup database only
```bash
cd /root/app/drawing-filing-approval-system
npm run prod:backup-db
```

### Quick status check
```bash
cd /root/app/drawing-filing-approval-system
npm run prod:check
```

### Restart only
```bash
cd /root/app/drawing-filing-approval-system
npm run prod:restart
```
