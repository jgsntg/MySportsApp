'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils';
import type { FavoriteTeam, FavoritePlayer, ESPNNewsArticle } from '@/types';

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
  state: 'pre' | 'in' | 'post';
  detail: string;
  away: GameTeam;
  home: GameTeam;
  venue?: string;
  broadcast?: string;
}

interface DashboardClientProps {
  userName: string;
  dateLabel: string;
  liveMyTeamCount: number;
  games: GameData[];
  myTeams: FavoriteTeam[];
  myPlayers: FavoritePlayer[];
  headlines: ESPNNewsArticle[];
}

// ── Theme tokens ──────────────────────────────────────────────────────────────

type ThemeKey = 'dark' | 'dim' | 'contrast';
type AccentKey = 'coral' | 'cyan' | 'lime' | 'rose';
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

// ── LiveBanner ────────────────────────────────────────────────────────────────

function LiveBanner({ games, T, A, onFocus }: {
  games: GameData[]; T: Tokens; A: Accent; onFocus: (g: GameData) => void;
}) {
  const live = games.filter(g => g.state === 'in' && (g.away.mine || g.home.mine));
  if (!live.length) return null;
  return (
    <div style={{
      margin: '20px 0 0', padding: '14px 18px', background: T.surface,
      border: `1px solid ${T.border}`, borderLeft: `3px solid ${A.a}`,
      borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: A.a,
        padding: '4px 8px', background: 'rgba(255,90,77,0.12)', borderRadius: 4, flexShrink: 0,
      }}>● YOUR TEAMS PLAYING</span>
      <div style={{ display: 'flex', gap: 22, flex: 1, flexWrap: 'wrap' }}>
        {live.map(g => {
          const me  = g.away.mine ? g.away : g.home;
          const opp = g.away.mine ? g.home : g.away;
          return (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: T.muted, letterSpacing: '0.1em' }}>{g.league}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: A.b }}>{me.name}</span>
              <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: me.winning ? A.b : T.ink }}>{me.score}</span>
              <span style={{ color: T.muted, fontSize: 12 }}>vs</span>
              <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 800, color: opp.winning ? A.b : T.ink }}>{opp.score}</span>
              <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{opp.name}</span>
              <span style={{ fontSize: 11, color: A.a, fontFamily: MONO, marginLeft: 4 }}>{g.detail}</span>
            </div>
          );
        })}
      </div>
      <button onClick={() => onFocus(live[0])} style={{
        background: A.a, color: '#000', border: 'none', padding: '6px 12px',
        borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
        cursor: 'pointer', fontFamily: 'inherit',
      }}>FOCUS ↗</button>
    </div>
  );
}

// ── SectionHead ───────────────────────────────────────────────────────────────

function SectionHead({ title, count, action, T, A, onDragStart, onDragEnd, dragging }: {
  title: string; count?: number | string; action?: string;
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
      {action && (
        <span style={{ fontSize: 10, color: A.b, letterSpacing: '0.14em', fontWeight: 700, cursor: 'pointer' }}>
          {action}
        </span>
      )}
    </div>
  );
}

// ── SectionGames ──────────────────────────────────────────────────────────────

function SectionGames({ games, T, A, DEN, onFocus }: {
  games: GameData[]; T: Tokens; A: Accent; DEN: Density; onFocus: (g: GameData) => void;
}) {
  if (!games.length) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: T.muted, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
        No games scheduled today.
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DEN.gap }}>
      {games.slice(0, 9).map(g => {
        const live = g.state === 'in';
        const post = g.state === 'post';
        return (
          <div
            key={g.id}
            onClick={() => live && onFocus(g)}
            style={{
              background: T.surface, borderRadius: 8,
              border: `1px solid ${live ? 'rgba(255,90,77,0.4)' : T.border}`,
              padding: DEN.padCard, position: 'relative', overflow: 'hidden',
              cursor: live ? 'pointer' : 'default',
            }}
          >
            {live && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: A.a }} />
            )}
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
      })}
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

// ── SectionHeadlines ──────────────────────────────────────────────────────────

function SectionHeadlines({ headlines, T, A, DEN }: {
  headlines: ESPNNewsArticle[]; T: Tokens; A: Accent; DEN: Density;
}) {
  if (!headlines.length) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: T.muted, border: `1px dashed ${T.border}`, borderRadius: 8 }}>
        No headlines available.
      </div>
    );
  }
  const lead   = headlines[0];
  const rest   = headlines.slice(1, 5);
  const leadImg = lead.images?.[0];
  const leadUrl = lead.links?.web?.href;
  const leadLeague = lead.categories?.find(c => c.type === 'league')?.description;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: DEN.gap }}>
      {/* Lead */}
      <a href={leadUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', gridRow: 'span 2' }}>
        <div style={{
          background: T.surface, borderRadius: 8, padding: DEN.padCard + 4,
          border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 10, height: '100%',
        }}>
          <div style={{ height: 160, borderRadius: 6, overflow: 'hidden', background: 'linear-gradient(135deg, #0C2C56, #005C5C)', position: 'relative', flexShrink: 0 }}>
            {leadImg && (
              <Image src={leadImg.url} alt={lead.headline} fill style={{ objectFit: 'cover' }} unoptimized />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: A.a, letterSpacing: '0.18em' }}>
              {leadLeague?.toUpperCase() ?? 'SPORTS'}
            </span>
            {lead.published && (
              <span style={{ fontSize: 10, color: T.muted }}>· {timeAgo(lead.published)}</span>
            )}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: T.ink, lineHeight: 1.25, margin: 0, letterSpacing: '-0.01em' }}>
            {lead.headline}
          </h3>
          {lead.description && (
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>{lead.description}</p>
          )}
        </div>
      </a>

      {/* Secondary */}
      {rest.map((h, i) => {
        const url    = h.links?.web?.href;
        const league = h.categories?.find(c => c.type === 'league')?.description;
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{
              background: T.surface, borderRadius: 8, padding: DEN.padCard,
              border: `1px solid ${T.border}`, height: '100%',
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: A.a, letterSpacing: '0.16em' }}>
                  {league?.toUpperCase() ?? 'SPORTS'}
                </span>
                {h.published && <span style={{ fontSize: 9, color: T.muted }}>· {timeAgo(h.published)}</span>}
              </div>
              <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.35, fontWeight: 600 }}>{h.headline}</div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ── FocusMode ─────────────────────────────────────────────────────────────────

function FocusMode({ game, T, A, onClose }: { game: GameData | null; T: Tokens; A: Accent; onClose: () => void }) {
  useEffect(() => {
    if (!game) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [game, onClose]);

  if (!game) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: '#000', color: T.ink,
      fontFamily: '"Inter", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      animation: 'msFade 0.2s ease',
    }}>
      {/* Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ background: A.a, color: '#000', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em' }}>
            ● FOCUS MODE
          </span>
          <span style={{ fontSize: 11, color: T.muted, letterSpacing: '0.14em', fontWeight: 600 }}>
            {game.league}{game.venue ? ` · ${game.venue}` : ''}{game.broadcast ? ` · ${game.broadcast}` : ''}
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: `1px solid ${T.border}`, color: T.ink,
          padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit',
        }}>EXIT ✕</button>
      </div>

      {/* Scoreboard */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 28% 50%, ${game.away.color}40, transparent 55%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 72% 50%, ${game.home.color}40, transparent 55%)`, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 56, maxWidth: 960, width: '100%' }}>
          {/* Away */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', color: T.muted, fontWeight: 700 }}>
              {game.away.mine ? 'YOUR TEAM' : 'AWAY'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.ink, marginTop: 4 }}>{game.away.name}</div>
            {game.away.record && <div style={{ fontSize: 11, color: T.muted, fontFamily: MONO, marginTop: 2 }}>{game.away.record}</div>}
            <div style={{
              fontSize: 140, fontWeight: 900, lineHeight: 0.85, marginTop: 16,
              color: game.away.winning ? A.b : T.muted, fontFamily: MONO, letterSpacing: '-0.05em',
              textShadow: game.away.winning ? `0 0 60px ${A.a}40` : 'none',
            }}>{game.away.score ?? '–'}</div>
          </div>

          {/* Center */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.2em', fontWeight: 700 }}>{game.detail}</div>
            <div style={{ fontSize: 48, fontWeight: 100, color: T.muted, lineHeight: 1, margin: '12px 0', fontFamily: MONO }}>—</div>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: '0.18em' }}>
              {game.state === 'post' ? 'FINAL' : game.state === 'pre' ? 'UPCOMING' : 'LIVE'}
            </div>
          </div>

          {/* Home */}
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', color: T.muted, fontWeight: 700 }}>
              {game.home.mine ? 'YOUR TEAM' : 'HOME'}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.ink, marginTop: 4 }}>{game.home.name}</div>
            {game.home.record && <div style={{ fontSize: 11, color: T.muted, fontFamily: MONO, marginTop: 2 }}>{game.home.record}</div>}
            <div style={{
              fontSize: 140, fontWeight: 900, lineHeight: 0.85, marginTop: 16,
              color: game.home.winning ? A.b : T.muted, fontFamily: MONO, letterSpacing: '-0.05em',
            }}>{game.home.score ?? '–'}</div>
          </div>
        </div>
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
  userName, dateLabel, liveMyTeamCount, games, myTeams, myPlayers, headlines,
}: DashboardClientProps) {
  const [tweaks, setTweaks] = useState<TweaksState>({
    theme: 'dark', density: 'cozy', accent: 'coral',
    showTicker: true, showLiveBanner: true, visible: {},
  });
  const set = (k: string, v: unknown) => setTweaks(t => ({ ...t, [k]: v }));

  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [savedSnapshot, setSavedSnapshot] = useState<string[] | null>(null);

  // Load saved order from localStorage on mount
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

  const [dragId, setDragId]   = useState<string | null>(null);
  const [overId, setOverId]   = useState<string | null>(null);
  const [focusGame, setFocusGame] = useState<GameData | null>(null);
  const [showTweaks, setShowTweaks] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const T   = THEMES[tweaks.theme];
  const A   = ACCENTS[tweaks.accent];
  const DEN = DENSITY[tweaks.density];

  const greetingMsg =
    liveMyTeamCount === 0 ? "What's happening in sports today." :
    liveMyTeamCount === 1 ? 'One of yours is live.' :
    `${liveMyTeamCount} of yours are live.`;

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

  const isVisible     = (id: string) => tweaks.visible[id] !== false;
  const orderedVisible = order.filter(isVisible);

  const SECTION_META: Record<string, { title: string; count?: number; action?: string }> = {
    games:     { title: "Today's games", count: games.length,     action: 'ALL →' },
    teams:     { title: 'My teams',      count: myTeams.length,   action: 'MANAGE →' },
    players:   { title: 'My players',    count: myPlayers.length },
    headlines: { title: 'Headlines',     count: headlines.length, action: 'ALL NEWS →' },
  };

  const renderSection = (id: string) => {
    switch (id) {
      case 'games':     return <SectionGames     games={games}         T={T} A={A} DEN={DEN} onFocus={setFocusGame} />;
      case 'teams':     return <SectionTeams     myTeams={myTeams}     T={T} A={A} DEN={DEN} />;
      case 'players':   return <SectionPlayers   myPlayers={myPlayers} T={T} A={A} DEN={DEN} />;
      case 'headlines': return <SectionHeadlines headlines={headlines} T={T} A={A} DEN={DEN} />;
      default:          return null;
    }
  };

  const sectionList = DEFAULT_ORDER.map(id => ({ id, title: SECTION_META[id]?.title ?? id }));

  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: '100vh', fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}>
      {/* Sticky ticker (below fixed navbar) */}
      {tweaks.showTicker && (
        <div style={{ position: 'sticky', top: 64, zIndex: 5 }}>
          <Ticker games={games} T={T} A={A} />
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '20px 0 0', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.18em', fontWeight: 700 }}>{dateLabel}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Hey, <span style={{ color: A.b }}>{userName}</span>.{' '}
            <span style={{ color: T.muted, fontWeight: 400 }}>{greetingMsg}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {dirty && (
            <span style={{ fontSize: 10, color: A.a, letterSpacing: '0.14em', fontWeight: 700 }}>● UNSAVED</span>
          )}
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

      {tweaks.showLiveBanner && <LiveBanner games={games} T={T} A={A} onFocus={setFocusGame} />}

      {/* Sections */}
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
      <FocusMode game={focusGame} T={T} A={A} onClose={() => setFocusGame(null)} />

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
