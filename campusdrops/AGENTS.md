# AGENTS.md

This repo is an Expo + React Native app using TypeScript and `expo-router` (file‑based routing in `app/`).

## Quick Start
- Install deps: `npm install`
- Run dev server: `npm start`
- Platform shortcuts: `npm run ios` | `npm run android` | `npm run web`
- Lint: `npm run lint`

## Project Layout
- `app/`: Routes and screens (file‑based routing via Expo Router)
- `components/`: Reusable UI components
- `constants/`: App constants and theme values
- `hooks/`: Custom React hooks
- `lib/`: Client utilities (e.g. Supabase)
- `assets/`: Images, fonts, static files

## Conventions
- Keep routing changes in `app/` and follow Expo Router patterns.
- Prefer functional components with hooks and TypeScript types.
- Keep UI components reusable and place them in `components/`.
- Avoid adding business logic directly in screens; extract to `lib/` or hooks.
- Use `expo` APIs over bare React Native modules when possible.

## Guardrails
- Do not edit generated or vendor files like `node_modules/`.
- Keep `package-lock.json` in sync with `package.json` when dependencies change.
- If you add new environment variables or secrets, document them and avoid committing real credentials.

## Branching & Commits (if applicable)
- Suggested branch prefix: `codex/`
- Keep commits small and descriptive.
