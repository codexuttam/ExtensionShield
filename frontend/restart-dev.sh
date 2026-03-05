#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "Clearing Vite cache..."
rm -rf node_modules/.vite .vite dist 2>/dev/null
echo "Starting dev server..."
npm run dev

