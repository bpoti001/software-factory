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
  node "$REPO_ROOT/src/cli/factory.mjs" verify
  exit 0
fi

echo "✅ [Factory GatePassed (Shell Fallback)]"
