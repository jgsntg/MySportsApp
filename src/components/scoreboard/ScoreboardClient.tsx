'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { EyeOff, Eye } from 'lucide-react';
import type { UserPrefs } from '@/lib/db/preferences';

const MONO = 'var(--font-mono), ui-monospace, monospace';
const STORAGE_KEY = 'ms_scoreboard_v1';

export interface ScoreTeam {
  abbr: string;
  name: string;
  logo?: string;
  score?: string;
  winning: boolean;
  mine: boolean;
}

export interface ScoreGame {
  id: string;
  state: 'pre' | 'in' | 'post';
  detail: string;
  away: ScoreTeam;
  home: ScoreTeam;
  venue?: string;
  broadcast?: string;
  espnLink?: string;
  label?: string; // "AWY vs HME" — used for hidden-game chips
}

export interface GolfLeader {
  order: number;
  name: string;
  score: string;
  thru?: string;
}

export interface GolfTournament {
  name: string;
  status: 'pre' | 'in' | 'post';
  statusDetail: string;
  leaders: GolfLeader[];
  espnLink?: string;
}

export interface ScoreSection {
  key: string;
  name: string;
  color: string;
  games: ScoreGame[];
  golfTournament?: GolfTournament;
}

type ScoreTab = 'yesterday' | 'today' | 'tomorrow';

interface ScoreboardClientProps {
  todaySections: ScoreSection[];
  yesterdaySections: ScoreSection[];
  tomorrowSections: ScoreSection[];
  todayDateLabel: string;
  yesterdayDateLabel: string;
  tomorrowDateLabel: string;
  savedPrefs?: UserPrefs;
}

function GameCard({ g }: { g: ScoreGame }) {
  const live = g.state === 'in';
  const post = g.state === 'post';

  const inner = (
    <div style={{
      background: '#121A30',
      borderRadius: 8,
      border: `1px solid ${live ? 'rgba(255,90,77,0.4)' : 'rgba(255,255,255,0.07)'}`,
      padding: 14,
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.12s',
    }}>
      {live && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#FF5A4D' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 9, color: '#8392B5', fontWeight: 700, letterSpacing: '0.12em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
          {g.venue ?? ''}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', fontFamily: MONO,
          color: live ? '#FF5A4D' : post ? '#8392B5' : '#F0F4FF',
          flexShrink: 0,
        }}>
          {live ? `● ${g.detail}` : post ? 'FINAL' : g.detail}
        </span>
      </div>
      {[g.away, g.home].map((team, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i === 0 ? 6 : 0 }}>
          {team.logo ? (
            <div style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 3, overflow: 'hidden', background: '#1A2440', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src={team.logo} alt={team.name} width={20} height={20} style={{ objectFit: 'contain' }} unoptimized />
            </div>
          ) : (
            <div style={{ width: 24, height: 24, background: '#1A2440', borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#F0F4FF', fontWeight: 800 }}>
              {team.abbr.slice(0, 3)}
            </div>
          )}
          <span style={{
            flex: 1, fontSize: 12, fontWeight: team.mine ? 700 : 500,
            color: team.mine ? '#FFD166' : '#F0F4FF',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{team.name}</span>
          {team.score !== undefined && (
            <span style={{
              fontFamily: MONO, fontSize: 16, fontWeight: team.winning ? 800 : 500,
              color: team.winning ? '#F0F4FF' : '#8392B5',
            }}>{team.score}</span>
          )}
        </div>
      ))}
      {g.broadcast && (
        <div style={{ marginTop: 8, fontSize: 9, color: '#8392B5' }}>{g.broadcast}</div>
      )}
      {g.espnLink && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 9, color: '#8392B5', letterSpacing: '0.1em', fontWeight: 600 }}>
          ESPN ↗
        </div>
      )}
    </div>
  );

  if (g.espnLink) {
    return (
      <a href={g.espnLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}
        onMouseEnter={e => ((e.currentTarget.firstChild as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)')}
        onMouseLeave={e => ((e.currentTarget.firstChild as HTMLElement).style.borderColor = live ? 'rgba(255,90,77,0.4)' : 'rgba(255,255,255,0.07)')}
      >
        {inner}
      </a>
    );
  }
  return inner;
}

function GolfCard({ t }: { t: GolfTournament }) {
  const live = t.status === 'in';
  const post = t.status === 'post';

  const inner = (
    <div style={{
      background: '#121A30', borderRadius: 8, padding: 16,
      border: `1px solid ${live ? 'rgba(255,90,77,0.4)' : 'rgba(255,255,255,0.07)'}`,
      position: 'relative', overflow: 'hidden',
    }}>
      {live && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#FF5A4D' }} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#F0F4FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
          {t.name}
        </span>
        <span style={{ fontSize: 9, fontWeight: 800, fontFamily: MONO, letterSpacing: '0.12em', flexShrink: 0,
          color: live ? '#FF5A4D' : post ? '#8392B5' : '#F0F4FF' }}>
          {live ? `● ${t.statusDetail}` : post ? 'FINAL' : t.statusDetail}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {t.leaders.slice(0, 5).map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, color: '#8392B5', width: 16, textAlign: 'right', flexShrink: 0 }}>{p.order}</span>
            <span style={{ flex: 1, fontSize: 12, color: i === 0 ? '#FFD166' : '#F0F4FF', fontWeight: i === 0 ? 700 : 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: i === 0 ? 800 : 500,
              color: i === 0 ? '#F0F4FF' : '#8392B5' }}>{p.score}</span>
            {p.thru && <span style={{ fontSize: 9, color: '#8392B5', fontFamily: MONO, flexShrink: 0 }}>{p.thru}</span>}
          </div>
        ))}
      </div>
      {t.espnLink && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 9, color: '#8392B5', letterSpacing: '0.1em', fontWeight: 600 }}>
          ESPN ↗
        </div>
      )}
    </div>
  );

  return t.espnLink ? (
    <a href={t.espnLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </a>
  ) : inner;
}

export default function ScoreboardClient({
  todaySections, yesterdaySections, tomorrowSections,
  todayDateLabel, yesterdayDateLabel, tomorrowDateLabel,
  savedPrefs,
}: ScoreboardClientProps) {
  const defaultTab: ScoreTab = todaySections.length ? 'today' : tomorrowSections.length ? 'tomorrow' : 'yesterday';
  const [tab, setTab] = useState<ScoreTab>(defaultTab);

  const sections = tab === 'today' ? todaySections : tab === 'yesterday' ? yesterdaySections : tomorrowSections;
  const dateLabel = tab === 'today' ? todayDateLabel : tab === 'yesterday' ? yesterdayDateLabel : tomorrowDateLabel;

  const defaultOrder = todaySections.map(s => s.key);
  const serverOrder     = savedPrefs?.scoreboardOrder;
  const serverCollapsed = savedPrefs?.scoreboardCollapsed;

  const [order, setOrder]           = useState<string[]>(serverOrder ?? defaultOrder);
  const [collapsed, setCollapsed]   = useState<Record<string, boolean>>(serverCollapsed ?? {});
  const [hiddenGames, setHiddenGames] = useState<string[]>(savedPrefs?.hiddenGames ?? []);
  const [dragId, setDragId]         = useState<string | null>(null);
  const [overId, setOverId]         = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);
  const initialized = useRef(false);

  // On mount: sync localStorage cache with server; fall back to localStorage if no server prefs
  useEffect(() => {
    if (serverOrder) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ order: serverOrder, collapsed: serverCollapsed ?? {} })); } catch {}
    } else {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { order?: string[]; collapsed?: Record<string, boolean> };
          if (parsed.order)     setOrder(parsed.order);
          if (parsed.collapsed) setCollapsed(parsed.collapsed);
        }
      } catch {}
    }
    initialized.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (nextOrder: string[], nextCollapsed: Record<string, boolean>) => {
    // Always write to localStorage as cache
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ order: nextOrder, collapsed: nextCollapsed })); } catch {}
    // Write to server
    fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scoreboardOrder: nextOrder, scoreboardCollapsed: nextCollapsed }),
    }).catch(() => {});
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1500);
  };

  const unhideGame = useCallback((id: string) => {
    setHiddenGames(prev => {
      const next = prev.filter(x => x !== id);
      fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenGames: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const toggleCollapse = (key: string) => {
    const next = { ...collapsed, [key]: !collapsed[key] };
    setCollapsed(next);
    persist(order, next);
  };

  const onDragStart = (key: string) => (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    setDragId(key);
  };
  const onDragOver = (key: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (key !== dragId) setOverId(key);
  };
  const onDrop = (key: string) => () => {
    if (!dragId || !overId || dragId === overId) { setDragId(null); setOverId(null); return; }
    const next = [...order];
    const from = next.indexOf(dragId);
    const to   = next.indexOf(key);
    next.splice(from, 1);
    next.splice(to, 0, dragId);
    setOrder(next);
    setDragId(null);
    setOverId(null);
    persist(next, collapsed);
  };
  const onDragEnd = () => { setDragId(null); setOverId(null); };

  const sectionMap = Object.fromEntries(sections.map(s => [s.key, s]));
  const ordered = order.filter(k => sectionMap[k]).map(k => sectionMap[k]);
  const missing = sections.filter(s => !order.includes(s.key));
  const visible = [...ordered, ...missing];

  const moveSection = (key: string, dir: -1 | 1) => {
    const keys = visible.map(s => s.key);
    const idx = keys.indexOf(key);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= keys.length) return;
    const arr = [...keys];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setOrder(arr);
    persist(arr, collapsed);
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 16px', borderRadius: 6, fontSize: 10, fontWeight: 800,
    letterSpacing: '0.12em', cursor: 'pointer', border: 'none', fontFamily: 'inherit',
    background: active ? '#FF5A4D' : 'transparent',
    color: active ? '#000' : '#8392B5',
    transition: 'all .12s',
  });

  const emptyMsg = tab === 'today' ? 'No games scheduled today.'
    : tab === 'yesterday' ? 'No games played yesterday.'
    : 'No games scheduled for tomorrow.';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#F0F4FF' }}>Scoreboard</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={tabStyle(tab === 'yesterday')} onClick={() => setTab('yesterday')}>YESTERDAY</button>
          <button style={tabStyle(tab === 'today')}     onClick={() => setTab('today')}>TODAY</button>
          <button style={tabStyle(tab === 'tomorrow')}  onClick={() => setTab('tomorrow')}>TOMORROW</button>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: '#8392B5', letterSpacing: '0.12em' }}>
          DRAG OR USE ↑↓ TO REORDER
        </span>
      </div>
      <div style={{ fontSize: 11, color: '#8392B5', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 28 }}>{dateLabel}</div>

      {sections.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: '#8392B5', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#F0F4FF', marginBottom: 6 }}>{emptyMsg}</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {visible.map((section, visIdx) => {
          const isOver      = overId === section.key && dragId !== section.key;
          const isDragging  = dragId === section.key;
          const isCollapsed = !!collapsed[section.key];
          const isGolf      = !!section.golfTournament;
          const gameCount   = isGolf ? 1 : section.games.length;

          const moveBtn = (label: string, disabled: boolean, dir: -1 | 1) => (
            <button
              onClick={e => { e.stopPropagation(); if (!disabled) moveSection(section.key, dir); }}
              onMouseDown={e => e.stopPropagation()}
              disabled={disabled}
              style={{
                background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                color: disabled ? 'transparent' : '#8392B5',
                width: 22, height: 22, borderRadius: 4, cursor: disabled ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, lineHeight: 1, padding: 0, flexShrink: 0,
              }}
              onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.color = '#F0F4FF'; }}
              onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLElement).style.color = '#8392B5'; }}
            >{label}</button>
          );

          return (
            <div
              key={section.key}
              onDragOver={onDragOver(section.key)}
              onDrop={onDrop(section.key)}
              onDragEnd={onDragEnd}
              style={{
                opacity: isDragging ? 0.4 : 1,
                borderTop: isOver ? '2px solid #FF5A4D' : '2px solid transparent',
                paddingTop: 8,
                transition: 'border-color 0.12s, opacity 0.12s',
              }}
            >
              {/* League header — draggable */}
              <div
                draggable
                onDragStart={onDragStart(section.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: isCollapsed ? 0 : 16,
                  cursor: 'grab', userSelect: 'none',
                }}
              >
                {moveBtn('↑', visIdx === 0, -1)}
                {moveBtn('↓', visIdx === visible.length - 1, 1)}
                <div style={{ width: 10, height: 10, borderRadius: 999, background: section.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: '#F0F4FF', textTransform: 'uppercase' }}>
                  {section.name}
                </span>
                <span style={{ fontSize: 10, color: '#8392B5', fontFamily: MONO }}>
                  · {gameCount} {isGolf ? 'tournament' : `game${gameCount !== 1 ? 's' : ''}`}
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)', marginLeft: 4 }} />

                {/* Collapse toggle */}
                <button
                  onClick={e => { e.stopPropagation(); toggleCollapse(section.key); }}
                  onMouseDown={e => e.stopPropagation()}
                  style={{
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#8392B5', padding: '3px 10px', borderRadius: 5,
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    letterSpacing: '0.1em', fontFamily: 'inherit', flexShrink: 0,
                    transition: 'color 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#F0F4FF')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#8392B5')}
                >
                  {isCollapsed ? '▶ EXPAND' : '▼ COLLAPSE'}
                </button>
              </div>

              {/* Content */}
              {!isCollapsed && (
                <>
                  {isGolf ? (
                    <div style={{ maxWidth: 320 }}>
                      <GolfCard t={section.golfTournament!} />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                      {section.games.filter(g => !hiddenGames.includes(g.id)).map(g => (
                        <GameCard key={g.id} g={g} />
                      ))}
                    </div>
                  )}
                  {/* Hidden game chips — click to re-enable */}
                  {(() => {
                    const hidden = section.games.filter(g => hiddenGames.includes(g.id));
                    if (!hidden.length) return null;
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {hidden.map(g => (
                          <button
                            key={g.id}
                            onClick={() => unhideGame(g.id)}
                            title="Show in Key Games"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: '#1A2440', border: '1px solid rgba(255,255,255,0.08)',
                              color: '#8392B5', borderRadius: 6, padding: '5px 9px',
                              fontSize: 10, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                            }}
                          >
                            <EyeOff size={11} />
                            {g.label ?? `${g.away.abbr} vs ${g.home.abbr}`}
                            <Eye size={11} style={{ marginLeft: 2, opacity: 0.6 }} />
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          );
        })}
      </div>

      {savedToast && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: '#FF5A4D', color: '#000', padding: '8px 18px', borderRadius: 999,
          fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', zIndex: 60,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>✓ ORDER SAVED</div>
      )}
    </div>
  );
}
