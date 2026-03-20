Evaluate the entire codebase against the Single Type Source of Truth rule below. Review all source code under `src/` and `amplify/`.

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

## Rule: Single Type Source of Truth

Each domain type should be defined once and imported everywhere it is used. When the same data shape is declared independently in multiple files — even with subtly different field subsets — changes to the underlying data model scatter across all declarations. TypeScript's type system (`Pick`, `Omit`, `Partial`) exists precisely to derive narrower views from a single canonical definition.

### Implementation

**Define each domain type once, derive variations:**
- Canonical types for domain entities should each be defined in one place
- Components that need a subset of fields should use `Pick<Entity, "id" | "field1" | "field2">` rather than re-declaring the interface
- Use `Omit`, `Partial`, and intersection types to create variations without duplicating the base shape
- Enum-like union types should be defined once and imported

**Leverage generated types where available:**
- When the data layer generates types (e.g., Amplify Gen 2 schema types), derive frontend types from those rather than hand-writing parallel interfaces
- If generated types are too broad, narrow them with `Pick`/`Omit` — still a single source of truth

**Type constants belong with their types:**
- Label maps, type lists, and similar type-adjacent constants should live near the type definition, not be re-declared per component
- If a constant is derived from a type (e.g., a label map for each enum value), it should be defined once alongside that type

**What is NOT a violation:**
- Component-specific prop interfaces — these are unique to each component
- Local state types that exist only within one component
- Types that genuinely differ in structure (not just field subset) across files
- Re-exporting types from a barrel file for convenience
- Types in test files that mirror production types for mocking purposes

**Test by asking: "If I add a field to this entity in the database, how many files need a type change?"**
- If the answer is more than 1-2 files (the canonical definition + possibly the schema), the type is duplicated
- If different files define the same type name with different field subsets, they will drift apart when the data model changes

### Diminishing Returns Filters

Before reporting any issue, it must pass ALL of the following filters. If it fails any one, drop it silently.

**Drift risk filter:** Are the duplicate type definitions actually at risk of drifting apart? If the types are identical and in files that are always modified together (e.g., a page and its co-located component), the risk is low. Only flag when the duplicates are in files that change independently.

**Consumer count filter:** Is the type duplicated in 3 or more files? Two files with the same type is borderline — the cost of consolidating may not justify the change. Three or more duplicates indicates a systemic issue worth fixing.

**Derivability filter:** Can the duplicate be replaced with a `Pick`/`Omit`/`Partial` derivation from an existing canonical type? If the duplicate has fields that don't exist on any canonical type (i.e., it represents a computed or UI-specific shape), it's not truly a duplicate — it's a distinct type that happens to share some field names.

**Stability filter:** Has the underlying data model been stable (few recent schema or type changes)? Type duplication in a stable schema is low-risk. Focus on types whose schema has changed recently or is likely to change.

### Overall Assessment

After evaluating all candidate issues against the filters, end the report with exactly one of these verdicts:

- **"Stop — types are well-managed"**: Use when no issues pass the filters, or all remaining issues are borderline. Recommend no further runs of this rule until significant new code is added.
- **"N issues worth fixing"**: Use when genuine issues remain. Only count issues that passed all filters.