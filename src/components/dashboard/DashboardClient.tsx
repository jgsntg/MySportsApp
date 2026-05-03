'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils';
import type { FavoriteTeam, FavoritePlayer, ESPNNewsArticle } from '@/types';
import type { GameSummary, ESPNPlay } from '@/lib/api/espn';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GameTeam {
  abbr: string;
  name: string;
  logo?: string;
  color: string;
  score?: string;
  mine: boolean;
  winning: boolean;
  record?: string;
}

export interface GameData {
  id: string;
  league: string;
  sport: string;
  leagueKey: string;
  state: 'pre' | 'in' | 'post';
  detail: string;
  date: string;
  away: GameTeam;
  home: GameTeam;
  venue?: string;
  broadcast?: string;
}

interface DashboardClientProps {
  userName: string;
  dateLabel: string;
  liveMyTeamCount: number;
  todayGames: GameData[];
  yesterdayGames: GameData[];
  myTeams: FavoriteTeam[];
  myPlayers: FavoritePlayer[];
  generalHeadlines: ESPNNewsArticle[];
  teamNews: ESPNNewsArticle[];
}

// ── Theme tokens ──────────────────────────────────────────────────────────────

type ThemeKey   = 'dark' | 'dim' | 'contrast';
type AccentKey  = 'coral' | 'cyan' | 'lime' | 'rose';
type DensityKey = 'compact' | 'cozy' | 'comfy';

const THEMES: Record<ThemeKey, { bg: string; surface: string; surface2: string; ink: string; muted: string; border: string }> = {
  dark:     { bg: '#0B1020', surface: '#121A30', surface2: '#1A2440', ink: '#F0F4FF', muted: '#8392B5', border: 'rgba(255,255,255,0.07)' },
  dim:      { bg: '#15192B', surface: '#1C223A', surface2: '#252C48', ink: '#EAEDF7', muted: '#8E96B5', border: 'rgba(255,255,255,0.06)' },
  contrast: { bg: '#000000', surface: '#0A0A0A', surface2: '#141414', ink: '#FFFFFF', muted: '#9098A8', border: 'rgba(255,255,255,0.16)' },
};

const ACCENTS: Record<AccentKey, { a: string; b: string }> = {
  coral: { a: '#FF5A4D', b: '#FFD166' },
  cyan:  { a: '#22D3EE', b: '#A78BFA' },
  lime:  { a: '#A3E635', b: '#FACC15' },
  rose:  { a: '#F43F5E', b: '#FB923C' },
};

const DENSITY: Record<DensityKey, { gap: number; sectionGap: number; padCard: number; font: number }> = {
  compact: { gap: 6,  sectionGap: 18, padCard: 10, font: 11 },
  cozy:    { gap: 10, sectionGap: 28, padCard: 14, font: 12 },
  comfy:   { gap: 14, sectionGap: 36, padCard: 18, font: 13 },
};

type Tokens  = typeof THEMES.dark;
type Accent  = typeof ACCENTS.coral;
type Density = typeof DENSITY.cozy;

const DEFAULT_ORDER = ['games', 'teams', 'players', 'headlines'];
const STORAGE_KEY   = 'ms_v3_layout_v1';
const MONO = 'var(--font-mono), ui-monospace, monospace';

// ── Ticker ────────────────────────────────────────────────────────────────────

function Ticker({ games, T, A }: { games: GameData[]; T: Tokens; A: Accent }) {
  if (!games.length) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', background: '#000',
      borderBottom: `1px solid ${T.border}`, overflow: 'hidden', height: 40,
    }}>
      <div style={{
        background: A.a, color: '#000', padding: '0 14px',
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: 999, background: '#000',
          display: 'inline-block', animation: 'msPulse 1.4s infinite',
        }} />
        LIVE
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          display: 'flex',
          animation: 'msTicker 60s linear infinite',
          whiteSpace: 'nowrap',
          width: 'fit-content',
        }}>
          {[...games, ...games].map((g, i) => {
            const live = g.state === 'in';
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, height: 40,
                padding: '0 20px', borderRight: `1px solid ${T.border}`,
                fontFamily: MONO, fontSize: 12,
              }}>
                <span style={{ fontSize: 9, color: T.muted, letterSpacing: '0.12em', fontWeight: 700 }}>{g.league}</span>
                <span style={{ color: g.away.mine ? A.b : T.ink, fontWeight: g.away.mine ? 700 : 500 }}>{g.away.abbr}</span>
                <span style={{ color: T.ink, fontWeight: 700 }}>{g.away.score ?? '–'}</span>
                <span style={{ color: T.muted }}>·</span>
                <span style={{ color: T.ink, fontWeight: 700 }}>{g.home.score ?? '–'}</span>
                <span style={{ color: g.home.mine ? A.b : T.ink, fontWeight: g.home.mine ? 700 : 500 }}>{g.home.abbr}</span>
                <span style={{ color: live ? A.a : T.muted, fontSize: 10, marginLeft: 4, fontWeight: live ? 700 : 500 }}>
                  {live && '● '}{g.detail}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── LiveBanner (carousel) ─────────────────────────────────────────────────────

function LiveBanner({ games, T, A, onFocus }: {
  games: GameData[]; T: Tokens; A: Accent; onFocus: (g: GameData, idx: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const live = games.filter(g => g.state === 'in' && (g.away.mine || g.home.mine));
  if (!live.length) return null;

  const safeIdx = Math.min(idx, live.length - 1);
  const g = live[safeIdx];
  const me  = g.away.mine ? g.away : g.home;
  const opp = g.away.mine ? g.home : g.away;

  const prev = () => setIdx(i => (i - 1 + live.length) % live.length);
  const next = () => setIdx(i => (i + 1) % live.length);

  return (
    <div style={{
      margin: '20px 0 0', padding: '14px 18px', background: T.surface,
      border: `1px solid ${T.border}`, borderLeft: `3px solid ${A.a}`,
      borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: A.a,
        padding: '4px 8px', background: 'rgba(255,90,77,0.12)', borderRadius: 4, flexShrink: 0,
      }}>● YOUR TEAMS PLAYING</span>

      {/* Carousel nav */}
      {live.length > 1 && (
        <button onClick={prev} style={{
          background: 'transparent', border: `1px solid ${T.border}`, color: T.ink,
          width: 24, height: 24, borderRadius: 4, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
        }}>‹</button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <span style={{ fontSize: 11, color: T.muted, letterSpacing: '0.1em' }}>{g.league}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: A.b }}>{me.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: me.winning ? A.b : T.ink }}>{me.score}</span>
        <span style={{ color: T.muted, fontSize: 12 }}>vs</span>
        <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: opp.winning ? A.b : T.ink }}>{opp.score}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{opp.name}</span>
        <span style={{ fontSize: 11, color: A.a, fontFamily: MONO, marginLeft: 4 }}>{g.detail}</span>
        {live.length > 1 && (
          <span style={{ fontSize: 10, color: T.muted, fontFamily: MONO, marginLeft: 4 }}>
            {safeIdx + 1}/{live.length}
          </span>
        )}
      </div>

      {live.length > 1 && (
        <button onClick={next} style={{
          background: 'transparent', border: `1px solid ${T.border}`, color: T.ink,
          width: 24, height: 24, borderRadius: 4, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
        }}>›</button>
      )}

      <button onClick={() => onFocus(g, safeIdx)} style={{
        background: A.a, color: '#000', border: 'none', padding: '6px 12px',
        borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
        cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
      }}>FOCUS ↗</button>
    </div>
  );
}

// ── SectionHead ───────────────────────────────────────────────────────────────

function SectionHead({ title, count, action, actionHref, T, A, onDragStart, onDragEnd, dragging }: {
  title: string; count?: number | string; action?: string; actionHref?: string;
  T: Tokens; A: Accent;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14 }}>
      <span
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{
          cursor: 'grab', color: dragging ? A.a : T.muted, fontSize: 16,
          padding: '4px 6px', borderRadius: 4, userSelect: 'none',
          transition: 'color .12s', lineHeight: 1,
        }}
        title="Drag to reorder"
      >⋮⋮</span>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: T.ink, textTransform: 'uppercase' }}>
        {title}
      </span>
      {count != null && (
        <span style={{ fontSize: 10, color: T.muted, fontFamily: MONO }}>· {count}</span>
      )}
      <div style={{ flex: 1, height: 1, background: T.border, marginLeft: 8 }} />
      {action && actionHref ? (
        <Link href={actionHref} style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 10, color: A.b, letterSpacing: '0.14em', fontWeight: 700, cursor: 'pointer' }}>
            {action}
          </span>
        </Link>
      ) : action ? (
        <span style={{ fontSize: 10, color: A.b, letterSpacing: '0.14em', fontWeight: 700, cursor: 'pointer' }}>
          {action}
        </span>
      ) : null}
    </div>
  );
}

// ── GameCard ──────────────────────────────────────────────────────────────────

function GameCard({ g, T, A, DEN, onFocus }: {
  g: GameData; T: Tokens; A: Accent; DEN: Density; onFocus: (g: GameData) => void;
}) {
  const live = g.state === 'in';
  const post = g.state === 'post';
  return (
    <div
      onClick={() => live && onFocus(g)}
      style={{
        background: T.surface, borderRadius: 8,
        border: `1px solid ${live ? 'rgba(255,90,77,0.4)' : T.border}`,
        padding: DEN.padCard, position: 'relative', overflow: 'hidden',
        cursor: live ? 'pointer' : 'default',
      }}
    >
      {live && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: A.a }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: T.muted }}>{g.league}</span>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
          color: live ? A.a : post ? T.muted : T.ink, fontFamily: MONO,
        }}>
          {live ? `● ${g.detail}` : post ? 'FINAL' : g.detail}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[g.away, g.home].map((team, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {team.logo ? (
              <div style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 4, overflow: 'hidden', background: T.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image src={team.logo} alt={team.name} width={22} height={22} style={{ objectFit: 'contain' }} unoptimized />
              </div>
            ) : (
              <div style={{
                width: 26, height: 26, background: team.color, borderRadius: 4, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color: '#fff', fontFamily: MONO,
              }}>{team.abbr.slice(0, 3)}</div>
            )}
            <span style={{ fontSize: DEN.font + 1, color: team.mine ? A.b : T.ink, fontWeight: team.mine ? 700 : 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {team.name}
            </span>
            {team.score !== undefined && (
              <span style={{
                fontFamily: MONO, fontSize: 18,
                fontWeight: team.winning ? 800 : 500,
                color: team.winning ? T.ink : T.muted,
                marginLeft: 'auto',
              }}>{team.score}</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.muted }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{g.venue}</span>
        <span>{g.broadcast}</span>
      </div>
    </div>
  );
}

// ── SectionGames (Yesterday / Today tabs) ────────────────────────────────────

function SectionGames({ todayGames, yesterdayGames, T, A, DEN, onFocus }: {
  todayGames: GameData[]; yesterdayGames: GameData[];
  T: Tokens; A: Accent; DEN: Density; onFocus: (g: GameData) => void;
}) {
  const [tab, setTab] = useState<'today' | 'yesterday'>(todayGames.length ? 'today' : 'yesterday');
  const games = tab === 'today' ? todayGames : yesterdayGames;

  const tabStyle = (active: boolean) => ({
    padding: '5px 14px', borderRadius: 6, fontSize: 10, fontWeight: 800,
    letterSpacing: '0.12em', cursor: 'pointer', border: 'none', fontFamily: 'inherit',
    background: active ? A.a : 'transparent',
    color: active ? '#000' : T.muted,
    transition: 'all .12s',
  } as React.CSSProperties);

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        <button style={tabStyle(tab === 'today')}     onClick={() => setTab('today')}>TODAY</button>
        <button style={tabStyle(tab === 'yesterday')} onClick={() => setTab('yesterday')}>YESTERDAY</button>
      </div>
      {!games.length ? (
        <div style={{ padding: '32px', textAlign: 'center', color: T.muted, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
          No games {tab === 'today' ? 'scheduled today' : 'played yesterday'}.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DEN.gap }}>
          {games.slice(0, 9).map(g => (
            <GameCard key={g.id} g={g} T={T} A={A} DEN={DEN} onFocus={onFocus} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── SectionTeams ──────────────────────────────────────────────────────────────

function SectionTeams({ myTeams, T, A, DEN }: {
  myTeams: FavoriteTeam[]; T: Tokens; A: Accent; DEN: Density;
}) {
  if (!myTeams.length) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: T.muted, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 8 }}>No favorite teams yet.</div>
        <Link href="/teams" style={{ color: A.a, fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'none' }}>
          BROWSE TEAMS →
        </Link>
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DEN.gap }}>
      {myTeams.map(t => {
        const color = t.teamColor ? `#${t.teamColor}` : '#1A2440';
        return (
          <Link key={t.id} href={`/team/${t.sport}/${t.league}/${t.teamId}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: `linear-gradient(135deg, ${color}BB 0%, ${color}66 55%, ${T.surface} 100%)`,
              borderRadius: 8, padding: DEN.padCard + 4, position: 'relative', overflow: 'hidden',
              border: `1px solid ${T.border}`, transition: 'opacity .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <div style={{ position: 'absolute', top: -10, right: -10, width: 90, height: 90, background: A.a, opacity: 0.1, borderRadius: '50%' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, background: 'rgba(255,255,255,0.1)', borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.2)', overflow: 'hidden', flexShrink: 0,
                }}>
                  {t.teamLogo ? (
                    <Image src={t.teamLogo} alt={t.teamName} width={40} height={40} style={{ objectFit: 'contain' }} unoptimized />
                  ) : (
                    <span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>
                      {t.teamName.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.16em', fontWeight: 700 }}>
                    {t.league.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.teamName}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ── SectionPlayers ────────────────────────────────────────────────────────────

function SectionPlayers({ myPlayers, T, A, DEN }: {
  myPlayers: FavoritePlayer[]; T: Tokens; A: Accent; DEN: Density;
}) {
  if (!myPlayers.length) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: T.muted, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 4 }}>No favorite players yet.</div>
        <div style={{ fontSize: 12, color: T.muted }}>Visit a team's roster to follow players.</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DEN.gap }}>
      {myPlayers.map(p => (
        <Link key={p.id} href={`/player/${p.sport}/${p.league}/${p.playerId}`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: T.surface, borderRadius: 8, padding: DEN.padCard + 2,
            border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12,
            transition: 'border-color .15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,209,102,0.3)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
          >
            {p.playerPhoto ? (
              <div style={{ width: 48, height: 48, borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
                <Image src={p.playerPhoto} alt={p.playerName} width={48} height={48} style={{ objectFit: 'cover' }} unoptimized />
              </div>
            ) : (
              <div style={{
                width: 48, height: 48, background: T.surface2, borderRadius: 999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.muted, fontSize: 20, fontWeight: 700, flexShrink: 0,
              }}>
                {p.playerName.charAt(0)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.playerName}
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>
                {p.position ?? '–'} · {p.teamName ?? p.league.toUpperCase()}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── ArticleCard ───────────────────────────────────────────────────────────────

function ArticleCard({ h, T, A, featured = false }: {
  h: ESPNNewsArticle; T: Tokens; A: Accent; featured?: boolean;
}) {
  const url    = h.links?.web?.href;
  const league = h.categories?.find(c => c.type === 'league')?.description;
  const img    = h.images?.[0];

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div style={{
        background: T.surface, borderRadius: 8, padding: featured ? 18 : 14,
        border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 8, height: '100%',
      }}>
        {featured && img && (
          <div style={{ height: 140, borderRadius: 6, overflow: 'hidden', background: '#0C2C56', position: 'relative', flexShrink: 0 }}>
            <Image src={img.url} alt={h.headline} fill style={{ objectFit: 'cover' }} unoptimized />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: A.a, letterSpacing: '0.16em' }}>
            {league?.toUpperCase() ?? 'SPORTS'}
          </span>
          {h.published && <span style={{ fontSize: 9, color: T.muted }}>· {timeAgo(h.published)}</span>}
        </div>
        <div style={{ fontSize: featured ? 18 : 13, color: T.ink, lineHeight: 1.35, fontWeight: featured ? 800 : 600 }}>
          {h.headline}
        </div>
        {featured && h.description && (
          <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, margin: 0 }}>{h.description}</p>
        )}
      </div>
    </a>
  );
}

// ── SectionHeadlines ──────────────────────────────────────────────────────────

function SectionHeadlines({ teamNews, generalHeadlines, T, A, DEN }: {
  teamNews: ESPNNewsArticle[]; generalHeadlines: ESPNNewsArticle[];
  T: Tokens; A: Accent; DEN: Density;
}) {
  const hasTeamNews = teamNews.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: DEN.sectionGap * 0.8 }}>
      {hasTeamNews && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: A.b, marginBottom: 10 }}>
            MY TEAMS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DEN.gap }}>
            {teamNews.slice(0, 3).map((h, i) => (
              <ArticleCard key={i} h={h} T={T} A={A} />
            ))}
          </div>
        </div>
      )}

      <div>
        {hasTeamNews && (
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: T.muted, marginBottom: 10 }}>
            TOP HEADLINES
          </div>
        )}
        {!generalHeadlines.length ? (
          <div style={{ padding: '32px', textAlign: 'center', color: T.muted, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
            No headlines available.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: DEN.gap }}>
            <div style={{ gridRow: 'span 2' }}>
              <ArticleCard h={generalHeadlines[0]} T={T} A={A} featured />
            </div>
            {generalHeadlines.slice(1, 5).map((h, i) => (
              <ArticleCard key={i} h={h} T={T} A={A} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PlayRow ───────────────────────────────────────────────────────────────────

function PlayRow({ play, T, A, scoring }: { play: ESPNPlay; T: Tokens; A: Accent; scoring: boolean }) {
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 6,
      background: scoring ? `${A.a}12` : T.surface2,
      border: `1px solid ${scoring ? `${A.a}30` : T.border}`,
      marginBottom: 4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: scoring ? A.a : T.muted, fontWeight: 700, letterSpacing: '0.12em' }}>
          {scoring ? '⚡ SCORING' : play.clock?.displayValue ?? ''}
          {play.period ? ` · Q${play.period.number}` : ''}
        </span>
        {play.awayScore !== undefined && play.homeScore !== undefined && (
          <span style={{ fontSize: 9, fontFamily: MONO, color: T.muted }}>
            {play.awayScore}–{play.homeScore}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: T.ink, lineHeight: 1.4 }}>{play.text}</div>
    </div>
  );
}

// ── FocusMode ─────────────────────────────────────────────────────────────────

function FocusMode({ liveMyGames, initialIdx, T, A, onClose }: {
  liveMyGames: GameData[];
  initialIdx: number;
  T: Tokens; A: Accent;
  onClose: () => void;
}) {
  const [idx, setIdx]         = useState(initialIdx);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const game = liveMyGames[Math.min(idx, liveMyGames.length - 1)] ?? null;

  const fetchSummary = useCallback(async (g: GameData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sports/summary?sport=${g.sport}&league=${g.leagueKey}&eventId=${g.id}`);
      if (res.ok) setSummary(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!game) return;
    setSummary(null);
    fetchSummary(game);
    if (game.state !== 'in') return;
    const interval = setInterval(() => fetchSummary(game), 30_000);
    return () => clearInterval(interval);
  }, [game, fetchSummary]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + liveMyGames.length) % liveMyGames.length);
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % liveMyGames.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [liveMyGames.length, onClose]);

  if (!game) return null;

  const isSoccer = game.sport === 'soccer';
  const isGolf   = game.sport === 'golf';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: '#000', color: T.ink,
      fontFamily: '"Inter", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      animation: 'msFade 0.2s ease',
    }}>
      {/* Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ background: A.a, color: '#000', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em' }}>
            ● FOCUS MODE
          </span>
          <span style={{ fontSize: 11, color: T.muted, letterSpacing: '0.14em', fontWeight: 600 }}>
            {game.league}{game.venue ? ` · ${game.venue}` : ''}{game.broadcast ? ` · ${game.broadcast}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {liveMyGames.length > 1 && (
            <>
              <button onClick={() => setIdx(i => (i - 1 + liveMyGames.length) % liveMyGames.length)} style={{
                background: 'transparent', border: `1px solid ${T.border}`, color: T.ink,
                padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}>‹ PREV</button>
              <span style={{ fontSize: 10, color: T.muted, fontFamily: MONO }}>{idx + 1}/{liveMyGames.length}</span>
              <button onClick={() => setIdx(i => (i + 1) % liveMyGames.length)} style={{
                background: 'transparent', border: `1px solid ${T.border}`, color: T.ink,
                padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}>NEXT ›</button>
            </>
          )}
          <button onClick={onClose} style={{
            background: 'transparent', border: `1px solid ${T.border}`, color: T.ink,
            padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit',
          }}>EXIT ✕</button>
        </div>
      </div>

      {/* Scoreboard */}
      <div style={{ padding: '32px 40px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 28% 50%, ${game.away.color}40, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 72% 50%, ${game.home.color}40, transparent 55%)`, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 40, maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.18em', color: T.muted, fontWeight: 700 }}>{game.away.mine ? 'YOUR TEAM' : 'AWAY'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, marginTop: 4 }}>{game.away.name}</div>
            {game.away.record && <div style={{ fontSize: 11, color: T.muted, fontFamily: MONO, marginTop: 2 }}>{game.away.record}</div>}
            <div style={{
              fontSize: 96, fontWeight: 900, lineHeight: 0.9, marginTop: 12,
              color: game.away.winning ? A.b : T.muted, fontFamily: MONO, letterSpacing: '-0.04em',
              textShadow: game.away.winning ? `0 0 60px ${A.a}40` : 'none',
            }}>{game.away.score ?? '–'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.2em', fontWeight: 700 }}>{game.detail}</div>
            <div style={{ fontSize: 36, fontWeight: 100, color: T.muted, lineHeight: 1, margin: '8px 0', fontFamily: MONO }}>—</div>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: '0.18em' }}>
              {game.state === 'post' ? 'FINAL' : game.state === 'pre' ? 'UPCOMING' : 'LIVE'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.18em', color: T.muted, fontWeight: 700 }}>{game.home.mine ? 'YOUR TEAM' : 'HOME'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, marginTop: 4 }}>{game.home.name}</div>
            {game.home.record && <div style={{ fontSize: 11, color: T.muted, fontFamily: MONO, marginTop: 2 }}>{game.home.record}</div>}
            <div style={{
              fontSize: 96, fontWeight: 900, lineHeight: 0.9, marginTop: 12,
              color: game.home.winning ? A.b : T.muted, fontFamily: MONO, letterSpacing: '-0.04em',
            }}>{game.home.score ?? '–'}</div>
          </div>
        </div>
      </div>

      {/* Plays panel */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 40px 32px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {loading && !summary && (
          <div style={{ textAlign: 'center', color: T.muted, padding: 20, fontSize: 12 }}>Loading plays…</div>
        )}

        {summary && !isGolf && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Scoring plays */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: A.a, marginBottom: 10 }}>
                {isSoccer ? 'GOALS' : 'SCORING PLAYS'}
              </div>
              {summary.scoringPlays.length === 0 ? (
                <div style={{ fontSize: 12, color: T.muted, padding: '12px 0' }}>No scoring plays yet.</div>
              ) : (
                summary.scoringPlays.map((p, i) => <PlayRow key={i} play={p} T={T} A={A} scoring />)
              )}
            </div>

            {/* Recent plays — soccer only shows goal timeline so skip this column for soccer */}
            {!isSoccer && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: T.muted, marginBottom: 10 }}>
                  LAST 5 PLAYS
                </div>
                {summary.recentPlays.length === 0 ? (
                  <div style={{ fontSize: 12, color: T.muted, padding: '12px 0' }}>No plays yet.</div>
                ) : (
                  summary.recentPlays.map((p, i) => <PlayRow key={i} play={p} T={T} A={A} scoring={false} />)
                )}
              </div>
            )}
          </div>
        )}

        {summary && isGolf && summary.golfLeaderboard && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: A.b, marginBottom: 12 }}>LEADERBOARD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {summary.golfLeaderboard.map((c, i) => {
                const scoreStat = c.statistics?.find(s => s.name === 'scoreToPar' || s.name === 'score');
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px',
                    background: i === 0 ? `${A.b}15` : T.surface2, borderRadius: 6,
                    border: `1px solid ${i === 0 ? `${A.b}30` : T.border}`,
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: T.muted, width: 24, textAlign: 'right' }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? A.b : T.ink, flex: 1 }}>
                      {c.displayName}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: i === 0 ? A.b : T.ink }}>
                      {scoreStat?.displayValue ?? c.score ?? '–'}
                    </span>
                    {c.status?.displayValue && (
                      <span style={{ fontSize: 10, color: T.muted, letterSpacing: '0.1em' }}>
                        {c.status.displayValue}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── TweaksPanel ───────────────────────────────────────────────────────────────

interface TweaksState {
  theme: ThemeKey;
  density: DensityKey;
  accent: AccentKey;
  showTicker: boolean;
  showLiveBanner: boolean;
  visible: Record<string, boolean>;
}

function TweaksPanel({ tweaks, set, T, A, sections }: {
  tweaks: TweaksState;
  set: (k: string, v: unknown) => void;
  T: Tokens; A: Accent;
  sections: Array<{ id: string; title: string }>;
}) {
  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, zIndex: 50, width: 256,
      background: 'rgba(18,26,48,0.96)', backdropFilter: 'blur(16px)',
      border: `1px solid ${T.border}`, borderRadius: 12, padding: 14,
      color: T.ink, fontSize: 11, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 800, color: T.muted, marginBottom: 12 }}>TWEAKS</div>

      <TweakGroup label="Theme">
        <SegControl value={tweaks.theme} options={['dark', 'dim', 'contrast']} onChange={v => set('theme', v)} A={A} T={T} />
      </TweakGroup>
      <TweakGroup label="Density">
        <SegControl value={tweaks.density} options={['compact', 'cozy', 'comfy']} onChange={v => set('density', v)} A={A} T={T} />
      </TweakGroup>
      <TweakGroup label="Accent">
        <div style={{ display: 'flex', gap: 6 }}>
          {(Object.entries(ACCENTS) as [AccentKey, { a: string; b: string }][]).map(([k, v]) => (
            <button key={k} onClick={() => set('accent', k)} title={k} style={{
              flex: 1, height: 26, padding: 0, cursor: 'pointer', borderRadius: 5,
              border: tweaks.accent === k ? `2px solid ${v.a}` : `1px solid ${T.border}`,
              background: `linear-gradient(135deg, ${v.a} 50%, ${v.b} 50%)`,
            }} />
          ))}
        </div>
      </TweakGroup>
      <TweakGroup label="Ticker">
        <ToggleControl value={tweaks.showTicker} onChange={v => set('showTicker', v)} A={A} />
      </TweakGroup>
      <TweakGroup label="Live banner">
        <ToggleControl value={tweaks.showLiveBanner} onChange={v => set('showLiveBanner', v)} A={A} />
      </TweakGroup>

      <div style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 800, color: T.muted, margin: '14px 0 8px' }}>SECTIONS</div>
      {sections.map(({ id, title }) => (
        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
          <span style={{ fontSize: 11, color: T.ink }}>{title}</span>
          <ToggleControl value={tweaks.visible[id] !== false} onChange={v => set('visible', { ...tweaks.visible, [id]: v })} A={A} />
        </div>
      ))}
    </div>
  );
}

function TweakGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: '#8392B5', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

function SegControl({ value, options, onChange, A, T }: {
  value: string; options: string[]; onChange: (v: string) => void; A: Accent; T: Tokens;
}) {
  return (
    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 2, gap: 2 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          flex: 1, padding: '5px 4px', border: 'none',
          background: value === o ? A.a : 'transparent',
          color: value === o ? '#000' : T.ink,
          fontSize: 10, fontWeight: value === o ? 800 : 500,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
        }}>{o}</button>
      ))}
    </div>
  );
}

function ToggleControl({ value, onChange, A }: { value: boolean; onChange: (v: boolean) => void; A: Accent }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 34, height: 18, borderRadius: 999, border: 'none', padding: 0,
      background: value ? A.a : 'rgba(255,255,255,0.15)',
      position: 'relative', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left 0.15s', display: 'block',
      }} />
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardClient({
  userName, dateLabel, liveMyTeamCount,
  todayGames, yesterdayGames,
  myTeams, myPlayers,
  generalHeadlines, teamNews,
}: DashboardClientProps) {
  const [tweaks, setTweaks] = useState<TweaksState>({
    theme: 'dark', density: 'cozy', accent: 'coral',
    showTicker: true, showLiveBanner: true, visible: {},
  });
  const set = (k: string, v: unknown) => setTweaks(t => ({ ...t, [k]: v }));

  const [order, setOrder]               = useState<string[]>(DEFAULT_ORDER);
  const [savedSnapshot, setSavedSnapshot] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        setOrder(parsed);
        setSavedSnapshot(parsed);
      }
    } catch {}
  }, []);

  const dirty = JSON.stringify(order) !== JSON.stringify(savedSnapshot ?? DEFAULT_ORDER);

  const [dragId, setDragId]     = useState<string | null>(null);
  const [overId, setOverId]     = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [showTweaks, setShowTweaks] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const T   = THEMES[tweaks.theme];
  const A   = ACCENTS[tweaks.accent];
  const DEN = DENSITY[tweaks.density];

  const liveMyGames = todayGames.filter(g => g.state === 'in' && (g.away.mine || g.home.mine));

  const greetingMsg =
    liveMyTeamCount === 0 ? "What's happening in sports today." :
    liveMyTeamCount === 1 ? 'One of yours is live.' :
    `${liveMyTeamCount} of yours are live.`;

  const openFocus = (g: GameData, idx?: number) => {
    const i = idx ?? liveMyGames.findIndex(x => x.id === g.id);
    setFocusIdx(i >= 0 ? i : 0);
  };

  const onDragStart = (id: string) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragId(id);
  };
  const onDragOver = (id: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (id !== dragId) setOverId(id);
  };
  const onDrop = () => {
    if (!dragId || !overId || dragId === overId) { setDragId(null); setOverId(null); return; }
    const next = [...order];
    const from = next.indexOf(dragId);
    const to   = next.indexOf(overId);
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    setOrder(next);
    setDragId(null);
    setOverId(null);
  };

  const saveLayout = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch {}
    setSavedSnapshot([...order]);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };
  const resetLayout = () => {
    setOrder(DEFAULT_ORDER);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setSavedSnapshot(null);
  };

  const isVisible      = (id: string) => tweaks.visible[id] !== false;
  const orderedVisible = order.filter(isVisible);

  const totalGames = todayGames.length + yesterdayGames.length;

  const SECTION_META: Record<string, { title: string; count?: number; action?: string; actionHref?: string }> = {
    games:     { title: "Today's games", count: totalGames,      action: 'SCOREBOARD →', actionHref: '/scoreboard' },
    teams:     { title: 'My teams',      count: myTeams.length,  action: 'MANAGE →' },
    players:   { title: 'My players',    count: myPlayers.length },
    headlines: { title: 'Headlines',     count: (teamNews.length + generalHeadlines.length), action: 'ALL NEWS →', actionHref: '/headlines' },
  };

  const renderSection = (id: string) => {
    switch (id) {
      case 'games':     return <SectionGames     todayGames={todayGames} yesterdayGames={yesterdayGames} T={T} A={A} DEN={DEN} onFocus={openFocus} />;
      case 'teams':     return <SectionTeams     myTeams={myTeams}     T={T} A={A} DEN={DEN} />;
      case 'players':   return <SectionPlayers   myPlayers={myPlayers} T={T} A={A} DEN={DEN} />;
      case 'headlines': return <SectionHeadlines teamNews={teamNews} generalHeadlines={generalHeadlines} T={T} A={A} DEN={DEN} />;
      default:          return null;
    }
  };

  const sectionList = DEFAULT_ORDER.map(id => ({ id, title: SECTION_META[id]?.title ?? id }));

  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: '100vh', fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}>
      {tweaks.showTicker && (
        <div style={{ position: 'sticky', top: 64, zIndex: 5 }}>
          <Ticker games={todayGames} T={T} A={A} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 0 0', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.18em', fontWeight: 700 }}>{dateLabel}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Hey, <span style={{ color: A.b }}>{userName}</span>.{' '}
            <span style={{ color: T.muted, fontWeight: 400 }}>{greetingMsg}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {dirty && <span style={{ fontSize: 10, color: A.a, letterSpacing: '0.14em', fontWeight: 700 }}>● UNSAVED</span>}
          <button onClick={resetLayout} style={{
            background: 'transparent', border: `1px solid ${T.border}`, color: T.muted,
            padding: '7px 12px', borderRadius: 8, fontSize: 10, letterSpacing: '0.12em', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>RESET</button>
          <button onClick={saveLayout} disabled={!dirty} style={{
            background: dirty ? A.a : 'rgba(255,255,255,0.06)', border: 'none',
            color: dirty ? '#000' : T.muted,
            padding: '7px 12px', borderRadius: 8, fontSize: 10, letterSpacing: '0.12em', fontWeight: 800,
            cursor: dirty ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all .15s',
          }}>SAVE LAYOUT</button>
          <button onClick={() => setShowTweaks(v => !v)} style={{
            background: showTweaks ? A.a : T.surface, border: `1px solid ${T.border}`,
            color: showTweaks ? '#000' : T.ink,
            padding: '7px 12px', borderRadius: 8, fontSize: 10, letterSpacing: '0.12em', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>⚙ TWEAKS</button>
        </div>
      </div>

      {tweaks.showLiveBanner && <LiveBanner games={todayGames} T={T} A={A} onFocus={openFocus} />}

      <div style={{ paddingTop: 24 }}>
        {orderedVisible.map(id => {
          const meta = SECTION_META[id];
          if (!meta) return null;
          return (
            <div
              key={id}
              onDragOver={onDragOver(id)}
              onDrop={onDrop}
              style={{
                marginBottom: DEN.sectionGap,
                opacity: dragId === id ? 0.4 : 1,
                borderTop: overId === id && dragId !== id ? `2px solid ${A.a}` : '2px solid transparent',
                paddingTop: 8,
                transition: 'border-color 0.12s, opacity 0.12s',
              }}
            >
              <SectionHead
                title={meta.title}
                count={meta.count}
                action={meta.action}
                actionHref={meta.actionHref}
                T={T} A={A}
                onDragStart={onDragStart(id)}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                dragging={dragId === id}
              />
              {renderSection(id)}
            </div>
          );
        })}

        {orderedVisible.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: T.muted, border: `1px dashed ${T.border}`, borderRadius: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 4 }}>No sections visible.</div>
            <div style={{ fontSize: 12 }}>Toggle sections back on in the Tweaks panel.</div>
          </div>
        )}
      </div>

      {showTweaks && <TweaksPanel tweaks={tweaks} set={set} T={T} A={A} sections={sectionList} />}

      {focusIdx !== null && liveMyGames.length > 0 && (
        <FocusMode
          liveMyGames={liveMyGames}
          initialIdx={focusIdx}
          T={T} A={A}
          onClose={() => setFocusIdx(null)}
        />
      )}

      {savedToast && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: A.a, color: '#000', padding: '10px 20px', borderRadius: 999,
          fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', zIndex: 60,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', animation: 'msFade 0.2s',
        }}>✓ LAYOUT SAVED</div>
      )}
    </div>
  );
}
