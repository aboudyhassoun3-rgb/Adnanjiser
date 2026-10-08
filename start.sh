#!/usr/bin/env bash
# AJ Class A — start script (controller runs this in tmux app-server, foreground).
# Builds the static preview into PROJECT_DIR/dist, publishes deployment-output.json,
# then serves dist/ in the foreground on PORT (default 3000).
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"
PORT="${PORT:-3000}"
export PORT
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"

/usr/bin/time -p bash scripts/build-preview.sh
/usr/bin/time -p mkdir -p "$WEB_DIR"
/usr/bin/time -p node -e "require('fs').writeFileSync(process.argv[1], JSON.stringify({project: process.argv[2], directory: process.argv[2] + '/dist'}))" "$WEB_DIR/deployment-output.json" "$PROJECT_DIR"
/usr/bin/time -p cat "$WEB_DIR/deployment-output.json"
echo "Starting static server for $PROJECT_DIR/dist on port $PORT"
exec node scripts/serve-static.mjs "$PROJECT_DIR/dist"
