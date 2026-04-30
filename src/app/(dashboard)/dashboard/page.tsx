import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoriteTeams, favoritePlayers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getScoreboard, getNews } from '@/lib/api/espn';
import Link from 'next/link';
import Image from 'next/image';
import { ScoreCard } from '@/components/scores/ScoreCard';
import { HeadlineCard } from '@/components/headlines/HeadlineCard';
import type { Metadata } from 'next';
import type { ESPNGame, ESPNNewsArticle } from '@/types';

export const metadata: Metadata = { title: 'Dashboard' };

const LEAGUES = [
  { sport: 'football', league: 'nfl', name: 'NFL' },
  { sport: 'basketball', league: 'nba', name: 'NBA' },
  { sport: 'baseball', league: 'mlb', name: 'MLB' },
  { sport: 'hockey', league: 'nhl', name: 'NHL' },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [myTeams, myPlayers, ...scoreResults] = await Promise.all([
    db.select().from(favoriteTeams).where(eq(favoriteTeams.userId, userId)),
    db.select().from(favoritePlayers).where(eq(favoritePlayers.userId, userId)),
    ...LEAGUES.map((l) => getScoreboard(l.sport, l.league)),
  ]);

  const headlines = (await getNews(undefined, 8)) as ESPNNewsArticle[];

  const allGames = LEAGUES.flatMap((l, i) =>
    ((scoreResults[i] as ESPNGame[]) ?? []).map((g) => ({ ...g, leagueName: l.name }))
  );

  const displayName = session?.user?.name ?? session?.user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, <span className="text-blue-400">{displayName}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Here's what's happening in sports today.</p>
      </div>

      {/* Today's Games */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <span className="inline-block w-1 h-4 bg-blue-500 rounded-full" />
          Today's Games
        </h2>
        {allGames.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
            No games scheduled today across major leagues.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allGames.slice(0, 9).map((game) => (
              <ScoreCard key={game.id} game={game as ESPNGame & { leagueName: string }} />
            ))}
          </div>
        )}
      </section>

      {/* My Teams */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="inline-block w-1 h-4 bg-yellow-500 rounded-full" />
            My Teams
          </h2>
          <Link href="/teams" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Browse all →
          </Link>
        </div>
        {myTeams.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400 mb-3">No favorite teams yet.</p>
            <Link
              href="/teams"
              className="inline-flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Browse Teams
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {myTeams.map((team) => (
              <Link
                key={team.id}
                href={`/team/${team.sport}/${team.league}/${team.teamId}`}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center gap-2.5 hover:border-blue-600/50 hover:bg-slate-800/80 transition-all group"
              >
                {team.teamLogo ? (
                  <Image
                    src={team.teamLogo}
                    alt={team.teamName}
                    width={52}
                    height={52}
                    className="object-contain group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: `#${team.teamColor ?? '334155'}` }}
                  >
                    {team.teamName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs font-semibold text-white leading-tight">{team.teamName}</p>
                  <p className="text-xs text-slate-500 uppercase mt-0.5">{team.league}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* My Players */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="inline-block w-1 h-4 bg-green-500 rounded-full" />
            My Players
          </h2>
        </div>
        {myPlayers.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400">No favorite players yet.</p>
            <p className="text-slate-500 text-sm mt-1">Visit a team's roster to add players.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {myPlayers.map((player) => (
              <Link
                key={player.id}
                href={`/player/${player.sport}/${player.league}/${player.playerId}`}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center gap-2.5 hover:border-green-600/40 hover:bg-slate-800/80 transition-all group"
              >
                {player.playerPhoto ? (
                  <Image
                    src={player.playerPhoto}
                    alt={player.playerName}
                    width={52}
                    height={52}
                    className="rounded-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-white text-base font-bold">
                    {player.playerName.charAt(0)}
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs font-semibold text-white leading-tight">{player.playerName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {player.position ?? '–'} · {player.teamName ?? player.league.toUpperCase()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Headlines */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="inline-block w-1 h-4 bg-red-500 rounded-full" />
            Headlines
          </h2>
          <Link href="/headlines" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            See all →
          </Link>
        </div>
        {headlines.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
            No headlines available.
          </div>
        ) : (
          <div className="grid gap-3">
            {headlines.slice(0, 5).map((article, i) => (
              <HeadlineCard key={i} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
