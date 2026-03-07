#!/bin/bash
# deploy.sh — ClaWin1Click zero-downtime deploy with health check & rollback
# Usage: ./deploy.sh [--skip-build] [--dry-run]
#
# Requires: bash 4+, pnpm, pm2, curl
# Designed for PM2 cluster mode (2 workers) — uses `pm2 reload` for zero-downtime.

set -euo pipefail

# ── Colors & Logging ────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()   { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $*"; }
ok()    { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✓${NC} $*"; }
warn()  { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠${NC} $*"; }
err()   { echo -e "${RED}[$(date '+%H:%M:%S')] ✗${NC} $*" >&2; }
step()  { echo -e "\n${CYAN}━━━ Step $1: $2 ━━━${NC}"; }

# ── Configuration ───────────────────────────────────────────────────────────

APP_DIR="/root/openclaw"
APP_NAME="openclaw-web"
NEXT_DIR="${APP_DIR}/apps/web/.next"
HEALTH_URL="https://clawin1click.com/api/status"
HEALTH_RETRIES=3
HEALTH_INTERVAL=5
BACKUP_DIR="${APP_DIR}/.deploy-backups"
MAX_BACKUPS=3
DEPLOY_START=$(date +%s)
SKIP_BUILD=false
DRY_RUN=false
BACKUP_PATH=""

# ── Parse Arguments ─────────────────────────────────────────────────────────

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    --dry-run)    DRY_RUN=true ;;
    --help|-h)
      echo "Usage: ./deploy.sh [--skip-build] [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --skip-build  Skip pnpm build (reload PM2 with existing build)"
      echo "  --dry-run     Show what would happen without executing"
      echo "  --help        Show this help"
      exit 0
      ;;
    *)
      err "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

# ── Cleanup on failure ─────────────────────────────────────────────────────

cleanup() {
  local exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    err "Deploy failed with exit code $exit_code"
    if [[ -n "$BACKUP_PATH" && -d "$BACKUP_PATH" ]]; then
      warn "A backup exists at: $BACKUP_PATH"
      warn "To rollback manually: cp -a $BACKUP_PATH $NEXT_DIR && pm2 reload $APP_NAME"
    fi
  fi
}
trap cleanup EXIT

# ── Functions ───────────────────────────────────────────────────────────────

health_check() {
  local retries=${1:-$HEALTH_RETRIES}
  local interval=${2:-$HEALTH_INTERVAL}
  local attempt=1

  while [[ $attempt -le $retries ]]; do
    log "Health check attempt $attempt/$retries..."
    local http_code
    http_code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 10 --max-time 15 "$HEALTH_URL" 2>/dev/null || echo "000")

    if [[ "$http_code" == "200" ]]; then
      ok "Health check passed (HTTP $http_code)"
      return 0
    fi

    warn "Health check returned HTTP $http_code"
    if [[ $attempt -lt $retries ]]; then
      log "Retrying in ${interval}s..."
      sleep "$interval"
    fi
    ((attempt++))
  done

  err "Health check failed after $retries attempts"
  return 1
}

rollback() {
  step "R" "ROLLBACK"
  err "Initiating rollback..."

  if [[ -z "$BACKUP_PATH" || ! -d "$BACKUP_PATH" ]]; then
    err "No backup available for rollback!"
    err "Manual intervention required."
    exit 2
  fi

  log "Restoring .next from backup: $BACKUP_PATH"
  if [[ "$DRY_RUN" == true ]]; then
    log "[DRY RUN] Would restore $BACKUP_PATH -> $NEXT_DIR"
    log "[DRY RUN] Would reload PM2"
    return
  fi

  rm -rf "$NEXT_DIR"
  cp -a "$BACKUP_PATH" "$NEXT_DIR"
  ok "Build artifacts restored"

  log "Reloading PM2 with previous build..."
  pm2 reload "$APP_NAME"
  ok "PM2 reloaded with rollback build"

  log "Verifying rollback health..."
  if health_check 3 5; then
    ok "Rollback successful — service is healthy with previous build"
  else
    err "CRITICAL: Rollback health check also failed!"
    err "Manual intervention required. Check PM2 logs:"
    err "  pm2 logs $APP_NAME --lines 50"
  fi

  exit 1
}

cleanup_old_backups() {
  local count
  count=$(find "$BACKUP_DIR" -maxdepth 1 -mindepth 1 -type d | wc -l)

  if [[ $count -gt $MAX_BACKUPS ]]; then
    local to_remove=$((count - MAX_BACKUPS))
    log "Cleaning up $to_remove old backup(s) (keeping last $MAX_BACKUPS)..."
    find "$BACKUP_DIR" -maxdepth 1 -mindepth 1 -type d -printf '%T@ %p\n' \
      | sort -n \
      | head -n "$to_remove" \
      | cut -d' ' -f2- \
      | while read -r dir; do
          rm -rf "$dir"
          log "  Removed: $(basename "$dir")"
        done
  fi
}

# ── Main Deploy Flow ────────────────────────────────────────────────────────

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║       ClaWin1Click — Deploy Script v1.0         ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

if [[ "$DRY_RUN" == true ]]; then
  warn "DRY RUN MODE — no changes will be made"
fi

# ── Step 1: Pre-deploy checks ──────────────────────────────────────────────

step 1 "Pre-deploy checks"

if [[ ! -d "$APP_DIR" ]]; then
  err "App directory not found: $APP_DIR"
  exit 1
fi
ok "App directory exists"

cd "$APP_DIR"

if ! pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  err "PM2 process '$APP_NAME' is not running"
  err "Start it first: pm2 start ecosystem.config.js"
  exit 1
fi
ok "PM2 process '$APP_NAME' is running"

if [[ ! -d "$NEXT_DIR" ]]; then
  warn ".next directory not found — first deploy or clean state"
else
  ok "Current .next build exists"
fi

if ! command -v pnpm > /dev/null 2>&1; then
  err "pnpm is not installed"
  exit 1
fi
ok "pnpm is available"

# ── Step 2: Backup current build ───────────────────────────────────────────

step 2 "Backup current build"

if [[ -d "$NEXT_DIR" ]]; then
  BACKUP_PATH="${BACKUP_DIR}/next-$(date '+%Y%m%d-%H%M%S')"
  mkdir -p "$BACKUP_DIR"

  if [[ "$DRY_RUN" == true ]]; then
    log "[DRY RUN] Would backup $NEXT_DIR -> $BACKUP_PATH"
  else
    cp -a "$NEXT_DIR" "$BACKUP_PATH"
    BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
    ok "Backup created: $BACKUP_PATH ($BACKUP_SIZE)"
  fi
else
  warn "No existing build to backup — skipping"
fi

# ── Step 3: Build ──────────────────────────────────────────────────────────

step 3 "Build"

if [[ "$SKIP_BUILD" == true ]]; then
  warn "Build skipped (--skip-build flag)"
else
  log "Loading environment variables..."
  set -a
  # shellcheck source=/dev/null
  source "${APP_DIR}/.env"
  # shellcheck source=/dev/null
  source "${APP_DIR}/apps/web/.env.local"
  set +a
  ok "Environment loaded"

  log "Building web app (pnpm --filter web build)..."
  if [[ "$DRY_RUN" == true ]]; then
    log "[DRY RUN] Would run: pnpm --filter web build"
  else
    if ! pnpm --filter web build; then
      err "Build failed!"
      err "Restoring previous build from backup..."
      if [[ -n "$BACKUP_PATH" && -d "$BACKUP_PATH" ]]; then
        rm -rf "$NEXT_DIR"
        cp -a "$BACKUP_PATH" "$NEXT_DIR"
        ok "Previous build restored — service was not interrupted"
      fi
      exit 1
    fi
    ok "Build completed successfully"
  fi
fi

# ── Step 4: PM2 reload (zero-downtime) ────────────────────────────────────

step 4 "PM2 reload (zero-downtime)"

if [[ "$DRY_RUN" == true ]]; then
  log "[DRY RUN] Would run: pm2 reload $APP_NAME"
else
  log "Reloading PM2 workers (cluster mode — zero-downtime)..."
  pm2 reload "$APP_NAME"
  ok "PM2 reload initiated"

  # Give workers a moment to initialize
  log "Waiting 5s for workers to stabilize..."
  sleep 5
fi

# ── Step 5: Health check ───────────────────────────────────────────────────

step 5 "Health check"

if [[ "$DRY_RUN" == true ]]; then
  log "[DRY RUN] Would check: $HEALTH_URL"
  log "[DRY RUN] Retries: $HEALTH_RETRIES, Interval: ${HEALTH_INTERVAL}s"
else
  if ! health_check; then
    err "Health check failed — triggering rollback"
    rollback
    # rollback calls exit, but just in case:
    exit 1
  fi
fi

# ── Step 6: Post-deploy cleanup ───────────────────────────────────────────

step 6 "Post-deploy cleanup"

if [[ "$DRY_RUN" != true ]]; then
  cleanup_old_backups
fi
ok "Backup cleanup complete"

# ── Step 7: Success ────────────────────────────────────────────────────────

DEPLOY_END=$(date +%s)
DURATION=$((DEPLOY_END - DEPLOY_START))

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗"
echo -e "║            Deploy Successful!                     ║"
echo -e "╚══════════════════════════════════════════════════════╝${NC}"
echo ""
log "Duration:   ${DURATION}s"
log "Backup:     ${BACKUP_PATH:-'none'}"
log "Health:     $HEALTH_URL -> 200 OK"
log "PM2 status:"
pm2 list | grep "$APP_NAME" || true
echo ""
ok "Deploy complete. Have a great day!"
