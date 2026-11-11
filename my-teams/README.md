# My Teams at-a-glance

Private TRMNL plugin: one e-ink screen with your four teams.

## What it shows

2x2 grid. Per team: league, short name, record, last result, next game, streak.

Covers: Toronto Maple Leafs (NHL), Toronto Raptors (NBA), Toronto Blue Jays (MLB), NYCFC (MLS).

## Setup

1. TRMNL web app > Plugins > Add Private Plugin.
2. Strategy: **Polling**. Polling URL: your deployed worker URL (see below).
   Refresh interval: 30 min in season, 6 h out of season is fine.
3. Edit Markup: paste `full.liquid`.
4. Force Refresh, check the preview, assign to a playlist.

## Data (no key needed)

Option A (recommended): deploy `worker.js` to Cloudflare Workers (free).
It polls ESPN's free scoreboard API and normalizes to `sample.json`.

Option B (no middleware): set 4 polling URLs, one per league, line-separated:

- https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard
- https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard
- https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard
- https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard

With multiple URLs, TRMNL exposes them as `IDX_0`..`IDX_3`.
You would then need Liquid filtering over `IDX_0.events` etc. The worker
approach keeps the markup simple and is what `full.liquid` expects.

## Files

- `sample.json` — shape the template renders against; use for preview.
- `full.liquid` — fullscreen markup using the TRMNL design framework.
- `worker.js` — Cloudflare Worker aggregator.
