// Variation 3 — Focus Ticker
// Persistent live ticker pinned to top. Reorderable vertical sections (drag handle).
// Single-column scroll with optional "Focus Mode" that elevates the live game.
// Aesthetic: deep navy, electric coral accent, varsity vibes.

const V3 = (() => {
  const D = window.MS_DATA;
  const BG = '#0B1020';
  const SURFACE = '#121A30';
  const SURFACE_2 = '#1A2440';
  const BORDER = 'rgba(255,255,255,0.07)';
  const INK = '#F0F4FF';
  const MUTED = '#8392B5';
  const ACCENT = '#FF5A4D'; // coral
  const ACCENT_2 = '#FFD166'; // mustard

  // Persistent live ticker
  const Ticker = () => (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      background: '#000', borderBottom: `1px solid ${BORDER}`,
      position: 'sticky', top: 0, zIndex: 5,
      overflow: 'hidden',
    }}>
      <div style={{
        background: ACCENT, color: '#000', padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#000', animation: 'msPulse 1.4s infinite' }}></span>
        LIVE TICKER
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 0, animation: 'msTicker 60s linear infinite', whiteSpace: 'nowrap' }}>
          {[...D.games, ...D.games].map((g, i) => {
            const live = g.state === 'in';
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 22px', borderRight: `1px solid ${BORDER}`,
                fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
              }}>
                <span style={{ fontSize: 9, color: MUTED, letterSpacing: '0.12em', fontWeight: 700 }}>{g.league}</span>
                <span style={{ color: g.away.mine ? ACCENT_2 : INK, fontWeight: g.away.mine ? 700 : 500 }}>{g.away.abbr}</span>
                <span style={{ color: INK, fontWeight: 700 }}>{g.away.score ?? '–'}</span>
                <span style={{ color: MUTED }}>·</span>
                <span style={{ color: INK, fontWeight: 700 }}>{g.home.score ?? '–'}</span>
                <span style={{ color: g.home.mine ? ACCENT_2 : INK, fontWeight: g.home.mine ? 700 : 500 }}>{g.home.abbr}</span>
                <span style={{
                  color: live ? ACCENT : MUTED, fontSize: 10,
                  marginLeft: 4, fontWeight: live ? 700 : 500,
                }}>{live && '● '}{g.detail}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Live banner (subtle, above dashboard, not loud)
  const LiveBanner = () => {
    const live = D.games.filter((g) => g.state === 'in' && (g.away.mine || g.home.mine));
    if (!live.length) return null;
    return (
      <div style={{
        margin: '20px 24px 0', padding: '14px 18px',
        background: SURFACE,
        border: `1px solid ${BORDER}`, borderLeft: `3px solid ${ACCENT}`,
        borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.18em',
          color: ACCENT, padding: '4px 8px', background: 'rgba(255,90,77,0.12)', borderRadius: 4,
        }}>● YOUR TEAMS PLAYING</span>
        <div style={{ display: 'flex', gap: 22, flex: 1 }}>
          {live.map((g, i) => {
            const me = g.away.mine ? g.away : g.home;
            const opp = g.away.mine ? g.home : g.away;
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: MUTED, letterSpacing: '0.1em' }}>{g.league}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: ACCENT_2 }}>{me.name}</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, fontWeight: 800, color: me.winning ? ACCENT_2 : INK }}>{me.score}</span>
                <span style={{ color: MUTED, fontSize: 12 }}>vs</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, fontWeight: 800, color: opp.winning ? ACCENT_2 : INK }}>{opp.score}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: INK }}>{opp.name}</span>
                <span style={{ fontSize: 11, color: ACCENT, fontFamily: '"JetBrains Mono", monospace', marginLeft: 4 }}>{g.detail}</span>
              </div>
            );
          })}
        </div>
        <button style={{
          background: ACCENT, color: '#000', border: 'none',
          padding: '6px 12px', borderRadius: 6, fontSize: 10, fontWeight: 800,
          letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'inherit',
        }}>WATCH ↗</button>
      </div>
    );
  };

  const SectionHead = ({ title, count, action, drag }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 14px' }}>
      <span {...drag} style={{ cursor: 'grab', color: MUTED, fontSize: 16, padding: '4px 6px', borderRadius: 4 }} onMouseEnter={(e) => e.currentTarget.style.color = INK} onMouseLeave={(e) => e.currentTarget.style.color = MUTED}>⋮⋮</span>
      <span style={{
        fontSize: 11, fontWeight: 800, letterSpacing: '0.22em',
        color: INK, textTransform: 'uppercase',
      }}>{title}</span>
      {count != null && (
        <span style={{ fontSize: 10, color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>· {count}</span>
      )}
      <div style={{ flex: 1, height: 1, background: BORDER, marginLeft: 8 }}></div>
      {action && (
        <span style={{ fontSize: 10, color: ACCENT_2, letterSpacing: '0.14em', fontWeight: 700, cursor: 'pointer' }}>{action}</span>
      )}
    </div>
  );

  // Today/Live games combined
  const SectionGames = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {D.games.map((g) => {
        const live = g.state === 'in';
        const post = g.state === 'post';
        return (
          <div key={g.id} style={{
            background: SURFACE, borderRadius: 8,
            border: `1px solid ${BORDER}`,
            padding: 14, position: 'relative', overflow: 'hidden',
            ...(live && { borderColor: 'rgba(255,90,77,0.4)' }),
          }}>
            {live && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: ACCENT }}></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: MUTED }}>{g.league}</span>
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
                color: live ? ACCENT : post ? MUTED : INK,
                fontFamily: '"JetBrains Mono", monospace',
              }}>{live ? `● ${g.detail}` : post ? 'FINAL' : g.detail}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[g.away, g.home].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 26, height: 26, background: t.color, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', fontFamily: '"JetBrains Mono", monospace' }}>{t.abbr.slice(0, 3)}</div>
                  <span style={{ fontSize: 13, color: t.mine ? ACCENT_2 : INK, fontWeight: t.mine ? 700 : 500 }}>{t.name}</span>
                  {t.score !== undefined && (
                    <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 18, fontWeight: t.winning ? 800 : 500, color: t.winning ? INK : MUTED }}>{t.score}</span>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: MUTED }}>
              <span>{g.venue}</span>
              <span>{g.broadcast}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Teams logo grid (true to ask: "logos grid")
  const SectionTeams = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {D.teams.map((t) => (
        <div key={t.id} style={{
          background: `linear-gradient(135deg, ${t.color} 0%, ${t.color} 60%, ${SURFACE} 100%)`,
          borderRadius: 8, padding: 18, position: 'relative', overflow: 'hidden',
          border: `1px solid ${BORDER}`,
        }}>
          <div style={{ position: 'absolute', top: -10, right: -10, width: 90, height: 90, background: t.accent, opacity: 0.18, borderRadius: '50%' }}></div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', border: `2px solid ${t.accent}`, color: '#fff', fontSize: 24, fontWeight: 800 }}>{t.logo}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.16em', fontWeight: 700 }}>{t.league}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginTop: 2 }}>{t.name}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}>
                <span style={{ color: '#fff' }}>{t.record}</span>
                <span style={{ color: t.streak.startsWith('W') ? '#7FFFA8' : '#FF8E8E', fontWeight: 700 }}>{t.streak}</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{t.rank}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Players
  const SectionPlayers = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {D.players.map((p) => (
        <div key={p.id} style={{
          background: SURFACE, borderRadius: 8, padding: 16,
          border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, background: p.color, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: 14 }}>#{p.jersey}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.1 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{p.position} · {p.team} · {p.league}</div>
              </div>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
              padding: '4px 7px', borderRadius: 999,
              background: p.trend === 'hot' ? ACCENT : 'rgba(255,255,255,0.06)',
              color: p.trend === 'hot' ? '#000' : MUTED,
            }}>{p.trend === 'hot' ? '🔥 HOT' : 'COOL'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {p.stats.map((s, j) => (
              <div key={j} style={{ background: SURFACE_2, padding: '8px 4px', borderRadius: 4, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: MUTED, letterSpacing: '0.1em', fontWeight: 600 }}>{s.k}</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 700, color: INK, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: MUTED }}>
            <span style={{ letterSpacing: '0.14em', fontWeight: 700 }}>L5</span>
            <div style={{ display: 'flex', gap: 3, flex: 1, height: 22, alignItems: 'flex-end' }}>
              {p.last5.map((h, j) => (
                <div key={j} style={{ flex: 1, height: Math.max(4, h * 8), background: h >= 2 ? ACCENT_2 : h === 1 ? 'rgba(255,209,102,0.4)' : 'rgba(255,255,255,0.08)', borderRadius: 2 }}></div>
              ))}
            </div>
            <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{p.last5.reduce((a, b) => a + b, 0)} H</span>
          </div>
          <div style={{ fontSize: 11, color: ACCENT_2, fontStyle: 'italic' }}>{p.note}</div>
        </div>
      ))}
    </div>
  );

  const SectionHeadlines = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
      {/* Lead */}
      {(() => {
        const h = D.headlines[0];
        return (
          <div style={{ background: SURFACE, borderRadius: 8, padding: 18, border: `1px solid ${BORDER}`, gridRow: 'span 2', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              height: 140, borderRadius: 6,
              background: `linear-gradient(135deg, #0C2C56, #005C5C)`,
              backgroundSize: 'cover', position: 'relative',
              border: `1px dashed rgba(255,255,255,0.14)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.4)', fontFamily: '"JetBrains Mono", monospace', fontSize: 11,
            }}>[ HERO IMAGE ]</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: ACCENT, letterSpacing: '0.18em' }}>{h.kicker}</span>
              {h.hot && <span style={{ width: 5, height: 5, borderRadius: 999, background: ACCENT, animation: 'msPulse 1.4s infinite' }}></span>}
              <span style={{ fontSize: 10, color: MUTED }}>· {h.league} · {h.time} · {h.source}</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: INK, lineHeight: 1.2, margin: 0, letterSpacing: '-0.01em' }}>{h.headline}</h3>
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, margin: 0 }}>{h.blurb}</p>
          </div>
        );
      })()}
      {D.headlines.slice(1, 5).map((h) => (
        <div key={h.id} style={{ background: SURFACE, borderRadius: 8, padding: 14, border: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: ACCENT, letterSpacing: '0.16em' }}>{h.kicker}</span>
            <span style={{ fontSize: 9, color: MUTED }}>· {h.time}</span>
          </div>
          <div style={{ fontSize: 13, color: INK, lineHeight: 1.3, fontWeight: 600 }}>{h.headline}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 6 }}>{h.league} · {h.source}</div>
        </div>
      ))}
    </div>
  );

  const SectionStandings = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {Object.entries(D.standings).map(([div, rows]) => (
        <div key={div} style={{ background: SURFACE, borderRadius: 8, padding: 14, border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: ACCENT_2, marginBottom: 10 }}>{div}</div>
          {rows.slice(0, 5).map((r, i) => (
            <div key={r.abbr} style={{
              display: 'grid', gridTemplateColumns: '18px 1fr 30px 28px 32px',
              gap: 6, alignItems: 'center', padding: '6px 4px',
              borderTop: i > 0 ? `1px solid ${BORDER}` : 'none',
              background: r.mine ? 'rgba(255,209,102,0.06)' : 'transparent',
            }}>
              <span style={{ fontSize: 10, color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>{i + 1}</span>
              <span style={{ fontSize: 12, color: r.mine ? ACCENT_2 : INK, fontWeight: r.mine ? 700 : 500 }}>{r.team}</span>
              <span style={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: INK, textAlign: 'right', fontWeight: 600 }}>{r.w}</span>
              <span style={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: MUTED, textAlign: 'right' }}>{r.l}</span>
              <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: MUTED, textAlign: 'right' }}>{r.gb || `${r.pts}p`}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const SectionSchedule = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
      {D.schedule.map((s, i) => (
        <div key={i} style={{
          background: s.today ? 'rgba(255,90,77,0.1)' : SURFACE,
          border: `1px solid ${s.today ? ACCENT : BORDER}`,
          borderRadius: 8, padding: 12, position: 'relative',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: s.today ? ACCENT : MUTED }}>{s.day} {s.today && '· TODAY'}</div>
          <div style={{ fontSize: 10, color: MUTED, fontFamily: '"JetBrains Mono", monospace', marginTop: 2 }}>{s.date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <span style={{ width: 18, height: 18, background: s.team === 'NYM' ? '#002D72' : s.league === 'MLS' ? '#5D9741' : '#0C2C56', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>{s.team}</span>
            <span style={{ fontSize: 11, color: INK, fontWeight: 600 }}>{s.vs}</span>
          </div>
          <div style={{ fontSize: 10, color: MUTED, fontFamily: '"JetBrains Mono", monospace', marginTop: 6 }}>{s.time}</div>
          <div style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>{s.tv}</div>
        </div>
      ))}
    </div>
  );

  const SECTIONS = [
    { id: 'games', title: "Today's games", count: '6', action: 'ALL →', render: SectionGames },
    { id: 'teams', title: 'My teams', count: '3', action: 'MANAGE →', render: SectionTeams },
    { id: 'players', title: 'My players', count: '3', action: 'SEE ALL →', render: SectionPlayers },
    { id: 'headlines', title: 'Headlines', count: '5', action: 'ALL NEWS →', render: SectionHeadlines },
    { id: 'standings', title: 'Standings', count: '3 divisions', render: SectionStandings },
    { id: 'schedule', title: 'Next 7 days', count: null, action: 'CALENDAR →', render: SectionSchedule },
  ];

  return function V3Component() {
    const [order, setOrder] = React.useState(SECTIONS.map((s) => s.id));
    const [dragId, setDragId] = React.useState(null);
    const [overId, setOverId] = React.useState(null);

    const ordered = order.map((id) => SECTIONS.find((s) => s.id === id));

    const onDragStart = (id) => (e) => {
      setDragId(id);
      e.dataTransfer.effectAllowed = 'move';
    };
    const onDragOver = (id) => (e) => {
      e.preventDefault();
      if (id !== dragId) setOverId(id);
    };
    const onDrop = () => {
      if (!dragId || !overId || dragId === overId) {
        setDragId(null); setOverId(null); return;
      }
      const next = [...order];
      const from = next.indexOf(dragId);
      const to = next.indexOf(overId);
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      setOrder(next);
      setDragId(null); setOverId(null);
    };

    return (
      <div style={{
        width: 1280, minHeight: 900, background: BG, color: INK,
        fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      }}>
        <Ticker />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
        }}>
          <div>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: '0.18em', fontWeight: 700 }}>TUESDAY · AUG 5</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: INK, marginTop: 4, letterSpacing: '-0.02em' }}>
              Hey, <span style={{ color: ACCENT_2 }}>{D.user.name}</span>. <span style={{ color: MUTED, fontWeight: 500 }}>Two of yours are live.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              background: 'transparent', border: `1px solid ${BORDER}`, color: INK,
              padding: '8px 14px', borderRadius: 8, fontSize: 11, letterSpacing: '0.12em', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>EDIT LAYOUT ✎</button>
            <button style={{
              background: ACCENT, border: 'none', color: '#000',
              padding: '8px 14px', borderRadius: 8, fontSize: 11, letterSpacing: '0.12em', fontWeight: 800,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>FOCUS MODE</button>
          </div>
        </div>

        <LiveBanner />

        {/* Reorderable sections */}
        <div style={{ padding: '24px' }}>
          {ordered.map((s) => (
            <div
              key={s.id}
              draggable
              onDragStart={onDragStart(s.id)}
              onDragOver={onDragOver(s.id)}
              onDrop={onDrop}
              onDragEnd={() => { setDragId(null); setOverId(null); }}
              style={{
                marginBottom: 28,
                opacity: dragId === s.id ? 0.4 : 1,
                borderTop: overId === s.id && dragId !== s.id ? `2px solid ${ACCENT}` : '2px solid transparent',
                paddingTop: 8,
                transition: 'border-color 0.12s',
              }}
            >
              <SectionHead title={s.title} count={s.count} action={s.action} drag={{}} />
              <s.render />
            </div>
          ))}
        </div>
      </div>
    );
  };
})();

window.V3 = V3;
