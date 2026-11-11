# M.League Standings

Private TRMNL plugin: season standings with your two teams highlighted.

## What it shows

Full-table list, rank + team + points. `Sega Sammy Phoenix` and
`Shibuya ABEMAS` render in title weight; everyone else in label weight.

## Setup

1. Plugins > Add Private Plugin, strategy **Polling**.
2. Polling URL: your deployed `worker.js` URL. Refresh: 6 h (standings move slowly).
3. Edit Markup: paste `full.liquid`. Force Refresh and preview.

## Data

No public M.League API exists, so `worker.js` scrapes the official site
and normalizes to `sample.json`. The selectors are best-effort; expect one
adjustment pass against the live HTML. If parsing fails the worker returns
502 and TRMNL keeps the last good render.

To also show Saikyousen / JPML schedules later, extend the worker to emit a
`schedule` array and add a second loop in the markup.
