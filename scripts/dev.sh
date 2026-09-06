#!/usr/bin/env bash
# Web3ToolBox dev server launcher
# Auto-configures Node 20 + IS_BUILD=false + correct paths.
#
# Usage:
#   ./scripts/dev.sh           — start backend (server + dbservice + toolService)
#   ./scripts/dev.sh stop      — stop all running services
#   ./scripts/dev.sh status    — show service status

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# ---- Node 20 setup ----
NODE_BIN="$HOME/.n/bin/node"
if [[ ! -x "$NODE_BIN" ]]; then
    echo "[dev] Node 20 not found at $NODE_BIN" >&2
    echo "[dev] Install: PATH=\$HOME/.npm-global/bin:\$PATH N_PREFIX=\$HOME/.n n install 20" >&2
    exit 1
fi

export PATH="$HOME/.n/bin:$PATH"

# ---- Verify Node version ----
NODE_VERSION="$(node --version)"
if [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
    echo "[dev] Wrong node version: $NODE_VERSION (expected v20.x)" >&2
    exit 1
fi

# ---- Required env vars ----
export IS_BUILD=false

# ---- Action dispatch ----
ACTION="${1:-start}"

case "$ACTION" in
    start)
        echo "[dev] Starting Web3ToolBox backend (Node $NODE_VERSION)..."
        echo "[dev] Server:      http://127.0.0.1:30001"
        echo "[dev] DB Service:  http://127.0.0.1:30002"
        echo "[dev] Tool Service: http://127.0.0.1:30004"
        echo "[dev] Press Ctrl+C to stop."
        echo ""
        exec node server/server.js
        ;;
    stop)
        echo "[dev] Stopping services..."
        for port in 30001 30002 30004; do
            pid=$(ss -tlnp 2>/dev/null | grep ":$port " | grep -oP 'pid=\K[0-9]+' | head -1 || true)
            if [[ -n "$pid" ]]; then
                echo "[dev]   Killing PID $pid on port $port"
                kill -9 "$pid" 2>/dev/null || true
            fi
        done
        echo "[dev] Done."
        ;;
    status)
        echo "[dev] Service status:"
        for port in 30001 30002 30004; do
            if ss -tln 2>/dev/null | grep -q ":$port "; then
                echo "  ✅ port $port — listening"
            else
                echo "  ❌ port $port — not running"
            fi
        done
        # Health checks
        echo ""
        echo "[dev] Health checks:"
        for url in \
            "http://127.0.0.1:30001/api/getAllWallets:server" \
            "http://127.0.0.1:30002/health:dbservice" \
            "http://127.0.0.1:30004/health:toolService"; do
            u="${url%:*}"
            name="${url##*:}"
            code=$(curl -s -o /dev/null -w "%{http_code}" "$u" --max-time 2 || echo "000")
            if [[ "$code" == "200" ]]; then
                echo "  ✅ $name ($u) — HTTP $code"
            else
                echo "  ❌ $name ($u) — HTTP $code"
            fi
        done
        ;;
    *)
        echo "Usage: $0 [start|stop|status]" >&2
        exit 2
        ;;
esac
