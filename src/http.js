#!/usr/bin/env node
/**
 * AgentStorefront MCP server — HTTP entry (paid/metered tier).
 *
 * Same 4 tools as the stdio entry, exposed over Streamable HTTP so the
 * server can be listed on paid MCP platforms (AgenticMarket, MCP Hive, etc.)
 * that proxy calls and meter per-invocation.
 *
 * Monetization gate:
 *   If AGENTICMARKET_SECRET is set, every request must carry header
 *   `x-agenticmarket-secret: <value>` — i.e. only the marketplace proxy
 *   (which bills the caller) can reach the tools. Unset = open (dev mode).
 *
 * Run:   AGENTICMARKET_SECRET=xxx PORT=8787 node src/http.js
 * Health: GET /healthz  -> {"ok":true}
 *
 * Deploy target: existing DigitalOcean droplet behind Cloudflare tunnel
 * (see ../MONETIZATION.md and DROPLET_DEPLOY_CF_TUNNEL_2026-06-05.md).
 */

import http from "node:http";
import crypto from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

const API_BASE = process.env.AGENTSTOREFRONT_API_URL || "https://api.agentstorefront.app";
const PORT = Number(process.env.PORT || 8787);
const SECRET = process.env.AGENTICMARKET_SECRET || "";
const VERSION = "0.2.0";

// ---- Tools (kept in sync with src/index.js) ----
const TOOLS = [
  {
    name: "list_services",
    description:
      "List AgentStorefront services that an agent can subscribe to and call. Returns names, prices, and short descriptions. Optionally filter by category.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Optional category filter (e.g., 'data', 'communication', 'finance')." },
        limit: { type: "number", description: "Max results (default 20, max 100).", default: 20 },
      },
    },
  },
  {
    name: "search_services",
    description:
      "Semantic search across AgentStorefront listings. Use a natural-language query like 'flight delay prediction' or 'invoice extraction'.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Natural-language search query." },
        max_price_cents: { type: "number", description: "Optional max per-call price in cents." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_service",
    description:
      "Get full details on a single AgentStorefront service: schema, pricing, rate limits, SLA, sample inputs/outputs.",
    inputSchema: {
      type: "object",
      properties: {
        service_id: { type: "string", description: "The service ID (UUID or slug)." },
      },
      required: ["service_id"],
    },
  },
  {
    name: "request_quote",
    description:
      "Request a quote for using a service at a specific call volume. Returns expected monthly cost, throughput, and subscription URL.",
    inputSchema: {
      type: "object",
      properties: {
        service_id: { type: "string" },
        expected_calls_per_month: { type: "number" },
        email: { type: "string", description: "Optional contact email for follow-up." },
      },
      required: ["service_id", "expected_calls_per_month"],
    },
  },
];

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `agentstorefront-mcp-http/${VERSION}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AgentStorefront API ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

const asText = (p) => ({
  content: [{ type: "text", text: typeof p === "string" ? p : JSON.stringify(p, null, 2) }],
});

const HANDLERS = {
  list_services: async ({ category, limit = 20 }) => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    q.set("limit", String(Math.min(limit, 100)));
    return asText(await fetchJson(`/services?${q}`));
  },
  search_services: async ({ query, max_price_cents }) => {
    const q = new URLSearchParams({ q: query });
    if (max_price_cents) q.set("max_price_cents", String(max_price_cents));
    return asText(await fetchJson(`/services/search?${q}`));
  },
  get_service: async ({ service_id }) =>
    asText(await fetchJson(`/services/${encodeURIComponent(service_id)}`)),
  request_quote: async ({ service_id, expected_calls_per_month, email }) =>
    asText(
      await fetchJson(`/services/${encodeURIComponent(service_id)}/quote`, {
        method: "POST",
        body: JSON.stringify({ expected_calls_per_month, email }),
      })
    ),
};

function buildServer() {
  const server = new Server(
    { name: "agentstorefront-mcp", version: VERSION },
    { capabilities: { tools: {} } }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    const fn = HANDLERS[name];
    if (!fn) return asText(`Unknown tool: ${name}`);
    try {
      // lightweight per-call metering log (stdout -> journald on droplet)
      console.log(JSON.stringify({ t: Date.now(), tool: name, metered: Boolean(SECRET) }));
      return await fn(args);
    } catch (err) {
      return asText(`Error calling ${name}: ${err.message}`);
    }
  });
  return server;
}

function timingSafeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

const httpServer = http.createServer(async (req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, version: VERSION, metered: Boolean(SECRET) }));
    return;
  }
  if (req.url !== "/mcp") {
    res.writeHead(404).end();
    return;
  }
  // Monetization gate: only the marketplace proxy may pass.
  if (SECRET) {
    const got = req.headers["x-agenticmarket-secret"];
    if (!got || !timingSafeEqual(got, SECRET)) {
      res.writeHead(402, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "payment_required",
          message:
            "This MCP server is metered. Call it via its marketplace listing (see https://agentstorefront.app/mcp) or use the free stdio package @lfidele/agentstorefront-mcp.",
        })
      );
      return;
    }
  }
  try {
    // Stateless mode: new transport+server per request (no session reuse).
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = buildServer();
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error("mcp request error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "internal_error" }));
    }
  }
});

httpServer.listen(PORT, () => {
  console.error(
    `agentstorefront-mcp-http v${VERSION} on :${PORT} (API: ${API_BASE}, gate: ${SECRET ? "ON" : "OFF/dev"})`
  );
});
