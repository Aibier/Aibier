#!/usr/bin/env bash
# One-time setup for the PDF builder.
# Run: bash scripts/install.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# ── Node.js check ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is required (https://nodejs.org)"
  echo "  macOS:  brew install node"
  echo "  Linux:  https://nodejs.org/en/download/package-manager"
  exit 1
fi

NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo "Error: Node.js 18+ required. Current: $(node -v)"
  exit 1
fi

echo "Node.js $(node -v)  ✓"

# ── npm install ──────────────────────────────────────────────────────────────
echo "Installing dependencies..."
npm install
echo ""
echo "✓ Setup complete. Quick start:"
echo "   make resume              # build resume.pdf"
echo "   make pdf SRC=myfile.md   # build any markdown file"
echo "   make help                # show all targets"
