import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { ESPNNewsArticle } from '@/types';

interface HeadlineCardProps {
  article: ESPNNewsArticle;
}

export function HeadlineCard({ article }: HeadlineCardProps) {
  const url = article.links?.web?.href;
  const image = article.images?.[0];
  const sport = article.categories?.find((c) => c.type === 'league')?.description;

  const Wrapper = url
    ? ({ children }: { children: React.ReactNode }) => (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 hover:bg-slate-750 transition-colors group"
        >
          {children}
        </a>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className="flex gap-4 bg-slate-800 border border-slate-700 rounded-xl p-4">
          {children}
        </div>
      );

  return (
    <Wrapper>
      {image && (
        <div className="shrink-0 relative w-24 h-16 sm:w-32 sm:h-20 rounded-lg overflow-hidden bg-slate-700">
          <Image
            src={image.url}
            alt={image.alt ?? article.headline}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="128px"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
            {article.headline}
          </h3>
          {url && (
            <ExternalLink
              size={14}
              className="shrink-0 text-slate-500 group-hover:text-blue-400 transition-colors mt-0.5"
            />
          )}
        </div>
        {article.description && (
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{article.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          {sport && (
            <span className="text-xs font-medium text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-full">
              {sport}
            </span>
          )}
          {article.published && (
            <span className="text-xs text-slate-500">{timeAgo(article.published)}</span>
          )}
        </div>
      </div>
    </Wrapper>
  );
}
