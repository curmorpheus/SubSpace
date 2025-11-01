# Playwright MCP Server Setup Guide

## What is Playwright MCP Server?

The Playwright MCP (Model Context Protocol) server is a tool that enables AI assistants like Claude to interact with web browsers programmatically using Playwright. It provides browser automation capabilities through structured accessibility data rather than screenshots, making it fast, reliable, and LLM-friendly.

### Key Features

- **Performance**: Uses Playwright's accessibility tree, not pixel-based input
- **LLM-Friendly**: No vision models needed, operates purely on structured data
- **Reliability**: Avoids ambiguity common with screenshot-based approaches
- **Multi-Browser Support**: Works with Chromium, Firefox, WebKit, and MS Edge

## Installation

The Playwright MCP server is **NOT** installed as a project dependency. Instead, it's configured at the Claude Code CLI level or other MCP-compatible tools.

### Prerequisites

1. **Playwright Test is already installed** in this project:
   ```json
   "@playwright/test": "^1.56.1"
   ```

2. **Playwright browsers must be installed**. Run:
   ```bash
   npx playwright install
   ```

### Installing Playwright MCP Server

The MCP server is installed and configured through Claude Code CLI:

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

This command:
- Registers the Playwright MCP server with Claude Code
- Uses `npx` to run the latest version without global installation
- Makes browser automation tools available to Claude during conversations

### Alternative Installation (Manual Configuration)

If you're using other MCP-compatible tools (VS Code, Cursor, etc.), add this to your MCP configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**For VS Code:**
```bash
code --add-mcp '{"name":"playwright","command":"npx","args":["@playwright/mcp@latest"]}'
```

**For Cursor:**
Go to Cursor Settings → MCP → Add new MCP Server, then use:
- Name: `playwright`
- Command type: `npx @playwright/mcp@latest`

## Configuration Options

The Playwright MCP server supports several command-line options:

### Basic Options

- `--browser <browser>`: Choose browser (chromium, firefox, webkit, msedge)
  ```bash
  npx @playwright/mcp@latest --browser firefox
  ```

- `--headless`: Run in headless mode (default is headed for better debugging)
  ```bash
  npx @playwright/mcp@latest --headless
  ```

- `--viewport-size <size>`: Set browser dimensions
  ```bash
  npx @playwright/mcp@latest --viewport-size "1920x1080"
  ```

### Advanced Options

- `--isolated`: Keep browser profile in memory only (no persistent data)
- `--user-data-dir <path>`: Specify persistent profile location
- `--port <number>`: Enable HTTP transport for server deployment
- `--config <path>`: Use JSON configuration file for advanced settings

### Example Advanced Configuration

Create a `playwright-mcp-config.json` file:

```json
{
  "browser": "chromium",
  "headless": false,
  "viewport": {
    "width": 1280,
    "height": 720
  },
  "userDataDir": "./playwright-data",
  "contextOptions": {
    "locale": "en-US",
    "timezoneId": "America/New_York"
  }
}
```

Then run:
```bash
npx @playwright/mcp@latest --config playwright-mcp-config.json
```

## How to Use

Once the Playwright MCP server is configured with Claude Code, you can ask Claude to:

### Example Use Cases

1. **Test Your Application**
   ```
   "Can you test the login flow on http://localhost:3000?"
   ```

2. **Debug UI Issues**
   ```
   "Navigate to http://localhost:3000/dashboard and check if the form is visible"
   ```

3. **Verify Accessibility**
   ```
   "Check the accessibility tree for the homepage"
   ```

4. **Automate Interactions**
   ```
   "Fill out the form on http://localhost:3000/contact with test data"
   ```

5. **Cross-Browser Testing**
   ```
   "Test the checkout flow in Firefox and Chrome"
   ```

## Verifying Installation

To verify the Playwright MCP server is working:

1. **Check MCP Server Status** (if using Claude Code CLI):
   ```bash
   claude mcp list
   ```
   You should see `playwright` in the list.

2. **Test Browser Installation**:
   ```bash
   npx playwright install --dry-run
   ```

3. **Run a Simple Test** in Claude Code:
   Ask Claude: "Can you navigate to https://playwright.dev and tell me what's on the page?"

## Integration with This Project

This SubSpace project already has Playwright configured for end-to-end testing:

- **Test Directory**: `/Users/curt.mills/Documents/GitHub/SubSpace/tests/e2e`
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit

### Available npm Scripts

```bash
# Run E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug
```

The Playwright MCP server can work alongside these existing tests, providing an interactive way to explore and test your application through Claude conversations.

## Troubleshooting

### Browser Binaries Not Found

If you get errors about missing browsers:
```bash
npx playwright install
```

### Permission Issues

If npx fails, ensure you have proper permissions and Node.js is installed:
```bash
node --version
npm --version
```

### MCP Server Not Responding

1. Check that the server is running:
   ```bash
   claude mcp list
   ```

2. Restart Claude Code CLI

3. Try removing and re-adding the server:
   ```bash
   claude mcp remove playwright
   claude mcp add playwright npx @playwright/mcp@latest
   ```

## Additional Resources

- [Playwright MCP GitHub Repository](https://github.com/microsoft/playwright-mcp)
- [Playwright Documentation](https://playwright.dev)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [Claude Code CLI Documentation](https://claude.ai/claude-code)

## Notes

- The MCP server runs separately from your project's Playwright tests
- It provides an interactive interface for Claude to control browsers
- It's designed for exploration and debugging, complementing your existing test suite
- The server runs ephemerally and doesn't persist browser state by default (use `--user-data-dir` for persistence)
