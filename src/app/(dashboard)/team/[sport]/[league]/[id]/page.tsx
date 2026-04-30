'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useFavoriteTeams, useFavoritePlayers, useToggleFavoriteTeam, useToggleFavoritePlayer } from '@/hooks/useFavorites';
import type { ESPNTeam, ESPNAthlete } from '@/types';

export default function TeamPage() {
  const params = useParams<{ sport: string; league: string; id: string }>();
  const { sport, league, id } = params;

  const { data: team, isLoading: teamLoading } = useQuery<ESPNTeam>({
    queryKey: ['team', sport, league, id],
    queryFn: async () => {
      const res = await fetch(`/api/sports/team?sport=${sport}&league=${league}&id=${id}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
  });

  const { data: roster, isLoading: rosterLoading } = useQuery<ESPNAthlete[]>({
    queryKey: ['roster', sport, league, id],
    queryFn: async () => {
      const res = await fetch(`/api/sports/roster?sport=${sport}&league=${league}&teamId=${id}`);
      if (!res.ok) throw new Error('Failed to fetch roster');
      return res.json();
    },
  });

  const { data: scores } = useQuery({
    queryKey: ['scores', sport, league],
    queryFn: async () => {
      const res = await fetch(`/api/sports/scores?sport=${sport}&league=${league}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: favTeams } = useFavoriteTeams();
  const { data: favPlayers } = useFavoritePlayers();
  const { add: addTeam, remove: removeTeam } = useToggleFavoriteTeam();
  const { add: addPlayer, remove: removePlayer } = useToggleFavoritePlayer();

  const favTeam = favTeams?.find((f) => f.teamId === id && f.sport === sport);
  const isTeamFav = !!favTeam;

  function handleTeamFav() {
    if (!team) return;
    if (isTeamFav && favTeam) {
      removeTeam.mutate(favTeam.id);
    } else {
      addTeam.mutate({
        teamId: id,
        sport,
        league,
        teamName: team.displayName,
        teamLogo: team.logos?.[0]?.href,
        teamColor: team.color,
      });
    }
  }

  function handlePlayerFav(player: ESPNAthlete) {
    const fav = favPlayers?.find((f) => f.playerId === player.id && f.sport === sport);
    if (fav) {
      removePlayer.mutate(fav.id);
    } else {
      addPlayer.mutate({
        playerId: player.id,
        sport,
        league,
        playerName: player.displayName,
        playerPhoto: player.headshot?.href,
        teamName: team?.displayName,
        position: player.position?.abbreviation,
      });
    }
  }

  const record = team?.record?.items?.find((r) => r.type === 'total')?.summary;

  // Recent games for this team
  const teamGames = (scores ?? []).filter((g: any) =>
    g.competitions?.[0]?.competitors?.some((c: any) => c.team?.id === id)
  );

  if (teamLoading) {
    return (
      <div className="space-y-4 pb-8">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-16 text-slate-400">
        Team not found.
        <Link href="/teams" className="block mt-3 text-blue-400 hover:text-blue-300">
          ← Back to teams
        </Link>
      </div>
    );
  }

  const logo = team.logos?.[0]?.href;

  return (
    <div className="pb-8 space-y-6">
      {/* Back */}
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ChevronLeft size={16} />
        All Teams
      </Link>

      {/* Team Header */}
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 border border-slate-700"
        style={{
          background: team.color
            ? `linear-gradient(135deg, #${team.color}33 0%, #1e293b 60%)`
            : '#1e293b',
        }}
      >
        {logo ? (
          <Image src={logo} alt={team.displayName} width={96} height={96} className="object-contain" />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ backgroundColor: `#${team.color ?? '334155'}` }}
          >
            {team.abbreviation}
          </div>
        )}
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-bold text-white">{team.displayName}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {league.toUpperCase()} · {sport.charAt(0).toUpperCase() + sport.slice(1)}
          </p>
          {record && (
            <p className="text-slate-300 text-sm mt-1 font-medium">Record: {record}</p>
          )}
        </div>
        <button
          onClick={handleTeamFav}
          disabled={addTeam.isPending || removeTeam.isPending}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            isTeamFav
              ? 'bg-yellow-500/20 text-yellow-400 hover:bg-red-900/30 hover:text-red-400 border border-yellow-500/30'
              : 'bg-slate-700 text-slate-300 hover:bg-yellow-500/20 hover:text-yellow-400 border border-slate-600'
          }`}
        >
          <Star size={15} className={isTeamFav ? 'fill-yellow-400' : ''} />
          {isTeamFav ? 'Favorited' : 'Add to Favorites'}
        </button>
      </div>

      {/* Recent Games */}
      {teamGames.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-3">Recent / Upcoming Games</h2>
          <div className="space-y-2">
            {teamGames.slice(0, 3).map((game: any) => {
              const comp = game.competitions?.[0];
              const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
              const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
              const status = comp?.status?.type;
              return (
                <div key={game.id} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{game.shortName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{status?.detail}</p>
                  </div>
                  {home?.score && away?.score && (
                    <span className="text-sm font-bold text-white tabular-nums">
                      {away.score} – {home.score}
                    </span>
                  )}
                  <Badge
                    variant={
                      status?.state === 'in' ? 'live' : status?.state === 'post' ? 'final' : 'upcoming'
                    }
                  >
                    {status?.state === 'in' ? '● LIVE' : status?.shortDetail}
                  </Badge>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Roster */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">Roster</h2>
        {rosterLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : !roster || roster.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-center text-slate-400">
            Roster not available.
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Player</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Pos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Age</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {roster.slice(0, 40).map((player) => {
                  const fav = favPlayers?.find(
                    (f) => f.playerId === player.id && f.sport === sport
                  );
                  return (
                    <tr key={player.id} className="hover:bg-slate-750 transition-colors group">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                        {player.jersey ?? '–'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/player/${sport}/${league}/${player.id}`}
                          className="flex items-center gap-2.5 group/link"
                        >
                          {player.headshot ? (
                            <Image
                              src={player.headshot.href}
                              alt={player.displayName}
                              width={32}
                              height={32}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                              {player.displayName.charAt(0)}
                            </div>
                          )}
                          <span className="text-white font-medium group-hover/link:text-blue-400 transition-colors">
                            {player.displayName}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-400 hidden sm:table-cell">
                        {player.position?.abbreviation ?? '–'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                        {player.age ?? '–'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handlePlayerFav(player)}
                          title={fav ? 'Remove from favorites' : 'Add to favorites'}
                          className={`p-1.5 rounded transition-colors ${
                            fav
                              ? 'text-yellow-400 hover:text-slate-400'
                              : 'text-slate-600 hover:text-yellow-400 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Star size={14} className={fav ? 'fill-yellow-400' : ''} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {roster.length > 40 && (
              <p className="px-4 py-3 text-xs text-slate-500 border-t border-slate-700">
                Showing 40 of {roster.length} players
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
