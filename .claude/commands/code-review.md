Run a full code review against all rules. Review all source code under `src/` and `amplify/`.

## Instructions

1. Read the following rule files:
   - `.claude/commands/coupling-cohesion.md`
   - `.claude/commands/dependency-injection.md`
   - `.claude/commands/abstraction-levels.md`
   - `.claude/commands/single-type-source.md`
   - `.claude/commands/error-handling.md`
   - `.claude/commands/async-waterfalls.md`
   - `.claude/commands/component-responsibility.md`
   - `.claude/commands/render-performance.md`

2. For each rule, run the finder/filter agent pattern described in the rule file:
   - **Agent 1 (Finder):** Scan the codebase for candidate violations. Do NOT apply filters. Cast a wide net.
   - **Agent 2 (Filter):** Receive candidates from the Finder. Apply ALL diminishing returns filters from the rule, using `git log` and `grep` to verify. Drop candidates that fail any filter.

3. Run all eight Finder agents **in parallel**. Once each Finder completes, run its corresponding Filter agent.

4. Produce a **consolidated report** with sections for each rule. For each issue that passes all filters, report:
   - **Location**: file path and relevant code
   - **Violation**: which principle is violated
   - **Impact**: what would break or scatter if a specific change occurred
   - **Suggestion**: how to fix it

5. End with an **Overall Assessment** that summarizes across all rules:
   - Total issues found across all rules
   - Per-rule verdict (from each rule's Overall Assessment criteria)