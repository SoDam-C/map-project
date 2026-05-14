'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import type { CountryFootprintStats } from '@/lib/types';
import type { AchievementStats } from '@/lib/achievements';
import type { CountryConfig } from '@/lib/countries';
import type { AdminLevel } from '@/lib/adminRegions';

interface FootprintStatsPanelProps {
  stats: CountryFootprintStats;
  achievementStats: AchievementStats;
  onReset: () => void;
  onOpenShare: () => void;
  currentLevel: AdminLevel;
  onLevelChange: (level: AdminLevel) => void;
  countryConfig: CountryConfig;
  isDark: boolean;
}

export function FootprintStatsPanel({
  stats,
  achievementStats,
  onReset,
  onOpenShare,
  currentLevel,
  onLevelChange,
  countryConfig,
  isDark,
}: FootprintStatsPanelProps) {
  const [statsOpen, setStatsOpen] = useState(true);

  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500';
  const subText = isDark ? 'text-gray-600' : 'text-gray-400';
  const barBg = isDark ? 'bg-white/10' : 'bg-black/10';
  const barFill = isDark ? 'bg-white/30' : 'bg-black/20';

  const levels = countryConfig.levels;

  return (
    <div className="space-y-0.5">
      {/* 足迹统计 */}
      <button
        onClick={() => setStatsOpen(!statsOpen)}
        className="w-full flex items-center gap-1 px-4 py-1 text-left"
      >
        {statsOpen ? <ChevronDown size={12} className={subText} /> : <ChevronRight size={12} className={subText} />}
        <span className={`text-[11px] ${mutedText}`}>足迹统计</span>
      </button>

      {statsOpen && (
        <div className="px-4 pb-3 space-y-3">
          {/* 行政级别切换 */}
          <div className="flex gap-1">
            {levels.map(level => {
              const active = currentLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => onLevelChange(level)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    active
                      ? (isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-200')
                      : (isDark ? 'bg-white/5 text-gray-500 border border-white/5' : 'bg-gray-50 text-gray-400 border border-gray-100')
                  }`}
                >
                  {countryConfig.levelNames[level] || `L${level}`}
                </button>
              );
            })}
          </div>

          {/* 当前级别的统计 */}
          {levels.map(level => {
            if (level !== currentLevel) return null;
            const total = countryConfig.levelTotals[level] || 0;
            const count = stats.counts[level] || 0;
            const pct = stats.percentages[level] || 0;
            return (
              <div key={level} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] ${mutedText}`}>
                    {countryConfig.levelNames[level]}
                  </span>
                  <span className={`text-[11px] ${subText}`}>
                    {count} / {total.toLocaleString()}
                    <span className="ml-1 text-[10px]">{pct}%</span>
                  </span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${barBg}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barFill}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}

          <button onClick={onReset} className="flex items-center gap-1 text-[10px] text-red-400/60 hover:text-red-400 transition-colors">
            <RotateCcw size={10} /> 重置
          </button>
        </div>
      )}
    </div>
  );
}
