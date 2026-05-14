'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { initStorage, load } from '@/lib/storage';
import type { DiaryStore, DiaryEntry, DiaryTripStore, FootprintStore } from '@/lib/types';
import {
  BarChart3, BookOpen, MapPin, Camera, Route, Calendar,
  TrendingUp, Flame, Plane, Heart, Download, Loader2,
  Award, Clock, Map, Image
} from 'lucide-react';
import { CalendarHeatmap } from '@/components/diary/CalendarHeatmap';

interface YearSummary {
  year: number;
  totalEntries: number;
  publishedEntries: number;
  totalPhotos: number;
  totalTrips: number;
  totalLocations: number;
  totalTags: number;
  provinces: number;
  streak: number;
  longestStreak: number;
  activeDays: number;
  moodDist: Record<string, number>;
  topMood: string;
  monthlyTrend: { month: string; entries: number }[];
  topLocations: { name: string; count: number }[];
  wordCount: number;
}

export default function AnnualReportPage() {
  const [entries, setEntries] = useState<DiaryStore>({});
  const [trips, setTrips] = useState<DiaryTripStore>({});
  const [footprints, setFootprints] = useState<FootprintStore>({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [ready, setReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initStorage();
    setEntries(load<DiaryStore>('diary') || {});
    setTrips(load<DiaryTripStore>('diary-trips') || {});
    setFootprints(load<FootprintStore>('footprints') || {});
    setReady(true);
  }, []);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    Object.values(entries).forEach(e => {
      years.add(parseInt(e.date.slice(0, 4)));
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [entries]);

  // Compute year summary
  const summary = useMemo((): YearSummary => {
    const yearStr = String(selectedYear);
    const yearEntries = Object.values(entries).filter(e => e.date.startsWith(yearStr));
    const yearTrips = Object.values(trips).filter(t => t.startDate.startsWith(yearStr));

    // Monthly trend
    const monthlyTrend: { month: string; entries: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      const key = `${yearStr}-${String(m).padStart(2, '0')}`;
      monthlyTrend.push({
        month: key,
        entries: yearEntries.filter(e => e.date.startsWith(key)).length,
      });
    }

    // Mood distribution
    const moodDist: Record<string, number> = {};
    yearEntries.forEach(e => {
      if (e.mood) moodDist[e.mood] = (moodDist[e.mood] || 0) + 1;
    });
    const topMood = Object.entries(moodDist).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    // Locations
    const locCount: Record<string, number> = {};
    yearEntries.forEach(e => {
      if (e.locationName) {
        locCount[e.locationName] = (locCount[e.locationName] || 0) + 1;
      }
    });
    const topLocations = Object.entries(locCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Active days
    const activeDays = new Set(yearEntries.map(e => e.date)).size;

    // Streak
    const datesWithContent = new Set(
      yearEntries.filter(e => e.content.length > 0).map(e => e.date)
    );
    let streak = 0;
    const d = new Date();
    if (parseInt(d.toISOString().slice(0, 4)) === selectedYear) {
      while (true) {
        const key = d.toISOString().slice(0, 10);
        if (datesWithContent.has(key)) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else break;
      }
    }

    // Longest streak in the year
    let longestStreak = 0;
    let currentStreak = 0;
    const sortedDates = [...datesWithContent].sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Provinces lit this year
    const yearFootprints = Object.values(footprints).filter(
      f => f.litAt.startsWith(yearStr) && f.adcode.endsWith('0000')
    );

    // Word count
    const wordCount = yearEntries.reduce((sum, e) => sum + e.content.length, 0);

    // Tags
    const allTags = new Set(yearEntries.flatMap(e => e.tags || []));

    return {
      year: selectedYear,
      totalEntries: yearEntries.length,
      publishedEntries: yearEntries.filter(e => e.content.length > 0).length,
      totalPhotos: yearEntries.reduce((s, e) => s + e.photoRefs.length, 0),
      totalTrips: yearTrips.length,
      totalLocations: Object.keys(locCount).length,
      totalTags: allTags.size,
      provinces: yearFootprints.length,
      streak,
      longestStreak,
      activeDays,
      moodDist,
      topMood,
      monthlyTrend,
      topLocations,
      wordCount,
    };
  }, [entries, trips, footprints, selectedYear]);

  const maxMonthly = Math.max(...summary.monthlyTrend.map(m => m.entries), 1);

  const handleDownload = useCallback(async () => {
    if (!posterRef.current) return;
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `annual-report-${selectedYear}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Failed to generate report image:', e);
    }
    setGenerating(false);
  }, [selectedYear]);

  if (!ready) return null;

  const hasData = summary.totalEntries > 0 || summary.provinces > 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 size={24} className="text-purple-400" />
            <h1 className="text-2xl font-bold">年度足迹报告</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* 年份选择 */}
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>
            {hasData && (
              <button
                onClick={handleDownload}
                disabled={generating}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                title="保存报告图片"
              >
                {generating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </button>
            )}
          </div>
        </div>

        {!hasData ? (
          <div className="text-center py-20 text-[var(--color-text-secondary)]">
            <Calendar size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">{selectedYear} 年还没有记录</p>
            <p className="text-sm">开始写日记或点亮足迹，年底来看你的年度报告</p>
          </div>
        ) : (
          <div ref={posterRef} className="space-y-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
            {/* 年度标题卡片 */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center">
              <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {selectedYear}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                你在这一年留下了 {summary.totalEntries} 条记录
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{summary.activeDays}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">活跃天数</div>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-bold">{summary.wordCount > 1000 ? `${(summary.wordCount / 1000).toFixed(1)}k` : summary.wordCount}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">总字数</div>
                </div>
                <div className="w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-bold">{summary.totalPhotos}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">张照片</div>
                </div>
              </div>
            </div>

            {/* 核心数据卡片 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: BookOpen, label: '日记', value: summary.publishedEntries, sub: `${summary.totalEntries - summary.publishedEntries} 待写`, color: 'text-blue-400' },
                { icon: Route, label: '旅行', value: summary.totalTrips, sub: `${summary.totalLocations} 个地点`, color: 'text-green-400' },
                { icon: MapPin, label: '新省份', value: summary.provinces, sub: '足迹点亮', color: 'text-orange-400' },
                { icon: Camera, label: '照片', value: summary.totalPhotos, sub: `${summary.totalTags} 个标签`, color: 'text-pink-400' },
              ].map(item => (
                <div key={item.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon size={16} className={item.color} />
                    <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-1">{item.sub}</div>
                </div>
              ))}
            </div>

            {/* 月度活跃度 */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-400" />
                月度活跃度
              </h3>
              <div className="flex items-end gap-1 h-32">
                {summary.monthlyTrend.map(m => {
                  const height = Math.max((m.entries / maxMonthly) * 100, 3);
                  const isActive = m.entries > 0;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      {isActive && (
                        <span className="text-[9px] text-[var(--color-text-secondary)]">{m.entries}</span>
                      )}
                      <div className="w-full flex flex-col items-center justify-end" style={{ height: '90px' }}>
                        <div
                          className={`w-full rounded-t transition-all ${isActive ? 'bg-gradient-to-t from-blue-500 to-purple-400' : 'bg-white/5'}`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[var(--color-text-secondary)]">
                        {m.month.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 连续天数 */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Flame size={16} className="text-orange-400" />
                写作连续性
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="text-3xl font-bold text-orange-400">{summary.streak}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">当前连续天数</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-3xl font-bold text-red-400">{summary.longestStreak}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">最长连续天数</div>
                </div>
              </div>
            </div>

            {/* 心情分布 */}
            {Object.keys(summary.moodDist).length > 0 && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Heart size={16} className="text-pink-400" />
                  年度心情
                </h3>
                <div className="flex items-center justify-center mb-3">
                  <span className="text-5xl">{summary.topMood}</span>
                  <span className="text-sm text-[var(--color-text-secondary)] ml-2">年度主心情</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(summary.moodDist)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([mood, count]) => (
                      <div key={mood} className="flex items-center gap-2">
                        <span className="text-lg w-8 text-center">{mood}</span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-pink-400 rounded-full"
                            style={{ width: `${(count / summary.totalEntries) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--color-text-secondary)] w-8 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 最常去的地方 */}
            {summary.topLocations.length > 0 && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Map size={16} className="text-emerald-400" />
                  最常记录的地点
                </h3>
                <div className="space-y-2">
                  {summary.topLocations.map((loc, i) => (
                    <div key={loc.name} className="flex items-center gap-3">
                      <span className={`w-6 text-center text-sm font-bold ${
                        i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-[var(--color-text-secondary)]'
                      }`}>
                        {i + 1}
                      </span>
                      <MapPin size={14} className="text-[var(--color-text-secondary)] shrink-0" />
                      <span className="text-sm flex-1">{loc.name}</span>
                      <span className="text-xs text-[var(--color-text-secondary)]">{loc.count} 次</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 日历热力图 */}
            {selectedYear === new Date().getFullYear() && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <CalendarHeatmap entries={entries} />
              </div>
            )}

            {/* 年度成就 */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Award size={16} className="text-yellow-400" />
                {selectedYear} 年度成就
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '日记新手', desc: '写下第一篇日记', unlocked: summary.totalEntries >= 1 },
                  { label: '坚持记录', desc: '写了 10 篇日记', unlocked: summary.totalEntries >= 10 },
                  { label: '高产出', desc: '写了 50 篇日记', unlocked: summary.totalEntries >= 50 },
                  { label: '摄影达人', desc: '拍了 50 张照片', unlocked: summary.totalPhotos >= 50 },
                  { label: '旅行家', desc: '完成 3 次旅行', unlocked: summary.totalTrips >= 3 },
                  { label: '连续 7 天', desc: '连续写 7 天', unlocked: summary.longestStreak >= 7 },
                  { label: '连续 30 天', desc: '连续写 30 天', unlocked: summary.longestStreak >= 30 },
                  { label: '足迹开拓', desc: '点亮 5 个新省份', unlocked: summary.provinces >= 5 },
                ].map(ach => (
                  <div
                    key={ach.label}
                    className={`p-3 rounded-lg border ${
                      ach.unlocked
                        ? 'bg-yellow-500/10 border-yellow-500/20'
                        : 'bg-white/3 border-white/5 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${ach.unlocked ? '' : 'grayscale'}`}>
                        {ach.unlocked ? '🏆' : '🔒'}
                      </span>
                      <div>
                        <div className={`text-xs font-medium ${ach.unlocked ? 'text-yellow-300' : ''}`}>
                          {ach.label}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)]">{ach.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
