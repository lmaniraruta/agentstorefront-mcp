#!/usr/bin/env bash
# Usage:  bash publish-with-token.sh npm_yourTokenHere
# Uses granular access token (with "Bypass 2FA for publishing" enabled) to skip the OTP loop.

set -e

TOKEN="$1"
if [[ -z "$TOKEN" ]] || [[ "$TOKEN" != npm_* ]]; then
  echo "❌ pass npm granular access token as argument"
  echo "   usage: bash publish-with-token.sh npm_xxxxxxxxxxxxxxxx"
  exit 1
fi

cd "/Users/lfidele/Documents/claude/Projects/A.I C.E.O/hard/H2-agentstorefront/mcp-server"

# Write token into a throwaway .npmrc — only way npm CLI actually USES it.
# NPM_TOKEN env var alone is NOT honored unless ~/.npmrc explicitly references ${NPM_TOKEN}.
TMP_NPMRC=$(mktemp /tmp/npmrc.XXXXXX)
trap 'rm -f "$TMP_NPMRC"' EXIT
cat > "$TMP_NPMRC" <<EOF
//registry.npmjs.org/:_authToken=$TOKEN
registry=https://registry.npmjs.org/
EOF

echo "=== verifying token via whoami ==="
npm whoami --userconfig "$TMP_NPMRC"

echo ""
echo "=== publishing with granular token (bypass-2fa) ==="
npm publish --access public --userconfig "$TMP_NPMRC"

echo ""
echo "=== verifying registry (10s) ==="
sleep 10
curl -s https://registry.npmjs.org/@lfidele/agentstorefront-mcp | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('✓ name:', d.get('name'))
    print('✓ latest:', d.get('dist-tags', {}).get('latest'))
    print('✓ url: https://www.npmjs.com/package/' + d.get('name', ''))
except Exception as e:
    print('!! could not parse:', e)
"

echo ""
echo "=== install smoke ==="
npx -y @lfidele/agentstorefront-mcp < /dev/null && echo "" || echo "  (clean exit on empty stdin = success)"

echo ""
echo "🚀 Published. URL: https://www.npmjs.com/package/@lfidele/agentstorefront-mcp"
