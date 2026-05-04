'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import type { GameData } from '@/components/dashboard/DashboardClient';
import type { GameSummary, ESPNPlay } from '@/lib/api/espn';

const MONO = 'var(--font-mono), ui-monospace, monospace';

// ── PlayRow ───────────────────────────────────────────────────────────────────

const PlayRow = memo(function PlayRow({ play, scoring }: { play: ESPNPlay; scoring: boolean }) {
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 6,
      background: scoring ? 'var(--ms-a12)' : 'var(--ms-surface2)',
      border: `1px solid ${scoring ? 'var(--ms-a30)' : 'var(--ms-border)'}`,
      marginBottom: 4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: scoring ? 'var(--ms-a)' : 'var(--ms-muted)', fontWeight: 700, letterSpacing: '0.12em' }}>
          {scoring ? '⚡ SCORING' : play.clock?.displayValue ?? ''}
          {play.period ? ` · Q${play.period.number}` : ''}
        </span>
        {play.awayScore !== undefined && play.homeScore !== undefined && (
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--ms-muted)' }}>
            {play.awayScore}–{play.homeScore}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--ms-ink)', lineHeight: 1.4 }}>{play.text}</div>
    </div>
  );
});

// ── FocusMode ─────────────────────────────────────────────────────────────────

export default function FocusMode({ liveMyGames, initialIdx, onClose }: {
  liveMyGames: GameData[];
  initialIdx: number;
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
      position: 'fixed', inset: 0, zIndex: 100, background: '#000', color: 'var(--ms-ink)',
      fontFamily: '"Inter", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
      animation: 'msFade 0.2s ease',
    }}>
      {/* Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '1px solid var(--ms-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ background: 'var(--ms-a)', color: '#000', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em' }}>
            ● FOCUS MODE
          </span>
          <span style={{ fontSize: 11, color: 'var(--ms-muted)', letterSpacing: '0.14em', fontWeight: 600 }}>
            {game.league}{game.venue ? ` · ${game.venue}` : ''}{game.broadcast ? ` · ${game.broadcast}` : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {liveMyGames.length > 1 && (
            <>
              <button onClick={() => setIdx(i => (i - 1 + liveMyGames.length) % liveMyGames.length)} style={{
                background: 'transparent', border: '1px solid var(--ms-border)', color: 'var(--ms-ink)',
                padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}>‹ PREV</button>
              <span style={{ fontSize: 10, color: 'var(--ms-muted)', fontFamily: MONO }}>{idx + 1}/{liveMyGames.length}</span>
              <button onClick={() => setIdx(i => (i + 1) % liveMyGames.length)} style={{
                background: 'transparent', border: '1px solid var(--ms-border)', color: 'var(--ms-ink)',
                padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}>NEXT ›</button>
            </>
          )}
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--ms-border)', color: 'var(--ms-ink)',
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
            <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ms-muted)', fontWeight: 700 }}>{game.away.mine ? 'YOUR TEAM' : 'AWAY'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ms-ink)', marginTop: 4 }}>{game.away.name}</div>
            {game.away.record && <div style={{ fontSize: 11, color: 'var(--ms-muted)', fontFamily: MONO, marginTop: 2 }}>{game.away.record}</div>}
            <div style={{
              fontSize: 96, fontWeight: 900, lineHeight: 0.9, marginTop: 12,
              color: game.away.winning ? 'var(--ms-b)' : 'var(--ms-muted)', fontFamily: MONO, letterSpacing: '-0.04em',
              textShadow: game.away.winning ? '0 0 60px var(--ms-a40)' : 'none',
            }}>{game.away.score ?? '–'}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--ms-muted)', letterSpacing: '0.2em', fontWeight: 700 }}>{game.detail}</div>
            <div style={{ fontSize: 36, fontWeight: 100, color: 'var(--ms-muted)', lineHeight: 1, margin: '8px 0', fontFamily: MONO }}>—</div>
            <div style={{ fontSize: 10, color: 'var(--ms-muted)', letterSpacing: '0.18em' }}>
              {game.state === 'post' ? 'FINAL' : game.state === 'pre' ? 'UPCOMING' : 'LIVE'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.18em', color: 'var(--ms-muted)', fontWeight: 700 }}>{game.home.mine ? 'YOUR TEAM' : 'HOME'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ms-ink)', marginTop: 4 }}>{game.home.name}</div>
            {game.home.record && <div style={{ fontSize: 11, color: 'var(--ms-muted)', fontFamily: MONO, marginTop: 2 }}>{game.home.record}</div>}
            <div style={{
              fontSize: 96, fontWeight: 900, lineHeight: 0.9, marginTop: 12,
              color: game.home.winning ? 'var(--ms-b)' : 'var(--ms-muted)', fontFamily: MONO, letterSpacing: '-0.04em',
            }}>{game.home.score ?? '–'}</div>
          </div>
        </div>
      </div>

      {/* Plays panel */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 40px 32px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {loading && !summary && (
          <div style={{ textAlign: 'center', color: 'var(--ms-muted)', padding: 20, fontSize: 12 }}>Loading plays…</div>
        )}

        {summary && !isGolf && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--ms-a)', marginBottom: 10 }}>
                {isSoccer ? 'GOALS' : 'SCORING PLAYS'}
              </div>
              {summary.scoringPlays.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--ms-muted)', padding: '12px 0' }}>No scoring plays yet.</div>
              ) : (
                summary.scoringPlays.map((p, i) => <PlayRow key={i} play={p} scoring />)
              )}
            </div>

            {!isSoccer && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--ms-muted)', marginBottom: 10 }}>
                  LAST 5 PLAYS
                </div>
                {summary.recentPlays.length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--ms-muted)', padding: '12px 0' }}>No plays yet.</div>
                ) : (
                  summary.recentPlays.map((p, i) => <PlayRow key={i} play={p} scoring={false} />)
                )}
              </div>
            )}
          </div>
        )}

        {summary && isGolf && summary.golfLeaderboard && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: 'var(--ms-b)', marginBottom: 12 }}>LEADERBOARD</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {summary.golfLeaderboard.map((c, i) => {
                const scoreStat = c.statistics?.find(s => s.name === 'scoreToPar' || s.name === 'score');
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px',
                    background: i === 0 ? 'var(--ms-b15)' : 'var(--ms-surface2)', borderRadius: 6,
                    border: `1px solid ${i === 0 ? 'var(--ms-b30)' : 'var(--ms-border)'}`,
                  }}>
                    <span style={{ fontFamily: MONO, fontSize: 13, color: 'var(--ms-muted)', width: 24, textAlign: 'right' }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? 'var(--ms-b)' : 'var(--ms-ink)', flex: 1 }}>
                      {c.displayName}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: i === 0 ? 'var(--ms-b)' : 'var(--ms-ink)' }}>
                      {scoreStat?.displayValue ?? c.score ?? '–'}
                    </span>
                    {c.status?.displayValue && (
                      <span style={{ fontSize: 10, color: 'var(--ms-muted)', letterSpacing: '0.1em' }}>
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
