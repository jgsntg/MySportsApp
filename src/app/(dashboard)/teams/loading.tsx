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

function TeamCardSkeleton() {
  return (
    <div style={{ background: SURFACE, borderRadius: 8, padding: 18, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
      <Bone w={52} h={52} r={8} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <Bone w="40%" h={9} />
        <Bone w="65%" h={15} />
      </div>
    </div>
  );
}

export default function TeamsLoading() {
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif', paddingBottom: 48 }}>
      <style>{`@keyframes msSkel { 0%,100%{opacity:.35} 50%{opacity:.7} }`}</style>

      {/* Sport tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[100, 90, 80, 75, 60, 65, 55, 70].map((w, i) => (
          <Bone key={i} w={w} h={32} r={8} />
        ))}
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 20 }}>
        <Bone w="100%" h={42} r={8} />
      </div>

      {/* Teams grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {Array.from({ length: 12 }).map((_, i) => <TeamCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
