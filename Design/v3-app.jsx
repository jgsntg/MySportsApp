// V3 polished — Focus Ticker (standalone)
// - Real drag-to-reorder sections (handle on each header)
// - Save/Load layout via localStorage (key: ms_v3_layout)
// - Section visibility toggles via Tweaks panel
// - Theme (dark / dim / contrast), density (compact/cozy/comfy), accent
// - Focus Mode: full-screen scoreboard takeover with last-play feed

const V3App = (() => {
  const D = window.MS_DATA;

  // ---------- Theme tokens ------------------------------------------------
  const THEMES = {
    dark:     { bg: '#0B1020', surface: '#121A30', surface2: '#1A2440', ink: '#F0F4FF', muted: '#8392B5', border: 'rgba(255,255,255,0.07)' },
    dim:      { bg: '#15192B', surface: '#1C223A', surface2: '#252C48', ink: '#EAEDF7', muted: '#8E96B5', border: 'rgba(255,255,255,0.06)' },
    contrast: { bg: '#000000', surface: '#0A0A0A', surface2: '#141414', ink: '#FFFFFF', muted: '#9098A8', border: 'rgba(255,255,255,0.16)' },
  };
  const ACCENTS = {
    coral:  { a: '#FF5A4D', b: '#FFD166' },
    cyan:   { a: '#22D3EE', b: '#A78BFA' },
    lime:   { a: '#A3E635', b: '#FACC15' },
    rose:   { a: '#F43F5E', b: '#FB923C' },
  };
  const DENSITY = {
    compact: { gap: 6, sectionGap: 18, padCard: 10, padSection: 16, font: 11 },
    cozy:    { gap: 10, sectionGap: 28, padCard: 14, padSection: 24, font: 12 },
    comfy:   { gap: 14, sectionGap: 36, padCard: 18, padSection: 32, font: 13 },
  };

  // ---------- Ticker (sticky) ---------------------------------------------
  const Ticker = ({ T, A }) => (
    <div style={{
      display: 'flex', alignItems: 'stretch', background: '#000',
      borderBottom: `1px solid ${T.border}`, overflow: 'hidden',
    }}>
      <div style={{
        background: A.a, color: '#000', padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', flexShrink: 0,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: '#000', animation: 'msPulse 1.4s infinite' }}></span>
        LIVE
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'msTicker 60s linear infinite', whiteSpace: 'nowrap', width: 'fit-content' }}>
          {[...D.games, ...D.games].map((g, i) => {
            const live = g.state === 'in';
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 22px', borderRight: `1px solid ${T.border}`,
                fontFamily: '"JetBrains Mono", monospace', fontSize: 12,
              }}>
                <span style={{ fontSize: 9, color: T.muted, letterSpacing: '0.12em', fontWeight: 700 }}>{g.league}</span>
                <span style={{ color: g.away.mine ? A.b : T.ink, fontWeight: g.away.mine ? 700 : 500 }}>{g.away.abbr}</span>
                <span style={{ color: T.ink, fontWeight: 700 }}>{g.away.score ?? '–'}</span>
                <span style={{ color: T.muted }}>·</span>
                <span style={{ color: T.ink, fontWeight: 700 }}>{g.home.score ?? '–'}</span>
                <span style={{ color: g.home.mine ? A.b : T.ink, fontWeight: g.home.mine ? 700 : 500 }}>{g.home.abbr}</span>
                <span style={{ color: live ? A.a : T.muted, fontSize: 10, marginLeft: 4, fontWeight: live ? 700 : 500 }}>{live && '● '}{g.detail}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ---------- Live banner -------------------------------------------------
  const LiveBanner = ({ T, A, onFocus }) => {
    const live = D.games.filter((g) => g.state === 'in' && (g.away.mine || g.home.mine));
    if (!live.length) return null;
    return (
      <div style={{
        margin: '20px 24px 0', padding: '14px 18px', background: T.surface,
        border: `1px solid ${T.border}`, borderLeft: `3px solid ${A.a}`,
        borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: A.a, padding: '4px 8px', background: 'rgba(255,90,77,0.12)', borderRadius: 4 }}>● YOUR TEAMS PLAYING</span>
        <div style={{ display: 'flex', gap: 22, flex: 1, flexWrap: 'wrap' }}>
          {live.map((g) => {
            const me = g.away.mine ? g.away : g.home;
            const opp = g.away.mine ? g.home : g.away;
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: T.muted, letterSpacing: '0.1em' }}>{g.league}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: A.b }}>{me.name}</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, fontWeight: 800, color: me.winning ? A.b : T.ink }}>{me.score}</span>
                <span style={{ color: T.muted, fontSize: 12 }}>vs</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 16, fontWeight: 800, color: opp.winning ? A.b : T.ink }}>{opp.score}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: T.ink }}>{opp.name}</span>
                <span style={{ fontSize: 11, color: A.a, fontFamily: '"JetBrains Mono", monospace', marginLeft: 4 }}>{g.detail}</span>
              </div>
            );
          })}
        </div>
        <button onClick={() => onFocus(live[0])} style={{
          background: A.a, color: '#000', border: 'none', padding: '6px 12px',
          borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>FOCUS MODE ↗</button>
      </div>
    );
  };

  // ---------- Section header w/ drag handle ------------------------------
  const SectionHead = ({ title, count, action, T, A, onDragStart, onDragEnd, dragging }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 14px' }}>
      <span
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        style={{
          cursor: 'grab', color: dragging ? A.a : T.muted, fontSize: 16,
          padding: '4px 6px', borderRadius: 4, userSelect: 'none',
          transition: 'color .12s',
        }}
        title="Drag to reorder"
      >⋮⋮</span>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.22em', color: T.ink, textTransform: 'uppercase' }}>{title}</span>
      {count != null && <span style={{ fontSize: 10, color: T.muted, fontFamily: '"JetBrains Mono", monospace' }}>· {count}</span>}
      <div style={{ flex: 1, height: 1, background: T.border, marginLeft: 8 }}></div>
      {action && <span style={{ fontSize: 10, color: A.b, letterSpacing: '0.14em', fontWeight: 700, cursor: 'pointer' }}>{action}</span>}
    </div>
  );

  // ---------- Sections (functions returning JSX given T,A,DEN) ----------
  const SectionGames = ({ T, A, DEN, onFocus }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DEN.gap }}>
      {D.games.map((g) => {
        const live = g.state === 'in';
        const post = g.state === 'post';
        return (
          <div key={g.id} onClick={() => live && onFocus(g)} style={{
            background: T.surface, borderRadius: 8, border: `1px solid ${live ? 'rgba(255,90,77,0.4)' : T.border}`,
            padding: DEN.padCard, position: 'relative', overflow: 'hidden',
            cursor: live ? 'pointer' : 'default',
          }}>
            {live && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: A.a }}></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', color: T.muted }}>{g.league}</span>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: live ? A.a : post ? T.muted : T.ink, fontFamily: '"JetBrains Mono", monospace' }}>{live ? `● ${g.detail}` : post ? 'FINAL' : g.detail}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[g.away, g.home].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 26, height: 26, background: t.color, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', fontFamily: '"JetBrains Mono", monospace' }}>{t.abbr.slice(0, 3)}</div>
                  <span style={{ fontSize: DEN.font + 1, color: t.mine ? A.b : T.ink, fontWeight: t.mine ? 700 : 500 }}>{t.name}</span>
                  {t.score !== undefined && <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 18, fontWeight: t.winning ? 800 : 500, color: t.winning ? T.ink : T.muted }}>{t.score}</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.muted }}>
              <span>{g.venue}</span><span>{g.broadcast}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const SectionTeams = ({ T, A, DEN }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DEN.gap }}>
      {D.teams.map((t) => (
        <div key={t.id} style={{
          background: `linear-gradient(135deg, ${t.color} 0%, ${t.color} 60%, ${T.surface} 100%)`,
          borderRadius: 8, padding: DEN.padCard + 4, position: 'relative', overflow: 'hidden',
          border: `1px solid ${T.border}`,
        }}>
          <div style={{ position: 'absolute', top: -10, right: -10, width: 90, height: 90, background: t.accent, opacity: 0.18, borderRadius: '50%' }}></div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${t.accent}`, color: '#fff', fontSize: 24, fontWeight: 800 }}>{t.logo}</div>
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

  const SectionPlayers = ({ T, A, DEN }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DEN.gap }}>
      {D.players.map((p) => (
        <div key={p.id} style={{
          background: T.surface, borderRadius: 8, padding: DEN.padCard + 2,
          border: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, background: p.color, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: '"JetBrains Mono", monospace', fontWeight: 800, fontSize: 14 }}>#{p.jersey}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, lineHeight: 1.1 }}>{p.name}</div>
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{p.position} · {p.team} · {p.league}</div>
              </div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', padding: '4px 7px', borderRadius: 999, background: p.trend === 'hot' ? A.a : 'rgba(255,255,255,0.06)', color: p.trend === 'hot' ? '#000' : T.muted }}>{p.trend === 'hot' ? '🔥 HOT' : 'COOL'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {p.stats.map((s, j) => (
              <div key={j} style={{ background: T.surface2, padding: '8px 4px', borderRadius: 4, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: T.muted, letterSpacing: '0.1em', fontWeight: 600 }}>{s.k}</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 14, fontWeight: 700, color: T.ink, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: T.muted }}>
            <span style={{ letterSpacing: '0.14em', fontWeight: 700 }}>L5</span>
            <div style={{ display: 'flex', gap: 3, flex: 1, height: 22, alignItems: 'flex-end' }}>
              {p.last5.map((h, j) => (
                <div key={j} style={{ flex: 1, height: Math.max(4, h * 8), background: h >= 2 ? A.b : h === 1 ? 'rgba(255,209,102,0.4)' : 'rgba(255,255,255,0.08)', borderRadius: 2 }}></div>
              ))}
            </div>
            <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{p.last5.reduce((a, b) => a + b, 0)} H</span>
          </div>
          <div style={{ fontSize: 11, color: A.b, fontStyle: 'italic' }}>{p.note}</div>
        </div>
      ))}
    </div>
  );

  const SectionHeadlines = ({ T, A, DEN }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: DEN.gap }}>
      {(() => {
        const h = D.headlines[0];
        return (
          <div style={{ background: T.surface, borderRadius: 8, padding: DEN.padCard + 4, border: `1px solid ${T.border}`, gridRow: 'span 2', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 140, borderRadius: 6, background: `linear-gradient(135deg, #0C2C56, #005C5C)`, position: 'relative', border: `1px dashed rgba(255,255,255,0.14)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}>[ HERO IMAGE ]</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: A.a, letterSpacing: '0.18em' }}>{h.kicker}</span>
              {h.hot && <span style={{ width: 5, height: 5, borderRadius: 999, background: A.a, animation: 'msPulse 1.4s infinite' }}></span>}
              <span style={{ fontSize: 10, color: T.muted }}>· {h.league} · {h.time} · {h.source}</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: T.ink, lineHeight: 1.2, margin: 0, letterSpacing: '-0.01em' }}>{h.headline}</h3>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.5, margin: 0 }}>{h.blurb}</p>
          </div>
        );
      })()}
      {D.headlines.slice(1, 5).map((h) => (
        <div key={h.id} style={{ background: T.surface, borderRadius: 8, padding: DEN.padCard, border: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: A.a, letterSpacing: '0.16em' }}>{h.kicker}</span>
            <span style={{ fontSize: 9, color: T.muted }}>· {h.time}</span>
          </div>
          <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.3, fontWeight: 600 }}>{h.headline}</div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>{h.league} · {h.source}</div>
        </div>
      ))}
    </div>
  );

  const SectionStandings = ({ T, A, DEN }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: DEN.gap }}>
      {Object.entries(D.standings).map(([div, rows]) => (
        <div key={div} style={{ background: T.surface, borderRadius: 8, padding: DEN.padCard, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: A.b, marginBottom: 10 }}>{div}</div>
          {rows.slice(0, 5).map((r, i) => (
            <div key={r.abbr} style={{ display: 'grid', gridTemplateColumns: '18px 1fr 30px 28px 32px', gap: 6, alignItems: 'center', padding: '6px 4px', borderTop: i > 0 ? `1px solid ${T.border}` : 'none', background: r.mine ? 'rgba(255,209,102,0.06)' : 'transparent' }}>
              <span style={{ fontSize: 10, color: T.muted, fontFamily: '"JetBrains Mono", monospace' }}>{i + 1}</span>
              <span style={{ fontSize: 12, color: r.mine ? A.b : T.ink, fontWeight: r.mine ? 700 : 500 }}>{r.team}</span>
              <span style={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: T.ink, textAlign: 'right', fontWeight: 600 }}>{r.w}</span>
              <span style={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', color: T.muted, textAlign: 'right' }}>{r.l}</span>
              <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: T.muted, textAlign: 'right' }}>{r.gb || `${r.pts}p`}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const SectionSchedule = ({ T, A, DEN }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
      {D.schedule.map((s, i) => (
        <div key={i} style={{
          background: s.today ? 'rgba(255,90,77,0.1)' : T.surface,
          border: `1px solid ${s.today ? A.a : T.border}`, borderRadius: 8, padding: 12, position: 'relative',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: s.today ? A.a : T.muted }}>{s.day} {s.today && '· TODAY'}</div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: '"JetBrains Mono", monospace', marginTop: 2 }}>{s.date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <span style={{ width: 18, height: 18, background: s.team === 'NYM' ? '#002D72' : s.league === 'MLS' ? '#5D9741' : '#0C2C56', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>{s.team}</span>
            <span style={{ fontSize: 11, color: T.ink, fontWeight: 600 }}>{s.vs}</span>
          </div>
          <div style={{ fontSize: 10, color: T.muted, fontFamily: '"JetBrains Mono", monospace', marginTop: 6 }}>{s.time}</div>
          <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{s.tv}</div>
        </div>
      ))}
    </div>
  );

  const SECTION_DEFS = {
    games:     { title: "Today's games", count: '6',          action: 'ALL →',         render: SectionGames },
    teams:     { title: 'My teams',      count: '3',          action: 'MANAGE →',      render: SectionTeams },
    players:   { title: 'My players',    count: '3',          action: 'SEE ALL →',     render: SectionPlayers },
    headlines: { title: 'Headlines',     count: '5',          action: 'ALL NEWS →',    render: SectionHeadlines },
    standings: { title: 'Standings',     count: '3 divisions', render: SectionStandings },
    schedule:  { title: 'Next 7 days',                action: 'CALENDAR →',  render: SectionSchedule },
  };
  const DEFAULT_ORDER = ['games', 'teams', 'players', 'headlines', 'standings', 'schedule'];
  const STORAGE_KEY = 'ms_v3_layout_v1';

  // ---------- Focus Mode (takeover) --------------------------------------
  const FocusMode = ({ game, T, A, onClose }) => {
    if (!game) return null;
    const me = game.away.mine ? game.away : game.home;
    const opp = game.away.mine ? game.home : game.away;
    const events = [
      { t: 'TOP 7', text: 'M. Trout flies out to deep right. 1 out.' },
      { t: 'TOP 7', text: 'A. Judge strikes out swinging on a 2-2 slider.' },
      { t: 'BOT 7', text: 'C. Raleigh walks on a full count.' },
      { t: 'BOT 7', text: 'J. Rodríguez doubles to deep center, Raleigh scores from 1st. SEA 4, NYY 3.' },
      { t: 'BOT 7', text: 'T. France grounds out, 4-3. Rodríguez to third.' },
    ];
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: '#000', color: T.ink,
        fontFamily: '"Inter", system-ui, sans-serif',
        display: 'flex', flexDirection: 'column',
        animation: 'msFade 0.25s ease',
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ background: A.a, color: '#000', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: '0.18em' }}>● FOCUS MODE</span>
            <span style={{ fontSize: 11, color: T.muted, letterSpacing: '0.16em', fontWeight: 600 }}>{game.league} · {game.venue} · {game.broadcast}</span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.ink, padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' }}>EXIT ✕</button>
        </div>

        {/* Massive scoreboard */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 0 }}>
          <div style={{ padding: '40px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 50%, ${me.color}40, transparent 60%)`, pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 70% 50%, ${opp.color}40, transparent 60%)`, pointerEvents: 'none' }}></div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 40 }}>
                {/* Away */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.18em', color: T.muted, fontWeight: 700 }}>{game.away.mine ? 'YOUR TEAM' : 'AWAY'}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: T.ink, marginTop: 4, letterSpacing: '-0.02em' }}>{game.away.name}</div>
                  <div style={{ fontSize: 12, color: T.muted, fontFamily: '"JetBrains Mono", monospace', marginTop: 2 }}>{game.away.abbr} · {game.away.record}</div>
                  <div style={{
                    fontSize: 240, fontWeight: 900, lineHeight: 0.85,
                    color: game.away.winning ? A.b : T.ink,
                    fontFamily: '"JetBrains Mono", monospace',
                    marginTop: 16, letterSpacing: '-0.05em',
                    textShadow: game.away.winning ? `0 0 60px ${A.a}40` : 'none',
                  }}>{game.away.score}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.2em', fontWeight: 700 }}>{game.detail.toUpperCase()}</div>
                  <div style={{ fontSize: 60, fontWeight: 100, color: T.muted, lineHeight: 1, fontFamily: '"JetBrains Mono", monospace', margin: '8px 0' }}>—</div>
                  {game.count && (
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.muted, fontFamily: '"JetBrains Mono", monospace', justifyContent: 'center', marginTop: 16 }}>
                      <span><span style={{ color: T.ink, fontWeight: 700, fontSize: 14 }}>{game.count.balls}</span> B</span>
                      <span><span style={{ color: T.ink, fontWeight: 700, fontSize: 14 }}>{game.count.strikes}</span> S</span>
                      <span><span style={{ color: T.ink, fontWeight: 700, fontSize: 14 }}>{game.count.outs}</span> O</span>
                    </div>
                  )}
                  {game.bases && (
                    <div style={{ position: 'relative', width: 80, height: 80, margin: '20px auto 0' }}>
                      {[
                        { key: 'second', x: 28, y: 0 },
                        { key: 'third', x: 0, y: 28 },
                        { key: 'first', x: 56, y: 28 },
                      ].map((b) => (
                        <div key={b.key} style={{
                          position: 'absolute', left: b.x, top: b.y,
                          width: 24, height: 24, transform: 'rotate(45deg)',
                          background: game.bases[b.key] ? A.b : 'transparent',
                          border: `2px solid ${game.bases[b.key] ? A.b : T.muted}`,
                        }}></div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Home */}
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.18em', color: T.muted, fontWeight: 700 }}>{game.home.mine ? 'YOUR TEAM' : 'HOME'}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: T.ink, marginTop: 4, letterSpacing: '-0.02em' }}>{game.home.name}</div>
                  <div style={{ fontSize: 12, color: T.muted, fontFamily: '"JetBrains Mono", monospace', marginTop: 2 }}>{game.home.abbr} · {game.home.record}</div>
                  <div style={{
                    fontSize: 240, fontWeight: 900, lineHeight: 0.85,
                    color: game.home.winning ? A.b : T.ink,
                    fontFamily: '"JetBrains Mono", monospace',
                    marginTop: 16, letterSpacing: '-0.05em',
                  }}>{game.home.score}</div>
                </div>
              </div>
              {game.lastPlay && (
                <div style={{ marginTop: 32, padding: '18px 24px', background: 'rgba(255,255,255,0.04)', borderLeft: `3px solid ${A.a}`, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: A.a, letterSpacing: '0.18em', fontWeight: 800, marginBottom: 6 }}>● LAST PLAY</div>
                  <div style={{ fontSize: 17, color: T.ink, lineHeight: 1.4, fontWeight: 500 }}>{game.lastPlay}</div>
                </div>
              )}
            </div>
          </div>

          {/* Play feed */}
          <div style={{ borderLeft: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: T.muted }}>PLAY-BY-PLAY</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginTop: 4 }}>Live updates</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {events.map((e, i) => (
                <div key={i} style={{
                  padding: '12px 18px', borderBottom: `1px solid ${T.border}`,
                  background: i === events.length - 1 ? 'rgba(255,90,77,0.06)' : 'transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.14em', color: i === events.length - 1 ? A.a : T.muted, fontFamily: '"JetBrains Mono", monospace' }}>{e.t}</span>
                    {i === events.length - 1 && <span style={{ width: 5, height: 5, borderRadius: 999, background: A.a, animation: 'msPulse 1.4s infinite' }}></span>}
                  </div>
                  <div style={{ fontSize: 12, color: T.ink, lineHeight: 1.4 }}>{e.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------- Tweaks panel ----------------------------------------------
  const Tweaks = ({ tweaks, set, T, A }) => (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, zIndex: 50, width: 260,
      background: 'rgba(20,24,40,0.92)', backdropFilter: 'blur(16px)',
      border: `1px solid ${T.border}`, borderRadius: 12,
      padding: 14, color: T.ink, fontSize: 11,
      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
      maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 800, color: T.muted, marginBottom: 10 }}>TWEAKS</div>

      <Group label="Theme">
        <Seg value={tweaks.theme} options={['dark', 'dim', 'contrast']} onChange={(v) => set('theme', v)} A={A} T={T} />
      </Group>
      <Group label="Density">
        <Seg value={tweaks.density} options={['compact', 'cozy', 'comfy']} onChange={(v) => set('density', v)} A={A} T={T} />
      </Group>
      <Group label="Accent">
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(ACCENTS).map(([k, v]) => (
            <button key={k} onClick={() => set('accent', k)} style={{
              flex: 1, height: 28, border: tweaks.accent === k ? `2px solid ${v.a}` : `1px solid ${T.border}`,
              background: `linear-gradient(135deg, ${v.a} 50%, ${v.b} 50%)`,
              borderRadius: 6, cursor: 'pointer', padding: 0,
            }} title={k}></button>
          ))}
        </div>
      </Group>
      <Group label="Show ticker">
        <Toggle value={tweaks.showTicker} onChange={(v) => set('showTicker', v)} A={A} T={T} />
      </Group>
      <Group label="Show live banner">
        <Toggle value={tweaks.showLiveBanner} onChange={(v) => set('showLiveBanner', v)} A={A} T={T} />
      </Group>

      <div style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 800, color: T.muted, margin: '14px 0 8px' }}>SECTIONS</div>
      {DEFAULT_ORDER.map((id) => (
        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
          <span style={{ fontSize: 11, color: T.ink }}>{SECTION_DEFS[id].title}</span>
          <Toggle value={tweaks.visible[id] !== false} onChange={(v) => set('visible', { ...tweaks.visible, [id]: v })} A={A} T={T} />
        </div>
      ))}
    </div>
  );

  const Group = ({ label, children }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: '#8392B5', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );

  const Seg = ({ value, options, onChange, A, T }) => (
    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 2, gap: 2 }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} style={{
          flex: 1, padding: '5px 6px', border: 'none',
          background: value === o ? A.a : 'transparent',
          color: value === o ? '#000' : T.ink,
          fontSize: 10, fontWeight: value === o ? 800 : 500,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
        }}>{o}</button>
      ))}
    </div>
  );

  const Toggle = ({ value, onChange, A, T }) => (
    <button onClick={() => onChange(!value)} style={{
      width: 34, height: 18, borderRadius: 999, padding: 0, border: 'none',
      background: value ? A.a : 'rgba(255,255,255,0.15)',
      position: 'relative', cursor: 'pointer', transition: 'background 0.15s',
    }}>
      <span style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left 0.15s',
      }}></span>
    </button>
  );

  // ---------- Main app ---------------------------------------------------
  return function V3StandaloneApp() {
    const [tweaks, setTweaks] = React.useState({
      theme: 'dark', density: 'cozy', accent: 'coral',
      showTicker: true, showLiveBanner: true,
      visible: {},
    });
    const set = (k, v) => setTweaks((t) => ({ ...t, [k]: v }));

    const [order, setOrder] = React.useState(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
      return DEFAULT_ORDER;
    });
    const [savedSnapshot, setSavedSnapshot] = React.useState(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
      return null;
    });
    const dirty = JSON.stringify(order) !== JSON.stringify(savedSnapshot ?? DEFAULT_ORDER);

    const [dragId, setDragId] = React.useState(null);
    const [overId, setOverId] = React.useState(null);
    const [focusGame, setFocusGame] = React.useState(null);
    const [savedToast, setSavedToast] = React.useState(false);

    const T = THEMES[tweaks.theme];
    const A = ACCENTS[tweaks.accent];
    const DEN = DENSITY[tweaks.density];

    const onDragStart = (id) => () => setDragId(id);
    const onDragOver = (id) => (e) => { e.preventDefault(); if (id !== dragId) setOverId(id); };
    const onDrop = () => {
      if (!dragId || !overId || dragId === overId) { setDragId(null); setOverId(null); return; }
      const next = [...order];
      const from = next.indexOf(dragId);
      const to = next.indexOf(overId);
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      setOrder(next);
      setDragId(null); setOverId(null);
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

    const visible = (id) => tweaks.visible[id] !== false;
    const orderedVisible = order.filter(visible);

    return (
      <div style={{
        background: T.bg, color: T.ink, minHeight: '100vh',
        fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      }}>
        {tweaks.showTicker && <div style={{ position: 'sticky', top: 0, zIndex: 5 }}><Ticker T={T} A={A} /></div>}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: T.muted, letterSpacing: '0.18em', fontWeight: 700 }}>TUESDAY · AUG 5, 2026</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.ink, marginTop: 4, letterSpacing: '-0.02em' }}>
              Hey, <span style={{ color: A.b }}>{D.user.name}</span>. <span style={{ color: T.muted, fontWeight: 500 }}>Two of yours are live.</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {dirty && <span style={{ fontSize: 10, color: A.a, letterSpacing: '0.14em', fontWeight: 700 }}>● UNSAVED CHANGES</span>}
            <button onClick={resetLayout} style={{
              background: 'transparent', border: `1px solid ${T.border}`, color: T.muted,
              padding: '8px 14px', borderRadius: 8, fontSize: 11, letterSpacing: '0.12em', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>RESET</button>
            <button onClick={saveLayout} disabled={!dirty} style={{
              background: dirty ? A.a : 'rgba(255,255,255,0.06)',
              border: 'none', color: dirty ? '#000' : T.muted,
              padding: '8px 14px', borderRadius: 8, fontSize: 11, letterSpacing: '0.12em', fontWeight: 800,
              cursor: dirty ? 'pointer' : 'default', fontFamily: 'inherit',
              transition: 'all .15s',
            }}>SAVE LAYOUT ↓</button>
          </div>
        </div>

        {tweaks.showLiveBanner && <LiveBanner T={T} A={A} onFocus={setFocusGame} />}

        <div style={{ padding: '24px' }}>
          {orderedVisible.map((id) => {
            const def = SECTION_DEFS[id];
            const SectionRender = def.render;
            return (
              <div
                key={id}
                onDragOver={onDragOver(id)}
                onDrop={onDrop}
                style={{
                  marginBottom: DEN.sectionGap,
                  opacity: dragId === id ? 0.4 : 1,
                  borderTop: overId === id && dragId !== id ? `2px solid ${A.a}` : '2px solid transparent',
                  paddingTop: 8, transition: 'border-color 0.12s, opacity 0.12s',
                }}
              >
                <SectionHead
                  title={def.title} count={def.count} action={def.action}
                  T={T} A={A}
                  onDragStart={onDragStart(id)}
                  onDragEnd={() => { setDragId(null); setOverId(null); }}
                  dragging={dragId === id}
                />
                <SectionRender T={T} A={A} DEN={DEN} onFocus={setFocusGame} />
              </div>
            );
          })}
          {orderedVisible.length === 0 && (
            <div style={{ padding: 60, textAlign: 'center', color: T.muted, border: `1px dashed ${T.border}`, borderRadius: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 4 }}>No sections visible</div>
              <div style={{ fontSize: 12 }}>Toggle sections back on from the Tweaks panel.</div>
            </div>
          )}
        </div>

        <Tweaks tweaks={tweaks} set={set} T={T} A={A} />
        <FocusMode game={focusGame} T={T} A={A} onClose={() => setFocusGame(null)} />

        {savedToast && (
          <div style={{
            position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: A.a, color: '#000', padding: '10px 20px', borderRadius: 999,
            fontSize: 11, fontWeight: 800, letterSpacing: '0.14em', zIndex: 60,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            animation: 'msFade 0.2s',
          }}>✓ LAYOUT SAVED</div>
        )}
      </div>
    );
  };
})();

window.V3App = V3App;
