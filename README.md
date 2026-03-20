# Amplify Template

Next.js 15 + AWS Amplify Gen 2 starter template with TDD workflow, Jest, Playwright, and Claude Code integration.

## What's included

- **Next.js 15** with React 19 and Turbopack
- **AWS Amplify Gen 2** — auth (Cognito) and data (AppSync/DynamoDB)
- **Tailwind CSS v4**
- **Jest + React Testing Library** — unit tests, co-located next to source
- **Playwright** — E2E tests
- **Claude Code** — TDD slash commands, code review commands, post-push deploy hook
- **Deployment script** — check Amplify deployment status from the CLI

## Getting started

1. Click **"Use this template"** on GitHub (or `gh repo create my-app --template marinsarbulescu/amplify-template`)
2. Clone your new repo and install dependencies:
   ```bash
   npm install
   ```
3. Set up your Amplify backend:
   ```bash
   npx ampx sandbox
   ```
4. Copy `.env.example` to `.env` and set your `AMPLIFY_APP_ID`
5. Start developing:
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Jest in watch mode |
| `npm run test:coverage` | Jest with coverage |
| `npm run e2e` | Playwright tests (headed) |
| `npm run e2e:headless` | Playwright tests (headless) |
| `npx tsx scripts/check-deployments.ts` | Check deployment status |
| `npx tsx scripts/check-deployments.ts --watch` | Poll until deployments complete |

## Project structure

```
src/
  app/
    globals.css          # Tailwind + theme variables
    layout.tsx           # Root layout with AuthProvider
    page.tsx             # Home (redirects based on auth)
    login/page.tsx       # Login page
    (authed)/
      layout.tsx         # Protected layout with header
      dashboard/page.tsx # Dashboard
  components/
    AuthProvider.tsx      # Amplify auth wrapper
  lib/
    data/
      types.ts           # Pagination types
      fetchAll.ts         # Auto-paginating fetch utility
      fetchPage.ts        # Single-page fetch utility
amplify/
  auth/resource.ts       # Cognito config
  data/resource.ts       # Data schema (starter Todo model)
  backend.ts             # Backend definition
scripts/
  check-deployments.ts   # Amplify deployment monitor
.claude/
  commands/              # Code review + TDD slash commands
  hooks/                 # Post-push deployment hook
```

## Deployment

- Push to `main` deploys to production
- Push to `dev` deploys to staging
- Amplify Hosting handles CI/CD automatically

## Development workflow

This template enforces **Test-Driven Development**. Use the `/tdd` command in Claude Code for every implementation task.
