#!/bin/bash
# Launch Navicat and connect to Connectly (Laravel Sail) MySQL
# See NAVICAT_LINUX_GUIDE.md for full setup instructions.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Connectly + Navicat ==="
echo ""
echo "MySQL connection for Navicat (from your .env):"
echo "  Host:     127.0.0.1"
echo "  Port:     3306"
echo "  Database: connectly_app"
echo "  Username: sail"
echo "  Password: password"
echo ""
echo "Make sure Sail is running: ./vendor/bin/sail up -d"
echo ""

# Try Flatpak first
if flatpak list 2>/dev/null | grep -q "com.navicat.premiumlite"; then
    echo "Launching Navicat Premium Lite (Flatpak)..."
    exec flatpak run com.navicat.premiumlite.en
fi

# Try AppImage in tools/navicat
APPIMAGE=$(ls "$SCRIPT_DIR/navicat/"*Premium*Lite*.AppImage 2>/dev/null | head -1)
if [ -n "$APPIMAGE" ] && [ -x "$APPIMAGE" ]; then
    echo "Launching Navicat Premium Lite (AppImage)..."
    exec "$APPIMAGE"
fi

# Not found
echo "ERROR: Navicat not found."
echo ""
echo "Install via one of these methods:"
echo "  1. Flatpak: flatpak install https://dn.navicat.com/flatpak/flatpakref/navicat17/com.navicat.premiumlite.en.flatpakref"
echo "  2. AppImage: Run ./tools/install-navicat.sh to download"
echo ""
echo "See NAVICAT_LINUX_GUIDE.md for details."
exit 1
