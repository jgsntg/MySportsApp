import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoriteTeams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getScoreboard } from '@/lib/api/espn';
import type { Metadata } from 'next';
import type { ESPNGame } from '@/types';
import ScoreboardClient, { type ScoreSection, type ScoreGame } from '@/components/scoreboard/ScoreboardClient';

export const metadata: Metadata = { title: 'Scoreboard' };

const LEAGUES = [
  { key: 'nfl',    sport: 'football',   league: 'nfl',   name: 'NFL',      color: '#013369' },
  { key: 'nba',    sport: 'basketball', league: 'nba',   name: 'NBA',      color: '#C9082A' },
  { key: 'mlb',    sport: 'baseball',   league: 'mlb',   name: 'MLB',      color: '#002D72' },
  { key: 'nhl',    sport: 'hockey',     league: 'nhl',   name: 'NHL',      color: '#154734' },
  { key: 'mls',    sport: 'soccer',     league: 'usa.1', name: 'MLS',      color: '#1C4E7F' },
  { key: 'laliga', sport: 'soccer',     league: 'esp.1', name: 'La Liga',  color: '#EF0027' },
  { key: 'epl',    sport: 'soccer',     league: 'eng.1', name: 'EPL',      color: '#3D185A' },
  { key: 'pga',    sport: 'golf',       league: 'pga',   name: 'PGA Tour', color: '#00573F' },
];

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function transformGame(game: ESPNGame, myTeamIds: Set<string>): ScoreGame | null {
  const comp = game.competitions?.[0];
  if (!comp) return null;
  const away = comp.competitors.find(c => c.homeAway === 'away');
  const home = comp.competitors.find(c => c.homeAway === 'home');
  if (!away || !home) return null;

  const { state } = comp.status.type;
  const detail = state === 'in' ? comp.status.type.shortDetail : comp.status.type.detail;
  const awayN = away.score ? Number(away.score) : undefined;
  const homeN = home.score ? Number(home.score) : undefined;

  return {
    id: game.id,
    state,
    detail,
    away: {
      abbr:    away.team.abbreviation,
      name:    away.team.displayName,
      logo:    away.team.logos?.[0]?.href,
      score:   away.score,
      mine:    myTeamIds.has(away.team.id),
      winning: state === 'post' ? !!away.winner
        : (awayN !== undefined && homeN !== undefined ? awayN > homeN : false),
    },
    home: {
      abbr:    home.team.abbreviation,
      name:    home.team.displayName,
      logo:    home.team.logos?.[0]?.href,
      score:   home.score,
      mine:    myTeamIds.has(home.team.id),
      winning: state === 'post' ? !!home.winner
        : (awayN !== undefined && homeN !== undefined ? homeN > awayN : false),
    },
    venue:     comp.venue?.fullName,
    broadcast: comp.broadcasts?.[0]?.names?.[0],
  };
}

export default async function ScoreboardPage() {
  const session = await getServerSession(authOptions);
  const userId  = session!.user.id;

  const todayStr = formatDate(new Date());

  const [myTeams, ...scoreResults] = await Promise.all([
    db.select().from(favoriteTeams).where(eq(favoriteTeams.userId, userId)),
    ...LEAGUES.map(l => getScoreboard(l.sport, l.league, todayStr)),
  ]);

  const myTeamIds = new Set(myTeams.map(t => t.teamId));

  const sections: ScoreSection[] = LEAGUES.map((l, i) => {
    const rawGames = (scoreResults[i] as ESPNGame[]) ?? [];
    const games = rawGames
      .map(g => transformGame(g, myTeamIds))
      .filter((g): g is ScoreGame => g !== null);

    // Favorites first, then live, then scheduled, then final
    games.sort((a, b) => {
      const aScore = (a.away.mine || a.home.mine ? 2 : 0) + (a.state === 'in' ? 1 : 0);
      const bScore = (b.away.mine || b.home.mine ? 2 : 0) + (b.state === 'in' ? 1 : 0);
      return bScore - aScore;
    });

    return { key: l.key, name: l.name, color: l.color, games };
  }).filter(s => s.games.length > 0);

  const now = new Date();
  const dateLabel = now
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase()
    .replace(',', ' ·');

  return (
    <div style={{ background: '#0B1020', color: '#F0F4FF', minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif', padding: '24px 0 48px' }}>
      <ScoreboardClient sections={sections} dateLabel={dateLabel} />
    </div>
  );
}
