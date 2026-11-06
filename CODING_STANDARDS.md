# Coding Standards & Maintainability Baseline (`CODING_STANDARDS.md`)

> **Why this file is separate from `AGENTS.md` / `copilot-instructions.md`:**
> Following Matt Pocock's *Separate Review Context* architecture, the implementation agent already carries high context pressure (exploring code, implementing vertical slices, debugging tests). Detailed coding standards and code-smell heuristics live here in `CODING_STANDARDS.md` so the **Review Agent (`@pr-reviewer`)** can evaluate diffs with a dedicated context budget and zero implementation fatigue.

---

## 1. Architectural & Module Design Standards (John Ousterhout + ECC)

### 1.1 Deep Modules Over Shallow Modules
- **Rule**: Modules must be **deep**—exposing a small, simple public interface (`index.ts` / root entry points) while hiding substantial implementation complexity inside private subfolders (`lib/`, `internal/`).
- **The Deletion Test**: If deleting a module/function concentrates complexity rather than scattering it across callers, the module was a shallow pass-through and should be inlined or deepened.
- **Entry-Point Boundary**: External callers and tests must import **only** through a package/module's public entry point—never reach into internal subfolders.

### 1.2 Seam & Adapter Discipline
- **The Interface is the Test Surface**: Write unit and integration tests against the module's public seam. Do not mock internal private helpers.
- **Two Adapters Rule**: One adapter at a seam is a hypothetical abstraction; two adapters (e.g., `PostgresOrderRepo` + `InMemoryOrderRepo`, or two real providers) justify the seam. Avoid speculative interfaces.
- **Accept Dependencies, Return Results**: Prefer pure data transformations and explicit dependency injection at boundaries over hidden singletons or in-place parameter mutation.

### 1.3 ADR & Documentation Traceability
- **No Undocumented Structural Changes**: Any PR that introduces a new external dependency, database table/migration, cross-service API contract, authentication flow, or state management pattern **must** cite an `accepted` ADR in `CONTEXT.md` (and Confluence) or include a newly drafted ADR/RFC.
- **Ubiquitous Language (`GLOSSARY.md`)**: Identifiers, types, API payloads, and database columns must use the exact canonical terms defined in `GLOSSARY.md`.

---

## 2. Implementation & Safety Standards (ECC Baseline)

### 2.1 Immutability & State
- **Never Mutate In-Place**: Always return new objects/collections rather than mutating arguments in place.
- **Narrow Types**: Avoid wide/optional bag-of-props types that only exist for mocks or tests (`narrow-prop-types`). Make invalid states unrepresentable in the type system.

### 2.2 File & Function Granularity
- **File Size**: Keep files focused (target 200–400 lines, hard ceiling 800 lines).
- **Function Size**: Keep functions under 50 lines with nesting depth $\le 4$.
- **Explicit Error Handling**: Never swallow exceptions silently. Validate all external inputs (HTTP bodies, query params, MCP/queue payloads) with schema validators at the system boundary.

### 2.3 Security Checklist (Mandatory Gate)
- Zero hardcoded secrets, tokens, or credentials.
- Parameterized queries for all persistence operations.
- Server-side authorization checks on every protected route/mutation.
- Sanitized error responses (never leak stack traces or internal infrastructure paths to clients).

---

## 3. Martin Fowler Code Smell Baseline (_Refactoring_, Ch. 3)

Even where a language linter passes, `@pr-reviewer` checks every diff hunk against these 12 structural smells. Documented repo ADRs override these heuristics where an explicit trade-off was accepted:

1. **Mysterious Name**: A function, variable, or type whose name doesn't reveal what it does or holds, or violates `GLOSSARY.md`. → *Fix*: Rename to match domain language; if no clear name exists, clarify the design.
2. **Duplicated Code**: The same logic shape appears in multiple hunks or modules instead of being centralized behind a deep module. → *Fix*: Extract the shared behavior behind a single seam.
3. **Feature Envy**: A function reaches into another module's internal data more than its own. → *Fix*: Move the behavior into the module that owns the data.
4. **Data Clumps**: The same 3+ parameters or fields travel together across multiple signatures. → *Fix*: Bundle them into a first-class domain value object/type.
5. **Primitive Obsession**: Raw strings, numbers, or booleans standing in for domain concepts (`OrderId`, `TenantSlug`, `CurrencyAmount`, state enums). → *Fix*: Introduce a branded/domain type.
6. **Repeated Switches**: The same `switch` or `if/else` cascade over a type code recurs across files. → *Fix*: Consolidate into a single polymorphism seam or exhaustive dispatch map.
7. **Shotgun Surgery**: One logical feature change forces scattered edits across many unrelated files. → *Fix*: Increase **locality** by co-locating related behavior into one module.
8. **Divergent Change**: One file or module is modified for several unrelated reasons (e.g., DB persistence + UI formatting + auth rules). → *Fix*: Split along responsibility seams.
9. **Speculative Generality**: Abstractions, flags, or hooks added for hypothetical future needs not in the Jira ticket or Spec. → *Fix*: Delete and inline (YAGNI).
10. **Message Chains**: Long `a.getB().getC().getD()` navigation coupling the caller to internal structure. → *Fix*: Hide the traversal behind the owning module's interface.
11. **Middle Man**: A shallow class/module that does nothing but delegate every call to another object. → *Fix*: Fails the Deletion Test; inline or deepen.
12. **Refused Bequest**: A subclass or adapter that ignores or throws `NotImplemented` for most of its interface. → *Fix*: Narrow the interface or replace inheritance with composition.

## Testing Guidelines
- Always write integration tests before submitting PRs (learned 2026-11-05) <!-- cid:469223572479d928 author:engineer -->
