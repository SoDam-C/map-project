'use client';

import { Layers, Globe, MapPin, HelpCircle, Compass } from 'lucide-react';
import type { LayerRuntimeState } from '@/layers/types';
import type { AccentColors } from '@/lib/theme';
import { layerRegistry } from './registry';
import { LayerToggle } from './LayerToggle';

interface LayerPanelProps {
  layerStates: ReadonlyMap<string, LayerRuntimeState>;
  onToggleLayer: (layerId: string) => void;
  isOpen: boolean;
  onTogglePanel: () => void;
  onOpenGuide: () => void;
  isDark: boolean;
  accent: AccentColors;
}

const sectionConfig: Record<string, { label: string; icon: React.ReactNode; empty?: string }> = {
  world: { label: '世界数据', icon: <Globe size={14} /> },
  travel: { label: '旅行', icon: <Compass size={14} /> },
  personal: { label: '我的数据', icon: <MapPin size={14} />, empty: '暂无个人数据图层' },
};

export function LayerPanel({
  layerStates,
  onToggleLayer,
  isOpen,
  onTogglePanel,
  onOpenGuide,
  isDark,
  accent,
}: LayerPanelProps) {
  const sections = ['world', 'travel', 'personal'] as const;

  const panelBg = isDark
    ? 'bg-black/50 backdrop-blur-xl border-r border-white/10'
    : 'bg-white/70 backdrop-blur-xl border-r border-black/10';
  const headerBorder = isDark ? 'border-white/10' : 'border-black/10';
  const toggleBtn = isDark
    ? 'bg-black/40 text-gray-200 border border-white/10 hover:bg-black/50'
    : 'bg-white/60 text-gray-700 border border-black/10 hover:bg-white/70';
  const headerBtn = isDark
    ? 'text-gray-400 hover:text-white hover:bg-white/10'
    : 'text-gray-500 hover:text-gray-900 hover:bg-black/5';
  const titleColor = isDark ? 'text-gray-400' : 'text-gray-500';
  const sectionTitle = isDark ? 'text-gray-500' : 'text-gray-400';
  const catTitle = isDark ? 'text-gray-600' : 'text-gray-400';
  const emptyText = isDark ? 'text-gray-600' : 'text-gray-400';

  return (
    <>
      {!isOpen && (
        <button
          onClick={onTogglePanel}
          className={`absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg shadow-md backdrop-blur-xl transition-colors ${toggleBtn}`}
          title="打开图层"
        >
          <Layers size={18} />
        </button>
      )}

      <div
        className={`absolute top-0 left-0 z-10 h-full w-72 transform transition-transform duration-300 ease-in-out ${panelBg} ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center justify-between border-b ${headerBorder} px-4 py-3`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider ${titleColor}`}>
            图层
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenGuide}
              className={`transition-colors p-1 rounded ${headerBtn}`}
              title="使用说明"
            >
              <HelpCircle size={16} />
            </button>
            <button
              onClick={onTogglePanel}
              className={`transition-colors p-1 rounded ${headerBtn}`}
              title="关闭"
            >
              <Layers size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-3 space-y-4" style={{ maxHeight: 'calc(100vh - 56px)' }}>
          {sections.map((section) => {
            const config = sectionConfig[section];
            const categories = layerRegistry.getCategoriesBySection(section);

            return (
              <div key={section}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={sectionTitle}>{config.icon}</span>
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${sectionTitle}`}>
                    {config.label}
                  </h3>
                </div>

                {categories.length === 0 ? (
                  <p className={`text-xs ${emptyText} px-3 py-2`}>{config.empty}</p>
                ) : (
                  <div className="space-y-3">
                    {categories.map((category) => {
                      const layers = layerRegistry.getLayersByCategory(category);
                      return (
                        <div key={category}>
                          <h4 className={`mb-0.5 px-3 text-[11px] ${catTitle} font-medium`}>
                            {category}
                          </h4>
                          <div className="space-y-0.5">
                            {layers.map((def) => {
                              const state = layerStates.get(def.id);
                              if (!state) return null;
                              return (
                                <LayerToggle
                                  key={def.id}
                                  name={def.name}
                                  icon={def.icon}
                                  visible={state.visible}
                                  loaded={state.loaded}
                                  loading={state.loading}
                                  onToggle={() => onToggleLayer(def.id)}
                                  isDark={isDark}
                                  accent={accent}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
