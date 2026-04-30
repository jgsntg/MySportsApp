'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronLeft, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useFavoritePlayers, useToggleFavoritePlayer } from '@/hooks/useFavorites';
import type { ESPNAthlete } from '@/types';
import { formatDate } from '@/lib/utils';

export default function PlayerPage() {
  const params = useParams<{ sport: string; league: string; id: string }>();
  const { sport, league, id } = params;

  const { data: player, isLoading } = useQuery<ESPNAthlete>({
    queryKey: ['player', sport, league, id],
    queryFn: async () => {
      const res = await fetch(`/api/sports/player?sport=${sport}&league=${league}&id=${id}`);
      if (!res.ok) throw new Error('Not found');
      return res.json();
    },
  });

  const { data: favorites } = useFavoritePlayers();
  const { add, remove } = useToggleFavoritePlayer();

  const fav = favorites?.find((f) => f.playerId === id && f.sport === sport);
  const isFav = !!fav;

  function handleToggle() {
    if (!player) return;
    if (isFav && fav) {
      remove.mutate(fav.id);
    } else {
      add.mutate({
        playerId: id,
        sport,
        league,
        playerName: player.displayName,
        playerPhoto: player.headshot?.href,
        teamName: player.team?.displayName,
        position: player.position?.abbreviation,
      });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 pb-8">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-16 text-slate-400">
        Player not found.
        <Link href="/teams" className="block mt-3 text-blue-400 hover:text-blue-300">
          ← Back to teams
        </Link>
      </div>
    );
  }

  const teamLogo = player.team?.logos?.[0]?.href;
  // ESPN sometimes returns links array on athlete objects
  const playerAny = player as unknown as { links?: Array<{ rel: string[]; href: string }> };
  const espnUrl = playerAny.links?.find((l) =>
    Array.isArray(l.rel) ? l.rel.includes('athlete') : false
  )?.href;

  const infoRows = [
    { label: 'Position', value: player.position?.displayName },
    { label: 'Jersey', value: player.jersey ? `#${player.jersey}` : undefined },
    { label: 'Age', value: player.age?.toString() },
    { label: 'Date of Birth', value: player.dateOfBirth ? formatDate(player.dateOfBirth) : undefined },
    { label: 'Height', value: player.displayHeight },
    { label: 'Weight', value: player.displayWeight },
    { label: 'Experience', value: player.experience ? `${player.experience.years} year${player.experience.years !== 1 ? 's' : ''}` : undefined },
    { label: 'College', value: player.college?.name },
    { label: 'Draft', value: player.draft?.displayText },
  ].filter((r) => r.value);

  return (
    <div className="pb-8 space-y-6">
      {/* Back */}
      {player.team && (
        <Link
          href={`/team/${sport}/${league}/${player.team.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          {player.team.displayName}
        </Link>
      )}

      {/* Player Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Photo */}
        {player.headshot ? (
          <Image
            src={player.headshot.href}
            alt={player.displayName}
            width={100}
            height={100}
            className="rounded-full object-cover ring-2 ring-slate-600"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-bold text-slate-300">
            {player.displayName.charAt(0)}
          </div>
        )}

        {/* Info */}
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
            <div>
              <h1 className="text-2xl font-bold text-white">{player.displayName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap justify-center sm:justify-start">
                {player.position && (
                  <Badge variant="default">{player.position.displayName}</Badge>
                )}
                {player.jersey && (
                  <Badge variant="default">#{player.jersey}</Badge>
                )}
                {player.active === false && (
                  <Badge variant="red">Inactive</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Team */}
          {player.team && (
            <Link
              href={`/team/${sport}/${league}/${player.team.id}`}
              className="inline-flex items-center gap-2 mt-3 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              {teamLogo && (
                <Image
                  src={teamLogo}
                  alt={player.team.displayName}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              )}
              <span className="text-sm text-slate-300">{player.team.displayName}</span>
            </Link>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleToggle}
            disabled={add.isPending || remove.isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              isFav
                ? 'bg-yellow-500/20 text-yellow-400 hover:bg-red-900/30 hover:text-red-400 border border-yellow-500/30'
                : 'bg-slate-700 text-slate-300 hover:bg-yellow-500/20 hover:text-yellow-400 border border-slate-600'
            }`}
          >
            <Star size={15} className={isFav ? 'fill-yellow-400' : ''} />
            {isFav ? 'Favorited' : 'Favorite'}
          </button>
          {espnUrl && (
            <a
              href={espnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 transition-colors"
            >
              <ExternalLink size={13} />
              ESPN Profile
            </a>
          )}
        </div>
      </div>

      {/* Bio / Info */}
      {infoRows.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-white mb-3">Player Info</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <dl className="divide-y divide-slate-700/50">
              {infoRows.map(({ label, value }) => (
                <div key={label} className="flex items-center px-4 py-3 gap-4">
                  <dt className="text-sm text-slate-400 w-32 shrink-0">{label}</dt>
                  <dd className="text-sm text-white font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      )}
    </div>
  );
}
