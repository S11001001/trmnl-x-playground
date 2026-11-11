# Radio Red Tracker

Private TRMNL plugin: one screen for your horse.

## What it shows

Header: Radio Red, Danny Gargan / Reeves Thoroughbred Racing.
Two columns: last race (Oct 8, 2026: 4th of 8 at 5/1, Belmont Park R8,
winner Factually Correct) and next entry (empty state until one posts,
Belmont Park entries called out prominently). Up to 3 news lines.

## Setup

1. Plugins > Add Private Plugin, strategy **Polling**.
2. Polling URL: your deployed `worker.js` URL. Refresh: 2 h is a good
   middle ground (6 h quiet weeks, 30 min on entry days if you want).
3. Edit Markup: paste `full.liquid`. Force Refresh, preview, assign.

## Data

`worker.js` scrapes Equibase's free horse search (no key) and normalizes to
`sample.json`. The selectors are best-effort; do one live pass against the
real HTML before relying on it. On parse failure the worker keeps serving
the last-known baseline so the screen never goes blank.

To wire in your Thursday weekly watch, have the cron that already checks
Radio Red POST the same JSON shape to a second worker endpoint, or just let
the polling worker pick up entries on its own cadence.
