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

function CardSkeleton() {
  return (
    <div style={{ background: SURFACE, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Bone w={40} h={10} />
        <Bone w={50} h={10} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bone w={26} h={26} r={4} />
        <Bone w="60%" h={12} />
        <Bone w={28} h={18} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Bone w={26} h={26} r={4} />
        <Bone w="50%" h={12} />
        <Bone w={28} h={18} />
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <Bone w="40%" h={9} />
        <Bone w={30} h={9} />
      </div>
    </div>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14 }}>
        <Bone w={80} h={11} />
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        <Bone w={60} h={11} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {Array.from({ length: rows }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div style={{ background: BG, minHeight: '100vh', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <style>{`@keyframes msSkel { 0%,100%{opacity:.35} 50%{opacity:.7} }`}</style>

      {/* Ticker bar */}
      <div style={{ height: 40, background: '#000', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 14 }}>
        <Bone w={42} h={22} r={4} />
        <Bone w="60%" h={12} />
      </div>

      {/* Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 0 24px', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Bone w={120} h={10} />
          <Bone w={260} h={24} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Bone w={64} h={32} r={8} />
          <Bone w={100} h={32} r={8} />
          <Bone w={80} h={32} r={8} />
        </div>
      </div>

      <SectionSkeleton rows={6} />
      <SectionSkeleton rows={3} />
      <SectionSkeleton rows={3} />
    </div>
  );
}
