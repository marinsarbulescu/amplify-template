Implement the described feature or fix using strict Test-Driven Development with this project's stack.

## Project Test Stack

- **Unit tests:** Jest + React Testing Library (`npm test`)
- **Watch mode:** `npm run test:watch`
- **Coverage:** `npm run test:coverage`
- **E2E tests:** Playwright (`npm run e2e` or `npm run e2e:headless`)
- **Test location:** Co-locate test files next to source files as `<name>.test.ts` or `<name>.test.tsx`
- **Path alias:** Use `@/` for imports from `src/` in test files

## TDD Workflow

Follow the strict Red-Green-Refactor cycle for every behavior change:

### 1. RED — Write ONE failing test

- One test, one behavior, clear name describing what should happen
- Use real code — avoid mocks unless absolutely necessary (e.g., external APIs, AWS Amplify services)
- For React components: use `@testing-library/react` with `render`, `screen`, `userEvent`
- For utilities/hooks: test the public API, not internals

Run:
```bash
npm test -- --testPathPattern="<test-file>"
```

Confirm the test **fails for the right reason** (missing feature, not a typo or import error).

### 2. GREEN — Write MINIMUM code to pass

- Simplest implementation that makes the test green
- No extra features, no "while I'm here" improvements
- Do not refactor yet

Run:
```bash
npm test -- --testPathPattern="<test-file>"
```

Confirm the test **passes** and all other tests remain green.

### 3. REFACTOR — Clean up while green

- Remove duplication, improve names, extract helpers
- Keep all tests passing — run the full suite after refactoring
- No new behavior in this phase

### 4. REPEAT — Next behavior, next failing test

## Rules

- **NEVER write production code without a failing test first.** If you did, delete it and start over.
- **NEVER write more than one test at a time.** Vertical slices, not horizontal.
- **NEVER skip running tests.** Every RED and GREEN phase must include actual test output.
- **NEVER claim work is complete without showing passing test output.**
- For **bug fixes**: write a failing test that reproduces the bug first, then fix.
- For **React components**: test user-visible behavior (what the user sees/clicks), not implementation details.
- For **Amplify data/auth**: mock AWS services at the boundary, test business logic with real code.

## Test Conventions

- Use `describe` blocks grouped by component/function name
- Use `it` or `test` with descriptive names: `it('rejects empty email with validation error')`
- Prefer `screen.getByRole`, `screen.getByText` over `getByTestId`
- Use `userEvent` over `fireEvent` for user interactions
- Keep test setup minimal — extract shared setup into `beforeEach` only when 3+ tests need it

## Input

$ARGUMENTS
