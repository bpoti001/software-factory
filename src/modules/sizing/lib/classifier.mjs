/**
 * Private Implementation: Adaptive Agent Sizing Classifier
 * Governed by: ADR-0001 (Deep Module Boundaries), ADR-0002 (Adaptive Agent Sizing)
 */

const STRUCTURAL_FILE_PATTERNS = [
  /(^|\/)(package\.json|requirements\.txt|pyproject\.toml|pom\.xml|build\.gradle|go\.mod|Cargo\.toml)$/,
  /(^|\/)(migrations?|schema|prisma|db\/migrate)\//i,
  /\.sql$/i,
  /^docs\/(adr|rfc)\//i,
];

const LARGE_PROMPT_KEYWORDS =
  /\b(new\s+(library|dependency|package|database|table|schema|migration|module|microservice)|migrate\s+to|redis|kafka|graphql|cross-module|rfc|create-adr|create-rfc|breaking\s+change)\b/i;

const SMALL_PROMPT_KEYWORDS =
  /\b(button\s+color|change\s+color|color\s+of|typo|spelling|copy\s+tweak|tooltip|padding|margin|font-size|css|style\s+tweak|rename\s+label|constant|timeout\s+value)\b/i;

/**
 * Extracts an explicit user size flag from the prompt or input parameter.
 * @param {string} prompt
 * @param {string | null | undefined} explicitSize
 * @returns {'S' | 'M' | 'L' | null}
 */
function parseExplicitUserSize(prompt, explicitSize) {
  if (explicitSize && ['S', 'M', 'L'].includes(explicitSize.toUpperCase())) {
    return /** @type {'S' | 'M' | 'L'} */ (explicitSize.toUpperCase());
  }

  if (/(^|\s)(\[S\]|--small|size:small|\/quick)(\s|$)/i.test(prompt)) {
    return 'S';
  }
  if (/(^|\s)(\[M\]|--medium|size:medium)(\s|$)/i.test(prompt)) {
    return 'M';
  }
  if (/(^|\s)(\[L\]|--large|size:large)(\s|$)/i.test(prompt)) {
    return 'L';
  }

  return null;
}

/**
 * Checks whether any touched files trigger a mandatory architectural safety escalation.
 * @param {string[]} changedFiles
 * @returns {string[]}
 */
function findStructuralFiles(changedFiles) {
  return changedFiles.filter((file) =>
    STRUCTURAL_FILE_PATTERNS.some((pattern) => pattern.test(file))
  );
}

/**
 * Builds the immutable SizingDecision output for a chosen size.
 * @param {'S' | 'M' | 'L'} size
 * @param {'user-override' | 'auto-detected' | 'safety-escalated'} mode
 * @param {boolean} escalated
 * @param {string | null} escalationReason
 */
function buildSizingDecision(size, mode, escalated, escalationReason) {
  if (size === 'S') {
    return Object.freeze({
      size: 'S',
      label: 'Small [S]',
      mode,
      escalated,
      escalationReason,
      skipResearch: true,
      skipConfluenceMcp: true,
      skipShowMe: true,
      hardStopForAdrOrRfc: false,
      requiredGates: Object.freeze(['local-verify']),
      recommendedCommand: '@engineer [S] (or /quick)',
    });
  }

  if (size === 'M') {
    return Object.freeze({
      size: 'M',
      label: 'Medium [M]',
      mode,
      escalated,
      escalationReason,
      skipResearch: false,
      skipConfluenceMcp: false,
      skipShowMe: false,
      hardStopForAdrOrRfc: false,
      requiredGates: Object.freeze(['product', 'architecture', 'program-design', 'tdd']),
      recommendedCommand: '@engineer [M] /feature-spec',
    });
  }

  return Object.freeze({
    size: 'L',
    label: 'Large [L]',
    mode,
    escalated,
    escalationReason,
    skipResearch: false,
    skipConfluenceMcp: false,
    skipShowMe: false,
    hardStopForAdrOrRfc: true,
    requiredGates: Object.freeze([
      'product',
      'architecture-adr-rfc-hard-stop',
      'program-design',
      'tdd',
    ]),
    recommendedCommand: '@architect (/create-adr or /create-rfc) -> @engineer [L]',
  });
}

/**
 * Classifies a task into Small [S], Medium [M], or Large [L] execution tiers.
 * @param {{ prompt?: string, changedFiles?: string[], explicitSize?: 'S' | 'M' | 'L' | null }} input
 */
export function classifyTaskSize(input = {}) {
  const prompt = String(input.prompt || '').trim();
  const changedFiles = Array.isArray(input.changedFiles) ? input.changedFiles : [];
  const structuralFiles = findStructuralFiles(changedFiles);
  const explicit = parseExplicitUserSize(prompt, input.explicitSize);

  // Safety Escalation Guard (ADR-0002):
  // If user requested Small [S], but touched package manifests, DB migrations, or ADR files, escalate to Large [L].
  if (explicit === 'S' && structuralFiles.length > 0) {
    return buildSizingDecision(
      'L',
      'safety-escalated',
      true,
      `Task requested Small [S] but modifies structural/architectural files (${structuralFiles.join(', ')}). Escalated to Large [L] per ADR-0002.`
    );
  }

  if (explicit) {
    return buildSizingDecision(explicit, 'user-override', false, null);
  }

  // Auto-Detection Mode:
  if (structuralFiles.length > 0 || LARGE_PROMPT_KEYWORDS.test(prompt)) {
    return buildSizingDecision('L', 'auto-detected', false, null);
  }

  const isSmallFileScope = changedFiles.length <= 2;
  if (isSmallFileScope && SMALL_PROMPT_KEYWORDS.test(prompt)) {
    return buildSizingDecision('S', 'auto-detected', false, null);
  }

  return buildSizingDecision('M', 'auto-detected', false, null);
}
