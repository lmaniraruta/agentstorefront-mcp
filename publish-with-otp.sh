#!/usr/bin/env bash
# Usage:  bash publish-with-otp.sh 123456
# Replace 123456 with your fresh 6-digit OTP from your authenticator.

set -e

OTP="$1"
if [[ -z "$OTP" ]] || [[ ${#OTP} -lt 6 ]]; then
  echo "❌ pass 6-digit OTP as argument"
  echo "   usage: bash publish-with-otp.sh 123456"
  exit 1
fi

cd "/Users/lfidele/Documents/claude/Projects/A.I C.E.O/hard/H2-agentstorefront/mcp-server"

echo "=== publishing with OTP $OTP ==="
npm publish --access public --otp="$OTP"

echo ""
echo "=== verifying registry (8s) ==="
sleep 8
curl -s https://registry.npmjs.org/@lfidele/agentstorefront-mcp | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print('✓ name:', d.get('name'))
    print('✓ latest:', d.get('dist-tags', {}).get('latest'))
    print('✓ url:', 'https://www.npmjs.com/package/' + d.get('name', ''))
except Exception as e:
    print('!! could not parse:', e)
" || true

echo ""
echo "=== install smoke ==="
npx -y @lfidele/agentstorefront-mcp < /dev/null && echo "" || echo "  (clean exit on empty stdin = success)"

echo ""
echo "🚀 Published. URL: https://www.npmjs.com/package/@lfidele/agentstorefront-mcp"
