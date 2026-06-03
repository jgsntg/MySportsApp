'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { FavoriteTeam, FavoritePlayer, ESPNNewsArticle } from '@/types';
import type { TweaksState } from '@/components/dashboard/TweaksPanel';
import type { UserPrefs } from '@/lib/db/preferences';

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
  espnLink?: string;
}

interface DashboardClientProps {
  userName: string;
  dateLabel: string;
  liveMyTeamCount: number;
  todayGames: GameData[];
  yesterdayGames: GameData[];
  tomorrowGames: GameData[];
  myTeams: FavoriteTeam[];
  myPlayers: FavoritePlayer[];
  generalHeadlines: ESPNNewsArticle[];
  teamNews: ESPNNewsArticle[];
  savedPrefs?: UserPrefs;
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

function buildCSSVars(theme: ThemeKey, accent: AccentKey, density: DensityKey): React.CSSProperties {
  const T = THEMES[theme];
  const A = ACCENTS[accent];
  const D = DENSITY[density];
  return {
    '--ms-bg': T.bg, '--ms-surface': T.surface, '--ms-surface2': T.surface2,
    '--ms-ink': T.ink, '--ms-muted': T.muted, '--ms-border': T.border,
    '--ms-a': A.a, '--ms-b': A.b,
    // Pre-computed hex-alpha variants used for subtle tints
    '--ms-a12': A.a + '12', '--ms-a30': A.a + '30', '--ms-a40': A.a + '40',
    '--ms-b15': A.b + '15', '--ms-b30': A.b + '30',
    // Density tokens
    '--ms-gap': D.gap + 'px', '--ms-sgap': D.sectionGap + 'px',
    '--ms-pad': D.padCard + 'px', '--ms-font': D.font + 'px',
  } as React.CSSProperties;
}

const DEFAULT_ORDER = ['games', 'teams', 'players', 'headlines'];
const STORAGE_KEY   = 'ms_v3_layout_v1';
const TWEAKS_KEY    = 'ms_v3_tweaks_v1';
const MONO = 'var(--font-mono), ui-monospace, monospace';

// ── Lazy-loaded heavy components ──────────────────────────────────────────────

const FocusMode = dynamic(() => import('@/components/dashboard/FocusMode'), { ssr: false });
const TweaksPanel = dynamic(() => import('@/components/dashboard/TweaksPanel'), { ssr: false });

// ── Ticker ────────────────────────────────────────────────────────────────────

const Ticker = memo(function Ticker({ games }: { games: GameData[] }) {
  if (!games.length) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', background: '#000',
      borderBottom: '1px solid var(--ms-border)', overflow: 'hidden', height: 40,
    }}>
      <div style={{
        background: 'var(--ms-a)', color: '#000', padding: '0 14px',
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
                padding: '0 20px', borderRight: '1px solid var(--ms-border)',
                fontFamily: MONO, fontSize: 12,
              }}>
                <span style={{ fontSize: 9, color: 'var(--ms-muted)', letterSpacing: '0.12em', fontWeight: 700 }}>{g.league}</span>
                <span style={{ color: g.away.mine ? 'var(--ms-b)' : 'var(--ms-ink)', fontWeight: g.away.mine ? 700 : 500 }}>{g.away.abbr}</span>
                <span style={{ color: 'var(--ms-ink)', fontWeight: 700 }}>{g.away.score ?? '–'}</span>
                <span style={{ color: 'var(--ms-muted)' }}>·</span>
                <span style={{ color: 'var(--ms-ink)', fontWeight: 700 }}>{g.home.score ?? '–'}</span>
                <span style={{ color: g.home.mine ? 'var(--ms-b)' : 'var(--ms-ink)', fontWeight: g.home.mine ? 700 : 500 }}>{g.home.abbr}</span>
                <span style={{ color: live ? 'var(--ms-a)' : 'var(--ms-muted)', fontSize: 10, marginLeft: 4, fontWeight: live ? 700 : 500 }}>
                  {live && '● '}{g.detail}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ── LiveBanner ────────────────────────────────────────────────────────────────

const LiveBanner = memo(function LiveBanner({ games, onFocus }: {
  games: GameData[]; onFocus: (g: GameData) => void;
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
      margin: '20px 0 0', padding: '14px 18px', background: 'var(--ms-surface)',
      border: '1px solid var(--ms-border)', borderLeft: '3px solid var(--ms-a)',
      borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: 'var(--ms-a)',
        padding: '4px 8px', background: 'var(--ms-a12)', borderRadius: 4, flexShrink: 0,
      }}>● YOUR TEAMS PLAYING</span>

      {live.length > 1 && (
        <button onClick={prev} style={{
          background: 'transparent', border: '1px solid var(--ms-border)', color: 'var(--ms-ink)',
          width: 24, height: 24, borderRadius: 4, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
        }}>‹</button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <span style={{ fontSize: 11, color: 'var(--ms-muted)', letterSpacing: '0.1em' }}>{g.league}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ms-b)' }}>{me.name}</span>
        <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: me.winning ? 'var(--ms-b)' : 'var(--ms-ink)' }}>{me.score}</span>
        <span style={{ color: 'var(--ms-muted)', fontSize: 12 }}>vs</span>
        <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: opp.winning ? 'var(--ms-b)' : 'var(--ms-ink)' }}>{opp.score}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ms-ink)' }}>{opp.name}</span>
        <span style={{ fontSize: 11, color: 'var(--ms-a)', fontFamily: MONO, marginLeft: 4 }}>{g.detail}</span>
        {live.length > 1 && (
          <span style={{ fontSize: 10, color: 'var(--ms-muted)', fontFamily: MONO, marginLeft: 4 }}>
            {safeIdx + 1}/{live.length}
          </span>
        )}
      </div>

      {live.length > 1 && (
        <button onClick={next} style={{
          background: 'transparent', border: '1px solid var(--ms-border)', color: 'var(--ms-ink)',
          width: 24, height: 24, borderRadius: 4, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
        }}>›</button>
      )}

      <button onClick={() => onFocus(g)} style={{
        background: 'var(--ms-a)', color: '#000', border: 'none', padding: '6px 12px',
        borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
        cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
      }}>FOCUS ↗</button>
    </div>
  );
});

// ── SectionHead ───────────────────────────────────────────────────────────────

const SectionHead = memo(function SectionHead({ title, count, action, actionHref, onDragStart, onDragEnd, dragging, onMoveUp, onMoveDown, collapsed, onToggleCollapse }: {
  title: string; count?: number | string; action?: string; actionHref?: string;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  dragging: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const moveBtn = (label: string, onClick?: () => void) => (
    <button
      onClick={onClick} disabled={!onClick}
      style={{
        background: 'transparent', border: '1px solid var(--ms-border)',
        color: onClick ? 'var(--ms-muted)' : 'transparent',
        width: 22, height: 22, borderRadius: 4, cursor: onClick ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, lineHeight: 1, padding: 0, flexShrink: 0,
        transition: 'color .12s, border-color .12s',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.color = 'var(--ms-ink)'; }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.color = 'var(--ms-muted)'; }}
    >{label}</button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14 }}>
      <span
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{
          cursor: 'grab', color: dragging ? 'var(--ms-a)' : 'var(--ms-muted)', fontSize: 16,
          padding: '4px 6px', borderRadius: 4, userSelect: 'none',
          transition: 'color .12s', lineHeight: 1,
        }}
        title="Drag to reorder"
      >⋮⋮</span>
      {moveBtn('↑', onMoveUp)}
      {moveBtn('↓', onMoveDown)}
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: 'var(--ms-ink)', textTransform: 'uppercase' }}>
        {title}
      </span>
      {count != null && (
        <span style={{ fontSize: 10, color: 'var(--ms-muted)', fontFamily: MONO }}>· {count}</span>
      )}
      <div style={{ flex: 1, height: 1, background: 'var(--ms-border)', marginLeft: 4 }} />
      {action && actionHref ? (
        <Link href={actionHref} style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: 10, color: 'var(--ms-b)', letterSpacing: '0.14em', fontWeight: 700, cursor: 'pointer' }}>
            {action}
          </span>
        </Link>
      ) : action ? (
        <span style={{ fontSize: 10, color: 'var(--ms-b)', letterSpacing: '0.14em', fontWeight: 700, cursor: 'pointer' }}>
          {action}
        </span>
      ) : null}
      {onToggleCollapse && (
        <button
          onClick={e => { e.stopPropagation(); onToggleCollapse(); }}
          onMouseDown={e => e.stopPropagation()}
          style={{
            background: 'transparent', border: '1px solid var(--ms-border)',
            color: 'var(--ms-muted)', padding: '3px 10px', borderRadius: 5,
            fontSize: 10, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.1em', fontFamily: 'inherit', flexShrink: 0,
            transition: 'color .12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--ms-ink)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--ms-muted)')}
        >
          {collapsed ? '▶ EXPAND' : '▼ COLLAPSE'}
        </button>
      )}
    </div>
  );
});

// ── GameCard ──────────────────────────────────────────────────────────────────

const GameCard = memo(function GameCard({ g, onFocus, onHide }: {
  g: GameData; onFocus: (g: GameData) => void; onHide: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const live = g.state === 'in';
  const post = g.state === 'post';

  const inner = (
    <div
      onClick={() => live && onFocus(g)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--ms-surface)', borderRadius: 8,
        border: `1px solid ${live ? 'var(--ms-a)' : 'var(--ms-border)'}`,
        padding: 'var(--ms-pad)', position: 'relative', overflow: 'hidden',
        cursor: live ? 'pointer' : 'default',
        transition: 'border-color .12s',
      }}
    >
      {live && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--ms-a)' }} />}
      {/* Hide button — appears on hover */}
      {hovered && (
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); onHide(g.id); }}
          title="Hide from Key Games"
          style={{
            position: 'absolute', top: 6, right: 6,
            background: 'var(--ms-surface2)', border: '1px solid var(--ms-border)',
            color: 'var(--ms-muted)', borderRadius: 4, width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0, lineHeight: 1, zIndex: 2,
          }}
        >
          <EyeOff size={11} />
        </button>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--ms-muted)' }}>{g.league}</span>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
          color: live ? 'var(--ms-a)' : post ? 'var(--ms-muted)' : 'var(--ms-ink)', fontFamily: MONO,
          paddingRight: hovered ? 20 : 0, transition: 'padding-right .1s',
        }}>
          {live ? `● ${g.detail}` : post ? 'FINAL' : g.detail}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[g.away, g.home].map((team, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {team.logo ? (
              <div style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 4, overflow: 'hidden', background: 'var(--ms-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Image src={team.logo} alt={team.name} width={22} height={22} style={{ objectFit: 'contain' }} unoptimized />
              </div>
            ) : (
              <div style={{
                width: 26, height: 26, background: team.color, borderRadius: 4, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color: '#fff', fontFamily: MONO,
              }}>{team.abbr.slice(0, 3)}</div>
            )}
            <span style={{ fontSize: 'calc(var(--ms-font) + 1px)', color: team.mine ? 'var(--ms-b)' : 'var(--ms-ink)', fontWeight: team.mine ? 700 : 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {team.name}
            </span>
            {team.score !== undefined && (
              <span style={{
                fontFamily: MONO, fontSize: 18,
                fontWeight: team.winning ? 800 : 500,
                color: team.winning ? 'var(--ms-ink)' : 'var(--ms-muted)',
                marginLeft: 'auto',
              }}>{team.score}</span>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--ms-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--ms-muted)' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{g.venue}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {g.broadcast && <span>{g.broadcast}</span>}
          {live && g.espnLink && (
            <a href={g.espnLink} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{ color: 'var(--ms-b)', fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'none', fontSize: 9 }}
            >ESPN ↗</a>
          )}
        </div>
      </div>
    </div>
  );

  if (!live && g.espnLink) {
    return (
      <a href={g.espnLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}
        onMouseEnter={e => { setHovered(true); (e.currentTarget.firstChild as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)'; }}
        onMouseLeave={e => { setHovered(false); (e.currentTarget.firstChild as HTMLElement).style.borderColor = 'var(--ms-border)'; }}
      >{inner}</a>
    );
  }
  return inner;
});

// ── SectionGames ──────────────────────────────────────────────────────────────

type GameTab = 'yesterday' | 'today' | 'tomorrow';

const SectionGames = memo(function SectionGames({ todayGames, yesterdayGames, tomorrowGames, onFocus, hiddenGames, onHideGame }: {
  todayGames: GameData[]; yesterdayGames: GameData[]; tomorrowGames: GameData[];
  onFocus: (g: GameData) => void;
  hiddenGames: string[];
  onHideGame: (id: string) => void;
}) {
  const defaultTab: GameTab = todayGames.length ? 'today' : tomorrowGames.length ? 'tomorrow' : 'yesterday';
  const [tab, setTab] = useState<GameTab>(defaultTab);
  const allGames = tab === 'today' ? todayGames : tab === 'yesterday' ? yesterdayGames : tomorrowGames;
  const games = allGames.filter(g => !hiddenGames.includes(g.id));
  const hiddenCount = allGames.length - games.length;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 14px', borderRadius: 6, fontSize: 10, fontWeight: 800,
    letterSpacing: '0.12em', cursor: 'pointer', border: 'none', fontFamily: 'inherit',
    background: active ? 'var(--ms-a)' : 'transparent',
    color: active ? '#000' : 'var(--ms-muted)',
    transition: 'all .12s',
  });

  const emptyMsg = tab === 'today' ? 'scheduled today' : tab === 'yesterday' ? 'played yesterday' : 'scheduled tomorrow';

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={tabStyle(tab === 'yesterday')} onClick={() => setTab('yesterday')}>YESTERDAY</button>
        <button style={tabStyle(tab === 'today')}     onClick={() => setTab('today')}>TODAY</button>
        <button style={tabStyle(tab === 'tomorrow')}  onClick={() => setTab('tomorrow')}>TOMORROW</button>
        {hiddenCount > 0 && (
          <Link href="/scoreboard" style={{
            marginLeft: 8, fontSize: 9, color: 'var(--ms-muted)', letterSpacing: '0.12em',
            fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <EyeOff size={10} />
            {hiddenCount} HIDDEN · RE-ENABLE ON SCOREBOARD
          </Link>
        )}
      </div>
      {!games.length ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ms-muted)', border: '1px dashed var(--ms-border)', borderRadius: 8 }}>
          {allGames.length > 0
            ? <span>All games hidden. <Link href="/scoreboard" style={{ color: 'var(--ms-a)', textDecoration: 'none' }}>Re-enable on Scoreboard</Link>.</span>
            : `No games ${emptyMsg}.`
          }
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px, 28vw, 280px), 1fr))', gap: 'var(--ms-gap)' }}>
          {games.slice(0, 9).map(g => (
            <GameCard key={g.id} g={g} onFocus={onFocus} onHide={onHideGame} />
          ))}
        </div>
      )}
    </div>
  );
});

// ── SectionTeams ──────────────────────────────────────────────────────────────

const SectionTeams = memo(function SectionTeams({ myTeams }: { myTeams: FavoriteTeam[] }) {
  if (!myTeams.length) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ms-muted)', border: '1px dashed var(--ms-border)', borderRadius: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ms-ink)', marginBottom: 8 }}>No favorite teams yet.</div>
        <Link href="/teams" style={{ color: 'var(--ms-a)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textDecoration: 'none' }}>
          BROWSE TEAMS →
        </Link>
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px, 28vw, 280px), 1fr))', gap: 'var(--ms-gap)' }}>
      {myTeams.map(t => {
        const color = t.teamColor ? `#${t.teamColor}` : '#1A2440';
        return (
          <Link key={t.id} href={`/team/${t.sport}/${t.league}/${t.teamId}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: `linear-gradient(135deg, ${color}BB 0%, ${color}66 55%, var(--ms-surface) 100%)`,
              borderRadius: 8, padding: 'calc(var(--ms-pad) + 4px)', position: 'relative', overflow: 'hidden',
              border: '1px solid var(--ms-border)', transition: 'opacity .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <div style={{ position: 'absolute', top: -10, right: -10, width: 90, height: 90, background: 'var(--ms-a)', opacity: 0.1, borderRadius: '50%' }} />
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
});

// ── PlayerStatLine ─────────────────────────────────────────────────────────────

interface PlayerStatsData {
  stats: Array<{ name: string; displayName: string; stats: Array<{ name: string; displayName: string; displayValue: string }> }>;
  recentGames: Array<{ id: string; eventName: string; date: string; stats: Array<{ name: string; displayName: string; displayValue: string }> }>;
}

const PlayerStatLine = memo(function PlayerStatLine({ sport, league, playerId }: {
  sport: string; league: string; playerId: string;
}) {
  const { data } = useQuery<PlayerStatsData | null>({
    queryKey: ['playerStats', sport, league, playerId],
    queryFn: async () => {
      const res = await fetch(`/api/sports/playerstats?sport=${sport}&league=${league}&id=${playerId}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  const seasonStats  = data?.stats[0]?.stats?.slice(0, 3) ?? [];
  const lastGame     = data?.recentGames?.[0];
  const lastGameStat = lastGame?.stats?.slice(0, 2) ?? [];

  if (!seasonStats.length && !lastGameStat.length) return null;

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--ms-border)' }}>
      {seasonStats.length > 0 && (
        <div>
          <div style={{ fontSize: 8, color: 'var(--ms-muted)', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 4 }}>SEASON</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {seasonStats.map(s => (
              <div key={s.name} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: 'var(--ms-a)', lineHeight: 1 }}>{s.displayValue}</div>
                <div style={{ fontSize: 8, color: 'var(--ms-muted)', letterSpacing: '0.1em', marginTop: 2 }}>{s.displayName.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {lastGame && lastGameStat.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 8, color: 'var(--ms-muted)', letterSpacing: '0.14em', fontWeight: 700, marginBottom: 4 }}>
            LAST · {lastGame.eventName}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {lastGameStat.map(s => (
              <div key={s.name} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: 'var(--ms-b)', lineHeight: 1 }}>{s.displayValue}</div>
                <div style={{ fontSize: 8, color: 'var(--ms-muted)', letterSpacing: '0.1em', marginTop: 2 }}>{s.displayName.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ── SectionPlayers ────────────────────────────────────────────────────────────

const SectionPlayers = memo(function SectionPlayers({ myPlayers, onMovePlayer, onToggleCommandCenter }: {
  myPlayers: FavoritePlayer[];
  onMovePlayer: (id: string, direction: -1 | 1) => void;
  onToggleCommandCenter: (id: string, enabled: boolean) => void;
}) {
  const visiblePlayers = myPlayers.filter(p => p.displayInCommandCenter !== 0);
  const hiddenPlayers = myPlayers.filter(p => p.displayInCommandCenter === 0);

  if (!myPlayers.length) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ms-muted)', border: '1px dashed var(--ms-border)', borderRadius: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ms-ink)', marginBottom: 4 }}>No favorite players yet.</div>
        <div style={{ fontSize: 12, color: 'var(--ms-muted)' }}>Visit a team&apos;s roster to follow players.</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ms-gap)' }}>
      {visiblePlayers.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 'var(--ms-gap)' }}>
          {visiblePlayers.map((p, index) => (
            <div key={p.id} style={{
              background: 'var(--ms-surface)', borderRadius: 8, padding: 'calc(var(--ms-pad) + 2px)',
              border: '1px solid var(--ms-border)',
              transition: 'border-color .15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,209,102,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ms-border)')}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Link href={`/player/${p.sport}/${p.league}/${p.playerId}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  {p.playerPhoto ? (
                    <div style={{ width: 48, height: 48, borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
                      <Image src={p.playerPhoto} alt={p.playerName} width={48} height={48} style={{ objectFit: 'cover' }} unoptimized />
                    </div>
                  ) : (
                    <div style={{
                      width: 48, height: 48, background: 'var(--ms-surface2)', borderRadius: 999,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--ms-muted)', fontSize: 20, fontWeight: 700, flexShrink: 0,
                    }}>
                      {p.playerName.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ms-ink)', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.playerName}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--ms-muted)', marginTop: 3 }}>
                      {p.position ?? '–'} · {p.teamName ?? p.league.toUpperCase()}
                    </div>
                  </div>
                </Link>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <PlayerIconButton title="Move up" disabled={index === 0} onClick={() => onMovePlayer(p.id, -1)}>
                    <ChevronUp size={13} />
                  </PlayerIconButton>
                  <PlayerIconButton title="Move down" disabled={index === visiblePlayers.length - 1} onClick={() => onMovePlayer(p.id, 1)}>
                    <ChevronDown size={13} />
                  </PlayerIconButton>
                  <PlayerIconButton title="Hide from Command Center" active onClick={() => onToggleCommandCenter(p.id, false)}>
                    <Eye size={13} />
                  </PlayerIconButton>
                </div>
              </div>
              <PlayerStatLine sport={p.sport} league={p.league} playerId={p.playerId} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '22px', textAlign: 'center', color: 'var(--ms-muted)', border: '1px dashed var(--ms-border)', borderRadius: 8, fontSize: 12 }}>
          No players are currently displayed in Command Center.
        </div>
      )}

      {hiddenPlayers.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
          {hiddenPlayers.map(p => (
            <button
              key={p.id}
              onClick={() => onToggleCommandCenter(p.id, true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--ms-surface2)', border: '1px solid var(--ms-border)',
                color: 'var(--ms-muted)', borderRadius: 6, padding: '6px 9px',
                fontSize: 10, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <EyeOff size={12} />
              {p.playerName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const PlayerIconButton = memo(function PlayerIconButton({ title, disabled = false, active = false, onClick, children }: {
  title: string;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 24, height: 24, borderRadius: 5, padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--ms-surface2)', border: '1px solid var(--ms-border)',
        color: disabled ? 'rgba(131,146,181,0.28)' : active ? 'var(--ms-b)' : 'var(--ms-muted)',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </button>
  );
});

// ── ArticleCard ───────────────────────────────────────────────────────────────

const ArticleCard = memo(function ArticleCard({ h, featured = false }: {
  h: ESPNNewsArticle; featured?: boolean;
}) {
  const url    = h.links?.web?.href;
  const league = h.categories?.find(c => c.type === 'league')?.description;
  const img    = h.images?.[0];

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div style={{
        background: 'var(--ms-surface)', borderRadius: 8, padding: featured ? 18 : 14,
        border: '1px solid var(--ms-border)', display: 'flex', flexDirection: 'column', gap: 8, height: '100%',
      }}>
        {featured && img && (
          <div style={{ height: 140, borderRadius: 6, overflow: 'hidden', background: '#0C2C56', position: 'relative', flexShrink: 0 }}>
            <Image src={img.url} alt={h.headline} fill style={{ objectFit: 'cover' }} unoptimized />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--ms-a)', letterSpacing: '0.16em' }}>
            {league?.toUpperCase() ?? 'SPORTS'}
          </span>
          {h.published && <span style={{ fontSize: 9, color: 'var(--ms-muted)' }}>· {timeAgo(h.published)}</span>}
        </div>
        <div style={{ fontSize: featured ? 18 : 13, color: 'var(--ms-ink)', lineHeight: 1.35, fontWeight: featured ? 800 : 600 }}>
          {h.headline}
        </div>
        {featured && h.description && (
          <p style={{ fontSize: 12, color: 'var(--ms-muted)', lineHeight: 1.5, margin: 0 }}>{h.description}</p>
        )}
      </div>
    </a>
  );
});

// ── SectionHeadlines ──────────────────────────────────────────────────────────

const SectionHeadlines = memo(function SectionHeadlines({ teamNews, generalHeadlines }: {
  teamNews: ESPNNewsArticle[]; generalHeadlines: ESPNNewsArticle[];
}) {
  const hasTeamNews = teamNews.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(var(--ms-sgap) * 0.8)' }}>
      {hasTeamNews && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--ms-b)', marginBottom: 10 }}>
            MY TEAMS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(200px, 30vw, 320px), 1fr))', gap: 'var(--ms-gap)' }}>
            {teamNews.slice(0, 3).map((h, i) => (
              <ArticleCard key={i} h={h} />
            ))}
          </div>
        </div>
      )}

      <div>
        {hasTeamNews && (
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--ms-muted)', marginBottom: 10 }}>
            TOP HEADLINES
          </div>
        )}
        {!generalHeadlines.length ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ms-muted)', border: '1px dashed var(--ms-border)', borderRadius: 8 }}>
            No headlines available.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(200px, 30vw, 320px), 1fr))', gap: 'var(--ms-gap)' }}>
            <ArticleCard h={generalHeadlines[0]} featured />
            {generalHeadlines.slice(1, 5).map((h, i) => (
              <ArticleCard key={i} h={h} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Main Component ────────────────────────────────────────────────────────────

export default function DashboardClient({
  userName, dateLabel, liveMyTeamCount,
  todayGames, yesterdayGames, tomorrowGames,
  myTeams, myPlayers,
  generalHeadlines, teamNews,
  savedPrefs,
}: DashboardClientProps) {
  // Initialize directly from server-passed prefs — no localStorage read needed on first render
  const serverOrder  = savedPrefs?.dashboardOrder;
  const serverTweaks = savedPrefs?.dashboardTweaks as Partial<TweaksState> | undefined;

  const [tweaks, setTweaks] = useState<TweaksState>({
    theme: 'dark', density: 'cozy', accent: 'coral',
    showTicker: true, showLiveBanner: true, visible: {}, collapsed: {},
    ...serverTweaks,
  });
  const set = useCallback((k: string, v: unknown) => setTweaks(t => ({ ...t, [k]: v })), []);

  const [order, setOrder]               = useState<string[]>(serverOrder ?? DEFAULT_ORDER);
  const [dashboardPlayers, setDashboardPlayers] = useState<FavoritePlayer[]>(myPlayers);
  const [savedSnapshot, setSavedSnapshot] = useState<string[] | null>(serverOrder ?? null);
  const [hiddenGames, setHiddenGames]   = useState<string[]>(savedPrefs?.hiddenGames ?? []);
  const initialized = React.useRef(false);
  const tweaksSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: sync localStorage cache with server values (server wins)
  useEffect(() => {
    if (serverOrder) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serverOrder)); } catch {}
    } else {
      // No server prefs yet — fall back to localStorage for this session
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as string[];
          setOrder(parsed);
          setSavedSnapshot(parsed);
        }
      } catch {}
      try {
        const saved = localStorage.getItem(TWEAKS_KEY);
        if (saved) setTweaks(t => ({ ...t, ...(JSON.parse(saved) as Partial<TweaksState>) }));
      } catch {}
    }
    initialized.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save tweaks: localStorage immediately, server debounced 1s
  useEffect(() => {
    if (!initialized.current) return;
    try { localStorage.setItem(TWEAKS_KEY, JSON.stringify(tweaks)); } catch {}
    if (tweaksSaveTimer.current) clearTimeout(tweaksSaveTimer.current);
    tweaksSaveTimer.current = setTimeout(() => {
      fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardTweaks: tweaks }),
      }).catch(() => {});
    }, 1000);
  }, [tweaks]);

  const dirty = JSON.stringify(order) !== JSON.stringify(savedSnapshot ?? DEFAULT_ORDER);

  const [dragId, setDragId]     = useState<string | null>(null);
  const [overId, setOverId]     = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const [showTweaks, setShowTweaks] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // CSS variables object — single object update drives all theme changes via CSS cascade
  const cssVars = useMemo(
    () => buildCSSVars(tweaks.theme, tweaks.accent, tweaks.density),
    [tweaks.theme, tweaks.accent, tweaks.density]
  );

  const liveMyGames = useMemo(
    () => todayGames.filter(g => g.state === 'in' && (g.away.mine || g.home.mine)),
    [todayGames]
  );

  // All live games (not just favorites) — used as the FocusMode navigation list
  const liveAllGames = useMemo(
    () => todayGames.filter(g => g.state === 'in'),
    [todayGames]
  );

  const greetingMsg =
    liveMyTeamCount === 0 ? "What's happening in sports today." :
    liveMyTeamCount === 1 ? 'One of yours is live.' :
    `${liveMyTeamCount} of yours are live.`;

  const openFocus = useCallback((g: GameData) => {
    const i = liveAllGames.findIndex(x => x.id === g.id);
    setFocusIdx(i >= 0 ? i : 0);
  }, [liveAllGames]);

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

  const saveLayout = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch {}
    fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardOrder: order }),
    }).catch(() => {});
    setSavedSnapshot([...order]);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  }, [order]);

  const resetLayout = useCallback(() => {
    setOrder(DEFAULT_ORDER);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardOrder: DEFAULT_ORDER }),
    }).catch(() => {});
    setSavedSnapshot(null);
  }, []);

  const moveSection = useCallback((id: string, dir: -1 | 1) => {
    setOrder(prev => {
      const idx = prev.indexOf(id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  }, []);

  const persistPlayerOrder = useCallback((next: FavoritePlayer[]) => {
    fetch('/api/favorites/players', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds: next.map(p => p.id) }),
    }).catch(() => {});
  }, []);

  const movePlayer = useCallback((id: string, direction: -1 | 1) => {
    setDashboardPlayers(prev => {
      const visibleIds = prev.filter(p => p.displayInCommandCenter !== 0).map(p => p.id);
      const visibleIndex = visibleIds.indexOf(id);
      const targetId = visibleIds[visibleIndex + direction];
      if (!targetId) return prev;
      const from = prev.findIndex(p => p.id === id);
      const to = prev.findIndex(p => p.id === targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      persistPlayerOrder(next);
      return next;
    });
  }, [persistPlayerOrder]);

  const togglePlayerCommandCenter = useCallback((id: string, enabled: boolean) => {
    setDashboardPlayers(prev =>
      prev.map(p => p.id === id ? { ...p, displayInCommandCenter: enabled ? 1 : 0 } : p)
    );
    fetch(`/api/favorites/players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayInCommandCenter: enabled }),
    }).catch(() => {});
  }, []);

  const onHideGame = useCallback((id: string) => {
    setHiddenGames(prev => {
      const next = prev.includes(id) ? prev : [...prev, id];
      fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenGames: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const isVisible      = (id: string) => tweaks.visible[id] !== false;
  const orderedVisible = order.filter(isVisible);

  const totalGames = todayGames.length + yesterdayGames.length + tomorrowGames.length;
  const commandCenterPlayerCount = dashboardPlayers.filter(p => p.displayInCommandCenter !== 0).length;

  const SECTION_META = useMemo<Record<string, { title: string; count: number; action?: string; actionHref?: string }>>(() => ({
    games:     { title: 'Key games',      count: totalGames,      action: 'SCOREBOARD →', actionHref: '/scoreboard' },
    teams:     { title: 'My teams',      count: myTeams.length,  action: 'MANAGE →' },
    players:   { title: 'My players',    count: commandCenterPlayerCount, action: 'VIEW ALL →', actionHref: '/players' },
    headlines: { title: 'Headlines',     count: teamNews.length + generalHeadlines.length, action: 'ALL NEWS →', actionHref: '/headlines' },
  }), [totalGames, myTeams.length, commandCenterPlayerCount, teamNews.length, generalHeadlines.length]);

  const sectionList = useMemo(
    () => DEFAULT_ORDER.map(id => ({ id, title: SECTION_META[id as keyof typeof SECTION_META]?.title ?? id })),
    [SECTION_META]
  );

  const renderSection = (id: string) => {
    switch (id) {
      case 'games':     return <SectionGames     todayGames={todayGames} yesterdayGames={yesterdayGames} tomorrowGames={tomorrowGames} onFocus={openFocus} hiddenGames={hiddenGames} onHideGame={onHideGame} />;
      case 'teams':     return <SectionTeams     myTeams={myTeams} />;
      case 'players':   return <SectionPlayers   myPlayers={dashboardPlayers} onMovePlayer={movePlayer} onToggleCommandCenter={togglePlayerCommandCenter} />;
      case 'headlines': return <SectionHeadlines teamNews={teamNews} generalHeadlines={generalHeadlines} />;
      default:          return null;
    }
  };

  return (
    <div style={{ ...cssVars, background: 'var(--ms-bg)', color: 'var(--ms-ink)', minHeight: '100vh', fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}>
      {tweaks.showTicker && (
        <div style={{ position: 'sticky', top: 64, zIndex: 5 }}>
          <Ticker games={todayGames} />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 0 0', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ms-muted)', letterSpacing: '0.18em', fontWeight: 700 }}>{dateLabel}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ms-ink)', marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Hey, <span style={{ color: 'var(--ms-b)' }}>{userName.split(' ')[0]}</span>.{' '}
            <span style={{ color: 'var(--ms-muted)', fontWeight: 400 }}>{greetingMsg}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {dirty && <span style={{ fontSize: 10, color: 'var(--ms-a)', letterSpacing: '0.14em', fontWeight: 700 }}>● UNSAVED</span>}
          <button onClick={resetLayout} style={{
            background: 'transparent', border: '1px solid var(--ms-border)', color: 'var(--ms-muted)',
            padding: '7px 12px', borderRadius: 8, fontSize: 10, letterSpacing: '0.12em', fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>RESET</button>
          <button onClick={saveLayout} disabled={!dirty} style={{
            background: dirty ? 'var(--ms-a)' : 'rgba(255,255,255,0.06)', border: 'none',
            color: dirty ? '#000' : 'var(--ms-muted)',
            padding: '7px 12px', borderRadius: 8, fontSize: 10, letterSpacing: '0.12em', fontWeight: 800,
            cursor: dirty ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all .15s',
          }}>SAVE LAYOUT</button>
          <button onClick={() => setShowTweaks(v => !v)} style={{
            background: showTweaks ? 'var(--ms-a)' : 'var(--ms-surface)', border: '1px solid var(--ms-border)',
            color: showTweaks ? '#000' : 'var(--ms-ink)',
            padding: '7px 12px', borderRadius: 8, fontSize: 10, letterSpacing: '0.12em', fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>⚙ TWEAKS</button>
        </div>
      </div>

      {tweaks.showLiveBanner && <LiveBanner games={todayGames} onFocus={openFocus} />}

      <div style={{ paddingTop: 24 }}>
        {orderedVisible.map(id => {
          const meta = SECTION_META[id as keyof typeof SECTION_META];
          if (!meta) return null;
          const isCollapsed = !!tweaks.collapsed?.[id];
          return (
            <div
              key={id}
              onDragOver={onDragOver(id)}
              onDrop={onDrop}
              style={{
                marginBottom: 'var(--ms-sgap)',
                opacity: dragId === id ? 0.4 : 1,
                borderTop: overId === id && dragId !== id ? '2px solid var(--ms-a)' : '2px solid transparent',
                paddingTop: 8,
                transition: 'border-color 0.12s, opacity 0.12s',
              }}
            >
              <SectionHead
                title={meta.title}
                count={meta.count}
                action={meta.action}
                actionHref={meta.actionHref}
                onDragStart={onDragStart(id)}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                dragging={dragId === id}
                onMoveUp={orderedVisible.indexOf(id) > 0 ? () => moveSection(id, -1) : undefined}
                onMoveDown={orderedVisible.indexOf(id) < orderedVisible.length - 1 ? () => moveSection(id, 1) : undefined}
                collapsed={isCollapsed}
                onToggleCollapse={() => set('collapsed', { ...tweaks.collapsed, [id]: !isCollapsed })}
              />
              {!isCollapsed && renderSection(id)}
            </div>
          );
        })}

        {orderedVisible.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--ms-muted)', border: '1px dashed var(--ms-border)', borderRadius: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ms-ink)', marginBottom: 4 }}>No sections visible.</div>
            <div style={{ fontSize: 12 }}>Toggle sections back on in the Tweaks panel.</div>
          </div>
        )}
      </div>

      {showTweaks && <TweaksPanel tweaks={tweaks} set={set} sections={sectionList} />}

      {focusIdx !== null && liveAllGames.length > 0 && (
        <FocusMode
          liveMyGames={liveAllGames}
          initialIdx={focusIdx}
          onClose={() => setFocusIdx(null)}
        />
      )}

      {savedToast && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ms-a)', color: '#000', padding: '10px 20px', borderRadius: 999,
          fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', zIndex: 60,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)', animation: 'msFade 0.2s',
        }}>✓ LAYOUT SAVED</div>
      )}
    </div>
  );
}
