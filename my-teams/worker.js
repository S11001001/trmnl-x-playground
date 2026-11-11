// Cloudflare Worker aggregator for the My Teams TRMNL plugin.
// Deploy, then point the TRMNL Private Plugin polling URL at the worker URL.
// Uses ESPN's free scoreboard API (no key). Normalizes to the sample.json shape.

const LEAGUES = {
  NHL: "https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
  NBA: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
  MLB: "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
  MLS: "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard",
};

// Team abbreviations to follow
const FOLLOW = {
  NHL: ["TOR"],
  NBA: ["TOR"],
  MLB: ["TOR"],
  MLS: ["NYC"],
};

const NAMES = {
  "TOR-NHL": { team: "Toronto Maple Leafs", short: "Leafs", league: "NHL" },
  "TOR-NBA": { team: "Toronto Raptors", short: "Raptors", league: "NBA" },
  "TOR-MLB": { team: "Toronto Blue Jays", short: "Jays", league: "MLB" },
  "NYC-MLS": { team: "NYCFC", short: "NYCFC", league: "MLS" },
};

async function fetchLeague(league, url) {
  const res = await fetch(url, { headers: { "User-Agent": "trmnl-my-teams/1.0" } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.events || []).filter((ev) => {
    const abbrevs = (ev.competitions?.[0]?.competitors || []).map((c) => c.team?.abbreviation);
    return FOLLOW[league].some((a) => abbrevs.includes(a));
  });
}

function summarize(league, ev) {
  const comp = ev.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const key = FOLLOW[league][0] + "-" + league;
  const meta = NAMES[key];
  const me = competitors.find((c) => c.team?.abbreviation === FOLLOW[league][0]);
  const opp = competitors.find((c) => c.team?.abbreviation !== FOLLOW[league][0]);
  const state = ev.status?.type?.state; // pre | in | post
  const detail = ev.status?.type?.shortDetail || "";

  if (state === "pre") {
    return {
      ...meta,
      record: me?.records?.[0]?.summary || "",
      last_result: "",
      next_game: detail,
      streak: "",
    };
  }
  const myScore = me?.score || "";
  const oppScore = opp?.score || "";
  const oppAbbr = opp?.team?.abbreviation || "";
  const won = state === "post" ? (parseInt(myScore) > parseInt(oppScore) ? "W" : "L") : "";
  return {
    ...meta,
    record: me?.records?.[0]?.summary || "",
    last_result: state === "in" ? `${myScore}-${oppScore} vs ${oppAbbr} (LIVE)` : `${won} ${myScore}-${oppScore} vs ${oppAbbr}`,
    next_game: state === "post" ? detail : "",
    streak: "",
  };
}

export default {
  async fetch() {
    const teams = [];
    for (const [league, url] of Object.entries(LEAGUES)) {
      try {
        const events = await fetchLeague(league, url);
        // Prefer live, then upcoming, then most recent final
        events.sort((a, b) => {
          const order = { in: 0, pre: 1, post: 2 };
          return (order[a.status?.type?.state] ?? 3) - (order[b.status?.type?.state] ?? 3);
        });
        if (events[0]) teams.push(summarize(league, events[0]));
      } catch (e) {
        // leave league out on error; TRMNL keeps last good render
      }
    }
    return Response.json({
      updated_at: new Date().toISOString(),
      teams,
    });
  },
};
