#!/usr/bin/env node
/**
 * HTTP smoke test for src/http.js — verifies:
 *  1. /healthz responds
 *  2. unauthenticated /mcp is rejected 402 when AGENTICMARKET_SECRET set
 *  3. authenticated initialize handshake succeeds
 *  4. tools/list returns 4 tools
 * Run: node test/smoke-http.js
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = 8791;
const SECRET = "smoke-secret-123";
const BASE = `http://127.0.0.1:${PORT}`;
const H = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
  "x-agenticmarket-secret": SECRET,
};

const child = spawn("node", ["src/http.js"], {
  env: { ...process.env, PORT: String(PORT), AGENTICMARKET_SECRET: SECRET },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stderr.on("data", (d) => process.stderr.write(`[server] ${d}`));

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
  if (!ok) failed++;
};

// Parse either plain JSON or SSE-wrapped JSON-RPC response bodies.
async function rpcBody(res) {
  const text = await res.text();
  if (text.startsWith("event:") || text.includes("\ndata:") || text.startsWith("data:")) {
    const line = text.split("\n").find((l) => l.startsWith("data:"));
    return JSON.parse(line.slice(5));
  }
  return JSON.parse(text);
}

try {
  await sleep(1200);

  const hz = await fetch(`${BASE}/healthz`);
  check("healthz 200", hz.status === 200);

  const noauth = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "smoke", version: "0" } } }),
  });
  check("unauthenticated rejected 402", noauth.status === 402);

  const init = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "smoke", version: "0" } } }),
  });
  const initBody = await rpcBody(init);
  check("initialize ok", init.status === 200 && initBody?.result?.serverInfo?.name === "agentstorefront-mcp",
        `status=${init.status}`);

  const tools = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/list", params: {} }),
  });
  const toolsBody = await rpcBody(tools);
  const n = toolsBody?.result?.tools?.length || 0;
  check("tools/list returns 4 tools", n === 4, `got ${n}`);
} catch (err) {
  check("smoke run", false, err.message);
} finally {
  child.kill();
}
process.exit(failed ? 1 : 0);
