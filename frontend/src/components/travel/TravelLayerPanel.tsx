'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import {
  MapPin, Navigation, Footprints, Route, Camera,
  Landmark, Utensils, Building, ChevronLeft, ChevronRight,
  Layers, Map, X,
} from 'lucide-react';

export interface TravelLayerState {
  footprints: boolean;
  trips: boolean;
  tracks: boolean;
  photos: boolean;
  // 目的地图层
  attractions: boolean;
  culture: boolean;
  food: boolean;
  cities: boolean;
}

const DEFAULT_LAYERS: TravelLayerState = {
  footprints: true,
  trips: false,
  tracks: false,
  photos: false,
  attractions: false,
  culture: false,
  food: false,
  cities: false,
};

type LayerDef = {
  id: keyof TravelLayerState;
  icon: React.ReactNode;
  label: string;
  hasDetail?: boolean;  // 是否有详情面板
};

const DESTINATION_LAYERS: LayerDef[] = [
  { id: 'attractions', icon: <Landmark size={16} />, label: '景点' },
  { id: 'culture', icon: <Building size={16} />, label: '人文' },
  { id: 'food', icon: <Utensils size={16} />, label: '美食' },
  { id: 'cities', icon: <MapPin size={16} />, label: '城市' },
];

const MY_LAYERS: LayerDef[] = [
  { id: 'footprints', icon: <Footprints size={16} />, label: '足迹', hasDetail: true },
  { id: 'trips', icon: <Route size={16} />, label: '行程', hasDetail: true },
  { id: 'tracks', icon: <Navigation size={16} />, label: '轨迹' },
  { id: 'photos', icon: <Camera size={16} />, label: '照片' },
];

interface TravelLayerPanelProps {
  layers: TravelLayerState;
  onToggle: (id: keyof TravelLayerState) => void;
  onOpenDetail: (id: keyof TravelLayerState) => void;
  isOpen: boolean;
  onTogglePanel: () => void;
  isDark: boolean;
  accentColor: string;
}

export function TravelLayerPanel({
  layers, onToggle, onOpenDetail,
  isOpen, onTogglePanel, isDark, accentColor,
}: TravelLayerPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onTogglePanel();
    };
    const timer = setTimeout(() => document.addEventListener('pointerdown', handler), 100);
    return () => { clearTimeout(timer); document.removeEventListener('pointerdown', handler); };
  }, [isOpen, onTogglePanel]);

  // Swipe left to close
  const touchStartX = useRef(0);
  const swiping = useRef(false);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiping.current = false;
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (dx < -20 && Math.abs(dx) > Math.abs(e.touches[0].clientY - touchStartX.current)) swiping.current = true;
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (swiping.current) { onTogglePanel(); swiping.current = false; }
  }, [onTogglePanel]);

  const bg = isDark ? 'bg-gray-950/95' : 'bg-white/95';
  const border = isDark ? 'border-white/10' : 'border-gray-200';

  const renderLayer = (def: LayerDef) => {
    const active = layers[def.id];
    return (
      <div key={def.id} className="flex items-center gap-2">
        <button
          onClick={() => onToggle(def.id)}
          className={`
            flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
            ${active
              ? (isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-900')
              : (isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-50')
            }
          `}
          style={active ? { color: accentColor } : undefined}
        >
          {def.icon}
          <span>{def.label}</span>
        </button>
        {def.hasDetail && active && (
          <button
            onClick={() => onOpenDetail(def.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
            }`}
            title={`展开${def.label}面板`}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    );
  };

  const sectionTitle = isDark ? 'text-gray-600 text-xs font-medium px-3 pt-4 pb-1' : 'text-gray-400 text-xs font-medium px-3 pt-4 pb-1';

  return (
    <div
      ref={panelRef}
      className={`
        absolute top-0 left-0 z-20 h-full
        w-[280px] max-w-[80vw]
        ${bg} backdrop-blur-xl
        border-r ${border}
        transition-transform duration-300 ease-in-out
        flex flex-col
        select-none
        ${isOpen ? 'translate-x-0' : '-translate-x-[232px]'}
      `}
      style={{ touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={e => e.stopPropagation()}
    >
      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className={`flex items-center justify-between px-4 h-12 shrink-0 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <Layers size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            <h2 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>图层</h2>
          </div>
          <button onClick={onTogglePanel} className={`p-1 rounded ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
          <div className={sectionTitle}>目的地</div>
          {DESTINATION_LAYERS.map(renderLayer)}
          {DESTINATION_LAYERS.every(l => !layers[l.id]) && (
            <p className={`text-xs px-3 py-2 ${isDark ? 'text-gray-700' : 'text-gray-300'}`}>暂无数据，敬请期待</p>
          )}
          <div className={sectionTitle}>我的</div>
          {MY_LAYERS.map(renderLayer)}
        </div>
      </div>

      {/* Toggle tab (always visible) */}
      <div className={`w-12 shrink-0 flex flex-col items-center py-3 border-l ${border}`}>
        <button
          onClick={onTogglePanel}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  );
}

export { DEFAULT_LAYERS };
export type { LayerDef };
