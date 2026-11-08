#!/bin/bash
# Copies the newest service account JSON from Downloads into Vercel without printing the key.
set -euo pipefail
cd "$(dirname "$0")/.."
FILE=$(ls -t "$HOME"/Downloads/coastal-height-*.json 2>/dev/null | head -1 || true)
if [ -z "$FILE" ]; then echo "Няма JSON файл на сметката в Downloads."; exit 1; fi
field() { python3 -c "import json,sys;sys.stdout.write(json.load(open(sys.argv[1]))[sys.argv[2]])" "$FILE" "$1"; }
field client_email | vercel env add GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL production --force >/dev/null 2>&1
field private_key | vercel env add GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY production --force >/dev/null 2>&1
echo "Готово: $(field client_email)"
