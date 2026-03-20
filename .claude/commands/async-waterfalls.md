Evaluate the entire codebase against the No Async Waterfalls rule below. Review all source code under `src/` and `amplify/`.

Use two separate agents with distinct responsibilities:

### Agent 1: Finder

Scan the entire codebase for candidate violations of the rule below. Report every case that *might* be a violation. Do NOT apply the diminishing returns filters — do NOT judge whether an issue is "worth fixing" or "minor." Cast a wide net. For each candidate, report the file path, the relevant code, and which principle it may violate.

### Agent 2: Filter

Receive the candidate list from Agent 1. For each candidate, apply ALL four diminishing returns filters below. Show your reasoning for each filter (pass/fail). Use `git log` to check stability and `grep` to verify consumer counts — do not guess. Silently drop candidates that fail any filter. For candidates that pass all filters, produce the final report entry.

---

For each issue that passes all filters, report:
1. **Location**: file path and relevant code
2. **Violation**: which principle is violated
3. **Impact**: estimated latency cost (how many sequential round trips could be parallelized)
4. **Suggestion**: how to fix it

At the end, provide an **Overall Assessment** verdict (see below).

## Rule: No Async Waterfalls

Sequential `await` calls where the second does not depend on the result of the first waste time by creating artificial waterfalls. Independent async operations should run in parallel using `Promise.all` or `Promise.allSettled`. This is the single most impactful performance issue in React/Next.js applications — each unnecessary sequential await adds a full network round trip to the user's wait time.

### Implementation

**Parallelize independent async operations:**
- When two or more `await` calls appear sequentially and the second does not use the result of the first, they should be wrapped in `Promise.all`
- This applies to data fetching, database operations, API calls, and any I/O-bound work
- The pattern `const a = await fetchA(); const b = await fetchB();` should be `const [a, b] = await Promise.all([fetchA(), fetchB()]);` when `fetchB` does not need `a`

**Recognize true dependencies:**
- `const user = await getUser(id); const orders = await getOrders(user.accountId);` — this IS dependent, sequential is correct
- `const user = await getUser(id); const settings = await getSettings(id);` — these are independent, should be parallel
- The test: does the second call reference any variable assigned by the first call?

**Batch sequential operations on collections:**
- `for (const item of items) { await process(item); }` is a waterfall when items are independent
- Use `Promise.all(items.map(item => process(item)))` for independent items
- Use batched parallel processing when the number of items is large: process in chunks of N with `Promise.all` per chunk
- Keep sequential processing when order matters (e.g., transactions that must be applied chronologically) or when the API has rate limits that require throttling

**Watch for fetch-render-fetch cascades:**
- A parent component fetches data, renders, then a child component fetches more data based on props — this is a waterfall
- Hoist both fetches to the parent and pass results as props, or fetch in parallel if both data sources are known upfront
- In Next.js App Router, colocate data fetching in Server Components to enable automatic request deduplication

**What is NOT a violation:**
- Sequential awaits where the second genuinely depends on the first's result
- Sequential operations where order matters for correctness (e.g., delete children before parent, create record before creating its relations)
- Sequential awaits inside a loop where each iteration depends on the previous (e.g., pagination: fetch page N, use cursor for page N+1)
- Rate-limited operations that intentionally throttle throughput (e.g., batched deletes with a batch size limit)
- Error handling patterns where the second operation should only run if the first succeeds and you need granular error reporting per step
- `await` inside a `for` loop when batching with `Promise.all` per chunk — the chunks themselves are sequential by design

### Diminishing Returns Filters

Before reporting any issue, it must pass ALL of the following filters. If it fails any one, drop it silently.

**Independence filter:** Are the sequential operations truly independent? Trace the data flow carefully. If the second operation uses any value produced by the first (even indirectly through shared state), it is dependent and sequential is correct. Only flag when there is NO data dependency between the operations.

**Latency filter:** Would parallelizing provide meaningful latency improvement? Two sequential `localStorage.getItem()` calls are technically a waterfall but complete in microseconds. Focus on operations that involve network I/O (API calls, database queries, external service calls) where each sequential step adds 50ms+ of latency.

**Complexity filter:** Would parallelizing make the code significantly harder to understand? If the sequential flow has clear step-by-step error handling where each step's error message is specific (e.g., "Failed to create transaction" then "Failed to update wallet"), parallelizing would merge the error paths and lose specificity. Only flag when the parallel version is at least as clear as the sequential version.

**Stability filter:** Has the code in question been stable (few recent git changes)? Waterfalls in stable code that users aren't complaining about are lower priority. Focus on code that is actively modified or on critical user paths (page load, form submission).

### Overall Assessment

After evaluating all candidate issues against the filters, end the report with exactly one of these verdicts:

- **"Stop — async operations are well-parallelized"**: Use when no issues pass the filters, or all remaining issues are borderline. Recommend no further runs of this rule until significant new code is added.
- **"N issues worth fixing"**: Use when genuine issues remain. Only count issues that passed all filters.