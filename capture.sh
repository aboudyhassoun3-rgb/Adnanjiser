#!/usr/bin/env bash
# AJ Class A — capture script.
# Opens CAPTURE_URL in a browser and saves desktop + mobile screenshots
# as final-desktop.png / final-mobile.png into CAPTURE_DIR.
# Exit 75: temporary navigation/browser infrastructure failure.
# Exit 1: script or rendering defect. Leaves the app server running.
set -euo pipefail
cd "$(dirname "$0")"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact URL to capture.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the screenshot output directory.}"
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
status=$?
/usr/bin/time -p ls -la "$CAPTURE_DIR"
exit "$status"
