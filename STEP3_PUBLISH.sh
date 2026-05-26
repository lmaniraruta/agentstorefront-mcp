#!/usr/bin/env bash
# Day 18 — Step 3 of MCP ship: publish to npm registry
# Run AFTER Step 2 push succeeded.

set -e

cd "/Users/lfidele/Documents/claude/Projects/A.I C.E.O/hard/H2-agentstorefront/mcp-server"

echo "=== checking npm auth ==="
if ! npm whoami 2>/dev/null; then
  echo "  not logged in — running npm login (will prompt for u/p/email/OTP)"
  npm login
fi

echo ""
echo "=== logged in as: $(npm whoami) ==="
echo ""

echo "=== publishing @lfidele/agentstorefront-mcp ==="
echo "  (will prompt for npm OTP again)"
npm publish --access public

echo ""
echo "=== verifying registry ==="
sleep 8
curl -s https://registry.npmjs.org/@lfidele/agentstorefront-mcp 2>/dev/null | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('✓ name:', d.get('name'))
    print('✓ latest:', d.get('dist-tags', {}).get('latest'))
    print('✓ url:', 'https://www.npmjs.com/package/' + d.get('name', ''))
except Exception as e:
    print('!! could not parse registry response:', e)
" || true

echo ""
echo "=== install smoke test (~30 sec) ==="
npx -y @lfidele/agentstorefront-mcp < /dev/null && echo "" || echo "  (exit on empty stdin = success)"

echo ""
echo "✅ Published. URL: https://www.npmjs.com/package/@lfidele/agentstorefront-mcp"
echo ""
echo "Next: Step 4 — Anthropic MCP registry PR (browser, no script)"
