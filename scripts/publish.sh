#!/usr/bin/env bash
set -euo pipefail

# Build and publish local copy to docs/dist for GitHub Pages
npm run build
mkdir -p docs/dist
if [ -f dist/mua.user.js ]; then
  cp dist/mua.user.js docs/dist/mua.user.js
else
  BUNDLE=$(ls dist/*.js 2>/dev/null | head -n1 || true)
  if [ -z "$BUNDLE" ]; then
    echo "No JS bundle found in dist/." >&2
    exit 1
  fi
  VERSION=$(node -p "require('./package.json').version")
  cat > dist/mua.user.js <<EOF
// ==UserScript==
// @name        MUA - Web Unicode Converter
// @namespace   https://github.com/$(git rev-parse --show-toplevel | xargs basename)
// @version     ${VERSION}
// @description Web Unicode converter userscript
// @match       *://*/*
// @grant       none
// ==/UserScript==
EOF
  cat "$BUNDLE" >> dist/mua.user.js
  cp dist/mua.user.js docs/dist/mua.user.js
fi

echo "Copied dist/mua.user.js -> docs/dist/mua.user.js"
