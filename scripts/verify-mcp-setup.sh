#!/bin/bash

# Playwright MCP Setup Verification Script
# This script checks if all required components are installed

echo "🔍 Verifying Playwright MCP Setup..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if npx is available
if command -v npx &> /dev/null; then
    echo -e "${GREEN}✓${NC} npx is installed"
else
    echo -e "${RED}✗${NC} npx is not installed"
    echo "  Please install Node.js and npm"
    exit 1
fi

# Check if Playwright is in package.json
if grep -q "@playwright/test" package.json; then
    echo -e "${GREEN}✓${NC} @playwright/test is in package.json"
else
    echo -e "${RED}✗${NC} @playwright/test not found in package.json"
    exit 1
fi

# Check if playwright browsers are installed
echo ""
echo "Checking Playwright browsers..."
if npx playwright install --dry-run 2>&1 | grep -q "is already installed"; then
    echo -e "${GREEN}✓${NC} Playwright browsers are installed"
elif npx playwright install --dry-run 2>&1 | grep -q "will be installed"; then
    echo -e "${YELLOW}⚠${NC} Playwright browsers need to be installed"
    echo "  Run: npm run playwright:install"
else
    echo -e "${YELLOW}⚠${NC} Unable to verify browser installation status"
fi

# Check if configuration files exist
echo ""
echo "Checking configuration files..."

if [ -f "playwright-mcp-config.json" ]; then
    echo -e "${GREEN}✓${NC} playwright-mcp-config.json exists"
else
    echo -e "${RED}✗${NC} playwright-mcp-config.json not found"
fi

if [ -f "playwright.config.ts" ]; then
    echo -e "${GREEN}✓${NC} playwright.config.ts exists"
else
    echo -e "${RED}✗${NC} playwright.config.ts not found"
fi

if [ -f "MCP_SETUP.md" ]; then
    echo -e "${GREEN}✓${NC} MCP_SETUP.md documentation exists"
else
    echo -e "${RED}✗${NC} MCP_SETUP.md not found"
fi

# Check if MCP scripts are in package.json
echo ""
echo "Checking npm scripts..."

if grep -q "mcp:playwright" package.json; then
    echo -e "${GREEN}✓${NC} MCP scripts are configured in package.json"
else
    echo -e "${RED}✗${NC} MCP scripts not found in package.json"
fi

# Test if @playwright/mcp is accessible
echo ""
echo "Testing @playwright/mcp availability..."
if npx @playwright/mcp@latest --help &> /dev/null; then
    echo -e "${GREEN}✓${NC} @playwright/mcp is accessible via npx"
else
    echo -e "${YELLOW}⚠${NC} Unable to run @playwright/mcp (this may be normal if MCP isn't configured)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo ""
echo "1. Install Playwright browsers (if needed):"
echo "   npm run playwright:install"
echo ""
echo "2. Install Playwright MCP server in Claude Code:"
echo "   claude mcp add playwright npx @playwright/mcp@latest"
echo ""
echo "3. Verify MCP server is configured:"
echo "   claude mcp list"
echo ""
echo "4. Start using it with Claude!"
echo "   Ask Claude: 'Navigate to http://localhost:3000'"
echo ""
echo "📚 Documentation: ./MCP_SETUP.md"
echo "🚀 Quick Start: ./docs/MCP_QUICK_START.md"
echo ""
