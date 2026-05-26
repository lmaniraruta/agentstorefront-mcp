#!/usr/bin/env bash
# Day 18 — Step 2 of MCP ship: git init + push to lmaniraruta/agentstorefront-mcp
# Run AFTER creating empty repo on GitHub UI.

set -e

cd "/Users/lfidele/Documents/claude/Projects/A.I C.E.O/hard/H2-agentstorefront/mcp-server"

echo "=== git init + first commit ==="
git init 2>/dev/null || echo "  (already initialized)"
git add .
git commit -m "feat: initial AgentStorefront MCP server (4 tools, ESM, MCP SDK 1.0)" 2>/dev/null || echo "  (nothing to commit OR commit already exists)"
git branch -M main

echo ""
echo "=== adding GitHub remote ==="
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/lmaniraruta/agentstorefront-mcp.git

echo ""
echo "=== pushing to GitHub (may prompt for credentials — use Personal Access Token) ==="
git push -u origin main

echo ""
echo "✅ Pushed. Verify at https://github.com/lmaniraruta/agentstorefront-mcp"
echo ""
echo "Next: bash STEP3_PUBLISH.sh"
