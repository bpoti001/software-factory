#!/usr/bin/env bash
# ==============================================================================
# Software Factory — Zero-Friction Developer & Repository Bootstrap
# ==============================================================================
# Usage:
#   ./scripts/factory-init.sh [target-repo-path]
#
# What this automates for every engineer:
#   1. Copies .github/ (Copilot Agents, Prompts, Instructions) & .vscode/settings.json
#   2. Seeds CONTEXT.md, GLOSSARY.md, CODING_STANDARDS.md, and docs/adr + docs/rfc (if missing)
#   3. Installs local git hooks (commit-msg + pre-push) so ADR/Jira checks run automatically
#   4. Installs Bitbucket Pipelines & PR templates so gates are enforced server-side
# ==============================================================================

set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$(cd "${1:-$(pwd)}" && pwd)"

echo "🏭 Initializing ADR-Governed Software Factory in: $TARGET_DIR"

mkdir -p "$TARGET_DIR/.github/agents" \
         "$TARGET_DIR/.github/prompts" \
         "$TARGET_DIR/.vscode" \
         "$TARGET_DIR/docs/adr" \
         "$TARGET_DIR/docs/rfc" \
         "$TARGET_DIR/docs/agents" \
         "$TARGET_DIR/scripts"

# 1. Sync Copilot Agents, Prompts, and Always-On Instructions (when target != source)
if [ "$SOURCE_DIR" != "$TARGET_DIR" ]; then
  cp -R "$SOURCE_DIR/.github/"* "$TARGET_DIR/.github/"
  cp "$SOURCE_DIR/.vscode/settings.json" "$TARGET_DIR/.vscode/settings.json"
  cp "$SOURCE_DIR/.vscode/tasks.json" "$TARGET_DIR/.vscode/tasks.json" 2>/dev/null || true
  cp -R "$SOURCE_DIR/docs/agents/"* "$TARGET_DIR/docs/agents/"

  # 2. Seed Living Governance Docs (preserve existing if already customized)
  for file in CONTEXT.md GLOSSARY.md CODING_STANDARDS.md AGENTS.md CLAUDE.md bitbucket-pipelines.yml; do
    if [ ! -f "$TARGET_DIR/$file" ] && [ -f "$SOURCE_DIR/$file" ]; then
      cp "$SOURCE_DIR/$file" "$TARGET_DIR/$file"
      echo "  ✅ Created $file"
    else
      echo "  ℹ️  Kept existing $file"
    fi
  done

  for doc in docs/adr/README.md docs/adr/template.md docs/adr/0000-adr-driven-software-factory.md docs/rfc/README.md docs/rfc/template.md; do
    if [ ! -f "$TARGET_DIR/$doc" ] && [ -f "$SOURCE_DIR/$doc" ]; then
      cp "$SOURCE_DIR/$doc" "$TARGET_DIR/$doc"
    fi
  done

  # 3. Copy automation & verification scripts
  cp "$SOURCE_DIR/scripts/"*.sh "$TARGET_DIR/scripts/" 2>/dev/null || true
  chmod +x "$TARGET_DIR/scripts/"*.sh 2>/dev/null || true
fi

# 4. Install Git Hooks (commit-msg and pre-push) if inside a git repository
if [ -d "$TARGET_DIR/.git" ]; then
  HOOKS_DIR="$TARGET_DIR/.git/hooks"
  mkdir -p "$HOOKS_DIR"

  cat > "$HOOKS_DIR/commit-msg" << 'EOF'
#!/usr/bin/env bash
# Auto-inject Jira Key from branch name into commit message if missing
COMMIT_MSG_FILE="$1"
BRANCH_NAME="$(git symbolic-ref --short HEAD 2>/dev/null || true)"
JIRA_KEY="$(echo "$BRANCH_NAME" | grep -oE '[A-Z][A-Z0-9]+-[0-9]+' | head -n 1 || true)"

if [ -n "$JIRA_KEY" ]; then
  if ! grep -q "$JIRA_KEY" "$COMMIT_MSG_FILE"; then
    # Prepend Jira key to commit message automatically
    TMP_FILE="$(mktemp)"
    FIRST_LINE="$(head -n 1 "$COMMIT_MSG_FILE")"
    REST="$(tail -n +2 "$COMMIT_MSG_FILE")"
    echo "${FIRST_LINE} [${JIRA_KEY}]" > "$TMP_FILE"
    echo "$REST" >> "$TMP_FILE"
    mv "$TMP_FILE" "$COMMIT_MSG_FILE"
    echo "🔗 Auto-tagged commit with Jira ticket [$JIRA_KEY] from branch '$BRANCH_NAME'"
  fi
fi
EOF
  chmod +x "$HOOKS_DIR/commit-msg"

  cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/usr/bin/env bash
# Run fast deterministic ADR & Deep Module boundary checks before push
REPO_ROOT="$(git rev-parse --show-toplevel)"
if [ -x "$REPO_ROOT/scripts/verify-governance.sh" ]; then
  "$REPO_ROOT/scripts/verify-governance.sh" --pre-push
fi
EOF
  chmod +x "$HOOKS_DIR/pre-push"
  echo "  ✅ Installed Git hooks (auto-Jira commit tagging + pre-push ADR/seam check)"
fi

echo ""
echo "🎉 Software Factory Ready!"
echo "👉 Open VS Code in '$TARGET_DIR' and type '/start' in Copilot Chat (or press Cmd+Shift+P -> 'Tasks: Run Task')."
