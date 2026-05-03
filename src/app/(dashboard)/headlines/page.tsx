'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { HeadlineCard } from '@/components/headlines/HeadlineCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavoriteTeams } from '@/hooks/useFavorites';
import type { ESPNNewsArticle } from '@/types';

const FILTERS = [
  { label: 'All Sports', value: '' },
  { label: 'NFL',        value: 'football' },
  { label: 'NBA',        value: 'basketball' },
  { label: 'MLB',        value: 'baseball' },
  { label: 'NHL',        value: 'hockey' },
  { label: 'Soccer',     value: 'soccer' },
  { label: 'Golf',       value: 'golf' },
];

function useTeamNews(enabled: boolean) {
  const { data: favorites } = useFavoriteTeams();

  return useQuery<ESPNNewsArticle[]>({
    queryKey: ['teamNews', favorites?.map(f => f.teamId).join(',')],
    enabled: enabled && !!favorites && favorites.length > 0,
    queryFn: async () => {
      if (!favorites?.length) return [];
      const slice = favorites.slice(0, 4);
      const results = await Promise.all(
        slice.map(f =>
          fetch(`/api/sports/headlines?sport=${f.sport}&league=${f.league}&team=${f.teamId}&limit=4`)
            .then(r => r.ok ? r.json() : [])
            .catch(() => [])
        )
      );
      const seen  = new Set<string>();
      const deduped: ESPNNewsArticle[] = [];
      for (const batch of results as ESPNNewsArticle[][]) {
        for (const a of batch) {
          const key = a.links?.web?.href ?? a.headline;
          if (!seen.has(key)) { seen.add(key); deduped.push(a); }
        }
      }
      return deduped.slice(0, 8);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export default function HeadlinesPage() {
  const [sport, setSport] = useState('');
  const { data: session } = useSession();
  const isFiltered = sport !== '';

  const { data: articles, isLoading } = useQuery<ESPNNewsArticle[]>({
    queryKey: ['headlines', sport],
    queryFn: async () => {
      const sp = sport ? `&sport=${sport}` : '';
      const res = await fetch(`/api/sports/headlines?limit=30${sp}`);
      if (!res.ok) throw new Error('Failed to fetch headlines');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: teamNews, isLoading: teamLoading } = useTeamNews(!isFiltered);
  const hasTeamNews = !isFiltered && !!teamNews?.length;

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Headlines</h1>
        {session?.user?.name && (
          <p className="text-slate-400 mt-1 text-sm">
            Your teams&apos; news and the top stories in sports.
          </p>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setSport(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sport === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* My Teams section — only shown when not filtered */}
      {!isFiltered && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold tracking-widest" style={{ color: '#FFD166', letterSpacing: '0.2em' }}>
              MY TEAMS
            </span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {teamLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : !hasTeamNews ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center text-slate-500 text-sm">
              {!session ? 'Sign in to see your teams\' news.' : 'Add favorite teams to see their latest news here.'}
            </div>
          ) : (
            <div className="grid gap-3">
              {teamNews!.map((article, i) => (
                <HeadlineCard key={i} article={article} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Headlines / filtered results */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-bold tracking-widest text-slate-500" style={{ letterSpacing: '0.2em' }}>
            {isFiltered
              ? FILTERS.find(f => f.value === sport)?.label.toUpperCase() + ' NEWS'
              : 'TOP HEADLINES'}
          </span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-10 text-center text-slate-400">
            No headlines available.
          </div>
        ) : (
          <div className="grid gap-3">
            {articles.map((article, i) => (
              <HeadlineCard key={i} article={article} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
