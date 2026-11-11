// Cloudflare Worker aggregator for the M.League TRMNL plugin.
// M.League has no public JSON API, so this scrapes the official standings page
// and normalizes to the sample.json shape. Deploy and point TRMNL polling at it.
//
// NOTE: check https://m-league.jp/ HTML before first deploy; selectors below
// are best-effort and may need one adjustment pass.

const SOURCE = "https://m-league.jp/";

type Standing = { rank: number; team: string; points: number };

async function fetchStandings(): Promise<Standing[] | null> {
  const res = await fetch(SOURCE, { headers: { "User-Agent": "trmnl-mleague/1.0" } });
  const html = await res.text();

  // Very defensive parse: look for team rows containing points.
  // Replace with DOM parsing (e.g. cheerio via worker) if the page is complex.
  // Fallback: return null so TRMNL keeps the last good render.
  const rows: Omit<Standing, 'rank'>[] = [];
  const re = /([A-Za-z0-9 .\-']+)<\/[^>]+>\s*([+-]?\d+\.\d+)/g;
  let m;
  const seen = new Set();
  while ((m = re.exec(html)) !== null && rows.length < 12) {
    if (!m[1] || !m[2]) continue;
    const team = m[1].trim();
    if (seen.has(team) || team.length < 3) continue;
    seen.add(team);
    rows.push({ team, points: parseFloat(m[2]) });
  }
  if (!rows.length) return null;
  rows.sort((a, b) => b.points - a.points);
  return rows.map((r, i) => ({ rank: i + 1, team: r.team, points: r.points }));
}

export default {
  async fetch() {
    const standings = await fetchStandings();
    if (!standings) {
      return new Response(JSON.stringify({ error: "parse failed, keeping last render" }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }
    return Response.json({
      season: "2026-27",
      updated: new Date().toISOString(),
      focus: ["Sega Sammy Phoenix", "Shibuya ABEMAS"],
      standings,
    });
  },
};
