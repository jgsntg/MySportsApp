import { NextResponse } from 'next/server';
import { getNews } from '@/lib/api/espn';
import type { ESPNNewsArticle } from '@/types';

const ESPN_RSS_URL = 'https://www.espn.com/espn/rss/nfl/fantasyNews';

const FANTASY_KEYWORDS = [
  'fantasy', 'waiver', 'lineup', 'rankings', 'pickup', 'start/sit',
  'dfs', 'mock draft', 'sleeper', 'projection', 'waiver wire', 'must start',
  'injury report', 'add/drop', 'trade value', 'bust', 'streaming',
  'roster moves', 'week ', 'draft', 'roto', 'points per',
];

// ── RSS parser (no external deps) ────────────────────────────────────────────

function parseCDATA(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(regex);
  return m ? parseCDATA(m[1]) : '';
}

interface RawRSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  creator: string;
}

function parseRSS(xml: string): RawRSSItem[] {
  const items: RawRSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml)) !== null) {
    const x = m[1];
    // ESPN wraps link in CDATA; fall back to plain text link
    const cdataLink = parseCDATA(extractTag(x, 'link'));
    const plainLink = x.match(/<link>([^<]+)<\/link>/)?.[1]?.trim() ?? '';
    items.push({
      title:       extractTag(x, 'title'),
      description: extractTag(x, 'description'),
      link:        cdataLink || plainLink,
      pubDate:     extractTag(x, 'pubDate'),
      creator:     extractTag(x, 'dc:creator'),
    });
  }
  return items;
}

// ── Scoring & sport detection ─────────────────────────────────────────────────

function fantasyScore(title: string, creator: string, description: string): number {
  let score = 0;
  const text = `${title} ${creator} ${description}`.toLowerCase();
  if (creator.toLowerCase().includes('fantasy')) score += 5;
  if (creator.toLowerCase().includes('karabell') || creator.toLowerCase().includes('dorey')) score += 3;
  for (const kw of FANTASY_KEYWORDS) {
    if (text.includes(kw)) score += 1;
  }
  return score;
}

function detectSport(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (/\b(nfl|football|quarterback|touchdown|wide receiver|running back|tight end|linebacker|defensive end|qb\b|rb\b|wr\b|te\b|kicker)\b/.test(text)) return 'football';
  if (/\b(nba|basketball|three-pointer|rebound|point guard|shooting guard|power forward|small forward|center\b)\b/.test(text)) return 'basketball';
  if (/\b(mlb|baseball|pitcher|batting average|home run|strikeout|outfield|shortstop|catcher|first base|second base|third base)\b/.test(text)) return 'baseball';
  if (/\b(nhl|hockey|goalie|power play|stanley cup|winger|defenseman|faceoff)\b/.test(text)) return 'hockey';
  return 'all';
}

// ── Exported types ────────────────────────────────────────────────────────────

export interface FantasyArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  creator: string;
  sport: string;
  fantasyScore: number;
  source: 'rss' | 'api';
  image?: string;
}

// ── Route handler ─────────────────────────────────────────────────────────────

const API_SPORTS = [
  { key: 'football',   label: 'NFL'  },
  { key: 'basketball', label: 'NBA'  },
  { key: 'baseball',   label: 'MLB'  },
  { key: 'hockey',     label: 'NHL'  },
] as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sportFilter = searchParams.get('sport') ?? 'all';

  const [rssRes, ...newsResults] = await Promise.all([
    fetch(ESPN_RSS_URL, { next: { revalidate: 300 } }),
    ...API_SPORTS.map(s => getNews(s.key, 15)),
  ]);

  // Parse RSS and score for fantasy relevance
  const rssXml = rssRes.ok ? await rssRes.text() : '';
  const rssItems = parseRSS(rssXml);

  const fantasyArticles: FantasyArticle[] = rssItems
    .map(item => ({
      ...item,
      sport:        detectSport(item.title, item.description),
      fantasyScore: fantasyScore(item.title, item.creator, item.description),
      source:       'rss' as const,
    }))
    .filter(item => item.fantasyScore >= 1)
    .sort((a, b) => {
      // Primary: fantasy score; secondary: recency
      if (b.fantasyScore !== a.fantasyScore) return b.fantasyScore - a.fantasyScore;
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });

  // Player / injury news from ESPN API
  const playerNews: FantasyArticle[] = (newsResults as ESPNNewsArticle[][]).flatMap((articles, i) =>
    articles.map(a => ({
      title:        a.headline,
      description:  a.description ?? '',
      link:         a.links?.web?.href ?? '',
      pubDate:      a.published ?? '',
      creator:      a.categories?.find(c => c.type === 'league')?.description ?? API_SPORTS[i].label,
      sport:        API_SPORTS[i].key,
      fantasyScore: 0,
      source:       'api' as const,
      image:        a.images?.[0]?.url,
    }))
  );

  const filterBySport = (item: FantasyArticle) =>
    sportFilter === 'all' || item.sport === sportFilter;

  return NextResponse.json(
    {
      fantasy: fantasyArticles.filter(filterBySport).slice(0, 20),
      news:    playerNews.filter(filterBySport).slice(0, 30),
    },
    { headers: { 'Cache-Control': 's-maxage=300' } }
  );
}
