// Variation 2 — Modular Command Grid (Bento)
// Drag-and-drop grid with resizable widgets. Sportsbook energy: high contrast,
// neon green primary, electric blue accent, dense data tiles.

const V2 = (() => {
  const D = window.MS_DATA;
  const BG = '#06070A';
  const PANEL = '#0E1116';
  const PANEL_2 = '#151922';
  const BORDER = 'rgba(255,255,255,0.08)';
  const BORDER_HOT = 'rgba(0,255,136,0.5)';
  const INK = '#F4F6F8';
  const MUTED = '#7B8794';
  const PRIMARY = '#00FF88'; // neon green
  const ACCENT = '#3B82F6';  // electric blue
  const HOT = '#FF3366';

  // --- Tiles -------------------------------------------------------------

  const TileShell = ({ title, action, children, accent, dense }) => (
    <div style={{
      background: PANEL, border: `1px solid ${accent ? BORDER_HOT : BORDER}`,
      borderRadius: 10, height: '100%', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: accent ? `0 0 0 1px ${BORDER_HOT}, 0 0 24px rgba(0,255,136,0.08)` : 'none',
    }}>
      <div style={{
        padding: dense ? '8px 12px' : '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${BORDER}`, gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className="ms-grip" style={{ cursor: 'grab', color: MUTED, fontSize: 14, lineHeight: 1 }}>⋮⋮</span>
          <span style={{ fontSize: 10, letterSpacing: '0.16em', color: accent ? PRIMARY : MUTED, fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        </div>
        {action && <span style={{ fontSize: 10, color: MUTED, letterSpacing: '0.1em' }}>{action}</span>}
      </div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{children}</div>
    </div>
  );

  // Live game tile — large
  const LiveTile = ({ g }) => {
    const mine = g.away.mine ? g.away : g.home;
    const opp = g.away.mine ? g.home : g.away;
    return (
      <TileShell title={`● LIVE · ${g.league}`} action={g.detail} accent>
        <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <TeamBlock t={g.away} />
            <span style={{ fontFamily: '"JetBrains Mono", monospace', color: MUTED, fontSize: 12 }}>VS</span>
            <TeamBlock t={g.home} />
          </div>
          {g.lastPlay && (
            <div style={{ background: PANEL_2, padding: '10px 12px', borderRadius: 6, borderLeft: `3px solid ${PRIMARY}` }}>
              <div style={{ fontSize: 9, color: PRIMARY, letterSpacing: '0.16em', fontWeight: 700, marginBottom: 3 }}>LAST PLAY</div>
              <div style={{ fontSize: 12, color: INK, lineHeight: 1.35 }}>{g.lastPlay}</div>
            </div>
          )}
          {g.count && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 'auto' }}>
              <Stat label="BALLS" value={g.count.balls} />
              <Stat label="STRIKES" value={g.count.strikes} />
              <Stat label="OUTS" value={g.count.outs} />
            </div>
          )}
        </div>
      </TileShell>
    );
  };

  const TeamBlock = ({ t }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <div style={{ width: 36, height: 36, background: t.color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: 11, border: t.mine ? `2px solid ${PRIMARY}` : 'none' }}>{t.abbr}</div>
      <div style={{ fontSize: 11, color: t.mine ? PRIMARY : INK, fontWeight: 600 }}>{t.name}</div>
      {t.score !== undefined && (
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 32, fontWeight: 800, color: t.winning ? PRIMARY : INK, lineHeight: 1 }}>{t.score}</div>
      )}
      <div style={{ fontSize: 9, color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>{t.record}</div>
    </div>
  );

  const Stat = ({ label, value }) => (
    <div style={{ background: PANEL_2, padding: '6px 8px', borderRadius: 4, textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: '0.1em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, color: INK, fontWeight: 700 }}>{value}</div>
    </div>
  );

  // Today list — compact
  const TodayTile = () => (
    <TileShell title="TODAY · 6 GAMES" action="ALL →">
      {D.games.map((g, i) => (
        <div key={g.id} style={{
          display: 'grid', gridTemplateColumns: '38px 1fr auto', gap: 10,
          alignItems: 'center', padding: '8px 12px',
          borderBottom: i < D.games.length - 1 ? `1px solid ${BORDER}` : 'none',
          background: g.state === 'in' ? 'rgba(0,255,136,0.04)' : 'transparent',
        }}>
          <span style={{
            fontSize: 9, letterSpacing: '0.12em', color: g.state === 'in' ? PRIMARY : MUTED,
            fontWeight: 700, fontFamily: '"JetBrains Mono", monospace',
          }}>{g.state === 'in' ? '● LIVE' : g.state === 'post' ? 'FINAL' : g.detail.split(' ')[0]}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
              <span style={{ color: g.away.mine ? PRIMARY : INK, fontWeight: g.away.mine ? 700 : 500 }}>{g.away.abbr}</span>
              <span style={{ color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>@</span>
              <span style={{ color: g.home.mine ? PRIMARY : INK, fontWeight: g.home.mine ? 700 : 500 }}>{g.home.abbr}</span>
            </div>
            <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{g.league} · {g.broadcast || g.venue}</div>
          </div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: INK, fontWeight: 700, textAlign: 'right' }}>
            {g.away.score !== undefined ? <span>{g.away.score}–{g.home.score}</span> : <span style={{ color: MUTED, fontWeight: 400 }}>{g.detail}</span>}
          </div>
        </div>
      ))}
    </TileShell>
  );

  // Player tile — big stat
  const PlayerTile = ({ p }) => (
    <TileShell title={`${p.position} · #${p.jersey} · ${p.team}`} action={p.trend === 'hot' ? '🔥 HOT' : 'COOL'}>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: INK, lineHeight: 1.1 }}>{p.name}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.note}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {p.stats.map((s, j) => (
            <div key={j} style={{ background: PANEL_2, padding: '6px 4px', borderRadius: 4, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: MUTED, letterSpacing: '0.1em' }}>{s.k}</div>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 700, color: INK }}>{s.v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 28, marginTop: 'auto' }}>
          {p.last5.map((h, j) => (
            <div key={j} style={{
              flex: 1, height: Math.max(4, h * 9),
              background: h >= 2 ? PRIMARY : h === 1 ? ACCENT : 'rgba(255,255,255,0.1)',
              borderRadius: 2,
            }}></div>
          ))}
          <span style={{ fontSize: 9, color: MUTED, fontFamily: '"JetBrains Mono", monospace', marginLeft: 4 }}>L5</span>
        </div>
      </div>
    </TileShell>
  );

  // Teams tile
  const TeamsTile = () => (
    <TileShell title="MY TEAMS · 3" action="MANAGE →">
      {D.teams.map((t, i) => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
          borderBottom: i < D.teams.length - 1 ? `1px solid ${BORDER}` : 'none',
        }}>
          <div style={{ width: 36, height: 36, background: t.color, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, fontFamily: '"JetBrains Mono", monospace', borderTop: `3px solid ${t.accent}` }}>{t.abbr}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: INK }}>{t.name}</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{t.league} · {t.rank}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: INK, fontWeight: 700 }}>{t.record}</div>
            <div style={{ fontSize: 10, color: t.streak.startsWith('W') ? PRIMARY : HOT, fontFamily: '"JetBrains Mono", monospace' }}>{t.streak}</div>
          </div>
        </div>
      ))}
    </TileShell>
  );

  // Headlines
  const HeadlinesTile = () => (
    <TileShell title="HEADLINES" action="ALL →">
      {D.headlines.slice(0, 5).map((h, i) => (
        <div key={h.id} style={{
          padding: '10px 12px', borderBottom: i < 4 ? `1px solid ${BORDER}` : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
              color: h.hot ? HOT : ACCENT,
            }}>{h.kicker}</span>
            <span style={{ fontSize: 9, color: MUTED }}>· {h.league} · {h.time}</span>
          </div>
          <div style={{ fontSize: 12, color: INK, lineHeight: 1.3, fontWeight: 600 }}>{h.headline}</div>
        </div>
      ))}
    </TileShell>
  );

  // Standings
  const StandingsTile = () => {
    const [active, setActive] = React.useState('AL West');
    const divs = Object.keys(D.standings);
    return (
      <TileShell title="STANDINGS">
        <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
          {divs.map((d) => (
            <button key={d} onClick={() => setActive(d)} style={{
              flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '8px 6px', fontSize: 9, letterSpacing: '0.12em', fontWeight: 700,
              color: active === d ? PRIMARY : MUTED,
              borderBottom: active === d ? `2px solid ${PRIMARY}` : '2px solid transparent',
              fontFamily: 'inherit',
            }}>{d.toUpperCase()}</button>
          ))}
        </div>
        <div style={{ padding: '4px 0' }}>
          {D.standings[active].map((r, i) => (
            <div key={r.abbr} style={{
              display: 'grid', gridTemplateColumns: '20px 1fr 30px 30px 36px',
              gap: 4, alignItems: 'center', padding: '5px 12px',
              background: r.mine ? 'rgba(0,255,136,0.06)' : 'transparent',
            }}>
              <span style={{ fontSize: 10, color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>{i + 1}</span>
              <span style={{ fontSize: 11, color: r.mine ? PRIMARY : INK, fontWeight: r.mine ? 700 : 500 }}>{r.team}</span>
              <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: INK, textAlign: 'right' }}>{r.w}</span>
              <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: MUTED, textAlign: 'right' }}>{r.l}</span>
              <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: MUTED, textAlign: 'right' }}>{r.gb || r.pts}</span>
            </div>
          ))}
        </div>
      </TileShell>
    );
  };

  // Schedule
  const ScheduleTile = () => (
    <TileShell title="NEXT 7 DAYS">
      {D.schedule.map((s, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '52px 24px 1fr auto', gap: 10,
          alignItems: 'center', padding: '8px 12px',
          borderBottom: i < D.schedule.length - 1 ? `1px solid ${BORDER}` : 'none',
          background: s.today ? 'rgba(0,255,136,0.06)' : 'transparent',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: s.today ? PRIMARY : INK, letterSpacing: '0.1em' }}>{s.day}</div>
            <div style={{ fontSize: 9, color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>{s.date}</div>
          </div>
          <div style={{ width: 20, height: 20, background: s.team === 'NYM' ? '#002D72' : s.league === 'MLS' ? '#5D9741' : '#0C2C56', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>{s.team}</div>
          <div style={{ fontSize: 11, color: INK }}>{s.vs}</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: INK, fontFamily: '"JetBrains Mono", monospace' }}>{s.time}</div>
            <div style={{ fontSize: 9, color: MUTED }}>{s.tv}</div>
          </div>
        </div>
      ))}
    </TileShell>
  );

  // ---------------- Drag-and-drop grid -----------------------------------
  // 12-col grid. Each widget has {x,y,w,h}. Dragging the title row moves it.
  // Resizing: drag the SE corner.

  const DEFAULT_LAYOUT = [
    { id: 'live1',    x: 0, y: 0, w: 5, h: 4, kind: 'live', game: 'g1' },
    { id: 'live2',    x: 5, y: 0, w: 4, h: 4, kind: 'live', game: 'g2' },
    { id: 'today',    x: 9, y: 0, w: 3, h: 8, kind: 'today' },
    { id: 'p1',       x: 0, y: 4, w: 3, h: 4, kind: 'player', player: 'p1' },
    { id: 'p2',       x: 3, y: 4, w: 3, h: 4, kind: 'player', player: 'p2' },
    { id: 'p3',       x: 6, y: 4, w: 3, h: 4, kind: 'player', player: 'p3' },
    { id: 'teams',    x: 0, y: 8, w: 4, h: 4, kind: 'teams' },
    { id: 'standing', x: 4, y: 8, w: 4, h: 4, kind: 'standings' },
    { id: 'sched',    x: 8, y: 8, w: 4, h: 4, kind: 'schedule' },
    { id: 'news',     x: 0, y: 12, w: 12, h: 4, kind: 'headlines' },
  ];

  const COL = 12;
  const ROW_H = 70;
  const GAP = 10;

  const renderWidget = (w) => {
    if (w.kind === 'live') {
      const g = D.games.find((x) => x.id === w.game);
      return g ? <LiveTile g={g} /> : null;
    }
    if (w.kind === 'today') return <TodayTile />;
    if (w.kind === 'player') {
      const p = D.players.find((x) => x.id === w.player);
      return p ? <PlayerTile p={p} /> : null;
    }
    if (w.kind === 'teams') return <TeamsTile />;
    if (w.kind === 'standings') return <StandingsTile />;
    if (w.kind === 'schedule') return <ScheduleTile />;
    if (w.kind === 'headlines') return <HeadlinesTile />;
    return null;
  };

  return function V2Component() {
    const [items, setItems] = React.useState(DEFAULT_LAYOUT);
    const [drag, setDrag] = React.useState(null); // {id, mode:'move'|'resize', dx, dy}
    const [hoverGhost, setHoverGhost] = React.useState(null);
    const containerRef = React.useRef(null);
    const cellW = (1280 - 32 - GAP * (COL - 1)) / COL;

    const onPointerDown = (e, id, mode) => {
      const rect = containerRef.current.getBoundingClientRect();
      const item = items.find((i) => i.id === id);
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setDrag({ id, mode, startX: px, startY: py, orig: { ...item } });
      e.preventDefault();
    };

    React.useEffect(() => {
      if (!drag) return;
      const onMove = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const dx = Math.round((px - drag.startX) / (cellW + GAP));
        const dy = Math.round((py - drag.startY) / (ROW_H + GAP));
        if (drag.mode === 'move') {
          setHoverGhost({
            id: drag.id,
            x: Math.max(0, Math.min(COL - drag.orig.w, drag.orig.x + dx)),
            y: Math.max(0, drag.orig.y + dy),
            w: drag.orig.w, h: drag.orig.h,
          });
        } else {
          setHoverGhost({
            id: drag.id,
            x: drag.orig.x, y: drag.orig.y,
            w: Math.max(2, Math.min(COL - drag.orig.x, drag.orig.w + dx)),
            h: Math.max(2, drag.orig.h + dy),
          });
        }
      };
      const onUp = () => {
        if (hoverGhost) {
          setItems((prev) => prev.map((i) => i.id === hoverGhost.id
            ? { ...i, x: hoverGhost.x, y: hoverGhost.y, w: hoverGhost.w, h: hoverGhost.h }
            : i));
        }
        setDrag(null);
        setHoverGhost(null);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      return () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
    }, [drag, hoverGhost, cellW]);

    const layoutFor = (it) => {
      const ghost = hoverGhost && hoverGhost.id === it.id ? hoverGhost : it;
      return {
        position: 'absolute',
        left: ghost.x * (cellW + GAP),
        top: ghost.y * (ROW_H + GAP),
        width: ghost.w * cellW + (ghost.w - 1) * GAP,
        height: ghost.h * ROW_H + (ghost.h - 1) * GAP,
        transition: drag && drag.id === it.id ? 'none' : 'all 0.18s cubic-bezier(.2,.7,.3,1)',
      };
    };

    const maxY = Math.max(...items.map((i) => i.y + i.h));

    const reset = () => setItems(DEFAULT_LAYOUT);

    return (
      <div style={{
        width: 1280, minHeight: 900, background: BG, color: INK,
        fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
        padding: 0,
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: `1px solid ${BORDER}`, gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 30, height: 30, background: PRIMARY, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: BG, fontWeight: 900, fontSize: 16, fontFamily: '"JetBrains Mono", monospace',
            }}>M</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>MySports <span style={{ color: PRIMARY }}>· Command</span></div>
              <div style={{ fontSize: 10, color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>TUE · AUG 5 · 2026 · 14:32 PT</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={reset} style={{
              background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED,
              padding: '6px 12px', fontSize: 10, letterSpacing: '0.14em', fontWeight: 700,
              borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>RESET LAYOUT</button>
            <button style={{
              background: PRIMARY, border: 'none', color: BG,
              padding: '6px 14px', fontSize: 10, letterSpacing: '0.14em', fontWeight: 800,
              borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>SAVE LAYOUT ↓</button>
          </div>
        </div>

        {/* Sub bar — drag hint */}
        <div style={{ padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: MUTED, letterSpacing: '0.1em', borderBottom: `1px solid ${BORDER}` }}>
          <span>DRAG <span style={{ color: PRIMARY }}>⋮⋮</span> TO REARRANGE · DRAG <span style={{ color: PRIMARY }}>↘</span> TO RESIZE · {items.length} WIDGETS</span>
          <span>LAYOUT: <span style={{ color: INK }}>CUSTOM</span></span>
        </div>

        {/* Grid */}
        <div ref={containerRef} style={{
          position: 'relative',
          margin: '16px',
          height: maxY * (ROW_H + GAP) + 20,
        }}>
          {/* ghost rectangle */}
          {hoverGhost && (
            <div style={{
              position: 'absolute',
              left: hoverGhost.x * (cellW + GAP),
              top: hoverGhost.y * (ROW_H + GAP),
              width: hoverGhost.w * cellW + (hoverGhost.w - 1) * GAP,
              height: hoverGhost.h * ROW_H + (hoverGhost.h - 1) * GAP,
              border: `1px dashed ${PRIMARY}`,
              borderRadius: 10,
              background: 'rgba(0,255,136,0.05)',
              pointerEvents: 'none',
            }}></div>
          )}
          {items.map((it) => (
            <div key={it.id} style={layoutFor(it)}>
              <div
                onPointerDown={(e) => {
                  if (e.target.classList.contains('ms-resize')) return;
                  if (e.target.closest('button')) return;
                  if (e.target.closest('.ms-grip') || e.target.closest('[data-titlebar]')) {
                    onPointerDown(e, it.id, 'move');
                  }
                }}
                style={{ height: '100%', position: 'relative' }}
              >
                <div data-titlebar style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}></div>
                {renderWidget(it)}
                {/* Resize handle */}
                <div
                  className="ms-resize"
                  onPointerDown={(e) => onPointerDown(e, it.id, 'resize')}
                  style={{
                    position: 'absolute', right: 4, bottom: 4, width: 14, height: 14,
                    cursor: 'nwse-resize', display: 'flex', alignItems: 'flex-end',
                    justifyContent: 'flex-end', color: MUTED, fontSize: 10, lineHeight: 1,
                    opacity: 0.6,
                  }}
                >↘</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
})();

window.V2 = V2;
