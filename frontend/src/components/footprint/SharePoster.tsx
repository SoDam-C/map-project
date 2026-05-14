'use client';

import { useRef, useCallback, useState, useMemo } from 'react';
import { Download, Share2, Loader2, Palette, LayoutGrid } from 'lucide-react';
import type { CountryFootprintStats } from '@/lib/types';
import { calculateExplorerLevel } from '@/lib/explorerLevel';
import type { CountryConfig } from '@/lib/countries';
import type { AdminLevel } from '@/lib/adminRegions';

interface SharePosterProps {
  stats: CountryFootprintStats;
  countryConfig: CountryConfig;
  username?: string;
  isDark: boolean;
}

type PosterTheme = 'dark' | 'gradient' | 'warm' | 'ocean';
type PosterLayout = 'square' | 'vertical';

const THEMES: Record<PosterTheme, { name: string; bg: string; accent: string; text: string; sub: string; bar: string }> = {
  dark: {
    name: '深邃夜空',
    bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    accent: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    text: '#ffffff',
    sub: 'rgba(255,255,255,0.5)',
    bar: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
  },
  gradient: {
    name: '渐变紫',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accent: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
    text: '#ffffff',
    sub: 'rgba(255,255,255,0.7)',
    bar: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
  },
  warm: {
    name: '暖阳橙',
    bg: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)',
    accent: 'linear-gradient(90deg, #fef3c7, #fde68a)',
    text: '#ffffff',
    sub: 'rgba(255,255,255,0.7)',
    bar: 'linear-gradient(90deg, #fef3c7, #fde68a)',
  },
  ocean: {
    name: '深海蓝',
    bg: 'linear-gradient(135deg, #0c4a6e 0%, #164e63 50%, #134e4a 100%)',
    accent: 'linear-gradient(90deg, #2dd4bf, #22d3ee)',
    text: '#ffffff',
    sub: 'rgba(255,255,255,0.6)',
    bar: 'linear-gradient(90deg, #2dd4bf, #22d3ee)',
  },
};

export function SharePoster({ stats, countryConfig, username = '旅行者', isDark }: SharePosterProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState<PosterTheme>('dark');
  const [layout, setLayout] = useState<PosterLayout>('square');
  const [showThemePicker, setShowThemePicker] = useState(false);

  const currentTheme = THEMES[theme];

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const levels = countryConfig.levels.filter(l => l > 0);
    if (levels.length === 0) return 0;
    const totalPercent = levels.reduce((sum: number, level) => {
      return sum + (stats.percentages[level] || 0);
    }, 0);
    return Math.round(totalPercent / levels.length);
  }, [stats, countryConfig]);

  // Find highest level with progress
  const highlightLevel = useMemo(() => {
    const levels = countryConfig.levels.filter(l => l > 0);
    for (let i = levels.length - 1; i >= 0; i--) {
      if ((stats.counts[levels[i]] || 0) > 0) return levels[i];
    }
    return levels[levels.length - 1] || 1;
  }, [stats, countryConfig]);

  const handleDownload = useCallback(async () => {
    if (!posterRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `footprint-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Failed to generate poster:', e);
    }
    setGenerating(false);
  }, []);

  const handleShare = useCallback(async () => {
    if (!posterRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'footprint.png', { type: 'image/png' });
        if (navigator.share) {
          await navigator.share({ files: [file], title: '我的足迹地图' });
        } else {
          const link = document.createElement('a');
          link.download = `footprint-${Date.now()}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
        }
      });
    } catch {
      // User cancelled or not supported
    }
    setGenerating(false);
  }, []);

  const btnBg = isDark
    ? 'bg-white/10 text-gray-300 hover:bg-white/15 border border-white/10'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200';

  const explorerLevel = calculateExplorerLevel(overallProgress);

  return (
    <div className="space-y-3">
      {/* 主题 + 布局选择 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs w-full transition-colors ${btnBg}`}
          >
            <Palette size={14} />
            <span className="flex-1 text-left">{currentTheme.name}</span>
          </button>
          {showThemePicker && (
            <div className={`mt-1 rounded-lg p-1 ${isDark ? 'bg-black/50 border border-white/10' : 'bg-white border border-gray-200'}`}>
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => { setTheme(key as PosterTheme); setShowThemePicker(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                    theme === key ? (isDark ? 'bg-white/10' : 'bg-gray-100') : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')
                  }`}
                >
                  <span className="w-4 h-4 rounded-full border border-white/20" style={{ background: t.bg }} />
                  <span className="flex-1 text-left">{t.name}</span>
                  {theme === key && <span className="text-blue-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setLayout(layout === 'square' ? 'vertical' : 'square')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${btnBg}`}
          title={layout === 'square' ? '切换竖版' : '切换方版'}
        >
          <LayoutGrid size={14} />
          {layout === 'square' ? '竖版' : '方版'}
        </button>
      </div>
      <div className="relative">
        <button
          onClick={() => setShowThemePicker(!showThemePicker)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs w-full transition-colors ${btnBg}`}
        >
          <Palette size={14} />
          <span className="flex-1 text-left">主题: {currentTheme.name}</span>
          <div className="flex gap-1">
            {Object.values(THEMES).map((t, i) => (
              <span
                key={i}
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ background: t.bg }}
              />
            ))}
          </div>
        </button>
        {showThemePicker && (
          <div className={`mt-1 rounded-lg p-1 ${isDark ? 'bg-black/50 border border-white/10' : 'bg-white border border-gray-200'}`}>
            {Object.entries(THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => { setTheme(key as PosterTheme); setShowThemePicker(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                  theme === key ? (isDark ? 'bg-white/10' : 'bg-gray-100') : (isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')
                }`}
              >
                <span className="w-4 h-4 rounded-full border border-white/20" style={{ background: t.bg }} />
                <span className="flex-1 text-left">{t.name}</span>
                {theme === key && <span className="text-blue-400">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 海报预览 */}
      <div ref={posterRef} className={`w-full rounded-xl overflow-hidden relative ${layout === 'vertical' ? 'aspect-[9/16]' : 'aspect-[3/4]'}`}
        style={{ background: currentTheme.bg }}>
        {/* 顶部装饰 */}
        <div className="absolute top-0 left-0 right-0 h-32 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.3), transparent)' }}
        />

        {layout === 'square' ? (
          <>
            {/* 方版: 3:4 */}
            <div className="relative p-6 pt-8 text-center">
              <div className="text-xs tracking-[0.3em] uppercase mb-3" style={{ color: currentTheme.sub }}>
                MY FOOTPRINT MAP
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: currentTheme.text }}>
                {countryConfig.flag} {countryConfig.name}
              </div>
              <div className="text-sm" style={{ color: currentTheme.sub }}>
                {username} · {explorerLevel.emoji} {explorerLevel.name}
              </div>
            </div>
            <div className="relative flex justify-center py-4">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="url(#progressGradient)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${Math.min(overallProgress, 100) * 3.267} 326.7`} />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={theme === 'dark' ? '#3b82f6' : theme === 'gradient' ? '#fbbf24' : theme === 'warm' ? '#fef3c7' : '#2dd4bf'} />
                      <stop offset="100%" stopColor={theme === 'dark' ? '#8b5cf6' : theme === 'gradient' ? '#f59e0b' : theme === 'warm' ? '#fde68a' : '#22d3ee'} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: currentTheme.text }}>{overallProgress}%</span>
                  <span className="text-xs" style={{ color: currentTheme.sub }}>{countryConfig.levelNames[highlightLevel] || '探索'}</span>
                </div>
              </div>
            </div>
            <div className="relative px-6 space-y-3">
              {countryConfig.levels.filter(l => l > 0).map(level => {
                const total = countryConfig.levelTotals[level] || 0;
                const count = stats.counts[level] || 0;
                const pct = stats.percentages[level] || 0;
                return (
                  <div key={level}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs" style={{ color: currentTheme.sub }}>{countryConfig.levelNames[level] || `L${level}`}</span>
                      <span className="text-sm font-medium" style={{ color: currentTheme.text }}>
                        {count}<span className="text-xs opacity-50 ml-1">/ {total.toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: currentTheme.bar }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
              <div className="text-xs opacity-30" style={{ color: currentTheme.text }}>Nexus Pocket</div>
            </div>
          </>
        ) : (
          <>
            {/* 竖版: 9:16 适合微信朋友圈/小红书 */}
            <div className="relative px-6 pt-10 text-center">
              <div className="text-4xl mb-3">{explorerLevel.emoji}</div>
              <div className="text-2xl font-bold mb-1" style={{ color: currentTheme.text }}>
                {countryConfig.flag} 我的足迹地图
              </div>
              <div className="text-sm mb-1" style={{ color: currentTheme.sub }}>
                {explorerLevel.name} · 已探索 {overallProgress}%
              </div>
              <div className="text-xs" style={{ color: currentTheme.sub }}>{username}</div>
            </div>

            {/* 中央大进度环 */}
            <div className="relative flex justify-center py-8">
              <div className="relative w-44 h-44">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="url(#vProgressGradient)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${Math.min(overallProgress, 100) * 3.267} 326.7`} />
                  <defs>
                    <linearGradient id="vProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={theme === 'dark' ? '#3b82f6' : theme === 'gradient' ? '#fbbf24' : theme === 'warm' ? '#fef3c7' : '#2dd4bf'} />
                      <stop offset="100%" stopColor={theme === 'dark' ? '#8b5cf6' : theme === 'gradient' ? '#f59e0b' : theme === 'warm' ? '#fde68a' : '#22d3ee'} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold" style={{ color: currentTheme.text }}>{overallProgress}%</span>
                  <span className="text-xs" style={{ color: currentTheme.sub }}>总探索度</span>
                </div>
              </div>
            </div>

            {/* 统计卡片网格 */}
            <div className="relative px-6">
              <div className="grid grid-cols-2 gap-3">
                {countryConfig.levels.filter(l => l > 0).map(level => {
                  const count = stats.counts[level] || 0;
                  const total = countryConfig.levelTotals[level] || 0;
                  const pct = stats.percentages[level] || 0;
                  return (
                    <div key={level} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="text-xs mb-1" style={{ color: currentTheme.sub }}>{countryConfig.levelNames[level]}</div>
                      <div className="text-lg font-bold" style={{ color: currentTheme.text }}>{count}<span className="text-xs opacity-50 ml-1">/{total.toLocaleString()}</span></div>
                      <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: currentTheme.bar }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 底部 */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
              <div className="text-xs opacity-30" style={{ color: currentTheme.text }}>Nexus Pocket · 足迹点亮</div>
            </div>
          </>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={generating}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-colors ${btnBg}`}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          保存图片
        </button>
        <button
          onClick={handleShare}
          disabled={generating}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs transition-colors ${btnBg}`}
        >
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
          分享
        </button>
      </div>
    </div>
  );
}
