'use client';

import { Activity, Ship, Plane, Gem, Wheat, Footprints, Route, Navigation } from 'lucide-react';
import type { AccentColors } from '@/lib/theme';

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  activity: Activity,
  ship: Ship,
  plane: Plane,
  gem: Gem,
  wheat: Wheat,
  footprints: Footprints,
  route: Route,
  navigation: Navigation,
};

interface LayerToggleProps {
  name: string;
  icon: string;
  visible: boolean;
  loaded: boolean;
  loading: boolean;
  onToggle: () => void;
  isDark: boolean;
  accent: AccentColors;
}

export function LayerToggle({
  name,
  icon,
  visible,
  loaded,
  loading,
  onToggle,
  isDark,
  accent,
}: LayerToggleProps) {
  const IconComponent = iconMap[icon] ?? Activity;

  const hoverBg = isDark ? 'hover:bg-white/5' : 'hover:bg-black/5';
  const nameColor = isDark ? 'text-gray-200' : 'text-gray-800';
  const loadingColor = isDark ? 'text-gray-500' : 'text-gray-400';
  const iconInactive = isDark
    ? 'bg-white/10 text-gray-400'
    : 'bg-black/10 text-gray-500';
  const trackInactive = isDark ? 'bg-white/20' : 'bg-black/20';

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 ${hoverBg} transition-colors cursor-pointer`}
      onClick={onToggle}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-md ${visible ? 'text-white' : iconInactive}`}
        style={visible ? { backgroundColor: accent.bg } : undefined}
      >
        <IconComponent size={16} />
      </div>
      <div className="flex flex-1 flex-col">
        <span className={`text-sm font-medium ${nameColor}`}>{name}</span>
        {!loaded && loading && (
          <span className={`text-xs ${loadingColor}`}>加载中...</span>
        )}
      </div>
      <div
        role="switch"
        aria-checked={visible}
        className={`relative h-5 w-9 rounded-full transition-colors ${visible ? '' : trackInactive}`}
        style={visible ? { backgroundColor: accent.bg } : undefined}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${visible ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </div>
    </div>
  );
}
