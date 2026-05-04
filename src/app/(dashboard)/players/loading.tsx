const BG = '#0B1020';
const SURFACE = '#121A30';
const SURFACE2 = '#1A2440';

function Bone({ w, h, r = 6 }: { w?: number | string; h: number; r?: number }) {
  return (
    <div style={{
      width: w ?? '100%', height: h, borderRadius: r,
      background: SURFACE2, animation: 'msSkel 1.4s ease-in-out infinite',
      flexShrink: 0,
    }} />
  );
}

function PlayerRowSkeleton({ active = false }: { active?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, border: `1px solid ${active ? 'rgba(255,90,77,0.4)' : 'rgba(255,255,255,0.07)'}`, background: active ? 'rgba(255,90,77,0.05)' : SURFACE }}>
      <Bone w={36} h={36} r={999} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Bone w="70%" h={11} />
        <Bone w="50%" h={9} />
      </div>
    </div>
  );
}

export default function PlayersLoading() {
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif', padding: '24px 0 48px' }}>
      <style>{`@keyframes msSkel { 0%,100%{opacity:.35} 50%{opacity:.7} }`}</style>

      <Bone w={140} h={26} r={6} />

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, marginTop: 24, alignItems: 'start' }}>
        {/* Player list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <PlayerRowSkeleton active />
          {[1, 2, 3, 4].map(i => <PlayerRowSkeleton key={i} />)}
        </div>

        {/* Detail panel */}
        <div style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 24 }}>
          {/* Player header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <Bone w={64} h={64} r={999} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Bone w="45%" h={20} />
              <Bone w="30%" h={11} />
            </div>
            <Bone w={70} h={32} r={8} />
          </div>

          {/* Season stats */}
          <div style={{ marginBottom: 28 }}>
            <Bone w={100} h={9} r={4} />
            <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <Bone w={40} h={22} r={4} />
                  <Bone w={30} h={8} r={4} />
                </div>
              ))}
            </div>
          </div>

          {/* Recent games */}
          <div style={{ marginBottom: 28 }}>
            <Bone w={80} h={9} r={4} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 52, borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', background: SURFACE2, animation: 'msSkel 1.4s ease-in-out infinite' }} />
              ))}
            </div>
          </div>

          {/* News */}
          <div>
            <Bone w={80} h={9} r={4} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
              {[1, 2].map(i => (
                <div key={i} style={{ height: 68, borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', background: SURFACE2, animation: 'msSkel 1.4s ease-in-out infinite' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
