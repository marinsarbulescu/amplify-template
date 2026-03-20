Evaluate the entire codebase against the Consistent Error Handling rule below. Review all source code under `src/` and `amplify/`.

Use two separate agents with distinct responsibilities:

### Agent 1: Finder

Scan the entire codebase for candidate violations of the rule below. Report every case that *might* be a violation. Do NOT apply the diminishing returns filters — do NOT judge whether an issue is "worth fixing" or "minor." Cast a wide net. For each candidate, report the file path, the relevant code, and which principle it may violate.

### Agent 2: Filter

Receive the candidate list from Agent 1. For each candidate, apply ALL four diminishing returns filters below. Show your reasoning for each filter (pass/fail). Use `git log` to check stability and `grep` to verify consumer counts — do not guess. Silently drop candidates that fail any filter. For candidates that pass all filters, produce the final report entry.

---

For each issue that passes all filters, report:
1. **Location**: file path and relevant code
2. **Violation**: which principle is violated
3. **Impact**: what would the user experience if this error path is triggered
4. **Suggestion**: how to fix it

At the end, provide an **Overall Assessment** verdict (see below).

## Rule: Consistent Error Handling

Error handling should follow uniform patterns across the application so that users see consistent feedback and developers can reason about failure modes without reading every handler. When error handling is inconsistent — some paths show inline banners, others show browser alerts, others fail silently — the application feels unreliable and bugs in error paths are hard to diagnose.

### Implementation

**Choose one user-facing error mechanism per context and use it everywhere:**
- Within page components: use the page's `setError()` state + inline error banner pattern consistently
- Do not mix `alert()`, `setError()`, `console.error()`-only, and silent catches within the same page or feature
- If the page has an error auto-dismiss timer, all errors on that page should use it

**Every async operation must have explicit error handling:**
- All `await` calls inside event handlers and callbacks must be wrapped in try/catch
- Catch blocks must either display a user-facing error OR re-throw — never silently swallow
- `console.error()` alone is NOT sufficient error handling for user-initiated actions (it is acceptable for background/optional operations like analytics)

**Error messages should provide context:**
- Bad: `"Failed to save"`, `"Something went wrong"`
- Good: `"Failed to save transaction: {specific reason}"`, `"Cannot delete: has remaining items"`
- Include the entity or action in the message so the user knows what failed
- When the API returns error details, include them: `result.errors.map(e => e.message).join(", ")`

**Validation errors are different from operation errors:**
- Validation errors (bad input, missing fields, business rule violations) should be shown inline near the relevant form field or as a contextual message — before the operation is attempted
- Operation errors (network failure, API error, unexpected state) should be shown after the operation fails
- Do not use the same mechanism for both if it creates confusion (e.g., a network error appearing next to a form field)

**What is NOT a violation:**
- `console.error()` for logging alongside a user-facing error display — logging is fine as supplementary
- Different error mechanisms across different pages — each page can have its own pattern as long as it's consistent within itself
- Scripts and CLI tools using `console.error()` and `process.exit()` — these are not user-facing UIs
- Optimistic error handling where the error is auto-dismissed after a timeout
- Catch blocks that re-throw after logging — the error is handled by a parent

**Red flags to look for:**
- `catch {}` or `catch { }` — empty catch blocks that swallow errors
- `catch (e) { console.error(e) }` as the only handling for a user-initiated action
- `alert()` mixed with `setError()` in the same page component
- Async functions called without `await` (fire-and-forget) in user-initiated handlers
- Generic error messages that don't mention what action or entity failed

### Diminishing Returns Filters

Before reporting any issue, it must pass ALL of the following filters. If it fails any one, drop it silently.

**User impact filter:** Would a real user encounter this error path during normal usage? If the error only occurs in edge cases that require corrupted data or manual database manipulation, it's low priority. Focus on error paths triggered by common failures: network errors, validation failures, concurrent edits, API rate limits.

**Consistency filter:** Is this an isolated inconsistency or part of a pattern? A single `alert()` in a page that otherwise uses `setError()` everywhere is worth fixing. But if the entire page consistently uses `alert()` for all errors (even if other pages use `setError()`), it's internally consistent and lower priority.

**Severity filter:** What happens if the error is swallowed? If a silently-swallowed error leaves the UI in a stale/incorrect state (e.g., user thinks a save succeeded but it didn't), that's high severity. If the error is in a non-critical path (e.g., failing to log analytics), it's low severity.

**Stability filter:** Has the error handling code been stable (few recent git changes)? Inconsistent error handling in stable code is lower risk than in actively-modified code where new patterns are being introduced.

### Overall Assessment

After evaluating all candidate issues against the filters, end the report with exactly one of these verdicts:

- **"Stop — error handling is consistent"**: Use when no issues pass the filters, or all remaining issues are borderline. Recommend no further runs of this rule until significant new code is added.
- **"N issues worth fixing"**: Use when genuine issues remain. Only count issues that passed all filters.