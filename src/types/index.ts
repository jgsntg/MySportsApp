// ESPN API types
export interface ESPNTeam {
  id: string;
  uid?: string;
  slug?: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  name: string;
  location?: string;
  color?: string;
  alternateColor?: string;
  logos?: ESPNLogo[];
  record?: {
    items: Array<{
      description: string;
      type: string;
      summary: string;
    }>;
  };
  links?: Array<{ rel: string[]; href: string; text: string }>;
}

export interface ESPNLogo {
  href: string;
  width?: number;
  height?: number;
  alt?: string;
  rel?: string[];
}

export interface ESPNAthlete {
  id: string;
  uid?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  displayName: string;
  shortName?: string;
  weight?: number;
  displayWeight?: string;
  height?: number;
  displayHeight?: string;
  age?: number;
  dateOfBirth?: string;
  jersey?: string;
  position?: {
    id?: string;
    name: string;
    displayName: string;
    abbreviation: string;
  };
  headshot?: {
    href: string;
    alt: string;
  };
  team?: ESPNTeam;
  status?: {
    id: string;
    name: string;
    type: string;
    abbreviation: string;
  };
  experience?: { years: number };
  college?: { name: string; shortName?: string };
  draft?: {
    displayText: string;
    round: number;
    selection: number;
    year: number;
  };
  statistics?: { $ref: string };
  active?: boolean;
}

export interface ESPNGame {
  id: string;
  name: string;
  shortName: string;
  date?: string;
  competitions: ESPNCompetition[];
  status: ESPNGameStatus;
}

export interface ESPNCompetition {
  id: string;
  date: string;
  status: ESPNGameStatus;
  competitors: ESPNCompetitor[];
  venue?: {
    fullName: string;
    address?: { city: string; state?: string };
  };
  broadcasts?: Array<{
    market: string;
    names: string[];
  }>;
}

export interface ESPNGameStatus {
  clock?: number;
  displayClock?: string;
  period?: number;
  type: {
    id: string;
    name: string;
    state: 'pre' | 'in' | 'post';
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

export interface ESPNCompetitor {
  id: string;
  homeAway: 'home' | 'away';
  team: ESPNTeam;
  score?: string;
  winner?: boolean;
  records?: Array<{ name: string; type: string; summary: string }>;
  linescores?: Array<{ value: number }>;
}

export interface ESPNNewsArticle {
  dataSourceIdentifier?: string;
  description?: string;
  type?: string;
  premium?: boolean;
  links?: {
    api?: { news?: { href: string } };
    web?: { href: string };
  };
  headline: string;
  images?: Array<{
    name?: string;
    width?: number;
    height?: number;
    alt?: string;
    caption?: string;
    url: string;
  }>;
  published?: string;
  lastModified?: string;
  categories?: Array<{
    id: number;
    description: string;
    type: string;
    sportId?: number;
    leagueId?: number;
  }>;
}

export interface ESPNRosterEntry {
  items?: ESPNAthlete[];
  athletes?: Array<{
    position: string;
    items: ESPNAthlete[];
  }>;
}

// App types
export const SPORT_CONFIGS = [
  { key: 'nfl',      sport: 'football',   league: 'nfl',        name: 'NFL',            color: '#013369' },
  { key: 'nba',      sport: 'basketball', league: 'nba',        name: 'NBA',            color: '#C9082A' },
  { key: 'mlb',      sport: 'baseball',   league: 'mlb',        name: 'MLB',            color: '#002D72' },
  { key: 'nhl',      sport: 'hockey',     league: 'nhl',        name: 'NHL',            color: '#154734' },
  { key: 'mls',      sport: 'soccer',     league: 'usa.1',      name: 'MLS',            color: '#1C4E7F' },
  { key: 'laliga',   sport: 'soccer',     league: 'esp.1',      name: 'La Liga',        color: '#EF0027' },
  { key: 'epl',      sport: 'soccer',     league: 'eng.1',      name: 'EPL',            color: '#3D185A' },
  { key: 'worldcup', sport: 'soccer',     league: 'fifa.world', name: 'FIFA World Cup', color: '#326295' },
  { key: 'pga',      sport: 'golf',       league: 'pga',        name: 'PGA Tour',       color: '#00573F' },
] as const;

export type SportKey = (typeof SPORT_CONFIGS)[number]['key'];

export interface FavoriteTeam {
  id: string;
  userId: string;
  teamId: string;
  sport: string;
  league: string;
  teamName: string;
  teamLogo: string | null;
  teamColor: string | null;
  createdAt: number | null;
}

export interface FavoritePlayer {
  id: string;
  userId: string;
  playerId: string;
  sport: string;
  league: string;
  playerName: string;
  playerPhoto: string | null;
  teamName: string | null;
  position: string | null;
  sortOrder: number | null;
  displayInCommandCenter: number | null;
  createdAt: number | null;
}

// NextAuth type augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
  }
}
