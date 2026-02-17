#!/usr/bin/env bash
set -euo pipefail

DOMAIN=""
BRAND=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="${2:-}"; shift 2 ;;
    --brand) BRAND="${2:-}"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$DOMAIN" || -z "$BRAND" ]]; then
  echo "Usage: bash scripts/bootstrap-template.sh --domain <domain> --brand \"<Brand Name>\""
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Replace canonical host references. Use rg when available, fallback to find+grep.
if command -v rg >/dev/null 2>&1; then
  FILES=$(rg -l "myugc\\.studio|My UGC Studio|MYUGC Studio" . \
    -g "*.html" -g "*.xml" -g "*.txt" -g "*.js" -g "*.json" 2>/dev/null || true)
else
  FILES=$(find . -type f \( -name "*.html" -o -name "*.xml" -o -name "*.txt" -o -name "*.js" -o -name "*.json" \) \
    -print0 | xargs -0 grep -lE "myugc\\.studio|My UGC Studio|MYUGC Studio" 2>/dev/null || true)
fi

if [[ -n "${FILES:-}" ]]; then
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    sed -i "s/myugc\\.studio/$DOMAIN/g" "$f"
    sed -i "s/My UGC Studio/$BRAND/g" "$f"
    sed -i "s/MYUGC Studio/$BRAND/g" "$f"
  done <<< "$FILES"
fi

# Reset robots/sitemap lastmod dates to today.
TODAY="$(date +%F)"
if [[ -f sitemap.xml ]]; then
  sed -i "s#<lastmod>[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}</lastmod>#<lastmod>${TODAY}</lastmod>#g" sitemap.xml || true
fi

echo "Bootstrap done for domain=$DOMAIN brand=$BRAND"
