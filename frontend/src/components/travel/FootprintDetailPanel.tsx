'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import {
  BarChart3, Trophy, Heart, Share2, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import type { AdminLevel } from '@/lib/adminRegions';
import { FootprintStatsPanel } from '@/components/footprint/FootprintStats';
import { ExplorerLevelBadge } from '@/components/footprint/ExplorerLevelBadge';
import { AchievementsPanel } from '@/components/footprint/Achievements';
import { WishlistPanel } from '@/components/footprint/WishlistPanel';
import { SharePoster } from '@/components/footprint/SharePoster';
import type { AchievementStats } from '@/lib/achievements';

type FootprintTab = 'stats' | 'achievements' | 'wishlist' | 'share';

const TABS: { id: FootprintTab; icon: React.ReactNode; label: string }[] = [
  { id: 'stats', icon: <BarChart3 size={18} />, label: '统计' },
  { id: 'achievements', icon: <Trophy size={18} />, label: '成就' },
  { id: 'wishlist', icon: <Heart size={18} />, label: '愿望' },
  { id: 'share', icon: <Share2 size={18} />, label: '分享' },
];

interface FootprintDetailPanelProps {
  visible: boolean;
  onClose: () => void;
  // Footprint data
  countryStats: any;
  countryConfig: any;
  achievementStats: AchievementStats;
  getOverallPercentage: () => number;
  getCountryLitAdcodes: (country: string) => Set<string>;
  resetFootprints: () => void;
  activeCountry: string;
  currentLevel: AdminLevel;
  onLevelChange: (level: AdminLevel) => void;
  isDark: boolean;
}

export function FootprintDetailPanel({
  visible, onClose,
  countryStats, countryConfig, achievementStats,
  getOverallPercentage, getCountryLitAdcodes, resetFootprints,
  activeCountry, currentLevel, onLevelChange,
  isDark,
}: FootprintDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<FootprintTab>('stats');
  const panelRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!visible) return;
    const handler = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const timer = setTimeout(() => document.addEventListener('pointerdown', handler), 100);
    return () => { clearTimeout(timer); document.removeEventListener('pointerdown', handler); };
  }, [visible, onClose]);

  const bg = isDark ? 'bg-gray-950/95' : 'bg-white/95';
  const border = isDark ? 'border-white/10' : 'border-gray-200';

  return (
    <div
      ref={panelRef}
      className={`
        absolute top-0 right-0 z-20 h-full
        w-[360px] max-w-[85vw]
        ${bg} backdrop-blur-xl
        border-l ${border}
        transition-transform duration-300 ease-in-out
        flex flex-col
        ${visible ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 h-12 shrink-0 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
        <h2 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {TABS.find(t => t.id === activeTab)?.label}
        </h2>
        <button onClick={onClose} className={`p-1 rounded ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <X size={16} />
        </button>
      </div>

      {/* Tab bar */}
      <div className={`flex border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors ${
              activeTab === tab.id
                ? (isDark ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-indigo-600 border-b-2 border-indigo-600')
                : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600')
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {activeTab === 'stats' && (
          <div className="p-4 space-y-3">
            <ExplorerLevelBadge overallPercent={getOverallPercentage()} />
            <FootprintStatsPanel
              stats={countryStats}
              achievementStats={achievementStats}
              onReset={resetFootprints}
              onOpenShare={() => setActiveTab('share')}
              currentLevel={currentLevel}
              onLevelChange={onLevelChange}
              countryConfig={countryConfig}
              isDark={isDark}
            />
          </div>
        )}
        {activeTab === 'achievements' && (
          <AchievementsPanel stats={achievementStats} isDark={isDark} />
        )}
        {activeTab === 'wishlist' && (
          <WishlistPanel isDark={isDark} litAdcodes={getCountryLitAdcodes(activeCountry)} />
        )}
        {activeTab === 'share' && (
          <div className="p-4">
            <SharePoster stats={countryStats} countryConfig={countryConfig} isDark={isDark} />
          </div>
        )}
      </div>
    </div>
  );
}
