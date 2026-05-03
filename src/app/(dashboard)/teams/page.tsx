'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamCard } from '@/components/teams/TeamCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavoriteTeams, useToggleFavoriteTeam } from '@/hooks/useFavorites';
import type { ESPNTeam } from '@/types';

const SPORTS = [
  { key: 'nfl',    sport: 'football',   league: 'nfl',   name: 'NFL',      emoji: '🏈' },
  { key: 'nba',    sport: 'basketball', league: 'nba',   name: 'NBA',      emoji: '🏀' },
  { key: 'mlb',    sport: 'baseball',   league: 'mlb',   name: 'MLB',      emoji: '⚾' },
  { key: 'nhl',    sport: 'hockey',     league: 'nhl',   name: 'NHL',      emoji: '🏒' },
  { key: 'mls',    sport: 'soccer',     league: 'usa.1', name: 'MLS',      emoji: '⚽' },
  { key: 'laliga', sport: 'soccer',     league: 'esp.1', name: 'La Liga',  emoji: '🇪🇸' },
  { key: 'epl',    sport: 'soccer',     league: 'eng.1', name: 'EPL',      emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { key: 'pga',    sport: 'golf',       league: 'pga',   name: 'PGA Tour', emoji: '⛳' },
] as const;

export default function TeamsPage() {
  const [selected, setSelected] = useState<(typeof SPORTS)[number]>(SPORTS[0]);
  const [search, setSearch] = useState('');

  const { data: teams, isLoading } = useQuery<ESPNTeam[]>({
    queryKey: ['teams', selected.sport, selected.league],
    queryFn: async () => {
      const res = await fetch(
        `/api/sports/teams?sport=${selected.sport}&league=${selected.league}`
      );
      if (!res.ok) throw new Error('Failed to fetch teams');
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  const { data: favorites } = useFavoriteTeams();
  const { add, remove } = useToggleFavoriteTeam();

  const filtered = (teams ?? []).filter((t) =>
    !search || t.displayName.toLowerCase().includes(search.toLowerCase())
  );

  function handleToggle(team: ESPNTeam, isFav: boolean, favId?: string) {
    if (isFav && favId) {
      remove.mutate(favId);
    } else {
      add.mutate({
        teamId: team.id,
        sport: selected.sport,
        league: selected.league,
        teamName: team.displayName,
        teamLogo: team.logos?.[0]?.href,
        teamColor: team.color,
      });
    }
  }

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Browse Teams</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Star a team to track it on your dashboard.
        </p>
      </div>

      {/* Sport tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {SPORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => { setSelected(s); setSearch(''); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selected.key === s.key
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <span>{s.emoji}</span>
            {s.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="search"
          placeholder={`Search ${selected.name} teams…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center text-slate-400">
          {search ? `No teams matching "${search}"` : 'No teams found.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((team) => {
            const fav = favorites?.find(
              (f) => f.teamId === team.id && f.sport === selected.sport
            );
            return (
              <TeamCard
                key={team.id}
                team={team}
                sport={selected.sport}
                league={selected.league}
                favorite={fav}
                onToggleFavorite={(isFav, favId) => handleToggle(team, isFav, favId)}
                isPending={add.isPending || remove.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
