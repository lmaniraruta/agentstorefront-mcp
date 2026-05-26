#!/usr/bin/env bash
# Day 18 — re-push with @lfidele scope (corrected from @lmaniraruta)
# Cleans .bak files left by sed, commits scope rename, pushes.

set -e

cd "/Users/lfidele/Documents/claude/Projects/A.I C.E.O/hard/H2-agentstorefront/mcp-server"

echo "=== cleaning sed .bak files ==="
find . -name "*.bak" -type f -delete 2>/dev/null || true
echo "  ✓ removed"

echo ""
echo "=== committing scope rename ==="
git add -A
git commit -m "fix: rename scope @lmaniraruta → @lfidele to match npm username"

echo ""
echo "=== pushing ==="
git push origin main

echo ""
echo "✅ Pushed. Now run: bash STEP3_PUBLISH.sh"
