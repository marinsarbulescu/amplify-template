Evaluate the entire codebase against the Abstraction Levels rule below. Review all source code under `src/` and `amplify/`.

Use two separate agents with distinct responsibilities:

### Agent 1: Finder

Scan the entire codebase for candidate violations of the rule below. Report every case that *might* be a violation. Do NOT apply the diminishing returns filters — do NOT judge whether an issue is "worth fixing" or "minor." Cast a wide net. For each candidate, report the file path, the relevant code, and which principle it may violate.

### Agent 2: Filter

Receive the candidate list from Agent 1. For each candidate, apply ALL four diminishing returns filters below. Show your reasoning for each filter (pass/fail). Use `git log` to check stability and `grep` to verify consumer counts — do not guess. Silently drop candidates that fail any filter. For candidates that pass all filters, produce the final report entry.

---

For each issue that passes all filters, report:
1. **Location**: file path and relevant code
2. **Violation**: which principle is violated
3. **Impact**: what would break or scatter if a specific change occurred
4. **Suggestion**: how to fix it

At the end, provide an **Overall Assessment** verdict (see below).

## Rule: Abstraction Levels

Code at different levels of abstraction should be separated into distinct functions, hooks, or modules. Higher-level code orchestrates by delegating to lower-level code, without knowing implementation details. Mixing orchestration with mechanics makes code harder to understand and change, because modifications to low-level details force changes to high-level coordination.

### Implementation

**Separate orchestration from mechanics:**
- High-level functions coordinate by calling lower-level functions
- High-level functions don't contain implementation details (string parsing, arithmetic, DOM manipulation)
- Low-level functions implement specifics without orchestrating workflows
- A React component's render body should read like a description of *what* is shown, not *how* values are computed

**Recognize levels through delegation structure:**
- If function A calls function B, A is at a higher level than B
- The call hierarchy reveals the abstraction hierarchy
- Components are higher-level than the hooks and utilities they consume
- Hooks are higher-level than the pure utility functions they call

**At component level:**
- Components that orchestrate layout and delegate to child components are at a higher level
- Components that implement specific UI mechanics (drag-and-drop, virtualized lists) are at a lower level
- Inline data transformation in JSX (`.map`, `.filter`, `.reduce` chains with complex logic) often signals mixed levels

**At hook level:**
- A hook that coordinates fetch → transform → setState is orchestration
- The transform logic (parsing, calculations, formatting) is mechanics — extract it to named utility functions
- Stop extracting when further splitting breaks cohesion or creates functions with no clear responsibility

**At utility/function level:**
- Extract implementation details into named helper functions
- Keep orchestrating functions focused on coordination
- A function doing CSV parsing inline while also coordinating a multi-step import is mixing levels

**These patterns are NOT violations:**
- Pure utility functions with complex but single-level logic (e.g., a 30-line calculation that operates at one abstraction level throughout)
- Components with straightforward inline expressions (e.g., `{items.length > 0 && <List />}`, `{price.toFixed(2)}`)
- Private helper functions within the same file that serve the file's single responsibility
- Type guards, type assertions, and conditional rendering based on data shape — this is often domain logic, not leaked abstraction
- React hooks that are inherently multi-step by design (`useEffect` with fetch + setState is the standard React pattern, not a violation)

**Test:** Ask "If I extract this, does it reduce complexity or just move it?" If extraction creates a function with no clear responsibility or forces artificial naming (`getAndFormat`, `checkAndConvert`), leave it inline. Extraction should reveal intent, not obscure it.

### Diminishing Returns Filters

Before reporting any issue, it must pass ALL of the following filters. If it fails any one, drop it silently.

**Clarity filter:** Would extracting the low-level code into a named function actually improve readability? If the inline code is short (under ~10 lines), self-explanatory, and appears only once, extraction may hurt readability by forcing the reader to jump to another function. Only flag when the mixed levels genuinely obscure the high-level flow.

**Natural pattern filter:** Is the mixing occurring in a standard React/Next.js pattern? `useEffect` with fetch + transform + setState, inline `.map()` in JSX, or `getServerSideProps` doing fetch + transform are idiomatic patterns. Only flag if the inline logic is so complex that it buries the orchestration intent.

**File count filter:** Would the fix increase the total number of source files? If the only way to fix it is to create a new file, the issue must be severe enough that multiple consumers would benefit from the extraction — not just one call site.

**Stability filter:** Has the code in question been stable (few recent git changes)? Mixed levels in stable code is low-risk. Focus on code that actually changes frequently.

### Overall Assessment

After evaluating all candidate issues against the filters, end the report with exactly one of these verdicts:

- **"Stop — abstraction levels are well-separated"**: Use when no issues pass the filters, or all remaining issues are borderline. Recommend no further runs of this rule until significant new code is added.
- **"N issues worth fixing"**: Use when genuine issues remain. Only count issues that passed all filters.