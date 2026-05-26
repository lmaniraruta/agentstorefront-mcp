# Anthropic MCP Registry Submission — AgentStorefront

**Submission target:** Anthropic MCP registry (modelcontextprotocol.io / registry)
**Date queued:** 2026-05-24 (Day 16)
**Ship-by:** Tue 2026-05-26
**Window:** 30-60 days first-mover advantage per market research

---

## Listing fields

**Name:** AgentStorefront — Discover agent services from inside Claude

**Slug:** `agentstorefront`

**Category:** Commerce / Agent Tooling / Marketplaces

**Tagline (80 chars max):** Let your agents discover, price, and subscribe to paid services autonomously.

**Short description (250 chars max):**
The AgentStorefront MCP turns the AgentStorefront marketplace into native vocabulary for any MCP-aware client. Search 100+ paid agent services (data, enrichment, prediction, OCR, etc.), get quotes, and subscribe — all from inside Claude or Cursor.

**Long description:**

AgentStorefront is a marketplace where developers list paid agent services — APIs explicitly designed to be called by AI agents. Flight delay prediction. Invoice OCR. Niche enrichment. Etc.

This MCP server makes those services discoverable from inside any MCP-aware client (Claude Desktop, Cursor, etc.). The result: your agent can find an API, price it, and subscribe — without you ever leaving the chat.

**4 tools:**

- `list_services` — list available services with names, prices, descriptions
- `search_services` — semantic search ("find me a flight-delay API")
- `get_service` — full schema + pricing + SLA for a service
- `request_quote` — expected monthly cost at your estimated call volume

**Why it matters:**
Marketplaces only work if their supply is discoverable. By embedding AgentStorefront in the MCP layer, we make every Claude/Cursor user a potential buyer of every listed service — instantly. Sellers benefit (more eyeballs), buyers benefit (no context-switching).

---

## Install command

```bash
npx -y @lmaniraruta/agentstorefront-mcp
```

## Config snippet (Claude Desktop)

```json
{
  "mcpServers": {
    "agentstorefront": {
      "command": "npx",
      "args": ["-y", "@lmaniraruta/agentstorefront-mcp"]
    }
  }
}
```

---

## Links

- **npm:** https://www.npmjs.com/package/@lmaniraruta/agentstorefront-mcp
- **GitHub:** https://github.com/lmaniraruta/agentstorefront-mcp
- **Homepage:** https://agentstorefront.app
- **Maintainer:** Fidele Maniraruta — lmaniraruta@gmail.com
- **Twitter:** @lmaniraruta

---

## Screenshot / demo asset

For registry submission, capture a 30-sec GIF of:
1. Claude Desktop with MCP config saved
2. Asking: "Find me a flight-delay prediction service under $0.05 per call"
3. Claude calling `search_services` and returning 3 results
4. Following up with `get_service` on the top result

Use `mcp__claude-in-chrome__gif_creator` once the npm package is live + installable.

---

## Submission steps (Fidele's 2% = ~5 min)

1. **npm publish** — Claude runs `npm publish` from `mcp-server/` after Fidele 2FA's into npm
2. **Push to GitHub** — Claude commits + pushes; Fidele approves the push if 2FA prompts
3. **Anthropic registry submission** — Fidele opens registry submission URL, signs in via GitHub OAuth, pastes fields from this file, attaches GIF, clicks Submit
4. **claudemarketplaces.com** — Same fields, separate submission (broader directory)
5. **Verify** — Claude verifies listing is live by querying registry within 24 hr

---

## Status tracking

- [ ] npm package published as `@lmaniraruta/agentstorefront-mcp` v0.1.0
- [ ] GitHub repo `lmaniraruta/agentstorefront-mcp` public + README rendered
- [ ] Anthropic registry submission filed
- [ ] claudemarketplaces.com submission filed
- [ ] Demo GIF captured + attached
- [ ] X thread announcing the listing (drives audience compounding)
- [ ] LinkedIn long-form announcing the listing
- [ ] HN Show post linking the registry entry
- [ ] First inbound install confirmed via npm download stats
- [ ] First inbound dev DM ("how do I list my service?") logged
- [ ] First $ routed through `request_quote` → subscription completion
