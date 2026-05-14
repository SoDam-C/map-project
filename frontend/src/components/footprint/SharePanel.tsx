'use client';

import { X } from 'lucide-react';
import { SharePoster } from './SharePoster';
import type { CountryFootprintStats } from '@/lib/types';
import type { CountryConfig } from '@/lib/countries';

interface SharePanelProps {
  stats: CountryFootprintStats;
  countryConfig: CountryConfig;
  isDark: boolean;
  onClose: () => void;
}

export function SharePanel({ stats, countryConfig, isDark, onClose }: SharePanelProps) {
  const panelBg = isDark
    ? 'bg-gray-900/90 backdrop-blur-xl border border-white/10'
    : 'bg-white/90 backdrop-blur-xl border border-gray-200';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* 弹窗 */}
      <div className={`relative w-80 rounded-xl shadow-2xl ${panelBg}`}>
        <div className="flex items-center justify-between p-4 pb-2">
          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>分享我的足迹</span>
          <button onClick={onClose} className={`p-1 rounded ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X size={16} />
          </button>
        </div>
        <div className="p-4 pt-0">
          <SharePoster stats={stats} countryConfig={countryConfig} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}
