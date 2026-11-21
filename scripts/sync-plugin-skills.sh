#!/usr/bin/env bash
# Portable Marketplace Plugin Skills Linker (ADR-0010, ENH-0009)
# Links locally installed Science, Tavily, and CodeRabbit plugin skills into .agents/skills/
# without committing machine-specific absolute symlinks to Git.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGINS_DIR="${GEMINI_PLUGINS_DIR:-$HOME/.gemini/config/plugins}"
SKILLS_DIR="$REPO_ROOT/.agents/skills"

mkdir -p "$SKILLS_DIR"

link_skill() {
  local name="$1"
  local rel_target="$2"
  local full_target="$PLUGINS_DIR/$rel_target"
  if [[ -d "$full_target" ]]; then
    ln -sfn "$full_target" "$SKILLS_DIR/$name"
    echo "✅ Linked $name -> $full_target"
  else
    echo "ℹ️  Skipped $name (not installed at $full_target)"
  fi
}

link_skill "coderabbit-autofix" "coderabbit/skills/autofix"
link_skill "coderabbit-review" "coderabbit/skills/code-review"
link_skill "embl-ebi-ols" "science/skills/embl_ebi_ols"
link_skill "literature-search-arxiv" "science/skills/literature_search_arxiv"
link_skill "literature-search-openalex" "science/skills/literature_search_openalex"
link_skill "tavily-research" "tavily/skills/tasks/tavily-research"
link_skill "tavily-search" "tavily/skills/core/tavily-search"
