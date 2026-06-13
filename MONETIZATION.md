# AgentStorefront MCP — Monetization Pack (2026-06-05)

**Status:** HTTP entry built + smoke-tested 4/4 green (`npm run test:http`). Stdio/free npm package untouched — free tier stays as discovery funnel.

## Strategy (from NEW_PROJECTS_HUNT research)
- Free stdio package on npm + free directories (mcp.so, Smithery, PulseMCP) = discovery.
- Paid HTTP endpoint on metered platforms = revenue. Buyer is agents/devs — faceless, no audience needed.
- Pricing: **$0.03/call** (general-utility band is $0.03-0.08; we start at the floor, raise after traction).

## Architecture
```
free:  npx @lfidele/agentstorefront-mcp        (stdio, src/index.js, unchanged)
paid:  https://mcp.agentstorefront.app/mcp     (src/http.js, Streamable HTTP)
        └── 402s unless x-agenticmarket-secret matches env (marketplace proxy only)
        └── GET /healthz for monitors + EOS BIT
```
Deploy target: existing DigitalOcean droplet + Cloudflare tunnel (pattern in DROPLET_DEPLOY_CF_TUNNEL_2026-06-05.md). Add systemd unit `agentstorefront-mcp-http` with `PORT=8787`, `AGENTICMARKET_SECRET=<from dashboard>`.

## Platform submissions (in order)

### 1. AgenticMarket (per-call, 90% rev share if in first 100 creators)
- URL: agenticmarket.dev/dashboard/submit
- Needs: public HTTPS endpoint, valid `initialize` + `tools/list` (✅ smoke), <10s responses (✅), per-call price ($0.03), description (below)
- After submit: receive `proxy_secret` → set as `AGENTICMARKET_SECRET` on droplet → 24h review
- **Fidele 2%:** account signup + payout details (Wise) — ~5 min

### 2. MCP Marketplace (85/15, Stripe Connect, license keys)
- Submit server listing; price as **$5/mo subscription** tier (different buyer: humans installing, not agents metering)
- **Fidele 2%:** Stripe Connect onboarding — ~5 min, evening window

### 3. Free directories (keep/refresh — funnel)
- mcp.so, Smithery, PulseMCP: ensure listing README links to (a) paid hosted endpoint (b) Gumroad "Ship Your First MCP" kit (P3) — the Krisying lead-gen pattern.

## Listing copy (paste anywhere)

**Name:** AgentStorefront — agent services discovery
**Tagline:** Let your agent discover, price, and quote 3rd-party agent services without leaving the conversation.
**Description:**
AgentStorefront MCP gives any MCP client (Claude, Cursor, Windsurf...) four tools over the AgentStorefront catalog: `list_services`, `search_services` (semantic), `get_service` (schema/pricing/SLA), and `request_quote` (volume pricing). Use it to let agents shop for capabilities — data feeds, communication, finance tools — and get real per-call quotes programmatically. Free stdio version on npm; this hosted endpoint adds zero-setup access, uptime monitoring, and metered billing.
**Price:** $0.03/call (AgenticMarket) · $5/mo (MCP Marketplace)
**Categories:** marketplace, discovery, agents, commerce

## Fidele 2% checklist (total ~15 min, evening)
1. [ ] AgenticMarket signup + submit (paste listing copy above, price $0.03) → get proxy_secret
2. [ ] Paste proxy_secret into droplet env (Claude provides exact ssh command when ready)
3. [ ] MCP Marketplace: Stripe Connect onboarding
4. [ ] Approve droplet deploy (Claude runs it via session, you watch)

## Claude 98% (next session after Fidele's 15 min)
- Deploy http.js to droplet + systemd + CF tunnel route `mcp.agentstorefront.app`
- Prod smoke against live URL (NON-NEG Day 17 rule)
- Add /healthz to EOS BIT ping list
- Refresh free-directory listings with funnel links
- Wire weekly call-volume report into stripe-revenue-tracker digest
