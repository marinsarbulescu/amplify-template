# Project

## Development Workflow

All feature development and bug fixes MUST follow Test-Driven Development (red-green-refactor). Use the `/tdd` command workflow for every implementation task — no production code without a failing test first.

## Project Stack

- **Framework:** Next.js 15 + React 19
- **Backend:** AWS Amplify Gen 2 (data, auth)
- **Testing:** Jest + React Testing Library (unit), Playwright (E2E)
- **Test files:** Co-located next to source as `<name>.test.ts` / `<name>.test.tsx`
- **Path alias:** `@/` maps to `src/`

## Deployment

- Push to `main` branch deploys to production
- Push to `dev` branch deploys to staging
- Amplify Hosting handles CI/CD automatically
- **Check deployment status**: `npx tsx scripts/check-deployments.ts` (add `--watch` to poll until complete). Requires `AMPLIFY_APP_ID` env var.
- **After pushing**: Always run the deployment watch script in the background so the user gets notified when deployments complete or fail
