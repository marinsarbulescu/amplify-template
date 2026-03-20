Evaluate the entire codebase against the React Render Performance rule below. Review all source code under `src/` and `amplify/`.

Use two separate agents with distinct responsibilities:

### Agent 1: Finder

Scan the entire codebase for candidate violations of the rule below. Report every case that *might* be a violation. Do NOT apply the diminishing returns filters — do NOT judge whether an issue is "worth fixing" or "minor." Cast a wide net. For each candidate, report the file path, the relevant code, and which principle it may violate.

### Agent 2: Filter

Receive the candidate list from Agent 1. For each candidate, apply ALL four diminishing returns filters below. Show your reasoning for each filter (pass/fail). Use `git log` to check stability and `grep` to verify usage counts — do not guess. Silently drop candidates that fail any filter. For candidates that pass all filters, produce the final report entry.

---

For each issue that passes all filters, report:
1. **Location**: file path and relevant code
2. **Violation**: which principle is violated
3. **Impact**: what unnecessary work the browser/React is doing and the user-visible effect (jank, delay, wasted cycles)
4. **Suggestion**: how to fix it

At the end, provide an **Overall Assessment** verdict (see below).

## Rule: React Render Performance

React re-renders components whenever state or props change. When components do expensive work during render — recomputing derived data, creating new objects/arrays, defining inline functions or components — every re-render repeats that work unnecessarily. This rule catches patterns where the render path does more work than necessary.

### Implementation

**Don't define components inside components:**
- A component defined inside another component's render body is unmounted and remounted on every parent re-render, destroying all internal state
- `const Row = ({ item }) => <tr>...</tr>` defined inside a parent component is recreated each render — React sees a new component type every time
- Extract to module-level: define all components at the top level of the file or in separate files
- This is the most impactful violation — it causes full DOM teardown and rebuild, not just a re-render

**Memoize expensive derived computations:**
- Filtering, sorting, or transforming large arrays on every render wastes cycles: `const sorted = items.sort(...)` runs on every re-render
- Wrap in `useMemo` with appropriate dependencies: `const sorted = useMemo(() => [...items].sort(...), [items])`
- Do NOT over-memoize: simple property access, string concatenation, basic arithmetic, or boolean expressions do not need `useMemo` — the memoization overhead exceeds the computation cost
- The threshold: if the computation iterates over a collection or performs O(n) work, consider memoizing; if it's O(1), don't

**Avoid creating new references in render for stable data:**
- `style={{ color: 'red' }}` in JSX creates a new object every render — hoist to a module-level constant: `const redStyle = { color: 'red' }`
- Array/object literals passed as props that never change should be constants: `columns={[...]}` recreated every render should be `const COLUMNS = [...]` at module level
- Default prop values as objects/arrays (`= []`, `= {}`) inside a memoized component's parameters defeat memoization — extract to module-level constants

**Stabilize callback props to memoized children:**
- When a child component uses `React.memo`, passing `onClick={() => handleClick(id)}` creates a new function each render, defeating the memo
- Use `useCallback` for handlers passed to memoized children or components in lists
- Do NOT blanket-wrap every handler in `useCallback` — only when the callback is passed to a memoized child or used as a dependency in another hook

**Calculate derived state during render instead of syncing with useEffect:**
- Anti-pattern: `useEffect(() => { setFiltered(items.filter(...)) }, [items])` — causes a double render (first with stale state, then with updated)
- Correct: `const filtered = useMemo(() => items.filter(...), [items])` — computed in a single render pass
- When you see `useState` + `useEffect` that transforms one state into another, it's almost always a derive-during-render candidate

**Use lazy state initialization for expensive defaults:**
- `useState(computeExpensiveDefault())` runs the computation on every render but only uses the result on mount
- Use the lazy form: `useState(() => computeExpensiveDefault())` to run once
- This applies when the initial value comes from `localStorage`, parsing, or any non-trivial computation

**Avoid unnecessary re-renders from context:**
- A context that bundles many values causes all consumers to re-render when any value changes, even if they only use one
- If a context has values that change at different rates, consumers of rarely-changing values re-render on every frequent-value update
- Split contexts by change frequency, or use `useMemo` on the context value object to prevent re-renders when values haven't actually changed
- `value={{ data, isLoading }}` creates a new object every render — wrap in `useMemo`

**Use stable keys in lists:**
- `key={index}` causes React to re-mount items when the list order changes (sort, filter, insert) instead of moving existing DOM nodes
- Use a stable, unique identifier: `key={item.id}`
- The cost: with index keys, adding an item at the top of a 100-row table re-renders all 100 rows; with stable keys, React inserts one new row

**What is NOT a violation:**
- `useMemo`/`useCallback` omitted for computations that are O(1) and not passed to memoized children — memoization has its own overhead and is not free
- Inline arrow functions in JSX for event handlers on native elements (`<button onClick={() => ...}>`) that are not memoized and are not in lists — the React reconciler handles this efficiently
- A component that re-renders frequently but does minimal work each time — fast re-renders are fine, only slow re-renders matter
- `useState` + `useEffect` for async data fetching (fetch on mount or on dependency change) — this is NOT derived state, it's a side effect
- Context providers that wrap the entire app but update infrequently — the re-render cost is proportional to consumers that actually read the changing values
- Simple prop drilling through 2-3 levels — unless it causes measurable re-render cascades, this is a readability concern (covered by other rules), not a performance concern

### Diminishing Returns Filters

Before reporting any issue, it must pass ALL of the following filters. If it fails any one, drop it silently.

**Render frequency filter:** Is the component likely to re-render frequently? Check if it consumes context that updates often, is inside a list that re-renders on data changes, or has state that updates on user interaction (typing, scrolling). A component that renders once on page load and never again is unlikely to benefit from render optimization. Focus on components in hot paths: table rows, frequently-updated dashboards.

**Computation cost filter:** Is the work being repeated on each render actually expensive? Sorting/filtering an array of 5 items is trivial. Sorting 500 items, or running a reduce over hundreds of records, is worth memoizing. Estimate the computational cost — if it's sub-millisecond, it's not worth the memoization overhead. Focus on O(n) operations over collections with 50+ items or DOM-heavy re-renders.

**Measurability filter:** Would the fix produce a user-perceptible improvement? A component that re-renders 3 times on a button click but completes in <16ms total is not causing jank. Focus on patterns that could cause dropped frames (>16ms render), visible flicker (double-render from useEffect state sync), or unnecessary DOM teardown (inline component definitions).

**Stability filter:** Has the code in question been stable (few recent git changes)? Render performance issues in stable code that users aren't reporting problems with are lower priority. Focus on actively-modified components or components on critical user paths.

### Overall Assessment

After evaluating all candidate issues against the filters, end the report with exactly one of these verdicts:

- **"Stop — render performance is well-managed"**: Use when no issues pass the filters, or all remaining issues are borderline. Recommend no further runs of this rule until significant new code is added.
- **"N issues worth fixing"**: Use when genuine issues remain. Only count issues that passed all filters.