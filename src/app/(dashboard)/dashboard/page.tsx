import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoriteTeams, favoritePlayers } from '@/lib/db/schema';
import { getSessionUserId } from '@/lib/db/session-user';
import { asc, eq } from 'drizzle-orm';
import { getScoreboard, getNews, getTeamNews } from '@/lib/api/espn';
import { getPreferences } from '@/lib/db/preferences';
import type { Metadata } from 'next';
import type { ESPNGame, ESPNNewsArticle, FavoriteTeam } from '@/types';
import DashboardClient, { type GameData } from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = { title: 'Dashboard' };

const LEAGUES = [
  { sport: 'football',   league: 'nfl',        name: 'NFL' },
  { sport: 'basketball', league: 'nba',        name: 'NBA' },
  { sport: 'baseball',   league: 'mlb',        name: 'MLB' },
  { sport: 'hockey',     league: 'nhl',        name: 'NHL' },
  { sport: 'soccer',     league: 'usa.1',      name: 'MLS' },
  { sport: 'soccer',     league: 'esp.1',      name: 'La Liga' },
  { sport: 'soccer',     league: 'eng.1',      name: 'EPL' },
  { sport: 'soccer',     league: 'fifa.world', name: 'FIFA World Cup' },
  { sport: 'golf',       league: 'pga',        name: 'PGA Tour' },
];

const ET_TZ = 'America/New_York';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: ET_TZ }).replace(/-/g, '');
}

function espnGameUrl(sport: string, league: string, gameId: string): string {
  if (sport === 'golf') return 'https://www.espn.com/golf/leaderboard';
  if (sport === 'soccer') return `https://www.espn.com/soccer/match/_/gameId/${gameId}`;
  const slug: Record<string, string> = { football: 'nfl', basketball: 'nba', baseball: 'mlb', hockey: 'nhl' };
  return `https://www.espn.com/${slug[sport] ?? league}/game/_/gameId/${gameId}`;
}

function parseGameDate(game: ESPNGame): string {
  const comp = game.competitions?.[0];
  if (!comp?.date) return '';
  // ESPN dates are UTC — convert to Eastern time before extracting the date
  return new Date(comp.date).toLocaleDateString('en-CA', { timeZone: ET_TZ }).replace(/-/g, '');
}

function transformGame(
  game: ESPNGame & { leagueName: string; sport: string; leagueKey: string },
  myTeamKeys: Set<string>,
): GameData | null {
  const comp = game.competitions?.[0];
  if (!comp) return null;
  const away = comp.competitors.find(c => c.homeAway === 'away');
  const home = comp.competitors.find(c => c.homeAway === 'home');
  if (!away || !home) return null;

  const { state } = comp.status.type;
  const detail = state === 'in' ? comp.status.type.shortDetail : comp.status.type.detail;

  const awayN = away.score ? Number(away.score) : undefined;
  const homeN = home.score ? Number(home.score) : undefined;
  const awayWinning = state === 'post' ? !!away.winner
    : (awayN !== undefined && homeN !== undefined ? awayN > homeN : false);
  const homeWinning = state === 'post' ? !!home.winner
    : (awayN !== undefined && homeN !== undefined ? homeN > awayN : false);

  return {
    id: game.id,
    league: game.leagueName,
    sport: game.sport,
    leagueKey: game.leagueKey,
    state,
    detail,
    date: parseGameDate(game),
    away: {
      abbr:    away.team.abbreviation,
      name:    away.team.displayName,
      logo:    away.team.logos?.[0]?.href,
      color:   away.team.color ? `#${away.team.color}` : '#334155',
      score:   away.score,
      mine:    myTeamKeys.has(`${away.team.id}:${game.leagueKey}`),
      winning: awayWinning,
      record:  away.records?.find(r => r.type === 'total')?.summary,
    },
    home: {
      abbr:    home.team.abbreviation,
      name:    home.team.displayName,
      logo:    home.team.logos?.[0]?.href,
      color:   home.team.color ? `#${home.team.color}` : '#334155',
      score:   home.score,
      mine:    myTeamKeys.has(`${home.team.id}:${game.leagueKey}`),
      winning: homeWinning,
      record:  home.records?.find(r => r.type === 'total')?.summary,
    },
    venue:     comp.venue?.fullName,
    broadcast: comp.broadcasts?.[0]?.names?.[0],
    espnLink:  espnGameUrl(game.sport, game.leagueKey, game.id),
  };
}

function gameScore(g: GameData): number {
  const fav  = (g.away.mine || g.home.mine) ? 4 : 0;
  const live = g.state === 'in'   ? 2 : 0;
  const pre  = g.state === 'pre'  ? 1 : 0;
  return fav + live + pre;
}

function sortByFavorites(games: GameData[]): GameData[] {
  return [...games].sort((a, b) => gameScore(b) - gameScore(a));
}

async function fetchTeamNews(teams: FavoriteTeam[]): Promise<ESPNNewsArticle[]> {
  // Fetch news for up to 4 favorite teams in parallel
  const slice = teams.slice(0, 4);
  const results = await Promise.all(
    slice.map(t => getTeamNews(t.sport, t.league, t.teamId, 4))
  );
  // Dedupe by article URL
  const seen = new Set<string>();
  const articles: ESPNNewsArticle[] = [];
  for (const batch of results) {
    for (const a of batch as ESPNNewsArticle[]) {
      const key = a.links?.web?.href ?? a.headline;
      if (!seen.has(key)) {
        seen.add(key);
        articles.push(a);
      }
    }
  }
  return articles.slice(0, 8);
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId  = await getSessionUserId(session!);
  if (!userId) throw new Error('Missing session user');

  const now       = new Date();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow  = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr     = formatDate(now);
  const yesterdayStr = formatDate(yesterday);
  const tomorrowStr  = formatDate(tomorrow);

  const [myTeams, myPlayers, savedPrefs] = await Promise.all([
    db.select().from(favoriteTeams).where(eq(favoriteTeams.userId, userId)),
    db.select().from(favoritePlayers).where(eq(favoritePlayers.userId, userId)).orderBy(asc(favoritePlayers.sortOrder), asc(favoritePlayers.createdAt)),
    getPreferences(userId),
  ]);

  // Fetch today + yesterday + tomorrow scoreboards for all leagues, plus headlines and team news
  const [generalHeadlines, teamNews, ...scoreResults] = await Promise.all([
    getNews(undefined, 8),
    fetchTeamNews(myTeams),
    ...LEAGUES.flatMap(l => [
      getScoreboard(l.sport, l.league, todayStr),
      getScoreboard(l.sport, l.league, yesterdayStr),
      getScoreboard(l.sport, l.league, tomorrowStr),
    ]),
  ]);

  // Key by "teamId:league" to prevent cross-sport teamId collisions (e.g. Seahawks & Giants both = id "26")
  const myTeamKeys = new Set(myTeams.map(t => `${t.teamId}:${t.league}`));

  const todayGames: GameData[]     = [];
  const yesterdayGames: GameData[] = [];
  const tomorrowGames: GameData[]  = [];

  LEAGUES.forEach((l, i) => {
    const todayRaw     = (scoreResults[i * 3]     as ESPNGame[]) ?? [];
    const yesterdayRaw = (scoreResults[i * 3 + 1] as ESPNGame[]) ?? [];
    const tomorrowRaw  = (scoreResults[i * 3 + 2] as ESPNGame[]) ?? [];

    for (const g of todayRaw) {
      const gd = transformGame({ ...g, leagueName: l.name, sport: l.sport, leagueKey: l.league }, myTeamKeys);
      if (gd && gd.date === todayStr) todayGames.push(gd);
    }
    for (const g of yesterdayRaw) {
      const gd = transformGame({ ...g, leagueName: l.name, sport: l.sport, leagueKey: l.league }, myTeamKeys);
      if (gd && gd.date === yesterdayStr) yesterdayGames.push(gd);
    }
    for (const g of tomorrowRaw) {
      const gd = transformGame({ ...g, leagueName: l.name, sport: l.sport, leagueKey: l.league }, myTeamKeys);
      if (gd && gd.date === tomorrowStr) tomorrowGames.push(gd);
    }
  });

  const sortedToday     = sortByFavorites(todayGames);
  const sortedYesterday = sortByFavorites(yesterdayGames);
  const sortedTomorrow  = sortByFavorites(tomorrowGames);

  const liveMyTeamCount = sortedToday.filter(
    g => g.state === 'in' && (g.away.mine || g.home.mine)
  ).length;

  const dateLabel = now
    .toLocaleDateString('en-US', { timeZone: ET_TZ, weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase()
    .replace(',', ' ·');

  const userName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'there';

  return (
    <DashboardClient
      userName={userName}
      dateLabel={dateLabel}
      liveMyTeamCount={liveMyTeamCount}
      todayGames={sortedToday}
      yesterdayGames={sortedYesterday}
      tomorrowGames={sortedTomorrow}
      myTeams={myTeams}
      myPlayers={myPlayers}
      generalHeadlines={generalHeadlines as ESPNNewsArticle[]}
      teamNews={teamNews}
      savedPrefs={savedPrefs}
    />
  );
}
