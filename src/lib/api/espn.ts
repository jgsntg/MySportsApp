const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

// Leagues to pull from when no sport filter is applied
const ALL_NEWS_LEAGUES = [
  { sport: 'football',   league: 'nfl'   },
  { sport: 'basketball', league: 'nba'   },
  { sport: 'baseball',   league: 'mlb'   },
  { sport: 'hockey',     league: 'nhl'   },
  { sport: 'soccer',     league: 'usa.1' },
  { sport: 'soccer',     league: 'esp.1' },
  { sport: 'soccer',     league: 'eng.1' },
  { sport: 'golf',       league: 'pga'   },
];

// Primary league per sport for filtered news
const SPORT_PRIMARY_LEAGUE: Record<string, string> = {
  football: 'nfl', basketball: 'nba', baseball: 'mlb',
  hockey: 'nhl',   soccer: 'usa.1',   golf: 'pga',
};

async function espnFetch(url: string, revalidate = 300): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`ESPN API ${res.status}: ${url}`);
  return res.json();
}

export async function getTeams(sport: string, league: string) {
  try {
    const data = (await espnFetch(
      `${ESPN_BASE}/${sport}/${league}/teams?limit=50`
    )) as { sports?: Array<{ leagues?: Array<{ teams?: Array<{ team: unknown }> }> }> };
    return (data.sports?.[0]?.leagues?.[0]?.teams ?? []).map((t) => t.team);
  } catch {
    return [];
  }
}

export async function getTeam(sport: string, league: string, teamId: string) {
  try {
    const data = (await espnFetch(
      `${ESPN_BASE}/${sport}/${league}/teams/${teamId}`
    )) as { team: unknown };
    return data.team;
  } catch {
    return null;
  }
}

export async function getTeamRoster(sport: string, league: string, teamId: string) {
  try {
    const data = (await espnFetch(
      `${ESPN_BASE}/${sport}/${league}/teams/${teamId}/roster`,
      3600
    )) as { athletes?: unknown[] };
    if (!data.athletes || !Array.isArray(data.athletes) || data.athletes.length === 0) return [];

    // NFL/NBA/MLB/NHL return grouped format: { position: string, items: Athlete[] }
    // Soccer (esp.1, eng.1, usa.1) returns a flat array of athlete objects
    const first = data.athletes[0] as Record<string, unknown>;
    if ('items' in first) {
      return (data.athletes as Array<{ position: string; items: unknown[] }>).flatMap((group) =>
        (group.items ?? []).map((p) => ({ ...p as object, positionGroup: group.position }))
      );
    }
    return data.athletes;
  } catch {
    return [];
  }
}

export async function getAthlete(sport: string, league: string, athleteId: string) {
  try {
    const data = await espnFetch(
      `${ESPN_BASE}/${sport}/${league}/athletes/${athleteId}`,
      3600
    );
    return data;
  } catch {
    return null;
  }
}

export async function getScoreboard(sport: string, league: string, date?: string) {
  try {
    const dateParam = date ? `?dates=${date}` : '';
    const data = (await espnFetch(
      `${ESPN_BASE}/${sport}/${league}/scoreboard${dateParam}`,
      60
    )) as { events?: unknown[] };
    return data.events ?? [];
  } catch {
    return [];
  }
}

export async function getNews(sport?: string, limit = 20): Promise<unknown[]> {
  try {
    if (sport) {
      const league = SPORT_PRIMARY_LEAGUE[sport];
      if (!league) return [];
      const data = (await espnFetch(
        `${ESPN_BASE}/${sport}/${league}/news?limit=${limit}`,
        300
      )) as { articles?: unknown[] };
      return data.articles ?? [];
    }

    // No filter: fetch from all leagues in parallel, merge sorted by date
    const perLeague = Math.ceil(limit / ALL_NEWS_LEAGUES.length) + 2;
    const results = await Promise.all(
      ALL_NEWS_LEAGUES.map(async ({ sport: s, league: l }) => {
        try {
          const data = (await espnFetch(
            `${ESPN_BASE}/${s}/${l}/news?limit=${perLeague}`,
            300
          )) as { articles?: unknown[] };
          return (data.articles ?? []) as Array<{ published?: string; headline: string }>;
        } catch {
          return [];
        }
      })
    );

    const seen = new Set<string>();
    const merged: Array<{ published?: string }> = [];
    for (const batch of results) {
      for (const a of batch) {
        if (!seen.has(a.headline)) {
          seen.add(a.headline);
          merged.push(a);
        }
      }
    }
    merged.sort((a, b) => {
      const at = a.published ? new Date(a.published).getTime() : 0;
      const bt = b.published ? new Date(b.published).getTime() : 0;
      return bt - at;
    });
    return merged.slice(0, limit);
  } catch {
    return [];
  }
}

export async function getTeamNews(sport: string, league: string, teamId: string, limit = 5) {
  try {
    const data = (await espnFetch(
      `${ESPN_BASE}/${sport}/${league}/news?team=${teamId}&limit=${limit}`,
      300
    )) as { articles?: unknown[] };
    return data.articles ?? [];
  } catch {
    return [];
  }
}

export interface ESPNPlay {
  id: string;
  text: string;
  scoringPlay: boolean;
  clock?: { displayValue: string };
  period?: { number: number };
  team?: { id: string; abbreviation: string };
  scoreValue?: number;
  awayScore?: number;
  homeScore?: number;
  type?: { text: string };
}

export interface ESPNGolfCompetitor {
  id: string;
  displayName: string;
  status?: { displayValue?: string };
  statistics?: Array<{ name: string; displayValue: string }>;
  linescores?: Array<{ value: number; displayValue?: string }>;
  score?: string;
}

export interface GameSummary {
  sport: 'standard' | 'golf';
  scoringPlays: ESPNPlay[];
  recentPlays: ESPNPlay[];
  golfLeaderboard?: ESPNGolfCompetitor[];
}

export async function getGameSummary(
  sport: string,
  league: string,
  eventId: string
): Promise<GameSummary> {
  const empty: GameSummary = { sport: 'standard', scoringPlays: [], recentPlays: [] };
  try {
    if (sport === 'golf') {
      const data = (await espnFetch(
        `${ESPN_BASE}/${sport}/${league}/scoreboard`,
        30
      )) as { events?: Array<{ id: string; competitions?: Array<{ competitors?: ESPNGolfCompetitor[] }> }> };
      const event = (data.events ?? []).find(e => e.id === eventId);
      const competitors = event?.competitions?.[0]?.competitors ?? [];
      return { sport: 'golf', scoringPlays: [], recentPlays: [], golfLeaderboard: competitors.slice(0, 10) };
    }

    const data = (await espnFetch(
      `${ESPN_BASE}/${sport}/${league}/summary?event=${eventId}`,
      30
    )) as { plays?: ESPNPlay[] };

    const plays = data.plays ?? [];
    const scoringPlays = plays.filter(p => p.scoringPlay);
    const recentPlays = plays.slice(-5).reverse();
    return { sport: 'standard', scoringPlays, recentPlays };
  } catch {
    return empty;
  }
}

// ── Player stats & event log ──────────────────────────────────────────────────

const ESPN_CORE_BASE = 'https://sports.core.api.espn.com/v2/sports';

async function coreApiFetch(url: string): Promise<unknown> {
  const safeUrl = url.replace(/^http:\/\//, 'https://');
  const res = await fetch(safeUrl, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error(`ESPN core API ${res.status}: ${safeUrl}`);
  return res.json();
}

// Soccer uses raw totals, not avg-prefixed names like other sports.
// These sets define which stats to surface per context.
const SOCCER_SEASON_STATS: Record<string, Set<string>> = {
  offensive: new Set(['totalGoals', 'assists', 'shots', 'shotsOnTarget', 'attemptsInBox', 'shotAssists']),
  general:   new Set(['appearances', 'starts', 'minutes', 'yellowCards', 'redCards', 'passPct']),
  defensive: new Set(['effectiveTackles', 'interceptions', 'effectiveClearance']),
};

// Order matters: first 4 show in the per-game row in PlayersClient
const SOCCER_GAME_STAT_ORDER = ['totalGoals', 'assists', 'shotsOnTarget', 'minutes', 'yellowCards', 'redCards', 'shots', 'passPct'];

export interface StatCategory {
  name: string;
  displayName: string;
  stats: Array<{ name: string; displayName: string; value: number; displayValue: string }>;
}

export async function getAthleteStats(sport: string, league: string, athleteId: string): Promise<StatCategory[]> {
  try {
    const data = await coreApiFetch(
      `${ESPN_CORE_BASE}/${sport}/leagues/${league}/athletes/${athleteId}/statistics/0?lang=en&region=us`
    ) as { splits?: { categories?: StatCategory[] } };
    const categories = data.splits?.categories ?? [];
    if (sport === 'soccer') {
      return categories.map(cat => ({
        ...cat,
        stats: cat.stats.filter(s => SOCCER_SEASON_STATS[cat.name.toLowerCase()]?.has(s.name)),
      })).filter(cat => cat.stats.length > 0);
    }
    // Other sports: filter to per-game averages (prefix "avg" but not "avg48")
    return categories.map(cat => ({
      ...cat,
      stats: cat.stats.filter(s => s.name.startsWith('avg') && !s.name.startsWith('avg48')),
    })).filter(cat => cat.stats.length > 0);
  } catch {
    return [];
  }
}

export interface EventLogGame {
  id: string;
  eventName: string;
  date: string;
  stats: Array<{ name: string; displayName: string; displayValue: string }>;
}

export async function getAthleteEventLog(sport: string, league: string, athleteId: string): Promise<EventLogGame[]> {
  try {
    const data = await coreApiFetch(
      `${ESPN_CORE_BASE}/${sport}/leagues/${league}/athletes/${athleteId}/eventlog?lang=en&region=us&limit=100`
    ) as {
      events?: {
        items?: Array<{
          event?: { $ref?: string };
          statistics?: { $ref?: string };
          played?: boolean;
        }>;
      };
    };

    const allItems = data.events?.items ?? [];
    const playedItems = allItems.filter(item => item.played !== false);
    // Also probe the item immediately after the last played one — it may be today's in-progress game
    const lastPlayedGlobalIdx = playedItems.length > 0
      ? allItems.lastIndexOf(playedItems[playedItems.length - 1])
      : -1;
    const maybeToday = lastPlayedGlobalIdx >= 0 && lastPlayedGlobalIdx + 1 < allItems.length
      ? [allItems[lastPlayedGlobalIdx + 1]]
      : [];
    const candidates = [...playedItems.slice(-5), ...maybeToday];
    if (!candidates.length) return [];

    const now = new Date();
    const results = await Promise.all(
      candidates.map(async item => {
        const [eventData, statsData] = await Promise.all([
          item.event?.$ref ? coreApiFetch(item.event.$ref) : Promise.resolve(null),
          item.statistics?.$ref ? coreApiFetch(item.statistics.$ref) : Promise.resolve(null),
        ]) as [
          { id?: string; shortName?: string; name?: string; date?: string } | null,
          { splits?: { categories?: StatCategory[] } } | null,
        ];

        const date = eventData?.date ?? '';
        // Drop games that haven't started yet
        if (date && new Date(date) > now) return null;

        const id = eventData?.id ?? String(Math.random());
        const eventName = eventData?.shortName ?? eventData?.name ?? 'Game';
        const cats = statsData?.splits?.categories ?? [];

        let stats: EventLogGame['stats'];
        if (sport === 'soccer') {
          const statsMap = new Map<string, EventLogGame['stats'][number]>();
          for (const cat of cats) {
            for (const s of cat.stats) {
              if (SOCCER_GAME_STAT_ORDER.includes(s.name)) statsMap.set(s.name, s);
            }
          }
          stats = SOCCER_GAME_STAT_ORDER.flatMap(name => {
            const s = statsMap.get(name);
            return s ? [s] : [];
          });
        } else {
          stats = cats
            .flatMap(c => c.stats.filter(s => s.name.startsWith('avg') && !s.name.startsWith('avg48')))
            .slice(0, 8);
        }

        return { id, eventName, date, stats };
      })
    );

    return results
      .filter((r): r is EventLogGame => r !== null)
      .slice(-5)
      .reverse();
  } catch {
    return [];
  }
}

export async function getPlayerNews(sport: string, league: string, athleteId: string, limit = 6): Promise<unknown[]> {
  try {
    const data = await espnFetch(
      `${ESPN_BASE}/${sport}/${league}/news?athlete=${athleteId}&limit=${limit}`,
      300
    ) as { articles?: unknown[] };
    return data.articles ?? [];
  } catch {
    return [];
  }
}

export const ALL_LEAGUES = [
  { sport: 'football',   league: 'nfl',   name: 'NFL',      key: 'nfl' },
  { sport: 'basketball', league: 'nba',   name: 'NBA',      key: 'nba' },
  { sport: 'baseball',   league: 'mlb',   name: 'MLB',      key: 'mlb' },
  { sport: 'hockey',     league: 'nhl',   name: 'NHL',      key: 'nhl' },
  { sport: 'soccer',     league: 'usa.1', name: 'MLS',      key: 'mls' },
  { sport: 'soccer',     league: 'esp.1', name: 'La Liga',  key: 'laliga' },
  { sport: 'soccer',     league: 'eng.1', name: 'EPL',      key: 'epl' },
  { sport: 'golf',       league: 'pga',   name: 'PGA Tour', key: 'pga' },
] as const;
