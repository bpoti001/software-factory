#!/usr/bin/env bash
# ==============================================================================
# Software Factory — Deterministic ADR, Documentation & Deep Module Gate
# ==============================================================================
# Governed by: ADR-0001, ADR-0003, ADR-0004
# Delegates to the zero-dependency Node ESM Software Factory Engine (`src/cli/factory.mjs`)
# when Node.js is available, with fallback shell verification.
# ==============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if command -v node >/dev/null 2>&1 && [ -f "$REPO_ROOT/src/cli/factory.mjs" ]; then
  # When called from pre-push hook, run test suite first
  if [ "${1:-}" = "--pre-push" ]; then
    echo "🧪 [Pre-Push Gate] Running automated test suite..."
    npm test --if-present
  fi

  node "$REPO_ROOT/src/cli/factory.mjs" verify
  exit 0
fi

echo "❌ [Factory Gate Error] Node.js is required to execute Software Factory governance verification." >&2
exit 1
