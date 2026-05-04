'use client';

import React, { memo } from 'react';

export type ThemeKey   = 'dark' | 'dim' | 'contrast';
export type AccentKey  = 'coral' | 'cyan' | 'lime' | 'rose';
export type DensityKey = 'compact' | 'cozy' | 'comfy';

export interface TweaksState {
  theme: ThemeKey;
  density: DensityKey;
  accent: AccentKey;
  showTicker: boolean;
  showLiveBanner: boolean;
  visible: Record<string, boolean>;
  collapsed: Record<string, boolean>;
}

// Accent colors needed for the color swatch buttons
const ACCENT_COLORS: Record<AccentKey, { a: string; b: string }> = {
  coral: { a: '#FF5A4D', b: '#FFD166' },
  cyan:  { a: '#22D3EE', b: '#A78BFA' },
  lime:  { a: '#A3E635', b: '#FACC15' },
  rose:  { a: '#F43F5E', b: '#FB923C' },
};

function TweakGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: 'var(--ms-muted)', marginBottom: 5, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}

function SegControl({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 2, gap: 2 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          flex: 1, padding: '5px 4px', border: 'none',
          background: value === o ? 'var(--ms-a)' : 'transparent',
          color: value === o ? '#000' : 'var(--ms-ink)',
          fontSize: 10, fontWeight: value === o ? 800 : 500,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
        }}>{o}</button>
      ))}
    </div>
  );
}

function ToggleControl({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 34, height: 18, borderRadius: 999, border: 'none', padding: 0,
      background: value ? 'var(--ms-a)' : 'rgba(255,255,255,0.15)',
      position: 'relative', cursor: 'pointer', transition: 'background 0.15s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 2, left: value ? 18 : 2,
        width: 14, height: 14, borderRadius: '50%', background: '#fff',
        transition: 'left 0.15s', display: 'block',
      }} />
    </button>
  );
}

export default memo(function TweaksPanel({ tweaks, set, sections }: {
  tweaks: TweaksState;
  set: (k: string, v: unknown) => void;
  sections: Array<{ id: string; title: string }>;
}) {
  return (
    <div style={{
      position: 'fixed', right: 16, bottom: 16, zIndex: 50, width: 256,
      background: 'rgba(18,26,48,0.96)', backdropFilter: 'blur(16px)',
      border: '1px solid var(--ms-border)', borderRadius: 12, padding: 14,
      color: 'var(--ms-ink)', fontSize: 11, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 800, color: 'var(--ms-muted)', marginBottom: 12 }}>TWEAKS</div>

      <TweakGroup label="Theme">
        <SegControl value={tweaks.theme} options={['dark', 'dim', 'contrast']} onChange={v => set('theme', v)} />
      </TweakGroup>
      <TweakGroup label="Density">
        <SegControl value={tweaks.density} options={['compact', 'cozy', 'comfy']} onChange={v => set('density', v)} />
      </TweakGroup>
      <TweakGroup label="Accent">
        <div style={{ display: 'flex', gap: 6 }}>
          {(Object.entries(ACCENT_COLORS) as [AccentKey, { a: string; b: string }][]).map(([k, v]) => (
            <button key={k} onClick={() => set('accent', k)} title={k} style={{
              flex: 1, height: 26, padding: 0, cursor: 'pointer', borderRadius: 5,
              border: tweaks.accent === k ? `2px solid ${v.a}` : '1px solid var(--ms-border)',
              background: `linear-gradient(135deg, ${v.a} 50%, ${v.b} 50%)`,
            }} />
          ))}
        </div>
      </TweakGroup>
      <TweakGroup label="Ticker">
        <ToggleControl value={tweaks.showTicker} onChange={v => set('showTicker', v)} />
      </TweakGroup>
      <TweakGroup label="Live banner">
        <ToggleControl value={tweaks.showLiveBanner} onChange={v => set('showLiveBanner', v)} />
      </TweakGroup>

      <div style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 800, color: 'var(--ms-muted)', margin: '14px 0 8px' }}>SECTIONS</div>
      {sections.map(({ id, title }) => (
        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
          <span style={{ fontSize: 11, color: 'var(--ms-ink)' }}>{title}</span>
          <ToggleControl value={tweaks.visible[id] !== false} onChange={v => set('visible', { ...tweaks.visible, [id]: v })} />
        </div>
      ))}
    </div>
  );
});
