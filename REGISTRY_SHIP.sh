#!/usr/bin/env bash
# Day 18 — Step 4: ship to Anthropic MCP registry
#
# Prereqs (done):
#   ✅ @lfidele/agentstorefront-mcp@0.1.0 published to npm
#   ✅ GitHub repo lmaniraruta/agentstorefront-mcp pushed
#   ✅ package.json now has mcpName + bumped to 0.1.1
#   ✅ server.json drafted
#
# This script:
#   1. Republishes @lfidele/agentstorefront-mcp@0.1.1 to npm (now with mcpName)
#   2. Installs mcp-publisher CLI
#   3. Logs in to the registry via GitHub device flow (interactive)
#   4. Publishes server.json to https://registry.modelcontextprotocol.io
#
# Usage:  bash REGISTRY_SHIP.sh npm_yourBypassTokenHere

set -e

NPM_TOKEN_ARG="$1"
if [[ -z "$NPM_TOKEN_ARG" ]] || [[ "$NPM_TOKEN_ARG" != npm_* ]]; then
  echo "❌ pass npm bypass-2FA token as argument (the same one from earlier, if not revoked)"
  echo "   usage: bash REGISTRY_SHIP.sh npm_xxxxxxxxxxxxxxxx"
  echo ""
  echo "   if you already revoked it, generate a fresh one at:"
  echo "   https://www.npmjs.com/settings/lfidele/tokens/granular-access-tokens/new"
  echo "   → Bypass 2FA ☑, Read+Write, @lfidele scope, Generate, paste here"
  exit 1
fi

cd "/Users/lfidele/Documents/claude/Projects/A.I C.E.O/hard/H2-agentstorefront/mcp-server"

# === Step A: republish 0.1.1 to npm (now contains mcpName) ===
TMP_NPMRC=$(mktemp /tmp/npmrc.XXXXXX)
trap 'rm -f "$TMP_NPMRC"' EXIT
cat > "$TMP_NPMRC" <<EOF
//registry.npmjs.org/:_authToken=$NPM_TOKEN_ARG
registry=https://registry.npmjs.org/
EOF

echo "=== A. republishing @lfidele/agentstorefront-mcp@0.1.1 (with mcpName) ==="
npm publish --access public --userconfig "$TMP_NPMRC"

echo ""
echo "=== B. waiting 10s for npm to propagate ==="
sleep 10

# === Step C: install mcp-publisher CLI ===
echo ""
echo "=== C. installing mcp-publisher CLI ==="
if command -v mcp-publisher >/dev/null 2>&1; then
  echo "  ✓ already installed"
else
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')
  echo "  downloading mcp-publisher_${OS}_${ARCH}..."
  curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_${OS}_${ARCH}.tar.gz" \
    | tar xz mcp-publisher
  echo "  moving to /usr/local/bin (will sudo)..."
  sudo mv mcp-publisher /usr/local/bin/
  echo "  ✓ installed"
fi

mcp-publisher --help | head -10

# === Step D: login (interactive GitHub OAuth device flow) ===
echo ""
echo "=== D. authenticating with the registry via GitHub ==="
echo "    Follow the link + enter the code shown below."
mcp-publisher login github

# === Step E: publish server.json to the registry ===
echo ""
echo "=== E. publishing to https://registry.modelcontextprotocol.io ==="
mcp-publisher publish

# === Step F: verify ===
echo ""
echo "=== F. verifying registry entry (5s) ==="
sleep 5
curl -s "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.lmaniraruta/agentstorefront" \
  | python3 -m json.tool 2>/dev/null | head -40 || echo "  (response not JSON or empty)"

echo ""
echo "🚀🚀🚀 SHIPPED TO MCP REGISTRY"
echo "   Registry URL:  https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.lmaniraruta/agentstorefront"
echo "   npm:           https://www.npmjs.com/package/@lfidele/agentstorefront-mcp"
echo "   GitHub:        https://github.com/lmaniraruta/agentstorefront-mcp"
echo "   Homepage:      https://agentstorefront.app"
echo ""
echo "Next: REVOKE the npm token at https://www.npmjs.com/settings/lfidele/tokens"
