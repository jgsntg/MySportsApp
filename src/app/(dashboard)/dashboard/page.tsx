import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoriteTeams, favoritePlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getScoreboard, getNews, getTeamNews } from '@/lib/api/espn';
import type { Metadata } from 'next';
import type { ESPNGame, ESPNNewsArticle, FavoriteTeam } from '@/types';
import DashboardClient, { type GameData } from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = { title: 'Dashboard' };

const LEAGUES = [
  { sport: 'football',   league: 'nfl',   name: 'NFL' },
  { sport: 'basketball', league: 'nba',   name: 'NBA' },
  { sport: 'baseball',   league: 'mlb',   name: 'MLB' },
  { sport: 'hockey',     league: 'nhl',   name: 'NHL' },
  { sport: 'soccer',     league: 'usa.1', name: 'MLS' },
  { sport: 'soccer',     league: 'esp.1', name: 'La Liga' },
  { sport: 'soccer',     league: 'eng.1', name: 'EPL' },
  { sport: 'golf',       league: 'pga',   name: 'PGA Tour' },
];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function parseGameDate(game: ESPNGame): string {
  const comp = game.competitions?.[0];
  // ESPN returns ISO dates like "2026-05-03T..." — strip time and dashes to match formatDate() output
  return comp?.date ? comp.date.slice(0, 10).replace(/-/g, '') : '';
}

function transformGame(
  game: ESPNGame & { leagueName: string; sport: string; leagueKey: string },
  myTeamIds: Set<string>,
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
      mine:    myTeamIds.has(away.team.id),
      winning: awayWinning,
      record:  away.records?.find(r => r.type === 'total')?.summary,
    },
    home: {
      abbr:    home.team.abbreviation,
      name:    home.team.displayName,
      logo:    home.team.logos?.[0]?.href,
      color:   home.team.color ? `#${home.team.color}` : '#334155',
      score:   home.score,
      mine:    myTeamIds.has(home.team.id),
      winning: homeWinning,
      record:  home.records?.find(r => r.type === 'total')?.summary,
    },
    venue:     comp.venue?.fullName,
    broadcast: comp.broadcasts?.[0]?.names?.[0],
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
  const userId  = session!.user.id;

  const now       = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayStr     = formatDate(now);
  const yesterdayStr = formatDate(yesterday);

  const [myTeams, myPlayers] = await Promise.all([
    db.select().from(favoriteTeams).where(eq(favoriteTeams.userId, userId)),
    db.select().from(favoritePlayers).where(eq(favoritePlayers.userId, userId)),
  ]);

  // Fetch today + yesterday scoreboards for all leagues, plus general headlines, plus team news
  const [generalHeadlines, teamNews, ...scoreResults] = await Promise.all([
    getNews(undefined, 8),
    fetchTeamNews(myTeams),
    ...LEAGUES.flatMap(l => [
      getScoreboard(l.sport, l.league, todayStr),
      getScoreboard(l.sport, l.league, yesterdayStr),
    ]),
  ]);

  const myTeamIds = new Set(myTeams.map(t => t.teamId));

  const todayGames: GameData[]     = [];
  const yesterdayGames: GameData[] = [];

  LEAGUES.forEach((l, i) => {
    const todayRaw     = (scoreResults[i * 2]     as ESPNGame[]) ?? [];
    const yesterdayRaw = (scoreResults[i * 2 + 1] as ESPNGame[]) ?? [];

    for (const g of todayRaw) {
      const gd = transformGame({ ...g, leagueName: l.name, sport: l.sport, leagueKey: l.league }, myTeamIds);
      if (gd && gd.date === todayStr) todayGames.push(gd);
    }
    for (const g of yesterdayRaw) {
      const gd = transformGame({ ...g, leagueName: l.name, sport: l.sport, leagueKey: l.league }, myTeamIds);
      if (gd && gd.date === yesterdayStr) yesterdayGames.push(gd);
    }
  });

  const sortedToday     = sortByFavorites(todayGames);
  const sortedYesterday = sortByFavorites(yesterdayGames);

  const liveMyTeamCount = sortedToday.filter(
    g => g.state === 'in' && (g.away.mine || g.home.mine)
  ).length;

  const dateLabel = now
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
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
      myTeams={myTeams}
      myPlayers={myPlayers}
      generalHeadlines={generalHeadlines as ESPNNewsArticle[]}
      teamNews={teamNews}
    />
  );
}
