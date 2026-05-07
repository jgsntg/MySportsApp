import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favoriteTeams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getScoreboard } from '@/lib/api/espn';
import { getPreferences } from '@/lib/db/preferences';
import type { Metadata } from 'next';
import type { ESPNGame } from '@/types';
import ScoreboardClient, { type ScoreSection, type ScoreGame, type GolfTournament } from '@/components/scoreboard/ScoreboardClient';

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

const ET_TZ = 'America/New_York';

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: ET_TZ }).replace(/-/g, '');
}

function makeDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { timeZone: ET_TZ, weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase().replace(',', ' ·');
}

interface ESPNGolfCompetitor {
  order?: number;
  score?: string;
  athlete?: { displayName?: string };
  status?: { thru?: string; displayValue?: string };
}

interface ESPNGolfEvent {
  id: string;
  name?: string;
  status?: { type?: { state?: string; description?: string } };
  competitions?: Array<{ competitors?: ESPNGolfCompetitor[] }>;
  links?: Array<{ rel?: string[]; href?: string }>;
}

function buildGolfTournament(events: ESPNGolfEvent[]): GolfTournament | undefined {
  const event = events[0];
  if (!event) return undefined;
  const comp = event.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  const sorted = [...competitors].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const leaders = sorted.slice(0, 10).map(c => ({
    order:  c.order ?? 0,
    name:   c.athlete?.displayName ?? 'Unknown',
    score:  c.score ?? '–',
    thru:   c.status?.thru ?? c.status?.displayValue,
  }));
  const state  = (event.status?.type?.state ?? 'pre') as 'pre' | 'in' | 'post';
  const espnLink = event.links?.find(l => l.rel?.includes('desktop'))?.href;
  return {
    name:         event.name ?? 'PGA Tour Event',
    status:       state,
    statusDetail: event.status?.type?.description ?? '',
    leaders,
    espnLink,
  };
}

function espnGameUrl(sport: string, league: string, gameId: string): string {
  if (sport === 'golf') return `https://www.espn.com/golf/leaderboard`;
  if (sport === 'soccer') return `https://www.espn.com/soccer/match/_/gameId/${gameId}`;
  const leagueSlug: Record<string, string> = {
    football: 'nfl', basketball: 'nba', baseball: 'mlb', hockey: 'nhl',
  };
  return `https://www.espn.com/${leagueSlug[sport] ?? league}/game/_/gameId/${gameId}`;
}

function transformGame(game: ESPNGame, myTeamKeys: Set<string>, sport: string, league: string): ScoreGame | null {
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
      mine:    myTeamKeys.has(`${away.team.id}:${league}`),
      winning: state === 'post' ? !!away.winner
        : (awayN !== undefined && homeN !== undefined ? awayN > homeN : false),
    },
    home: {
      abbr:    home.team.abbreviation,
      name:    home.team.displayName,
      logo:    home.team.logos?.[0]?.href,
      score:   home.score,
      mine:    myTeamKeys.has(`${home.team.id}:${league}`),
      winning: state === 'post' ? !!home.winner
        : (awayN !== undefined && homeN !== undefined ? homeN > awayN : false),
    },
    venue:     comp.venue?.fullName,
    broadcast: comp.broadcasts?.[0]?.names?.[0],
    espnLink:  espnGameUrl(sport, league, game.id),
  };
}

function buildSections(rawResults: unknown[], myTeamKeys: Set<string>): ScoreSection[] {
  return (LEAGUES.map((l, i) => {
    if (l.sport === 'golf') {
      const golfTournament = buildGolfTournament(rawResults[i] as ESPNGolfEvent[]);
      if (!golfTournament) return null;
      return { key: l.key, name: l.name, color: l.color, games: [], golfTournament };
    }
    const rawGames = (rawResults[i] as ESPNGame[]) ?? [];
    const games = rawGames
      .map(g => transformGame(g, myTeamKeys, l.sport, l.league))
      .filter((g): g is ScoreGame => g !== null);
    games.sort((a, b) => {
      const aScore = (a.away.mine || a.home.mine ? 2 : 0) + (a.state === 'in' ? 1 : 0);
      const bScore = (b.away.mine || b.home.mine ? 2 : 0) + (b.state === 'in' ? 1 : 0);
      return bScore - aScore;
    });
    return { key: l.key, name: l.name, color: l.color, games };
  }) as Array<ScoreSection | null>).filter((s): s is ScoreSection => s !== null && (s.games.length > 0 || !!s.golfTournament));
}

export default async function ScoreboardPage() {
  const session = await getServerSession(authOptions);
  const userId  = session!.user.id;

  const now       = new Date();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow  = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr     = formatDate(now);
  const yesterdayStr = formatDate(yesterday);
  const tomorrowStr  = formatDate(tomorrow);

  const [myTeams, savedPrefs, ...scoreResults] = await Promise.all([
    db.select().from(favoriteTeams).where(eq(favoriteTeams.userId, userId)),
    getPreferences(userId),
    ...LEAGUES.flatMap(l => [
      getScoreboard(l.sport, l.league, todayStr),
      getScoreboard(l.sport, l.league, yesterdayStr),
      getScoreboard(l.sport, l.league, tomorrowStr),
    ]),
  ]);

  const myTeamKeys = new Set(myTeams.map(t => `${t.teamId}:${t.league}`));
  const n = LEAGUES.length;

  const todaySections     = buildSections(scoreResults.filter((_, i) => i % 3 === 0).slice(0, n), myTeamKeys);
  const yesterdaySections = buildSections(scoreResults.filter((_, i) => i % 3 === 1).slice(0, n), myTeamKeys);
  const tomorrowSections  = buildSections(scoreResults.filter((_, i) => i % 3 === 2).slice(0, n), myTeamKeys);

  return (
    <div style={{ background: '#0B1020', color: '#F0F4FF', minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif', padding: '24px 0 48px' }}>
      <ScoreboardClient
        todaySections={todaySections}
        yesterdaySections={yesterdaySections}
        tomorrowSections={tomorrowSections}
        todayDateLabel={makeDateLabel(now)}
        yesterdayDateLabel={makeDateLabel(yesterday)}
        tomorrowDateLabel={makeDateLabel(tomorrow)}
        savedPrefs={savedPrefs}
      />
    </div>
  );
}
