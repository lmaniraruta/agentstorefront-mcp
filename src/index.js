#!/usr/bin/env node
/**
 * AgentStorefront MCP server
 *
 * Exposes 4 tools that let agents discover, search, get details on,
 * and request quotes from AgentStorefront listings — all from inside
 * an MCP-aware client (Claude Desktop, Cursor, etc.).
 *
 * Distribution: published to npm as @lmaniraruta/agentstorefront-mcp
 * Registry: submitted to Anthropic MCP registry as `agentstorefront`.
 *
 * Usage in Claude Desktop config:
 *   "mcpServers": {
 *     "agentstorefront": {
 *       "command": "npx",
 *       "args": ["-y", "@lmaniraruta/agentstorefront-mcp"]
 *     }
 *   }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

const API_BASE = process.env.AGENTSTOREFRONT_API_URL || "https://api.agentstorefront.app";
const VERSION = "0.1.0";

// --- Tool definitions ---

const TOOLS = [
  {
    name: "list_services",
    description:
      "List AgentStorefront services that an agent can subscribe to and call. Returns names, prices, and short descriptions. Optionally filter by category.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional category filter (e.g., 'data', 'communication', 'finance').",
        },
        limit: {
          type: "number",
          description: "Max results (default 20, max 100).",
          default: 20,
        },
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
        query: {
          type: "string",
          description: "Natural-language search query.",
        },
        max_price_cents: {
          type: "number",
          description: "Optional max per-call price in cents.",
        },
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
        service_id: {
          type: "string",
          description: "The service ID (UUID or slug).",
        },
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
        email: {
          type: "string",
          description: "Optional contact email for follow-up.",
        },
      },
      required: ["service_id", "expected_calls_per_month"],
    },
  },
];

// --- Helpers ---

async function fetchJson(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `agentstorefront-mcp/${VERSION}`,
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AgentStorefront API ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

function asTextResult(payload) {
  return {
    content: [
      {
        type: "text",
        text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2),
      },
    ],
  };
}

// --- Tool handlers ---

async function handleListServices({ category, limit = 20 }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  params.set("limit", String(Math.min(limit, 100)));
  const data = await fetchJson(`/services?${params.toString()}`);
  return asTextResult(data);
}

async function handleSearchServices({ query, max_price_cents }) {
  const params = new URLSearchParams({ q: query });
  if (max_price_cents) params.set("max_price_cents", String(max_price_cents));
  const data = await fetchJson(`/services/search?${params.toString()}`);
  return asTextResult(data);
}

async function handleGetService({ service_id }) {
  const data = await fetchJson(`/services/${encodeURIComponent(service_id)}`);
  return asTextResult(data);
}

async function handleRequestQuote({ service_id, expected_calls_per_month, email }) {
  const data = await fetchJson(`/services/${encodeURIComponent(service_id)}/quote`, {
    method: "POST",
    body: JSON.stringify({ expected_calls_per_month, email }),
  });
  return asTextResult(data);
}

// --- Server setup ---

const server = new Server(
  {
    name: "agentstorefront-mcp",
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  try {
    switch (name) {
      case "list_services":
        return await handleListServices(args);
      case "search_services":
        return await handleSearchServices(args);
      case "get_service":
        return await handleGetService(args);
      case "request_quote":
        return await handleRequestQuote(args);
      default:
        return asTextResult(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return asTextResult(`Error calling ${name}: ${err.message}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`agentstorefront-mcp v${VERSION} listening on stdio (API: ${API_BASE})`);
