#!/usr/bin/env bash
# ==============================================================================
# Interactive GitHub Repository Publisher (Matt Pocock /wizard pattern)
# ==============================================================================
set -euo pipefail

REPO_NAME="${1:-software-factory}"
GH_USER="bpoti001"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🚀 Publishing '$REPO_NAME' to https://github.com/$GH_USER/$REPO_NAME"
echo ""
echo "ℹ️  Your macOS Keychain token is a Fine-Grained PAT scoped to existing repositories,"
echo "   which allows pushing code once the empty repository exists on GitHub."
echo ""
echo "Step 1: Opening GitHub 'Create a New Repository' in your browser..."
if command -v open >/dev/null 2>&1; then
  open "https://github.com/new?name=${REPO_NAME}&description=ADR-Governed+Software+Factory+with+VS+Code+Copilot+Agents%2C+43+Engineering+Skills%2C+and+Jira%2FConfluence%2FBitbucket+MCP+Governance"
fi

echo "   👉 In the browser tab that just opened, leave 'Initialize this repository with a README' UNCHECKED and click 'Create repository'."
echo ""
read -r -p "Step 2: Press [Enter] once you have clicked 'Create repository' (or paste a classic PAT with 'repo' scope to create via API): " TOKEN_INPUT

cd "$REPO_DIR"

if [ -n "${TOKEN_INPUT:-}" ]; then
  echo "Creating repository via GitHub API..."
  curl -sS -X POST "https://api.github.com/user/repos" \
    -H "Authorization: Bearer $TOKEN_INPUT" \
    -H "Accept: application/vnd.github+json" \
    -d "{\"name\":\"$REPO_NAME\",\"private\":false}" >/dev/null
  git remote set-url origin "https://${GH_USER}:${TOKEN_INPUT}@github.com/${GH_USER}/${REPO_NAME}.git"
else
  git remote set-url origin "https://github.com/${GH_USER}/${REPO_NAME}.git"
fi

echo "Step 3: Pushing 'main' branch (214 files, 43 skills, Copilot agents) to origin..."
git push -u origin main

# Reset remote URL to clean HTTPS URL without embedded token
git remote set-url origin "https://github.com/${GH_USER}/${REPO_NAME}.git"

echo ""
echo "✅ Successfully pushed to: https://github.com/${GH_USER}/${REPO_NAME}"
