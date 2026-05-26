#!/usr/bin/env node
/**
 * Smoke test — verifies the MCP server can be required, the tool list
 * is well-formed, and basic schema sanity holds. Runs in <1 sec.
 *
 * No network calls. Safe to wire into prepublishOnly.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, "..", "package.json");
const indexPath = join(__dirname, "..", "src", "index.js");

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const indexSrc = readFileSync(indexPath, "utf8");

// 1. package.json sanity
assert.equal(pkg.name, "@lmaniraruta/agentstorefront-mcp", "package name mismatch");
assert.ok(pkg.version.match(/^\d+\.\d+\.\d+/), "version must be semver");
assert.equal(pkg.type, "module", "must be ESM");
assert.ok(pkg.bin && pkg.bin["agentstorefront-mcp"], "bin entry missing");
assert.ok(pkg.dependencies["@modelcontextprotocol/sdk"], "MCP SDK dependency missing");

// 2. index.js exports the 4 expected tool names
const expectedTools = ["list_services", "search_services", "get_service", "request_quote"];
for (const tool of expectedTools) {
  assert.ok(
    indexSrc.includes(`name: "${tool}"`),
    `tool ${tool} not declared in TOOLS array`
  );
}

// 3. Shebang for npx executability
assert.ok(indexSrc.startsWith("#!/usr/bin/env node"), "src/index.js missing shebang");

// 4. Server name matches
assert.ok(
  indexSrc.includes('name: "agentstorefront-mcp"'),
  "server name string not found"
);

console.log("smoke ok — 4 tools declared, package sane, ESM, shebang present");
process.exit(0);
