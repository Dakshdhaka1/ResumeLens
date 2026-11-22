#!/usr/bin/env bash
# Starts backend (8000) + frontend (3000). Usage: ./scripts/dev.sh [--mock]
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
[ "$1" = "--mock" ] && export RESUMELENS_MOCK=1
PY="$ROOT/backend/.venv/bin/python"; [ -f "$PY" ] || PY="$ROOT/backend/.venv/Scripts/python"
(cd "$ROOT/backend" && "$PY" -m uvicorn app.main:app --port 8000 --reload) &
BACK=$!
trap 'kill $BACK 2>/dev/null' EXIT
cd "$ROOT/frontend" && npm run dev
