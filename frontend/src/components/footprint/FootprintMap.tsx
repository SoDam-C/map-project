'use client';

import { useRef, useState, useCallback } from 'react';
import { MapViewer, type MapViewerHandle } from '@/components/map/MapViewer';
import { basemapStyles } from '@/lib/mapStyles';
import { accentFrom } from '@/lib/theme';
import { Globe, ZoomIn, ZoomOut, RotateCcw, Lock } from 'lucide-react';
import { basemapList } from '@/lib/mapStyles';
import type { AccentColors } from '@/lib/theme';

interface FootprintMapProps {
  onMapReady: (map: import('maplibre-gl').Map) => void;
  isDark: boolean;
  accentColor: string;
}

export function FootprintMap({ onMapReady, isDark, accentColor }: FootprintMapProps) {
  const mapViewerRef = useRef<MapViewerHandle>(null);
  const [basemapId, setBasemapId] = useState('amap');
  const [basemapOpen, setBasemapOpen] = useState(false);
  const style = basemapStyles[basemapId];
  const accent = accentFrom(style?.accent ?? accentColor);

  const handleMapReady = useCallback((map: import('maplibre-gl').Map) => {
    onMapReady(map);
  }, [onMapReady]);

  const handleZoomIn = useCallback(() => mapViewerRef.current?.getMap()?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapViewerRef.current?.getMap()?.zoomOut(), []);
  const handleReset = useCallback(() => {
    const map = mapViewerRef.current?.getMap();
    if (map) map.easeTo({ center: [104, 35], zoom: 4, duration: 1000 });
  }, []);

  const inactiveBtn = isDark
    ? 'bg-black/40 text-gray-200 border border-white/10 hover:bg-black/50'
    : 'bg-white/60 text-gray-700 border border-black/10 hover:bg-white/70';
  const menuBg = isDark
    ? 'bg-black/50 backdrop-blur-xl border border-white/10'
    : 'bg-white/70 backdrop-blur-xl border border-black/10';

  return (
    <div className="absolute inset-0">
      <MapViewer
        ref={mapViewerRef}
        basemapTheme={basemapId}
        onMapReady={handleMapReady}
        initialCenter={[104, 35]}
        initialZoom={4}
      />

      {/* 右上角控制按钮 */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
        {/* 底图选择 */}
        <div className="relative">
          <button
            onClick={() => setBasemapOpen(prev => !prev)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${inactiveBtn}`}
            style={basemapOpen ? { backgroundColor: accentColor, color: '#fff' } : undefined}
          >
            <Globe size={18} />
          </button>
          {basemapOpen && (
            <div className={`absolute top-12 right-0 rounded-lg shadow-xl py-1 min-w-[160px] ${menuBg}`}>
              {basemapList.map(s => {
                const locked = s.requiresKey;
                const active = basemapId === s.id;
                const activeStyle = active ? { backgroundColor: accentColor, color: '#fff' } : undefined;
                return (
                  <button
                    key={s.id}
                    onClick={() => { if (!locked) setBasemapId(s.id); setBasemapOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                      active ? '' : locked
                        ? 'text-yellow-500/80'
                        : (isDark ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-black/5')
                    }`}
                    style={activeStyle}
                  >
                    <span className="w-3 h-3 rounded-full border-2 shrink-0 flex items-center justify-center">
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="flex-1 truncate">{s.name}</span>
                    {locked && <Lock size={12} className="shrink-0 text-gray-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={handleZoomIn} className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${inactiveBtn}`}>
          <ZoomIn size={18} />
        </button>
        <button onClick={handleZoomOut} className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${inactiveBtn}`}>
          <ZoomOut size={18} />
        </button>
        <button onClick={handleReset} className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${inactiveBtn}`}>
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
