# Decisions & Plans

## Trending Section (Explore Tab)

### Summary
Add a “Trending” section to the Explore screen, powered by a server‑side Supabase RPC that ranks upcoming drops by recent **saves + check‑ins** (last **48 hours**). This avoids RLS issues, keeps performance fast, and produces a stable, explainable ranking.

### Decisions Locked
- Placement: **Explore section**
- Ranking: **Saves + Check‑ins**
- Window: **Last 48 hours**
- Scope: **Upcoming only**
- Computation: **Server‑side SQL/RPC** (security definer)

### Plan Details

#### 1) Database: Add RPC for Trending (server‑side)
Goal: Return top N upcoming drops ranked by activity within 48 hours.

Function signature (example):
- `public.get_trending_drops(window_hours integer default 48, limit_count integer default 20)`
- Returns: drop fields + `save_count`, `checkin_count`, `score`

Implementation logic:
- `save_count` = count of saves with `created_at >= now() - interval 'window_hours hours'`
- `checkin_count` = count of checkins with `created_at >= now() - interval 'window_hours hours'`
- `score = save_count + checkin_count`
- Include only upcoming: `end_time >= now()`
- Order by `score DESC`, tie‑break by `start_time ASC`, then `created_at DESC`

Indexes:
- `saves(drop_id, created_at)`
- `checkins(drop_id, created_at)`
- `drops(end_time)`

Permissions:
- `security definer` + `set search_path = public`
- `grant execute on function ... to authenticated`

#### 2) Client Data Layer
Add `lib/trending.ts`:
- `fetchTrendingDrops(windowHours = 48, limit = 20)`
- Calls `supabase.rpc('get_trending_drops', { window_hours, limit_count })`
- Returns list with `save_count`, `checkin_count`, `score`

#### 3) Explore UI
Replace placeholder “Featured Drops” with Trending list:
- Show cards with score + counts
- Tap card → `/drop/[id]`
- Loading + empty states

#### 4) Navigation
No new tab needed (Trending is a section inside Explore).

### API / Interface Changes
- New RPC: `get_trending_drops(window_hours, limit_count)`
- New client module: `lib/trending.ts`
- Explore uses real data instead of static placeholder list

### Test Cases / Acceptance Criteria
1. Trending fetch returns only upcoming drops.
2. Ranking reflects saves + check‑ins within last 48 hours.
3. Explore shows a trending list with counts.
4. Tapping a trending card opens `/drop/[id]`.
5. Empty state shows when no data.

### Assumptions
- Keep current RLS on `saves`/`checkins`
- Trending computed server‑side via security definer RPC
- Score is simple sum (no weighting)
