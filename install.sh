#!/bin/bash
# ─────────────────────────────────────────────────────────────
# claude-evolve installer
# Run: curl -fsSL https://raw.githubusercontent.com/yourusername/claude-evolve/main/install.sh | bash
# ─────────────────────────────────────────────────────────────

set -e

PLUGIN_DIR="$HOME/.claude/plugins/marketplaces/claude-evolve"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "  🧠 claude-evolve installer"
echo "  Your CLAUDE.md learns from every correction."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js not found. Install Node.js 18+ first.${NC}"
  exit 1
fi

NODE_VERSION=$(node -e "console.log(process.versions.node.split('.')[0])")
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}Error: Node.js 18+ required. Found: $(node --version)${NC}"
  exit 1
fi

# Check ANTHROPIC_API_KEY
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo -e "${YELLOW}Warning: ANTHROPIC_API_KEY not set.${NC}"
  echo "Add it to your shell profile:"
  echo "  export ANTHROPIC_API_KEY=sk-ant-..."
  echo ""
fi

# Check for existing Claude Code plugin system
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
if [ ! -f "$CLAUDE_SETTINGS" ]; then
  echo -e "${YELLOW}Warning: Claude Code settings not found at $CLAUDE_SETTINGS${NC}"
  echo "Make sure Claude Code is installed first."
  echo ""
fi

# Clone or update
echo "Installing claude-evolve..."
if [ -d "$PLUGIN_DIR" ]; then
  echo "Updating existing installation..."
  cd "$PLUGIN_DIR"
  git pull --quiet 2>/dev/null || echo "Not a git repo — skipping pull"
else
  mkdir -p "$(dirname "$PLUGIN_DIR")"
  if command -v git &> /dev/null; then
    git clone --quiet https://github.com/yourusername/claude-evolve "$PLUGIN_DIR"
  else
    echo -e "${RED}Error: git not found.${NC}"
    exit 1
  fi
fi

# Install dependencies
cd "$PLUGIN_DIR"
echo "Installing dependencies..."
npm install --silent --production

# Make scripts executable
chmod +x scripts/*.js

# Create .env if needed
if [ ! -f "$PLUGIN_DIR/.env" ] && [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" > "$PLUGIN_DIR/.env"
fi

# Create store directory
mkdir -p "$HOME/.claude-evolve"

echo ""
echo -e "${GREEN}✓ claude-evolve installed${NC}"
echo ""
echo "Next steps:"
echo "  1. Restart Claude Code"
echo "  2. Run: /plugin install claude-evolve"
echo "  3. Make a correction — watch CLAUDE.md learn"
echo ""
echo "That's it. Your CLAUDE.md now learns automatically."
echo ""
