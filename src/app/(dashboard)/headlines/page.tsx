'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HeadlineCard } from '@/components/headlines/HeadlineCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { ESPNNewsArticle } from '@/types';

const FILTERS = [
  { label: 'All Sports', value: '' },
  { label: 'NFL', value: 'football' },
  { label: 'NBA', value: 'basketball' },
  { label: 'MLB', value: 'baseball' },
  { label: 'NHL', value: 'hockey' },
  { label: 'Soccer', value: 'soccer' },
];

export default function HeadlinesPage() {
  const [sport, setSport] = useState('');

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

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Sports Headlines</h1>
        <p className="text-slate-400 mt-1 text-sm">Latest news from ESPN.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
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
  );
}
