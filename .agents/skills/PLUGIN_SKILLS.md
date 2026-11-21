# Optional Marketplace Plugin Skills (`ENH-0009`, `ADR-0010`)

To keep this repository 100% portable across developer machines and CI runners, optional Marketplace plugin skills are **not** committed as machine-local absolute symlinks.

Run `./scripts/sync-plugin-skills.sh` on any workstation with Antigravity / Gemini plugins installed (`$HOME/.gemini/config/plugins`) to link:

| Skill Alias | Plugin Source Path | Used In |
|---|---|---|
| `literature-search-arxiv` | `science/skills/literature_search_arxiv` | Gate 1 Literature Recon & Gate 6 Citation Verification |
| `literature-search-openalex` | `science/skills/literature_search_openalex` | Gate 1 Bibliometric & Citation Verification |
| `embl-ebi-ols` | `science/skills/embl_ebi_ols` | Domain Ontology Lookup |
| `tavily-search` | `tavily/skills/core/tavily-search` | Live Web Grounding |
| `tavily-research` | `tavily/skills/tasks/tavily-research` | Deep Research Synthesis |
| `coderabbit-review` | `coderabbit/skills/code-review` | Gate 6 Automated PR Review |
| `coderabbit-autofix` | `coderabbit/skills/autofix` | Gate 6 Review Thread Remediation |
