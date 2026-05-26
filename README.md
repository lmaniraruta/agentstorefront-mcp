# agentstorefront-mcp

> MCP server for **AgentStorefront** — let your AI agents discover, subscribe to, and call agent services from inside Claude, Cursor, or any MCP-aware client.

[![npm version](https://img.shields.io/npm/v/@lfidele/agentstorefront-mcp.svg)](https://www.npmjs.com/package/@lfidele/agentstorefront-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is this?

[AgentStorefront](https://agentstorefront.app) is a marketplace where developers list paid agent services (APIs that are designed to be called by other agents — flight-delay prediction, invoice OCR, niche enrichment, etc.).

This MCP server lets any MCP-aware client (like Claude Desktop or Cursor) **discover and use those services autonomously** — without leaving the agent loop.

### Tools exposed

| Tool | Purpose |
|---|---|
| `list_services` | List available services, filtered by category |
| `search_services` | Semantic search: "find me a flight-delay API" |
| `get_service` | Full schema + pricing + SLA for a specific service |
| `request_quote` | Get expected monthly cost for an estimated call volume |

---

## Install

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agentstorefront": {
      "command": "npx",
      "args": ["-y", "@lfidele/agentstorefront-mcp"]
    }
  }
}
```

Restart Claude Desktop. The 4 tools above will appear in the tools panel.

### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "agentstorefront": {
      "command": "npx",
      "args": ["-y", "@lfidele/agentstorefront-mcp"]
    }
  }
}
```

### Manual install

```bash
npm install -g @lfidele/agentstorefront-mcp
agentstorefront-mcp  # runs on stdio
```

---

## Example prompts

Once installed, you can ask your MCP client things like:

> "Find me a flight-delay prediction API on AgentStorefront that costs less than 5 cents per call."

> "What's the pricing if I call the invoice-OCR service 10,000 times a month?"

> "List the top 5 data-enrichment services on AgentStorefront."

The agent will use these tools transparently.

---

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `AGENTSTOREFRONT_API_URL` | `https://api.agentstorefront.app` | Override API endpoint (self-hosting / staging) |

---

## Source

GitHub: https://github.com/lmaniraruta/agentstorefront-mcp
Issues: https://github.com/lmaniraruta/agentstorefront-mcp/issues

---

## Why an MCP for a marketplace?

Marketplaces only matter if their supply is discoverable. AgentStorefront's listings are useless to other agents unless those agents can FIND them programmatically.

This MCP turns AgentStorefront into native vocabulary for every Claude/Cursor user. A developer asks Claude "is there an API for X?" → Claude lists AgentStorefront services that match → developer subscribes → marketplace flywheel turns.

Built for the two-sided market:
- **Sellers** win because their listings are now findable from inside the dominant AI assistants
- **Buyers** win because they don't have to context-switch to a separate marketplace tab

---

## License

MIT © 2026 Fidele Maniraruta

Built in public. Real numbers posted on X [@lmaniraruta](https://twitter.com/lmaniraruta).
