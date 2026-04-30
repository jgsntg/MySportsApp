import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { ESPNGame, ESPNCompetitor } from '@/types';

interface ScoreCardProps {
  game: ESPNGame & { leagueName?: string };
}

function getStatusBadge(state: string, detail: string) {
  if (state === 'in') return <Badge variant="live">● LIVE · {detail}</Badge>;
  if (state === 'post') return <Badge variant="final">Final</Badge>;
  return <Badge variant="upcoming">{detail}</Badge>;
}

function Team({ competitor }: { competitor: ESPNCompetitor }) {
  const logo = competitor.team.logos?.[0]?.href;
  const isWinner = competitor.winner;

  return (
    <div className="flex items-center gap-2.5">
      {logo ? (
        <Image
          src={logo}
          alt={competitor.team.displayName}
          width={28}
          height={28}
          className="object-contain"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-slate-600" />
      )}
      <span
        className={`text-sm font-medium truncate ${
          isWinner ? 'text-white' : 'text-slate-400'
        }`}
      >
        {competitor.team.abbreviation}
      </span>
      {competitor.score !== undefined && (
        <span
          className={`ml-auto text-sm font-bold tabular-nums ${
            isWinner ? 'text-white' : 'text-slate-400'
          }`}
        >
          {competitor.score}
        </span>
      )}
    </div>
  );
}

export function ScoreCard({ game }: ScoreCardProps) {
  const competition = game.competitions?.[0];
  if (!competition) return null;

  const home = competition.competitors.find((c) => c.homeAway === 'home');
  const away = competition.competitors.find((c) => c.homeAway === 'away');
  if (!home || !away) return null;

  const { state, detail, shortDetail } = competition.status.type;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase">
          {game.leagueName}
        </span>
        {getStatusBadge(state, state === 'in' ? shortDetail : detail)}
      </div>
      <div className="space-y-2">
        <Team competitor={away} />
        <Team competitor={home} />
      </div>
      {competition.venue && (
        <p className="text-xs text-slate-500 mt-2.5 truncate">
          {competition.venue.fullName}
        </p>
      )}
    </div>
  );
}
