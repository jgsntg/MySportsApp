'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { timeAgo } from '@/lib/utils';
import type { FavoritePlayer, ESPNNewsArticle } from '@/types';
import type { StatCategory, EventLogGame } from '@/lib/api/espn';

const MONO = 'var(--font-mono), ui-monospace, monospace';
const T = {
  bg: '#0B1020', surface: '#121A30', surface2: '#1A2440',
  ink: '#F0F4FF', muted: '#8392B5', border: 'rgba(255,255,255,0.07)',
};
const A = { a: '#FF5A4D', b: '#FFD166' };

interface PlayerDetail {
  stats: StatCategory[];
  recentGames: EventLogGame[];
  news: ESPNNewsArticle[];
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 48 }}>
      <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 800, color: A.a, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: T.muted, letterSpacing: '0.12em', marginTop: 3 }}>{label.toUpperCase()}</div>
    </div>
  );
}

function PlayerPanel({ player }: { player: FavoritePlayer }) {
  const { data, isLoading } = useQuery<PlayerDetail>({
    queryKey: ['playerDetail', player.sport, player.league, player.playerId],
    queryFn: async () => {
      const res = await fetch(
        `/api/sports/playerstats?sport=${player.sport}&league=${player.league}&id=${player.playerId}`
      );
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Season Stats */}
      <section>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: T.muted, marginBottom: 14 }}>
          SEASON STATS
        </div>
        {isLoading ? (
          <div style={{ display: 'flex', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ width: 64, height: 44, background: T.surface2, borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : !data?.stats?.length ? (
          <div style={{ fontSize: 12, color: T.muted, padding: '16px 0' }}>No season stats available.</div>
        ) : (
          data.stats.map(cat => (
            <div key={cat.name} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 9, color: A.b, letterSpacing: '0.16em', fontWeight: 700, marginBottom: 10 }}>
                {cat.displayName.toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {cat.stats.map(s => (
                  <StatBadge key={s.name} label={s.displayName} value={s.displayValue} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Last 5 Games */}
      <section>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: T.muted, marginBottom: 14 }}>
          LAST 5 GAMES
        </div>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 48, background: T.surface2, borderRadius: 6 }} />
            ))}
          </div>
        ) : !data?.recentGames?.length ? (
          <div style={{ fontSize: 12, color: T.muted, padding: '16px 0' }}>No recent game data available.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.recentGames.map((game, i) => (
              <div key={game.id} style={{
                background: i === 0 ? T.surface2 : 'transparent',
                border: `1px solid ${i === 0 ? 'rgba(255,209,102,0.2)' : T.border}`,
                borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? A.b : T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {game.eventName}
                  </div>
                  {game.date && (
                    <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>
                      {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                  {game.stats.slice(0, 4).map(s => (
                    <div key={s.name} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: i === 0 ? A.b : T.ink }}>{s.displayValue}</div>
                      <div style={{ fontSize: 8, color: T.muted, letterSpacing: '0.1em' }}>{s.displayName.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent News */}
      <section>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: T.muted, marginBottom: 14 }}>
          RECENT NEWS
        </div>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[1,2].map(i => (
              <div key={i} style={{ height: 60, background: T.surface2, borderRadius: 6 }} />
            ))}
          </div>
        ) : !data?.news?.length ? (
          <div style={{ fontSize: 12, color: T.muted, padding: '16px 0' }}>No recent news available.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(data.news as ESPNNewsArticle[]).map((article, i) => {
              const url = article.links?.web?.href;
              const inner = (
                <div style={{
                  background: T.surface2, border: `1px solid ${T.border}`,
                  borderRadius: 8, padding: '12px 14px',
                  transition: 'border-color .12s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: A.a, letterSpacing: '0.14em' }}>
                      {article.categories?.find(c => c.type === 'league')?.description?.toUpperCase() ?? 'NEWS'}
                    </span>
                    {article.published && (
                      <span style={{ fontSize: 9, color: T.muted }}>· {timeAgo(article.published)}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, lineHeight: 1.4 }}>
                    {article.headline}
                  </div>
                </div>
              );
              return url ? (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}
                  onMouseEnter={e => ((e.currentTarget.firstChild as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)')}
                  onMouseLeave={e => ((e.currentTarget.firstChild as HTMLElement).style.borderColor = T.border)}
                >
                  {inner}
                </a>
              ) : <div key={i}>{inner}</div>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function PlayersClient({ players }: { players: FavoritePlayer[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    players.length > 0 ? players[0].id : null
  );

  const selected = players.find(p => p.id === selectedId) ?? null;

  if (!players.length) {
    return (
      <div style={{ background: T.bg, color: T.ink, minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif', padding: '24px 0 48px' }}>
        <h1 style={{ margin: '0 0 32px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>
          My Players
        </h1>
        <div style={{
          padding: 60, textAlign: 'center', color: T.muted,
          border: `1px dashed ${T.border}`, borderRadius: 12,
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.ink, marginBottom: 8 }}>No favorite players yet.</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Visit a team roster and star players to follow them here.</div>
          <Link href="/teams" style={{
            display: 'inline-block', background: A.a, color: '#000',
            padding: '8px 20px', borderRadius: 8,
            fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', textDecoration: 'none',
          }}>
            BROWSE TEAMS →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, color: T.ink, minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif', padding: '24px 0 48px' }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: T.ink }}>
        My Players
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Player list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'sticky', top: 84 }}>
          {players.map(p => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 8, border: `1px solid ${active ? A.a : T.border}`,
                  background: active ? `rgba(255,90,77,0.08)` : T.surface,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all .12s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = T.border; }}
              >
                {p.playerPhoto ? (
                  <div style={{ width: 36, height: 36, borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={p.playerPhoto} alt={p.playerName} width={36} height={36} style={{ objectFit: 'cover' }} unoptimized />
                  </div>
                ) : (
                  <div style={{
                    width: 36, height: 36, borderRadius: 999, background: T.surface2, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: active ? A.a : T.muted,
                  }}>
                    {p.playerName.charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.ink : T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.playerName}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                    {p.position ?? '–'} · {p.league.toUpperCase()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            {/* Player header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
              {selected.playerPhoto ? (
                <div style={{ width: 64, height: 64, borderRadius: 999, overflow: 'hidden', flexShrink: 0 }}>
                  <Image src={selected.playerPhoto} alt={selected.playerName} width={64} height={64} style={{ objectFit: 'cover' }} unoptimized />
                </div>
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: 999, background: T.surface2, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 700, color: T.muted,
                }}>
                  {selected.playerName.charAt(0)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{selected.playerName}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
                  {selected.position ?? '–'} · {selected.teamName ?? '–'} · {selected.league.toUpperCase()}
                </div>
              </div>
              <Link
                href={`/player/${selected.sport}/${selected.league}/${selected.playerId}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: T.surface2, border: `1px solid ${T.border}`,
                  color: T.muted, padding: '7px 14px', borderRadius: 8,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                  textDecoration: 'none', flexShrink: 0,
                  transition: 'color .12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = T.ink)}
                onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
              >
                PROFILE ↗
              </Link>
            </div>

            <PlayerPanel player={selected} />
          </div>
        )}
      </div>
    </div>
  );
}
