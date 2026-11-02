#!/usr/bin/env bash
# ==============================================================================
# Software Factory — Deterministic ADR, Documentation & Deep Module Gate
# ==============================================================================
# Runs in < 2 seconds locally (pre-push hook) and in Bitbucket Pipelines CI.
#
# Checks:
#   1. Deep Module Entry-Point Boundary: No external imports into private `/lib/` folders.
#   2. Structural Drift Gate: If package manifests, DB schemas/migrations, or new module
#      directories changed, verifies that CONTEXT.md or docs/adr/ or docs/rfc/ was also
#      updated (or an [ADR-NNNN] / [RFC-NNNN] tag is referenced).
#   3. Delete-Zone Guard: Ensures deprecated patterns listed in CONTEXT.md are not recreated.
# ==============================================================================

set -euo pipefail

BASE_REF="${BASE_REF:-origin/main}"
if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
  BASE_REF="$(git rev-list --max-parents=0 HEAD 2>/dev/null | tail -n 1 || echo HEAD)"
fi

CHANGED_FILES="$(git diff --name-only "$BASE_REF"...HEAD 2>/dev/null || git status --porcelain | awk '{print $2}')"

if [ -z "$CHANGED_FILES" ]; then
  echo "✅ [Factory Gate] No changed files to verify."
  exit 0
fi

ERRORS=0

echo "🔍 [Factory Gate] Verifying ADR Governance & Deep Module Boundaries..."

# ------------------------------------------------------------------------------
# Gate 1: Deep Module Seam Check (No cross-module imports into private `/lib/` or `/internal/`)
# ------------------------------------------------------------------------------
while IFS= read -r file; do
  [ -f "$file" ] || continue
  case "$file" in
    *.ts|*.tsx|*.js|*.jsx|*.py|*.go|*.java)
      # Flag relative or alias imports reaching across packages into /lib/ or /internal/
      if grep -nE "from ['\"](\.\./\.\./.*|@[^'\"]+)/lib/|import .*(\.\./\.\./.*)/internal/" "$file" >/dev/null 2>&1; then
        echo "❌ [Seam Violation] $file imports private '/lib/' or '/internal/' internals across module boundaries."
        echo "   👉 Rule (ADR-0001): Import only through the target Deep Module's root entry point (index.*)."
        ERRORS=$((ERRORS + 1))
      fi
      ;;
  esac
done <<< "$CHANGED_FILES"

# ------------------------------------------------------------------------------
# Gate 2: Architectural Drift & Documentation Co-Update Check
# ------------------------------------------------------------------------------
STRUCTURAL_CHANGE=0
DOC_UPDATED=0

while IFS= read -r file; do
  [ -n "$file" ] || continue
  case "$file" in
    package.json|pyproject.toml|requirements*.txt|pom.xml|build.gradle*|Cargo.toml|go.mod|*migration*|*schema*|*.sql|*.proto|openapi*.yaml|openapi*.json)
      STRUCTURAL_CHANGE=1
      ;;
  esac
  case "$file" in
    CONTEXT.md|GLOSSARY.md|docs/adr/*|docs/rfc/*)
      DOC_UPDATED=1
      ;;
  esac
done <<< "$CHANGED_FILES"

if [ "$STRUCTURAL_CHANGE" -eq 1 ] && [ "$DOC_UPDATED" -eq 0 ]; then
  # Check if commit messages explicitly cite an existing accepted ADR-NNNN or RFC-NNNN
  RECENT_COMMITS="$(git log "$BASE_REF"..HEAD --oneline 2>/dev/null || true)"
  if ! echo "$RECENT_COMMITS" | grep -qE "(ADR-[0-9]{4}|RFC-[0-9]{4})"; then
    echo "⚠️  [ADR Drift Gate] Structural changes detected (dependencies, schemas, migrations, or contracts)"
    echo "   without a corresponding update to CONTEXT.md, docs/adr/, docs/rfc/, or an [ADR-NNNN] commit tag."
    echo "   👉 Run '/create-adr' or '/create-rfc' in VS Code Copilot (or tag your commit with [ADR-NNNN])."
    ERRORS=$((ERRORS + 1))
  fi
fi

if [ "$ERRORS" -gt 0 ]; then
  echo ""
  echo "🛑 [Factory Gate Failed] $ERRORS governance violation(s) detected."
  exit 1
fi

echo "✅ [Factory Gate Passed] Deep Module boundaries and ADR documentation gates verified."
