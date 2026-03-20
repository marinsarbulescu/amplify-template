Evaluate the entire codebase against the Component Single Responsibility rule below. Review all source code under `src/` and `amplify/`.

Use two separate agents with distinct responsibilities:

### Agent 1: Finder

Scan the entire codebase for candidate violations of the rule below. Report every case that *might* be a violation. Do NOT apply the diminishing returns filters — do NOT judge whether an issue is "worth fixing" or "minor." Cast a wide net. For each candidate, report the file path, the relevant code, and which principle it may violate.

### Agent 2: Filter

Receive the candidate list from Agent 1. For each candidate, apply ALL four diminishing returns filters below. Show your reasoning for each filter (pass/fail). Use `git log` to check stability and `grep` to verify consumer counts — do not guess. Silently drop candidates that fail any filter. For candidates that pass all filters, produce the final report entry.

---

For each issue that passes all filters, report:
1. **Location**: file path and relevant code
2. **Violation**: which principle is violated
3. **Impact**: what distinct responsibilities are mixed and how they interfere with each other
4. **Suggestion**: how to decompose it

At the end, provide an **Overall Assessment** verdict (see below).

## Rule: Component Single Responsibility

Each React component file should have one primary reason to change. When a component handles data fetching, business logic, state management, and complex rendering all in one file, any change to one concern risks breaking the others, the file becomes hard to navigate, and the component is impossible to test in isolation. This rule operates at the file/component level — it complements the Abstraction Levels rule (which operates at the function level) by addressing the higher-level question of whether a file has too many distinct jobs.

### Implementation

**A component should either orchestrate or implement, not both at scale:**
- A page component that fetches data, transforms it, manages 8 pieces of state, handles 6 different CRUD operations, and renders 500+ lines of JSX is doing too many jobs
- Split into: (a) a page/container that orchestrates data flow, and (b) child components or custom hooks that own specific concerns
- The page should read like a table of contents: fetch data, pass to components, handle top-level callbacks

**Recognize distinct responsibilities by counting "reasons to change":**
- Data fetching logic: changes when the API or data model changes
- Business logic (calculations, validation, transformations): changes when business rules change
- CRUD handlers (create, update, delete operations): change when workflows change
- State management (useState, useReducer): changes when the UI interaction model changes
- Rendering/JSX: changes when the visual design changes
- Column/table definitions: change when display requirements change
- Modal orchestration (open/close state, which modal is active): changes when UX flow changes

If a single file contains 4+ of these categories with significant complexity in each, it has too many responsibilities.

**Extract by responsibility, not by size:**
- Don't just split a file in half — split along responsibility boundaries
- A custom hook can own "all CRUD operations" or "state management"
- A child component can own "table with column definitions and rendering"
- The remaining page component wires them together

**Indicators of excessive responsibility:**
- File exceeds ~500 lines (not a hard rule — a 600-line file with one clear purpose is fine; a 400-line file with 5 purposes is not)
- More than 5 `useState` calls in a single component
- More than 3 data-fetching functions defined in a single file
- More than 3 CRUD handler functions (`handleCreate`, `handleUpdate`, `handleDelete`, etc.) in a single file
- JSX render section exceeds ~200 lines with complex conditional rendering
- Multiple `useMemo`/`useCallback` hooks computing unrelated derived state

**What is NOT a violation:**
- A page component that imports and composes multiple child components with simple prop passing — that's the page's job (composition root)
- A component with many `useState` calls that are all part of one cohesive form (e.g., a form with 8 fields = 8 `useState` is fine if they all serve the same form)
- A file with helper functions that serve the single component in that file — co-location is fine when the helpers aren't reusable
- A component that is long purely because of JSX markup (many similar sections) but has simple logic — size alone isn't the issue
- Utility files that contain many functions — these are organized by technical purpose, not by component responsibility
- Scripts that are inherently multi-step (CLI tools, migration scripts) — they have one responsibility: run the script

**Relationship to other rules:**
- **Abstraction Levels** asks: "Does this function mix orchestration with mechanics?" — operates at function level
- **Component Single Responsibility** asks: "Does this file mix unrelated concerns?" — operates at file/component level
- **Coupling & Cohesion** asks: "Is this code grouped by what changes together?" — operates at cross-file level
- These three rules are complementary, not overlapping. A file can pass Abstraction Levels (each function is clean) while failing Component Responsibility (the file has too many unrelated clean functions).

### Diminishing Returns Filters

Before reporting any issue, it must pass ALL of the following filters. If it fails any one, drop it silently.

**Decomposition clarity filter:** Can the file be split into pieces with clear, descriptive names? If the only way to split it produces awkwardly-named fragments with no clear single responsibility each, the decomposition isn't worth it. The extracted pieces must each have a name that describes their one job.

**Independence filter:** Would the extracted pieces be genuinely independent, or would they need to pass 10+ props/callbacks back and forth to function? If extraction creates a web of tightly-coupled siblings that are harder to understand than the original monolith, the cure is worse than the disease. Only flag when at least one extraction would result in a piece with a clean, narrow interface (3-5 props).

**Change frequency filter:** Does the file actually experience changes to multiple responsibilities? Use `git log` to check. If the file changes frequently but always for the same reason (e.g., only the CRUD handlers change), it has one effective responsibility despite its size. Only flag when `git log` shows changes touching different sections for different reasons.

**Stability filter:** Has the file been stable recently (few git changes in the last 3 months)? A large file that nobody modifies is low priority regardless of how many responsibilities it contains. Focus on files that are actively modified.

### Overall Assessment

After evaluating all candidate issues against the filters, end the report with exactly one of these verdicts:

- **"Stop — components are well-scoped"**: Use when no issues pass the filters, or all remaining issues are borderline. Recommend no further runs of this rule until significant new code is added.
- **"N issues worth fixing"**: Use when genuine issues remain. Only count issues that passed all filters.