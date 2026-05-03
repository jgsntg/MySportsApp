const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const ESPN_NEWS_BASE = 'https://site.api.espn.com/apis/v1/sites/espn';

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
    )) as { athletes?: Array<{ position: string; items: unknown[] }> };
    if (data.athletes && Array.isArray(data.athletes)) {
      return data.athletes.flatMap((group) =>
        (group.items ?? []).map((p) => ({ ...p as object, positionGroup: group.position }))
      );
    }
    return [];
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

export async function getNews(sport?: string, limit = 20) {
  try {
    const sportParam = sport ? `&sport=${sport}` : '';
    const data = (await espnFetch(
      `${ESPN_NEWS_BASE}/news?limit=${limit}${sportParam}`,
      300
    )) as { articles?: unknown[] };
    return data.articles ?? [];
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
