// Variation 1 — Editorial Broadsheet
// Big slab serif kickers, dense tabular data, layout preset cycler.
// Dark with a single warm accent (cadmium).

const V1 = (() => {
  const D = window.MS_DATA;
  const ACCENT = '#FF4D2E'; // cadmium
  const ACCENT_2 = '#E8DDC4'; // bone
  const PAPER = '#0A0A0A';
  const INK = '#F5F1EA';
  const MUTED = '#8A8478';
  const RULE = 'rgba(245,241,234,0.12)';

  const styles = {
    root: {
      width: 1280,
      minHeight: 900,
      background: PAPER,
      color: INK,
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      fontFeatureSettings: '"ss01", "cv11"',
      padding: 0,
      position: 'relative',
    },
  };

  const Rule = ({ thick }) => (
    <div style={{ height: thick ? 2 : 1, background: thick ? INK : RULE, width: '100%' }}></div>
  );

  const SectionHead = ({ kicker, title, action }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '20px 0 10px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{ width: 8, height: 8, background: ACCENT, display: 'inline-block', transform: 'translateY(1px)' }}></span>
        <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 32, letterSpacing: '-0.02em', lineHeight: 1, fontWeight: 400 }}>{title}</span>
        {kicker && <span style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: MUTED, fontWeight: 600 }}>{kicker}</span>}
      </div>
      {action && <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, fontWeight: 600 }}>{action}</span>}
    </div>
  );

  // Live banner — subtle, single line
  const LiveBanner = () => {
    const live = D.games.filter((g) => g.state === 'in' && (g.away.mine || g.home.mine));
    if (!live.length) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}`, background: 'rgba(255,77,46,0.06)' }}>
        <div style={{ background: ACCENT, color: PAPER, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em' }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: PAPER, animation: 'msPulse 1.4s infinite' }}></span>
          ON NOW
        </div>
        <div style={{ display: 'flex', flex: 1 }}>
          {live.map((g, i) => {
            const mine = g.away.mine ? g.away : g.home;
            const opp = g.away.mine ? g.home : g.away;
            return (
              <div key={g.id} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderRight: i < live.length - 1 ? `1px solid ${RULE}` : 'none' }}>
                <span style={{ fontSize: 10, letterSpacing: '0.12em', color: MUTED, fontWeight: 600 }}>{g.league}</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, fontWeight: 700 }}>
                  <span style={{ color: ACCENT_2 }}>{mine.abbr}</span>
                  <span style={{ color: INK, margin: '0 6px' }}>{mine.score}</span>
                  <span style={{ color: MUTED }}>—</span>
                  <span style={{ color: INK, margin: '0 6px' }}>{opp.score}</span>
                  <span style={{ color: MUTED }}>{opp.abbr}</span>
                </span>
                <span style={{ fontSize: 11, color: MUTED, marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace' }}>{g.detail}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Hero game card — only used when a fave is live
  const HeroGame = ({ g }) => {
    const mine = g.away.mine ? g.away : g.home;
    const opp = g.away.mine ? g.home : g.away;
    return (
      <div style={{ position: 'relative', padding: '28px 28px 22px', border: `1px solid ${RULE}`, background: '#0F0F0F', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08, background: `radial-gradient(circle at 20% 30%, ${ACCENT}, transparent 50%)` }}></div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <span style={{ background: ACCENT, color: PAPER, padding: '3px 8px', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em' }}>● LIVE</span>
            <span style={{ fontSize: 11, letterSpacing: '0.14em', color: MUTED, fontWeight: 600 }}>{g.league} · {g.venue} · {g.broadcast}</span>
            <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: ACCENT_2 }}>{g.detail}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 24 }}>
            <TeamHero t={g.away} side="left" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: MUTED, letterSpacing: '0.16em', marginBottom: 4 }}>SCORE</div>
              <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 14, color: MUTED }}>—</div>
            </div>
            <TeamHero t={g.home} side="right" />
          </div>
          {g.lastPlay && (
            <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${RULE}`, display: 'flex', gap: 14 }}>
              <span style={{ fontSize: 10, letterSpacing: '0.18em', color: ACCENT, fontWeight: 700, marginTop: 3 }}>LAST</span>
              <span style={{ fontSize: 14, lineHeight: 1.4, fontFamily: '"DM Serif Display", Georgia, serif', flex: 1 }}>{g.lastPlay}</span>
              {g.count && (
                <div style={{ display: 'flex', gap: 10, fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: MUTED }}>
                  <span><span style={{ color: INK }}>{g.count.balls}</span>-<span style={{ color: INK }}>{g.count.strikes}</span> CT</span>
                  <span><span style={{ color: INK }}>{g.count.outs}</span> OUT</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const TeamHero = ({ t, side }) => (
    <div style={{ textAlign: side === 'left' ? 'left' : 'right' }}>
      <div style={{ fontSize: 10, letterSpacing: '0.16em', color: MUTED, fontWeight: 600 }}>{t.mine ? 'YOUR TEAM' : '\u00A0'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: side === 'left' ? 'flex-start' : 'flex-end', marginTop: 6 }}>
        {side === 'right' && <ScoreBig t={t} />}
        <div>
          <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 28, lineHeight: 1, letterSpacing: '-0.01em' }}>{t.name}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 4, fontFamily: '"JetBrains Mono", monospace' }}>{t.abbr} · {t.record}</div>
        </div>
        {side === 'left' && <ScoreBig t={t} />}
      </div>
    </div>
  );

  const ScoreBig = ({ t }) => (
    <div style={{
      width: 72, height: 72, background: t.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 44, lineHeight: 1,
      borderLeft: `3px solid ${t.accent}`,
      fontWeight: t.winning ? 700 : 400,
      opacity: t.winning ? 1 : 0.85,
    }}>{t.score}</div>
  );

  // Today's games — dense list
  const GamesList = () => (
    <div>
      {D.games.filter((g) => g.state !== 'in').map((g, i) => (
        <div key={g.id} style={{
          display: 'grid', gridTemplateColumns: '60px 1fr 1fr 100px 80px',
          alignItems: 'center', gap: 14, padding: '14px 0',
          borderTop: i === 0 ? `1px solid ${RULE}` : 'none',
          borderBottom: `1px solid ${RULE}`,
        }}>
          <span style={{ fontSize: 10, letterSpacing: '0.14em', color: MUTED, fontWeight: 700 }}>{g.league}</span>
          <RowTeam t={g.away} won={g.state === 'post' && g.away.winning} />
          <RowTeam t={g.home} won={g.state === 'post' && g.home.winning} />
          <span style={{
            fontSize: 11, fontFamily: '"JetBrains Mono", monospace',
            color: g.state === 'post' ? INK : ACCENT_2, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{g.detail}</span>
          <span style={{ fontSize: 10, color: MUTED, textAlign: 'right', letterSpacing: '0.06em' }}>{g.broadcast || g.venue || ''}</span>
        </div>
      ))}
    </div>
  );

  const RowTeam = ({ t, won }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 22, height: 22, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 800, color: '#fff' }}>{t.abbr.slice(0, 3)}</div>
      <span style={{ fontSize: 14, fontWeight: t.mine ? 700 : 500, color: t.mine ? ACCENT : INK, fontFamily: '"DM Serif Display", Georgia, serif' }}>{t.name}</span>
      {t.score !== undefined && (
        <span style={{ marginLeft: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 16, fontWeight: won ? 800 : 500, color: won ? INK : MUTED }}>{t.score}</span>
      )}
    </div>
  );

  // Players — big editorial cards
  const PlayersStrip = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, borderTop: `1px solid ${RULE}` }}>
      {D.players.map((p, i) => (
        <div key={p.id} style={{ padding: '20px 22px', borderRight: i < D.players.length - 1 ? `1px solid ${RULE}` : 'none', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: MUTED, letterSpacing: '0.14em', fontWeight: 600 }}>{p.position} · #{p.jersey} · {p.team}</div>
              <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 26, lineHeight: 1.05, letterSpacing: '-0.01em', marginTop: 4 }}>{p.name}</div>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
              padding: '3px 7px',
              background: p.trend === 'hot' ? ACCENT : 'transparent',
              color: p.trend === 'hot' ? PAPER : MUTED,
              border: p.trend === 'hot' ? 'none' : `1px solid ${RULE}`,
            }}>{p.trend === 'hot' ? '🔥 HOT' : 'COOL'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 16, borderTop: `1px solid ${RULE}` }}>
            {p.stats.map((s, j) => (
              <div key={j} style={{ padding: '10px 0 6px', borderRight: j < 3 ? `1px solid ${RULE}` : 'none' }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: MUTED, letterSpacing: '0.1em' }}>{s.k}</div>
                <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 22, marginTop: 2 }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: MUTED, letterSpacing: '0.14em' }}>L5</span>
            <div style={{ display: 'flex', gap: 3, flex: 1 }}>
              {p.last5.map((h, j) => (
                <div key={j} style={{
                  flex: 1, height: Math.max(6, h * 8), background: h > 0 ? ACCENT : RULE,
                  alignSelf: 'flex-end',
                }}></div>
              ))}
            </div>
            <span style={{ fontSize: 10, color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>{p.last5.reduce((a, b) => a + b, 0)} H</span>
          </div>
          <div style={{ fontSize: 12, color: ACCENT_2, marginTop: 10, fontStyle: 'italic' }}>"{p.note}"</div>
        </div>
      ))}
    </div>
  );

  // Teams logo grid
  const TeamsGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: `1px solid ${RULE}` }}>
      {D.teams.map((t, i) => (
        <div key={t.id} style={{
          padding: '18px 20px',
          borderRight: i < D.teams.length - 1 ? `1px solid ${RULE}` : 'none',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 56, height: 56, background: t.color,
            borderTop: `4px solid ${t.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 26, color: '#fff',
          }}>{t.logo}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 18, lineHeight: 1.1 }}>{t.name}</div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>
              <span>{t.record}</span>
              <span>·</span>
              <span style={{ color: t.streak.startsWith('W') ? '#7FCB7F' : '#E37070' }}>{t.streak}</span>
              <span>·</span>
              <span>{t.rank}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Headlines — newspaper column
  const HeadlinesCol = () => (
    <div style={{ borderTop: `1px solid ${RULE}` }}>
      {D.headlines.slice(0, 5).map((h, i) => (
        <div key={h.id} style={{
          padding: '16px 0', borderBottom: `1px solid ${RULE}`,
          display: 'grid', gridTemplateColumns: i === 0 ? '1fr' : '90px 1fr', gap: 16, alignItems: 'baseline',
        }}>
          {i === 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', color: ACCENT }}>{h.kicker}</span>
                {h.hot && <span style={{ width: 5, height: 5, borderRadius: 999, background: ACCENT, animation: 'msPulse 1.4s infinite' }}></span>}
                <span style={{ fontSize: 10, letterSpacing: '0.14em', color: MUTED }}>{h.league} · {h.time} · {h.source}</span>
              </div>
              <h3 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.015em', margin: 0, fontWeight: 400 }}>{h.headline}</h3>
              <p style={{ fontSize: 14, color: ACCENT_2, marginTop: 8, lineHeight: 1.45, opacity: 0.8 }}>{h.blurb}</p>
            </div>
          ) : (
            <React.Fragment>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: ACCENT }}>{h.kicker}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2, fontFamily: '"JetBrains Mono", monospace' }}>{h.time}</div>
              </div>
              <div>
                <h4 style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 17, lineHeight: 1.2, letterSpacing: '-0.01em', margin: 0, fontWeight: 400 }}>{h.headline}</h4>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 4, letterSpacing: '0.1em' }}>{h.league} · {h.source}</div>
              </div>
            </React.Fragment>
          )}
        </div>
      ))}
    </div>
  );

  // Standings
  const Standings = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22, borderTop: `1px solid ${RULE}`, paddingTop: 18 }}>
      {Object.entries(D.standings).map(([div, rows]) => (
        <div key={div}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', color: MUTED, fontWeight: 700, marginBottom: 10 }}>{div}</div>
          <div>
            {rows.slice(0, 5).map((r, i) => (
              <div key={r.abbr} style={{
                display: 'grid', gridTemplateColumns: '20px 1fr 36px 36px 36px',
                alignItems: 'center', gap: 8, padding: '6px 0',
                borderBottom: i < 4 ? `1px solid ${RULE}` : 'none',
                background: r.mine ? 'rgba(255,77,46,0.06)' : 'transparent',
              }}>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: MUTED }}>{i + 1}</span>
                <span style={{ fontSize: 12, fontWeight: r.mine ? 700 : 500, color: r.mine ? ACCENT : INK, fontFamily: '"DM Serif Display", Georgia, serif' }}>{r.team}</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: INK, textAlign: 'right' }}>{r.w}</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: MUTED, textAlign: 'right' }}>{r.l}{r.t !== undefined ? `-${r.t}` : ''}</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: MUTED, textAlign: 'right' }}>{r.gb || r.pts}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Schedule strip
  const ScheduleStrip = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
      {D.schedule.map((s, i) => (
        <div key={i} style={{
          padding: '12px 12px 14px',
          borderRight: i < D.schedule.length - 1 ? `1px solid ${RULE}` : 'none',
          background: s.today ? 'rgba(255,77,46,0.08)' : 'transparent',
          position: 'relative',
        }}>
          {s.today && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: ACCENT }}></div>}
          <div style={{ fontSize: 10, letterSpacing: '0.16em', color: s.today ? ACCENT : MUTED, fontWeight: 700 }}>{s.day}</div>
          <div style={{ fontSize: 10, color: MUTED, fontFamily: '"JetBrains Mono", monospace', marginTop: 2 }}>{s.date}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ width: 16, height: 16, background: s.team === 'NYM' ? '#002D72' : s.league === 'MLS' ? '#5D9741' : '#0C2C56', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>{s.team}</span>
            <span style={{ fontSize: 11, color: INK, fontFamily: '"DM Serif Display", Georgia, serif' }}>{s.vs}</span>
          </div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 6, fontFamily: '"JetBrains Mono", monospace' }}>{s.time}</div>
          <div style={{ fontSize: 9, color: MUTED, marginTop: 2, letterSpacing: '0.1em' }}>{s.tv}</div>
        </div>
      ))}
    </div>
  );

  // Header — masthead
  const Masthead = ({ layout, onCycleLayout }) => {
    const today = new Date(2026, 7, 5); // Aug 5
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 28px 6px', fontSize: 10, letterSpacing: '0.18em', color: MUTED, fontWeight: 600 }}>
          <span>VOL. MMXXVI · NO. 217</span>
          <span>{dateStr}</span>
          <span>HELLO, {D.user.name.toUpperCase()}</span>
        </div>
        <Rule thick />
        <div style={{ padding: '14px 28px 16px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: 64, lineHeight: 0.95, letterSpacing: '-0.03em', fontWeight: 400 }}>
              The Daily <span style={{ color: ACCENT, fontStyle: 'italic' }}>Sportsdesk</span>
            </div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: MUTED, marginTop: 6, fontWeight: 600 }}>YOUR PERSONAL COMMAND DESK · MARINERS · SOUNDERS · METS</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCycleLayout} style={{
              background: 'transparent', color: INK, border: `1px solid ${RULE}`,
              padding: '8px 14px', fontSize: 10, letterSpacing: '0.16em', fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>LAYOUT · {layout.toUpperCase()} ↻</button>
          </div>
        </div>
        <Rule thick />
      </div>
    );
  };

  // Layout presets — same content, different ordering
  const LAYOUTS = {
    classic: ['live', 'today', 'players', 'teams', 'standings', 'headlines', 'schedule'],
    'players-first': ['live', 'players', 'today', 'headlines', 'teams', 'standings', 'schedule'],
    minimal: ['live', 'today', 'headlines', 'players'],
  };

  const Section = ({ id }) => {
    if (id === 'live') {
      const live = D.games.find((g) => g.state === 'in' && (g.away.mine || g.home.mine));
      if (!live) return null;
      return (
        <div style={{ padding: '20px 28px 0' }}>
          <SectionHead title="On the field now" kicker="LIVE" />
          <HeroGame g={live} />
        </div>
      );
    }
    if (id === 'today') return (
      <div style={{ padding: '0 28px' }}>
        <SectionHead title="Today's slate" kicker="MLB · MLS" action="ALL GAMES →" />
        <GamesList />
      </div>
    );
    if (id === 'players') return (
      <div style={{ padding: '0 28px' }}>
        <SectionHead title="My players" kicker="3 FAVORITES" action="SEE ALL →" />
        <PlayersStrip />
      </div>
    );
    if (id === 'teams') return (
      <div style={{ padding: '0 28px' }}>
        <SectionHead title="My teams" kicker="3 CLUBS" action="MANAGE →" />
        <TeamsGrid />
      </div>
    );
    if (id === 'standings') return (
      <div style={{ padding: '0 28px' }}>
        <SectionHead title="Where they sit" kicker="STANDINGS" action="FULL TABLES →" />
        <Standings />
      </div>
    );
    if (id === 'headlines') return (
      <div style={{ padding: '0 28px' }}>
        <SectionHead title="On the wire" kicker="HEADLINES" action="ALL NEWS →" />
        <HeadlinesCol />
      </div>
    );
    if (id === 'schedule') return (
      <div style={{ padding: '0 28px 28px' }}>
        <SectionHead title="The week ahead" kicker="7 DAYS" action="FULL CALENDAR →" />
        <ScheduleStrip />
      </div>
    );
    return null;
  };

  return function V1Component() {
    const [layout, setLayout] = React.useState('classic');
    const layoutNames = Object.keys(LAYOUTS);
    const cycle = () => setLayout(layoutNames[(layoutNames.indexOf(layout) + 1) % layoutNames.length]);
    return (
      <div style={styles.root}>
        <Masthead layout={layout} onCycleLayout={cycle} />
        <LiveBanner />
        {LAYOUTS[layout].map((id) => <Section key={id} id={id} />)}
      </div>
    );
  };
})();

window.V1 = V1;
