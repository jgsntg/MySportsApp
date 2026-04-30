'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ESPNAthlete, FavoritePlayer } from '@/types';

interface PlayerCardProps {
  player: ESPNAthlete;
  sport: string;
  league: string;
  favorite?: FavoritePlayer;
  onToggleFavorite: (isFav: boolean, favId?: string) => void;
  isPending?: boolean;
}

export function PlayerCard({
  player,
  sport,
  league,
  favorite,
  onToggleFavorite,
  isPending,
}: PlayerCardProps) {
  const isFav = !!favorite;
  const photo = player.headshot?.href;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center gap-3 hover:border-slate-600 transition-colors group">
      <Link
        href={`/player/${sport}/${league}/${player.id}`}
        className="flex flex-col items-center gap-2 flex-1 w-full"
      >
        {photo ? (
          <Image
            src={photo}
            alt={player.displayName}
            width={64}
            height={64}
            className="rounded-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-300">
            {player.displayName.charAt(0)}
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-semibold text-white leading-tight">{player.displayName}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {player.position?.abbreviation ?? '–'}
            {player.jersey ? ` · #${player.jersey}` : ''}
          </p>
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
      >
        <Star size={12} className={isFav ? 'fill-yellow-400' : ''} />
        {isFav ? 'Favorited' : 'Favorite'}
      </button>
    </div>
  );
}
