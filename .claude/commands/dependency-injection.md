Evaluate the entire codebase against the Dependency Injection rule below. Review all source code under `src/` and `amplify/`.

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

## Rule: Dependency Injection

Components, hooks, and modules should receive their behavioral dependencies (data fetching, side effects, external services) from the outside rather than hard-coding them internally. This makes code testable, swappable, and explicit about what it needs. In React/Next.js, "injection" happens through props, Context, and hook parameters — not through class constructors.

### Implementation

**Components should receive behavioral dependencies via props or Context:**
- Data-fetching functions, mutation callbacks, and service clients should be passed in — not imported directly inside the component that uses them
- React Context is proper dependency injection: a Provider at a composition root supplies a concrete implementation, and consumers depend only on the context interface
- Callback props (`onSave`, `onDelete`, `fetchData`) are constructor injection — the parent decides the concrete behavior

**Pages, layouts, and route handlers are composition roots:**
- These files are *supposed* to import concrete implementations and wire them together — that is their job
- A `page.tsx` importing a specific client, calling a specific API, and passing results as props to child components is correct DI
- Provider components wrapping `children` in `layout.tsx` are composition root wiring

**Separate wiring from work:**
- Module-level side effects at import time are the equivalent of "constructors doing work" — avoid them
- Hooks should not unconditionally trigger network requests or subscriptions on mount unless that is their explicit, documented purpose
- Configuration and environment values should flow from composition roots, not be read from `process.env` deep inside utility functions

**Direct use of concrete types is fine for:**
- Pure utility functions with no side effects — these are deterministic transformations
- TypeScript type imports and interfaces
- Language/framework primitives (`useState`, `useEffect`, `useRouter`, `useCallback`)
- Self-contained UI hooks with no external dependencies (e.g., `usePagination`, `useColumnVisibility`)
- Static configuration constants and enums

**Red flags to look for:**
- A non-page component directly importing and calling the Amplify `client` to fetch or mutate data, instead of receiving data/callbacks via props
- A utility function that reads `process.env` or `localStorage` internally rather than accepting those values as parameters
- A component that imports a concrete service module (not a type) when it could receive the behavior via a callback prop
- Hooks that import and call specific API clients when the calling component could pass the client or fetch function in
- Hidden global state: modules that maintain mutable state at module scope, invisible to consumers
- Multiple components independently importing the same data-fetching logic instead of lifting it to a shared parent or Context

### Diminishing Returns Filters

Before reporting any issue, it must pass ALL of the following filters. If it fails any one, drop it silently.

**Composition root filter:** Is the direct import occurring in a page, layout, route handler, or top-level Provider component? These are composition roots — they are *supposed* to import and wire concrete implementations. Only flag if the wiring logic is duplicated across multiple composition roots (i.e., the same multi-step fetch-and-transform sequence appears in several pages).

**Testability filter:** Would extracting the dependency actually improve testability? If the module is already easy to test as-is (pure function, or the component is always tested via integration tests that include the real dependency), the refactor adds indirection without benefit. Only flag if the hard-coded dependency makes unit testing difficult or forces test authors to mock at the module level.

**Single-consumer filter:** Does only one component or hook use this dependency? If so, extracting it to a prop or Context parameter just moves the import one level up with no additional consumers benefiting. Only flag if multiple consumers would benefit from the abstraction, or if the single consumer is deeply nested and the dependency should logically live higher in the tree.

**Stability filter:** Has the concrete dependency been stable (few recent git changes, unlikely to be swapped)? Injecting a dependency that has never changed and is unlikely to change adds flexibility that will never be exercised. Focus on dependencies that have changed, are likely to change, or that actively cause testing pain.

### Overall Assessment

After evaluating all candidate issues against the filters, end the report with exactly one of these verdicts:

- **"Stop — dependencies are well-managed"**: Use when no issues pass the filters, or all remaining issues are borderline. Recommend no further runs of this rule until significant new code is added.
- **"N issues worth fixing"**: Use when genuine issues remain. Only count issues that passed all filters.