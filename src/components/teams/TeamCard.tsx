'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ESPNTeam, FavoriteTeam } from '@/types';

interface TeamCardProps {
  team: ESPNTeam;
  sport: string;
  league: string;
  favorite?: FavoriteTeam;
  onToggleFavorite: (isFav: boolean, favId?: string) => void;
  isPending?: boolean;
}

export function TeamCard({
  team,
  sport,
  league,
  favorite,
  onToggleFavorite,
  isPending,
}: TeamCardProps) {
  const logo = team.logos?.[0]?.href;
  const record = team.record?.items?.find((r) => r.type === 'total')?.summary;
  const isFav = !!favorite;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center gap-3 hover:border-slate-600 transition-colors group">
      <Link
        href={`/team/${sport}/${league}/${team.id}`}
        className="flex flex-col items-center gap-3 flex-1 w-full"
      >
        {logo ? (
          <Image
            src={logo}
            alt={team.displayName}
            width={64}
            height={64}
            className="object-contain group-hover:scale-105 transition-transform"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ backgroundColor: `#${team.color ?? '334155'}` }}
          >
            {team.abbreviation}
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold text-white leading-tight">{team.displayName}</p>
          {record && <p className="text-xs text-slate-400 mt-0.5">{record}</p>}
        </div>
      </Link>

      <button
        onClick={() => onToggleFavorite(isFav, favorite?.id)}
        disabled={isPending}
        className={cn(
          'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50',
          isFav
            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-red-900/30 hover:text-red-400'
            : 'bg-slate-700 text-slate-400 hover:bg-yellow-500/20 hover:text-yellow-400'
        )}
        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star size={12} className={isFav ? 'fill-yellow-400' : ''} />
        {isFav ? 'Favorited' : 'Favorite'}
      </button>
    </div>
  );
}
