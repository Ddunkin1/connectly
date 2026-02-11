#!/bin/bash
# Install Navicat Premium Lite for Linux (Connectly project)
# Supports: Flatpak (preferred on Fedora) or AppImage download

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NAVICAT_DIR="$SCRIPT_DIR/navicat"
ARCH=$(uname -m)

echo "=== Navicat Premium Lite Installer for Connectly ==="
echo ""

# Option 1: Flatpak (preferred on Fedora)
install_via_flatpak() {
    if command -v flatpak &>/dev/null; then
        echo "Installing via Flatpak..."
        flatpak install -y https://dn.navicat.com/flatpak/flatpakref/navicat17/com.navicat.premiumlite.en.flatpakref
        echo ""
        echo "Done! Run: ./tools/run-navicat.sh"
        return 0
    fi
    return 1
}

# Option 2: AppImage (manual download - Navicat's URL returns HTML, not binary)
install_via_appimage() {
    mkdir -p "$NAVICAT_DIR"
    cd "$NAVICAT_DIR"

    if [ "$ARCH" = "x86_64" ]; then
        FILE="navicat17-premium-lite-en-x86_64.AppImage"
        URL="https://www.navicat.com/en/download/navicat-premium-lite"
    elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        FILE="navicat17-premium-lite-en-aarch64.AppImage"
        URL="https://www.navicat.com/en/download/navicat-premium-lite"
    else
        echo "Unsupported architecture: $ARCH"
        return 1
    fi

    # Check if already downloaded
    for f in navicat*-premium*lite*.AppImage; do
        [ -f "$f" ] && [ -x "$f" ] || continue
        echo "Navicat AppImage found: $NAVICAT_DIR/$f"
        echo "Run: ./tools/run-navicat.sh"
        return 0
    done

    echo "Navicat requires manual download (their server uses JavaScript redirects)."
    echo ""
    echo "1. Open in browser: $URL"
    echo "2. Under Linux -> AppImage ($ARCH), click 'Direct Download'"
    echo "3. Save the .AppImage to: $NAVICAT_DIR/"
    echo "4. Run: chmod +x $NAVICAT_DIR/*.AppImage"
    echo "5. Run: ./tools/run-navicat.sh"
    echo ""
    if command -v xdg-open &>/dev/null; then
        echo "Opening download page..."
        xdg-open "$URL" 2>/dev/null || true
    fi
    return 1
}

# Try Flatpak first
if install_via_flatpak; then
    exit 0
fi

# Fallback to AppImage
echo "Flatpak not available or failed. Trying AppImage..."
if install_via_appimage; then
    exit 0
fi

echo "Installation failed. See NAVICAT_LINUX_GUIDE.md for manual steps."
exit 1
