# TRMNL X Custom Plugins

Three private plugin drafts for your TRMNL X, built around your interests.
Each folder is self-contained: paste the `.liquid` into TRMNL's Edit Markup,
point polling at the deployed worker, done.

Local repo: `~/ide/trmnl-x-playground` (git). Source of truth for these drafts;
`~/workspace/trmnl-plugins/` holds the original delivery copies.

## Plugins

1. **my-teams** — 2x2 at-a-glance board: Leafs, Raptors, Jays, NYCFC.
   Record, last result, next game. Data via ESPN's free scoreboard API.
2. **mleague-standings** — M.League table with Sega Sammy Phoenix and
   Shibuya ABEMAS highlighted. Worker scrapes the official site (no public API).
3. **radio-red** — Radio Red (Danny Gargan / Reeves Thoroughbred Racing):
   last race (Oct 8, 2026, 4th at 5/1, Belmont R8), next entry with a Belmont
   callout, latest news lines.

## How private plugins work (quick version)

- TRMNL web app > Plugins > Add Private Plugin.
- Strategy **Polling**: TRMNL fetches your URL on a schedule; the JSON it
  gets back is what your Liquid markup renders against.
- One polling URL: fields available directly (`{{ teams }}`).
  Multiple URLs (line-separated): exposed as `{{ IDX_0 }}`, `{{ IDX_1 }}`, ...
- Edit Markup > paste `full.liquid` > Force Refresh to preview against live data.
- `sample.json` is the shape the template expects; handy for offline preview.

## Deploying the workers

Each plugin has a `worker.js` + `wrangler.toml` written for Cloudflare Workers
(free tier is fine). From the repo root:

```bash
npx wrangler deploy --config my-teams/wrangler.toml
npx wrangler deploy --config mleague-standings/wrangler.toml
npx wrangler deploy --config radio-red/wrangler.toml
# or: npm run deploy:my-teams
```

Copy the `*.workers.dev` URL into the plugin's Polling URL field.

## Development

Run `npm run format` to format supported files with Prettier, or
`npm run format:check` to check formatting without changing files.
Run `npm run check` to type-check the workers.

## E-ink notes

- Markup uses the TRMNL design framework classes (`layout`, `grid`,
  `title_bar`, `value`, `label`, `description`) — no custom fonts, no emoji,
  no opacity tricks, so it renders cleanly in 16-level grayscale.
- Refresh guidance: My Teams 30 min in season; M.League 6 h; Radio Red 2 h.

## Files per plugin

- `full.liquid` — the markup to paste into TRMNL.
- `sample.json` — example payload / preview data.
- `worker.js` — aggregator that produces the live JSON.
- `README.md` — setup notes and data-source details.
