// Cloudflare Worker aggregator for the My Teams TRMNL plugin.
// Deploy, then point the TRMNL Private Plugin polling URL at the worker URL.
// Uses ESPN's free scoreboard API (no key). Normalizes to the sample.json shape.

type League = 'NHL' | 'NBA' | 'MLB' | 'MLS';

const LEAGUES: [League, string][] = [
  [
    'NHL',
    'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  ],
  [
    'NBA',
    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  ],
  [
    'MLB',
    'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  ],
  [
    'MLS',
    'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard',
  ],
];

type TeamAbbrev = 'TOR' | 'NYC';

// Team abbreviations to follow
const FOLLOW: Record<League, TeamAbbrev[]> = {
  NHL: ['TOR'],
  NBA: ['TOR'],
  MLB: ['TOR'],
  MLS: ['NYC'],
};

type Team = {
  team: string;
  short: string;
  league: League;
};

const NAMES: Record<string, Team> = {
  'TOR-NHL': { team: 'Toronto Maple Leafs', short: 'Leafs', league: 'NHL' },
  'TOR-NBA': { team: 'Toronto Raptors', short: 'Raptors', league: 'NBA' },
  'TOR-MLB': { team: 'Toronto Blue Jays', short: 'Jays', league: 'MLB' },
  'NYC-MLS': { team: 'NYCFC', short: 'NYCFC', league: 'MLS' },
};

type ScCompetitor = {
  team?: {
    abbreviation?: TeamAbbrev | string; // e.g. TOR
    shortDisplayName?: string; // e.g. "Maple Leafs"
    displayName?: string; // e.g. "Toronto Maple Leafs"
    logo?: string; // e.g. "https://a.espncdn.com/i/teamlogos/nhl/500/scoreboard/tor.png"
  };
  homeAway?: 'home' | 'away';
  score: string; // numeric
  // e.g. {name: overall, type: total...} then Home, Away records
  // we assume [0] is overall
  records?: {
    summary?: string;
  }[];
};

type ScCompetition = {
  competitors?: ScCompetitor[]; // should have 2 in all our cases
  venue?: {
    fullName?: string; // e.g. "Scotiabank Arena"
    address?: {
      city?: string; // e.g. "Toronto"
    };
  };
};

type ScEvent = {
  // usually a 1-element array
  competitions?: ScCompetition[];
  status?: {
    type?: {
      state: 'pre' | 'in' | 'post';
      shortDetail?: string;
    };
  };
};

type Scoreboard = {
  events?: ScEvent[];
};

async function fetchLeague(league: League, url: string) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'trmnl-my-teams/1.0' },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Scoreboard;
  return (data.events || []).filter((ev) => {
    const abbrevs = (ev.competitions?.[0]?.competitors || []).map(
      (c) => c.team?.abbreviation,
    );
    return FOLLOW[league].some((a) => abbrevs.includes(a));
  });
}

function summarize(league: League, ev: ScEvent) {
  const comp = ev.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const key = FOLLOW[league][0] + '-' + league;
  const meta = NAMES[key];
  const me = competitors.find(
    (c) => c.team?.abbreviation === FOLLOW[league][0],
  );
  const opp = competitors.find(
    (c) => c.team?.abbreviation !== FOLLOW[league][0],
  );
  const state = ev.status?.type?.state;
  const detail = ev.status?.type?.shortDetail || '';

  if (state === 'pre') {
    return {
      ...meta,
      record: me?.records?.[0]?.summary || '',
      last_result: '',
      next_game: detail,
      streak: '',
    };
  }
  const myScore = me?.score || '';
  const oppScore = opp?.score || '';
  const oppAbbr = opp?.team?.abbreviation || '';
  const won =
    state === 'post'
      ? parseInt(myScore) > parseInt(oppScore)
        ? 'W'
        : 'L'
      : '';
  return {
    ...meta,
    record: me?.records?.[0]?.summary || '',
    last_result:
      state === 'in'
        ? `${myScore}-${oppScore} vs ${oppAbbr} (LIVE)`
        : `${won} ${myScore}-${oppScore} vs ${oppAbbr}`,
    next_game: state === 'post' ? detail : '',
    streak: '',
  };
}

function comparator<T>(k: (t: T) => number): (a: T, b: T) => number {
  return (a, b) => k(a) - k(b);
}

export default {
  async fetch(): Promise<Response> {
    const teams = [];
    for (const [league, url] of LEAGUES) {
      try {
        const events = await fetchLeague(league, url);
        // Prefer live, then upcoming, then most recent final
        const order = { in: 0, pre: 1, post: 2 };
        events.sort(
          comparator((s: ScEvent) => {
            const state = s.status?.type?.state;
            return state !== undefined ? order[state] : 3;
          }),
        );
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
