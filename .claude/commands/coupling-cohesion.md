Evaluate the entire codebase against the Coupling and Cohesion rule below. Review all source code under `src/` and `amplify/`.

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

## Rule: Coupling and Cohesion

Code should be organized so that elements that change together are grouped together, and elements that change for different reasons are kept separate. This minimizes the scope of change - when requirements evolve, modifications should be localized rather than scattered. The goal is high cohesion within boundaries and low coupling across boundaries.

### Implementation

**Group code that changes together for the same reason:**
- CRUD operations (read, insert, update, delete) belong together when they all change if the data structure changes
- Related domain operations that share the same business rules
- Infrastructure code that changes when a technical decision changes (database, framework, protocol)

**Separate code that changes for different reasons:**
- Different business domains should be in different packages
- Different infrastructure concerns should be in different modules
- Code with different reasons to change should be in different classes

**Test by asking: "If X changes, what code needs to change?"**
- If unrelated code would need changes, separation is insufficient
- If the same change scatters across many places, cohesion is insufficient

**At package level:** organize by business domain first, not technical layers
- Group by feature/domain: `payments.creditcard`, `payments.paypal`
- Not by technical function: `controllers/`, `services/`, `repositories/`

**At class level:** group related operations that share a reason to change

**At method level:** group operations that always change together

### Diminishing Returns Filters

Before reporting any issue, it must pass ALL of the following filters. If it fails any one, drop it silently.

**Indirection filter:** Would the fix just move imports one file away without reducing the number of files that change during a real modification? If yes, skip it. A facade that re-exports doesn't reduce coupling — it adds a file and a layer of indirection.

**Natural integration point filter:** Is the coupling occurring in a page, route handler, or top-level component? These are *supposed* to pull things together — that's their job. Only flag if the page is doing multi-step orchestration that is duplicated in other pages or hooks (i.e., the same sequence appears in multiple places).

**File count filter:** Would the fix increase the total number of source files? If the only way to fix it is to create a new file, the issue must be severe enough that multiple consumers would benefit from the extraction — not just one call site.

**Stability filter:** Has the code in question been stable (few recent git changes)? Coupling in stable code is low-risk. Focus on code that actually changes frequently.

### Overall Assessment

After evaluating all candidate issues against the filters, end the report with exactly one of these verdicts:

- **"Stop — codebase is well-structured"**: Use when no issues pass the filters, or all remaining issues are borderline. Recommend no further runs of this rule until significant new code is added.
- **"N issues worth fixing"**: Use when genuine issues remain. Only count issues that passed all filters.