# CampusDrops

CampusDrops is a campus‑focused discovery app for student orgs and local businesses. It helps students find pop‑ups, events, and limited‑time drops, with save and check‑in features inspired by Beli.

## Features
- Email/password auth (Supabase)
- Upcoming feed with past‑events history
- Save + Check‑in actions
- “My Stuff” tab for saved and checked‑in drops
- Drop details screen with counts
- “Near me” sorting using device location
- User profiles with unique usernames

## Tech Stack
- Expo + React Native + TypeScript
- Expo Router (file‑based routing)
- Supabase (auth + database)

## Getting Started
1. Install dependencies
   - `npm install`
2. Create `.env`
   - `EXPO_PUBLIC_SUPABASE_URL=...`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=...`
3. Install location module
   - `npx expo install expo-location`
4. Start the app
   - `npm start`

## Useful Commands
- `npm start` start Expo dev server
- `npm run ios` run iOS simulator
- `npm run android` run Android emulator
- `npm run web` run web
- `npm run lint` lint

## Supabase Tables
- `drops` events/pop‑ups
- `saves` “want to go”
- `checkins` “I went”
- `profiles` usernames / display names

## Current Status
- Auth flow with sign‑in/sign‑up, username on sign‑up only
- Home feed: upcoming + past events, save/check‑in, pull‑to‑refresh
- “Near me” toggle with distance display (client‑side sorting)
- Drop details screen with save/check‑in and counts
- “My Stuff” tab with saved/checked‑in lists and username editor
- GPS autofill for Post (requires `expo-location`)

## TODO
- Add profile completion for users created before usernames
- Replace Explore tab template with real discovery flow
- Add server‑side “near me” query (RPC/view)
- Add drop photos + comments
- Add notifications for saved drops

## Roadmap
- Org/business profiles + verification
- Drop photos + comments
- Map view + filters
- Server‑side “near me” queries
- Notifications for saved drops

## Notes
- “Near me” sorting is client‑side for now. A server‑side geo query can be swapped in later via `lib/drops.ts`.
