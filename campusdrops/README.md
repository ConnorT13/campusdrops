# CampusDrops

CampusDrops is an Expo + React Native app for discovering campus events, pop-ups, and limited-time drops. Students can browse upcoming drops, sort by proximity, save events, check in after attending, and post their own drops.

## Stack

- Expo 54
- React Native 0.81
- React 19
- TypeScript
- Expo Router
- Supabase Auth + Database

## Current App Surface

- `Home`: upcoming drops feed, past drops history, save/check-in actions, and "Near me" sorting
- `Explore`: styled discovery screen with placeholder trending/featured content
- `Post`: authenticated drop creation form with date/time pickers and GPS coordinate autofill
- `My Stuff`: saved drops, checked-in drops, created drops, and username management
- `Drop details`: per-drop view with creator info, save counts, and check-in counts
- `AuthGate`: sign in, sign up, sign out, and required username setup

## Requirements

- Node.js 18+
- npm
- A Supabase project with the tables this app queries

## Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These are read by [lib/supabase.ts](/Users/connortan/Documents/New project/campusdrops/lib/supabase.ts:1).

## Getting Started

```bash
npm install
npm start
```

Platform-specific commands:

- `npm run ios`
- `npm run android`
- `npm run web`
- `npm run lint`

## Running The Demo

After `npm start`, Expo opens the dev server in your terminal.

- iOS simulator: press `i` in the Expo terminal, or run `npm run ios`
- Android emulator: press `a` in the Expo terminal, or run `npm run android`
- Web: press `w` in the Expo terminal, or run `npm run web`
- Physical phone: scan the QR code with the Expo Go app

If you want the full demo flow, sign up or sign in first, then:

- browse upcoming drops in `Home`
- switch to `Near me` and allow location access
- open a drop to save or check in
- create a new drop in `Post`
- review saved, checked-in, and created drops in `My Stuff`

## Project Structure

- `app/`: Expo Router routes and screens
- `components/`: reusable UI and auth/theme wrappers
- `constants/`: shared theme primitives
- `hooks/`: color scheme helpers
- `lib/`: Supabase client and app data helpers
- `assets/`: icons, splash, and image assets
- `docs/`: planning and architecture notes

## Supabase Data Model

The app currently expects these tables:

- `drops`: event/drop records
- `saves`: user-to-drop save relationships
- `checkins`: user-to-drop check-in relationships
- `profiles`: usernames and display names

Common fields used by the client include:

- `drops`: `id`, `title`, `description`, `start_time`, `end_time`, `location_name`, `latitude`, `longitude`, `tags`, `created_by`
- `profiles`: `id`, `username`, `display_name`
- `saves`: `user_id`, `drop_id`
- `checkins`: `user_id`, `drop_id`

## Location Usage

The app uses `expo-location` in two places:

- `Home` uses foreground location permission to sort upcoming drops by distance
- `Post` uses foreground location permission to autofill latitude and longitude

Location permission strings are configured in [app.json](/Users/connortan/Documents/New project/campusdrops/app.json:1).

## Current Status

- Authenticated app flow is enforced through `AuthGate`
- Username creation is required if a signed-in user does not yet have a profile username
- Nearby sorting is currently client-side in [lib/drops.ts](/Users/connortan/Documents/New project/campusdrops/lib/drops.ts:1)
- Explore is still mock content; the trending plan is documented in [docs/decisions.md](/Users/connortan/Documents/New project/campusdrops/docs/decisions.md:1)

## Notes

- This repo does not include Supabase migrations or SQL schema files
- If you change dependencies, keep `package-lock.json` in sync with `package.json`
