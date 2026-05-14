'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Map as MapLibreMap, FilterSpecification } from 'maplibre-gl';
import { CloudOff, Cloud, Eye, EyeOff } from 'lucide-react';

interface FogOverlayProps {
  map: MapLibreMap | null;
  footprints: Record<string, import('@/lib/types').FootprintRecord>;
  activeCountry: string;
  currentLevel: number;
  isDark: boolean;
}

export function FogOverlay({ map, footprints, activeCountry, currentLevel, isDark }: FogOverlayProps) {
  const [fogEnabled, setFogEnabled] = useState(false);
  const [revealAnim, setRevealAnim] = useState<string | null>(null);
  const prevFogRef = useRef(false);

  // Build lit adcodes for current level
  const litAdcodes = useCallback((): string[] => {
    return Object.entries(footprints)
      .filter(([adcode, fp]) => {
        if (fp.level === currentLevel) return true;
        if (currentLevel === 3 && fp.level === 2) return true;
        if (currentLevel === 4 && fp.level === 3) return true;
        return false;
      })
      .map(([adcode]) => adcode);
  }, [footprints, currentLevel]);

  // Add fog layers on map ready
  useEffect(() => {
    const m = map;
    if (!m || !m.getSource('footprints-regions')) return;

    // Check if fog layers already exist
    if (m.getLayer('fog-fill')) return;

    // Fog layers sit below lit but above unlit
    m.addLayer({
      id: 'fog-fill',
      type: 'fill',
      source: 'footprints-regions',
      paint: {
        'fill-color': [
          'interpolate', ['linear'], ['zoom'],
          2, '#1a1a2e',
          5, '#16213e',
          8, '#0f3460',
        ],
        'fill-opacity': [
          'interpolate', ['linear'], ['zoom'],
          2, 0.85,
          5, 0.75,
          8, 0.6,
        ],
        'fill-antialias': true,
      },
      filter: ['literal', false],
    }, 'fp-lit-fill');

    m.addLayer({
      id: 'fog-glow',
      type: 'fill',
      source: 'footprints-regions',
      paint: {
        'fill-color': '#e2e8f0',
        'fill-opacity': 0.08,
        'fill-antialias': true,
      },
      filter: ['literal', false],
    }, 'fp-lit-fill');

    return () => {
      try { if (m.getLayer('fog-glow')) m.removeLayer('fog-glow'); } catch {}
      try { if (m.getLayer('fog-fill')) m.removeLayer('fog-fill'); } catch {}
    };
  }, [map]);

  // Update fog filter when enabled/disabled or footprints change
  useEffect(() => {
    const m = map;
    if (!m || !m.getLayer('fog-fill')) return;

    if (fogEnabled) {
      const lit = litAdcodes();
      // Fog covers all UNLIT regions
      const fogFilter: FilterSpecification = [
        'all',
        ['!', ['in', ['get', 'adcode'], ['literal', lit]]],
        ['!=', ['get', '_neighbor'], true],
      ];
      m.setFilter('fog-fill', fogFilter);

      // Glow around lit regions (lit regions get a subtle glow)
      const glowFilter: FilterSpecification = [
        'all',
        ['in', ['get', 'adcode'], ['literal', lit]],
      ];
      m.setFilter('fog-glow', glowFilter);

      // When fog is on, make unlit regions nearly invisible
      if (m.getLayer('fp-unlit-fill')) {
        m.setPaintProperty('fp-unlit-fill', 'fill-opacity', 0.01);
      }
      if (m.getLayer('fp-unlit-line')) {
        m.setPaintProperty('fp-unlit-line', 'line-opacity', 0.02);
      }
      // Make lit regions more vibrant
      if (m.getLayer('fp-lit-fill')) {
        m.setPaintProperty('fp-lit-fill', 'fill-opacity', 0.7);
        m.setPaintProperty('fp-lit-fill', 'fill-color', '#818cf8');
      }
      if (m.getLayer('fp-lit-line')) {
        m.setPaintProperty('fp-lit-line', 'line-color', '#a5b4fc');
        m.setPaintProperty('fp-lit-line', 'line-width', 2);
      }
      // Dim labels for unlit
      if (m.getLayer('fp-label')) {
        m.setPaintProperty('fp-label', 'text-opacity', 0.15);
      }
    } else {
      // Restore normal styling
      m.setFilter('fog-fill', ['literal', false]);
      m.setFilter('fog-glow', ['literal', false]);
      if (m.getLayer('fp-unlit-fill')) {
        m.setPaintProperty('fp-unlit-fill', 'fill-opacity', 0.03);
      }
      if (m.getLayer('fp-unlit-line')) {
        m.setPaintProperty('fp-unlit-line', 'line-opacity', 0.06);
      }
      if (m.getLayer('fp-lit-fill')) {
        m.setPaintProperty('fp-lit-fill', 'fill-opacity', 0.5);
        m.setPaintProperty('fp-lit-fill', 'fill-color', '#6366f1');
      }
      if (m.getLayer('fp-lit-line')) {
        m.setPaintProperty('fp-lit-line', 'line-color', '#818cf8');
        m.setPaintProperty('fp-lit-line', 'line-width', 1.5);
      }
      if (m.getLayer('fp-label')) {
        m.setPaintProperty('fp-label', 'text-opacity', 1);
      }
    }

    prevFogRef.current = fogEnabled;
  }, [map, fogEnabled, litAdcodes]);

  // Animate reveal when a new footprint is added while fog is on
  useEffect(() => {
    if (!fogEnabled || !revealAnim) return;
    const timer = setTimeout(() => setRevealAnim(null), 1000);
    return () => clearTimeout(timer);
  }, [fogEnabled, revealAnim]);

  const toggleFog = useCallback(() => {
    setFogEnabled(prev => !prev);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={toggleFog}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
          fogEnabled
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30'
            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
        }`}
      >
        {fogEnabled ? <CloudOff size={14} /> : <Cloud size={14} />}
        {fogEnabled ? '关闭迷雾' : '迷雾模式'}
      </button>

      {/* Fog coverage indicator */}
      {fogEnabled && map?.getSource('footprints-regions') && (
        <FogCoverageIndicator
          map={map}
          footprints={footprints}
          currentLevel={currentLevel}
          isDark={isDark}
        />
      )}
    </div>
  );
}

/** Shows how much of the map is covered by fog */
function FogCoverageIndicator({
  map,
  footprints,
  currentLevel,
  isDark,
}: {
  map: MapLibreMap;
  footprints: Record<string, import('@/lib/types').FootprintRecord>;
  currentLevel: number;
  isDark: boolean;
}) {
  const [coverage, setCoverage] = useState<{ lit: number; total: number; percent: number } | null>(null);

  useEffect(() => {
    const source = map.getSource('footprints-regions') as any;
    if (!source) return;

    const update = () => {
      const data = source._data;
      if (!data?.features) return;

      const allFeatures = data.features.filter(
        (f: any) => !f.properties?._neighbor
      );
      const total = allFeatures.length;
      const litIds = new Set(
        Object.entries(footprints)
          .filter(([, fp]) => fp.level === currentLevel)
          .map(([adcode]) => adcode)
      );
      const lit = allFeatures.filter((f: any) => litIds.has(String(f.properties?.adcode))).length;

      setCoverage({
        lit,
        total,
        percent: total > 0 ? Math.round((lit / total) * 100) : 0,
      });
    };

    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, [map, footprints, currentLevel]);

  if (!coverage) return null;

  return (
    <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${
      isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-50 text-gray-600'
    }`}>
      <div className="flex justify-between mb-1">
        <span>已探索</span>
        <span className="font-medium">{coverage.percent}%</span>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${coverage.percent}%`,
            background: coverage.percent > 80
              ? 'linear-gradient(90deg, #10b981, #34d399)'
              : coverage.percent > 40
              ? 'linear-gradient(90deg, #3b82f6, #818cf8)'
              : 'linear-gradient(90deg, #6366f1, #a78bfa)',
          }}
        />
      </div>
      <div className="text-[10px] opacity-50 mt-1">
        {coverage.lit} / {coverage.total} 个区域
      </div>
    </div>
  );
}
