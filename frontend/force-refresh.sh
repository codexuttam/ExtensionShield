#!/bin/bash
echo "🔄 Force refreshing ExtensionShield frontend..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Kill any running dev servers
echo "Stopping any running dev servers..."
pkill -f "vite" 2>/dev/null
sleep 2

# Clear all caches
echo "Clearing caches..."
rm -rf node_modules/.vite .vite dist .cache 2>/dev/null

# Clear browser cache hint
echo ""
echo "✅ Cache cleared!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm run dev"
echo "2. Open browser to http://localhost:5173"
echo "3. Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows) to hard refresh"
echo "4. Or open DevTools (F12) → Right-click refresh → 'Empty Cache and Hard Reload'"
echo ""

