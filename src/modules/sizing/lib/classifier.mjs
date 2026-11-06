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

const INTERFACE_FILE_PATTERNS = [
  /(^|\/)src\/modules\/[^/]+\/index\.(mjs|cjs|js|ts)$/,
];

const LARGE_PROMPT_KEYWORDS =
  /\b(new\s+(library|dependency|package|database|table|schema|migration|module|microservice)|create\s+([a-z0-9_-]+\s+)?module|migrate\s+to|redis|kafka|graphql|cross-module|rfc|create-adr|create-rfc|breaking\s+change)\b/i;

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
 * Infers task Intent Profile, depth, and test strategy from prompt and size (ADR-0007).
 * @param {string} prompt
 * @param {'S' | 'M' | 'L'} size
 */
function inferIntentProfile(prompt, size) {
  if (/\b(cve-\d+|security|vulnerability|auth\s+bypass|sanitize|injection)\b/i.test(prompt)) {
    return { profile: 'security-patch', depth: 'minimal', testStrategy: 'minimal' };
  }
  if (/\b(terraform|k8s|kubernetes|cloudwatch|ecs|ec2|docker|infra|infrastructure|iac|pipeline|deploy)\b/i.test(prompt)) {
    return { profile: 'infra', depth: 'standard', testStrategy: 'standard' };
  }
  if (/\b(refactor|cleanup|clean\s+up|reorganize|rename\s+internal|deduplicate)\b/i.test(prompt)) {
    return { profile: 'refactor', depth: 'minimal', testStrategy: 'minimal' };
  }
  if (/\b(fix|bug|crash|error|exception|regression|null\s+pointer|timeout)\b/i.test(prompt)) {
    return { profile: 'bugfix', depth: 'minimal', testStrategy: 'minimal' };
  }
  if (/\b(poc|proof\s+of\s+concept|prototype|experiment)\b/i.test(prompt)) {
    return { profile: 'poc', depth: 'minimal', testStrategy: 'minimal' };
  }
  if (size === 'S' || SMALL_PROMPT_KEYWORDS.test(prompt)) {
    return { profile: 'ui-tweak', depth: 'minimal', testStrategy: 'minimal' };
  }
  if (size === 'L' || /\b(enterprise|compliance|audit|regulated)\b/i.test(prompt)) {
    return { profile: 'enterprise', depth: 'comprehensive', testStrategy: 'comprehensive' };
  }
  return { profile: 'feature', depth: 'standard', testStrategy: 'standard' };
}

/**
 * Builds the immutable SizingDecision output for a chosen size.
 * @param {'S' | 'M' | 'L'} size
 * @param {'user-override' | 'auto-detected' | 'safety-escalated'} mode
 * @param {boolean} escalated
 * @param {string | null} escalationReason
 * @param {string} prompt
 */
function buildSizingDecision(size, mode, escalated, escalationReason, prompt = '') {
  const intent = inferIntentProfile(prompt, size);

  if (size === 'S') {
    return Object.freeze({
      size: 'S',
      label: 'Small [S]',
      profile: intent.profile,
      depth: intent.depth,
      testStrategy: intent.testStrategy,
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
      profile: intent.profile,
      depth: intent.depth,
      testStrategy: intent.testStrategy,
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
    profile: intent.profile,
    depth: intent.depth,
    testStrategy: intent.testStrategy,
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

  const interfaceFiles = changedFiles.filter((file) =>
    INTERFACE_FILE_PATTERNS.some((pattern) => pattern.test(file))
  );

  // Safety Escalation Guard (ADR-0002):
  // If user requested Small [S], but touched package manifests, DB migrations, ADR files, module interfaces,
  // or prompt indicates architectural changes, escalate to Large [L].
  if (
    explicit === 'S' &&
    (structuralFiles.length > 0 || interfaceFiles.length > 0 || LARGE_PROMPT_KEYWORDS.test(prompt))
  ) {
    const triggering = [...structuralFiles, ...interfaceFiles];
    const triggerDetail = triggering.length > 0 ? ` (${triggering.join(', ')})` : '';
    return buildSizingDecision(
      'L',
      'safety-escalated',
      true,
      `Task requested Small [S] but modifies structural/architectural files or interfaces${triggerDetail}. Escalated to Large [L] per ADR-0002.`,
      prompt
    );
  }

  if (explicit) {
    return buildSizingDecision(explicit, 'user-override', false, null, prompt);
  }

  // Auto-Detection Mode:
  if (structuralFiles.length > 0 || LARGE_PROMPT_KEYWORDS.test(prompt)) {
    return buildSizingDecision('L', 'auto-detected', false, null, prompt);
  }

  const isSmallFileScope = changedFiles.length <= 2;
  if (isSmallFileScope && SMALL_PROMPT_KEYWORDS.test(prompt)) {
    return buildSizingDecision('S', 'auto-detected', false, null, prompt);
  }

  return buildSizingDecision('M', 'auto-detected', false, null, prompt);
}
