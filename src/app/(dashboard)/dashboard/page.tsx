import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoriteTeams, favoritePlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getScoreboard, getNews } from '@/lib/api/espn';
import type { Metadata } from 'next';
import type { ESPNGame, ESPNNewsArticle } from '@/types';
import DashboardClient, { type GameData } from '@/components/dashboard/DashboardClient';

export const metadata: Metadata = { title: 'Dashboard' };

const LEAGUES = [
  { sport: 'football',   league: 'nfl',   name: 'NFL' },
  { sport: 'basketball', league: 'nba',   name: 'NBA' },
  { sport: 'baseball',   league: 'mlb',   name: 'MLB' },
  { sport: 'hockey',     league: 'nhl',   name: 'NHL' },
];

function transformGame(
  game: ESPNGame & { leagueName: string },
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
    state,
    detail,
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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId  = session!.user.id;

  const [myTeams, myPlayers, ...scoreResults] = await Promise.all([
    db.select().from(favoriteTeams).where(eq(favoriteTeams.userId, userId)),
    db.select().from(favoritePlayers).where(eq(favoritePlayers.userId, userId)),
    ...LEAGUES.map(l => getScoreboard(l.sport, l.league)),
  ]);

  const headlines = (await getNews(undefined, 8)) as ESPNNewsArticle[];

  const myTeamIds = new Set(myTeams.map(t => t.teamId));

  const allGames = LEAGUES.flatMap((l, i) =>
    ((scoreResults[i] as ESPNGame[]) ?? []).map(g => ({ ...g, leagueName: l.name }))
  );

  const games = allGames
    .map(g => transformGame(g, myTeamIds))
    .filter((g): g is GameData => g !== null);

  const liveMyTeamCount = games.filter(
    g => g.state === 'in' && (g.away.mine || g.home.mine)
  ).length;

  const now = new Date();
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
      games={games}
      myTeams={myTeams}
      myPlayers={myPlayers}
      headlines={headlines}
    />
  );
}
