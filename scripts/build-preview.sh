#!/usr/bin/env bash
# AJ Class A — build the static preview output into PROJECT_DIR/dist.
# Source lives in PROJECT_DIR/site; output stays inside PROJECT_DIR.
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"
/usr/bin/time -p mkdir -p dist
if [[ -f package.json ]]; then
  if [[ -f package-lock.json ]]; then
    /usr/bin/time -p npm ci --no-audit --no-fund
  else
    /usr/bin/time -p npm install --no-audit --no-fund
  fi
  if node -e "const p=require('./package.json');process.exit(p.scripts&&p.scripts.build?0:1)"; then
    /usr/bin/time -p npm run build
  fi
fi
# Rebuild dist from site/ when the source is newer (or dist is missing index.html).
if [[ ! -f dist/index.html || site/index.html -nt dist/index.html ]]; then
  /usr/bin/time -p cp -r site/. dist/
fi
/usr/bin/time -p test -f dist/index.html
echo "Preview output ready: $PROJECT_DIR/dist"
