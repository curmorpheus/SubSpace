# Playwright MCP Quick Start

## Installation Command

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

## Verify Installation

```bash
# List all MCP servers
claude mcp list

# Check Playwright browsers are installed
npx playwright install --dry-run
```

## Install Browsers (if needed)

```bash
npm run playwright:install
# or
npx playwright install
```

## Using with Claude Code

Once installed, you can ask Claude to interact with browsers:

```
"Navigate to http://localhost:3000 and test the login form"
"Check the accessibility of the dashboard page"
"Fill out the contact form with test data"
```

## Project-Specific Scripts

```bash
# Run MCP server with project config (headed mode)
npm run mcp:playwright

# Run MCP server in headless mode
npm run mcp:playwright:headless
```

## Configuration

The project includes a `playwright-mcp-config.json` with optimized settings:
- Browser: Chromium
- Viewport: 1280x720
- Base URL: http://localhost:3000
- Slow motion: 100ms (for better visibility)

## Common Use Cases

### 1. Test a Feature
Ask Claude: "Can you test the sign-up flow on localhost:3000?"

### 2. Debug UI Issues
Ask Claude: "Navigate to /dashboard and check if all buttons are clickable"

### 3. Verify Accessibility
Ask Claude: "Check the accessibility tree for the home page"

### 4. Cross-Browser Testing
Ask Claude: "Test this form in Firefox and Chrome"

### 5. Interactive Exploration
Ask Claude: "Show me what's on the /forms page and click through the workflow"

## Troubleshooting

### MCP Server Not Found
```bash
claude mcp remove playwright
claude mcp add playwright npx @playwright/mcp@latest
```

### Browsers Not Installed
```bash
npm run playwright:install
```

### Port 3000 Already in Use
Make sure your Next.js dev server is running:
```bash
npm run dev
```

## Documentation

Full documentation: `/Users/curt.mills/Documents/GitHub/SubSpace/MCP_SETUP.md`
