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
    // Flatten grouped roster (by position group)
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

export async function getScoreboard(sport: string, league: string) {
  try {
    const data = (await espnFetch(
      `${ESPN_BASE}/${sport}/${league}/scoreboard`,
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

export const ALL_LEAGUES = [
  { sport: 'football', league: 'nfl', name: 'NFL', key: 'nfl' },
  { sport: 'basketball', league: 'nba', name: 'NBA', key: 'nba' },
  { sport: 'baseball', league: 'mlb', name: 'MLB', key: 'mlb' },
  { sport: 'hockey', league: 'nhl', name: 'NHL', key: 'nhl' },
  { sport: 'soccer', league: 'usa.1', name: 'MLS', key: 'mls' },
] as const;
