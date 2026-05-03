'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, TrendingUp, Newspaper, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { timeAgo } from '@/lib/utils';
import type { FantasyArticle } from '@/app/api/fantasy/feed/route';

// ── Constants ─────────────────────────────────────────────────────────────────

const SPORT_TABS = [
  { label: 'All Sports', value: 'all' },
  { label: 'NFL',        value: 'football' },
  { label: 'NBA',        value: 'basketball' },
  { label: 'MLB',        value: 'baseball' },
  { label: 'NHL',        value: 'hockey' },
];

const SPORT_COLORS: Record<string, string> = {
  football:   'bg-orange-900/40 text-orange-400',
  basketball: 'bg-red-900/40 text-red-400',
  baseball:   'bg-blue-900/40 text-blue-400',
  hockey:     'bg-cyan-900/40 text-cyan-400',
  all:        'bg-green-900/40 text-green-400',
};

const SPORT_LABELS: Record<string, string> = {
  football:   'NFL',
  basketball: 'NBA',
  baseball:   'MLB',
  hockey:     'NHL',
  all:        'SPORTS',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SportBadge({ sport }: { sport: string }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SPORT_COLORS[sport] ?? SPORT_COLORS.all}`}>
      {SPORT_LABELS[sport] ?? sport.toUpperCase()}
    </span>
  );
}

function FantasyCard({ article, featured = false }: { article: FantasyArticle; featured?: boolean }) {
  const url = article.link || undefined;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4 transition-colors hover:border-slate-600 hover:bg-slate-750 ${!url ? 'pointer-events-none' : ''}`}
    >
      {featured && article.image && (
        <div className="relative h-36 w-full overflow-hidden rounded-lg bg-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt={article.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <SportBadge sport={article.sport} />
        {article.fantasyScore >= 5 && (
          <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
            <TrendingUp size={10} />
            FANTASY
          </span>
        )}
        {article.pubDate && (
          <span className="text-xs text-slate-500 ml-auto">{timeAgo(article.pubDate)}</span>
        )}
      </div>

      <div className={`font-semibold leading-tight text-white group-hover:text-green-400 transition-colors ${featured ? 'text-lg' : 'text-sm'}`}>
        {article.title}
      </div>

      {article.description && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {article.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between">
        <span className="text-xs text-slate-500 truncate max-w-[70%]">
          {article.creator || 'ESPN'}
        </span>
        {url && (
          <ExternalLink size={12} className="shrink-0 text-slate-500 group-hover:text-green-400 transition-colors" />
        )}
      </div>
    </a>
  );
}

function NewsRow({ article }: { article: FantasyArticle }) {
  const url = article.link || undefined;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4 transition-colors hover:border-slate-600 ${!url ? 'pointer-events-none' : ''}`}
    >
      {article.image && (
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt={article.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 min-w-0 flex-col gap-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <SportBadge sport={article.sport} />
          {article.pubDate && (
            <span className="text-xs text-slate-500">{timeAgo(article.pubDate)}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-green-400 transition-colors">
          {article.title}
        </p>
        {article.description && (
          <p className="text-xs text-slate-400 line-clamp-1">{article.description}</p>
        )}
      </div>
      {url && (
        <ExternalLink size={14} className="mt-1 shrink-0 text-slate-500 group-hover:text-green-400 transition-colors" />
      )}
    </a>
  );
}

function LoadingGrid({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FantasyPage() {
  const [sport, setSport] = useState('all');
  const [tab, setTab]     = useState<'fantasy' | 'news'>('fantasy');

  const { data, isLoading, isError } = useQuery<{
    fantasy: FantasyArticle[];
    news:    FantasyArticle[];
  }>({
    queryKey: ['fantasy', sport],
    queryFn: async () => {
      const res = await fetch(`/api/fantasy/feed?sport=${sport}`);
      if (!res.ok) throw new Error('Failed to fetch fantasy feed');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const fantasyArticles = data?.fantasy ?? [];
  const newsArticles    = data?.news    ?? [];
  const featured        = fantasyArticles[0];
  const rest            = fantasyArticles.slice(1);

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">Fantasy Sports</h1>
          <span className="text-xs font-bold bg-green-600 text-white px-2 py-0.5 rounded-full">
            LIVE
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Rankings, waiver wire, analysis and player news — powered by ESPN Fantasy.
        </p>
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {SPORT_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setSport(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sport === t.value
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-700">
        {([
          { key: 'fantasy', label: 'Fantasy Analysis', icon: TrendingUp },
          { key: 'news',    label: 'Player News',      icon: Newspaper  },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-800 bg-red-900/20 p-4 text-sm text-red-400 mb-6">
          <AlertCircle size={16} />
          Failed to load fantasy feed. Check your connection and try again.
        </div>
      )}

      {/* ── Fantasy Analysis tab ── */}
      {tab === 'fantasy' && (
        <>
          {isLoading ? (
            <LoadingGrid rows={8} />
          ) : fantasyArticles.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
              <TrendingUp size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-white mb-1">No fantasy articles right now.</p>
              <p className="text-sm">Try a different sport filter or check back later.</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Featured article — full-width on small, left col on large */}
              {featured && (
                <div className="lg:col-span-1">
                  <FantasyCard article={featured} featured />
                </div>
              )}

              {/* Rest as a 2-col grid on large */}
              <div className={`grid gap-3 content-start ${featured ? 'lg:col-span-2 sm:grid-cols-2' : 'lg:col-span-3 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {rest.map((a, i) => (
                  <FantasyCard key={i} article={a} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Player News tab ── */}
      {tab === 'news' && (
        <>
          {isLoading ? (
            <LoadingGrid rows={10} />
          ) : newsArticles.length === 0 ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
              <Newspaper size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-white mb-1">No player news right now.</p>
              <p className="text-sm">Try a different sport filter or check back later.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {newsArticles.map((a, i) => (
                <NewsRow key={i} article={a} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
