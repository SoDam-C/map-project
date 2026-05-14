'use client';

import { useState, useEffect, useCallback } from 'react';
import { initStorage, load } from '@/lib/storage';
import type { DiaryStore, DiaryEntry, DiaryTripStore, FootprintStore, FootprintRecord } from '@/lib/types';
import { BarChart3, BookOpen, MapPin, Camera, Route, TrendingUp, Calendar, Flame } from 'lucide-react';
import { CalendarHeatmap } from '@/components/diary/CalendarHeatmap';

interface MonthlyCount { month: string; entries: number; withContent: number; }

export default function StatsPage() {
  const [entries, setEntries] = useState<DiaryStore>({});
  const [trips, setTrips] = useState<DiaryTripStore>({});
  const [footprints, setFootprints] = useState<FootprintStore>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStorage();
    setEntries(load<DiaryStore>('diary') || {});
    setTrips(load<DiaryTripStore>('diary-trips') || {});
    setFootprints(load<FootprintStore>('footprints') || {});
    setReady(true);
  }, []);

  const allEntries = Object.values(entries);
  const allTrips = Object.values(trips);
  const allFootprints = Object.values(footprints);

  // 基础统计
  const totalEntries = allEntries.length;
  const publishedEntries = allEntries.filter(e => e.content.length > 0).length;
  const draftEntries = totalEntries - publishedEntries;
  const entriesWithPhotos = allEntries.filter(e => e.photoRefs.length > 0).length;
  const entriesWithTrack = allEntries.filter(e => (e.trackIds?.length ?? 0) > 0).length;
  const totalTrips = allTrips.length;
  const totalPhotos = allEntries.reduce((sum, e) => sum + e.photoRefs.length, 0);
  const totalTags = new Set(allEntries.flatMap(e => e.tags || [])).size;
  const totalLocations = new Set(allEntries.filter(e => e.locationName).map(e => e.locationName)).size;

  // 足迹统计
  const litProvinces = allFootprints.filter(f => f.adcode.endsWith('0000')).length;
  const litCities = allFootprints.filter(f => {
    const code = f.adcode;
    return code.length === 6 && !code.endsWith('0000') && (code.endsWith('00') || code.endsWith('01') || code.endsWith('02') || code.endsWith('03') || code.endsWith('04') || code.endsWith('05') || code.endsWith('06') || code.endsWith('07') || code.endsWith('08') || code.endsWith('09'));
  }).length;

  // 月度趋势（最近12个月）
  const monthlyTrend: MonthlyCount[] = useCallback(() => {
    const now = new Date();
    const months: MonthlyCount[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthEntries = allEntries.filter(e => e.date.startsWith(key));
      months.push({
        month: key,
        entries: monthEntries.length,
        withContent: monthEntries.filter(e => e.content.length > 0).length,
      });
    }
    return months;
  }, [allEntries])();

  const maxMonthly = Math.max(...monthlyTrend.map(m => m.entries), 1);

  // 连续写日记天数
  const streak = useCallback(() => {
    const datesWithContent = new Set(
      allEntries.filter(e => e.content.length > 0).map(e => e.date)
    );
    if (datesWithContent.size === 0) return 0;

    let count = 0;
    const d = new Date();
    // 从今天往前数
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (datesWithContent.has(key)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [allEntries])();

  // 心情分布
  const moodDist = useCallback(() => {
    const counts: Record<string, number> = {};
    allEntries.forEach(e => {
      if (e.mood) {
        counts[e.mood] = (counts[e.mood] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [allEntries])();

  if (!ready) return null;

  const statCards = [
    { icon: BookOpen, label: '总日记', value: totalEntries, sub: `${publishedEntries} 已写` },
    { icon: Route, label: '旅行', value: totalTrips, sub: `${allTrips.reduce((s, t) => s + t.entryIds.length, 0)} 条关联` },
    { icon: MapPin, label: '足迹省份', value: litProvinces, sub: `${allFootprints.length} 个区域` },
    { icon: Camera, label: '照片', value: totalPhotos, sub: `${entriesWithPhotos} 篇有照片` },
    { icon: Calendar, label: '连续天数', value: streak, sub: streak > 0 ? '坚持中' : '开始写日记吧' },
    { icon: TrendingUp, label: '地点', value: totalLocations, sub: `${totalTags} 个标签` },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* 头部 */}
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={24} />
          <h1 className="text-2xl font-bold">数据统计</h1>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {statCards.map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} className="text-blue-400" />
                <span className="text-xs text-[var(--color-text-secondary)]">{s.label}</span>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* 日历热力图 */}
        <CalendarHeatmap entries={entries} />

        {/* 月度趋势 */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            月度趋势（最近12个月）
          </h3>
          <div className="flex items-end gap-1 h-32">
            {monthlyTrend.map(m => {
              const height = Math.max((m.entries / maxMonthly) * 100, 4);
              const hasContent = m.withContent > 0;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center justify-end" style={{ height: '100px' }}>
                    <div
                      className={`w-full rounded-t transition-all ${hasContent ? 'bg-blue-500' : 'bg-white/20'}`}
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
          <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-blue-500" /> 有内容
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-white/20" /> 纯记录
            </span>
          </div>
        </div>

        {/* 两列：心情分布 + 类型分布 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* 心情分布 */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Flame size={16} className="text-orange-400" />
              心情分布
            </h3>
            {moodDist.length > 0 ? (
              <div className="space-y-2">
                {moodDist.map(([mood, count]) => (
                  <div key={mood} className="flex items-center gap-2">
                    <span className="text-sm w-16">{mood}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full"
                        style={{ width: `${(count / allEntries.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)] w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-secondary)] opacity-60">暂无心情记录</p>
            )}
          </div>

          {/* 类型分布 */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 className="text-sm font-medium mb-3">条目类型</h3>
            <div className="space-y-3">
              {[
                { label: '轨迹日记', count: entriesWithTrack, color: 'bg-green-400' },
                { label: '记忆', count: allEntries.filter(e => e.type === 'memory_entry').length, color: 'bg-blue-400' },
                { label: '笔记', count: allEntries.filter(e => e.type === 'note_entry').length, color: 'bg-purple-400' },
                { label: '有照片', count: entriesWithPhotos, color: 'bg-pink-400' },
                { label: '待填充', count: draftEntries, color: 'bg-gray-400' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-16 h-1.5 bg-white/10 rounded-full overflow-hidden`}>
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: totalEntries > 0 ? `${(item.count / totalEntries) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs font-mono w-6 text-right">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 旅行统计 */}
        {totalTrips > 0 && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Route size={16} className="text-blue-400" />
              旅行统计
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold">{totalTrips}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">总旅行</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{allTrips.reduce((s, t) => s + t.entryIds.length, 0)}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">关联日记</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{allTrips.reduce((s, t) => s + t.destinations.length, 0)}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">目的地</div>
              </div>
            </div>
          </div>
        )}

        {/* 城市点亮进度 */}
        {litProvinces > 0 && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MapPin size={16} className="text-green-400" />
              足迹点亮
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-secondary)]">省份覆盖率</span>
                <span className="text-xs font-mono">{litProvinces}/34 ({Math.round(litProvinces / 34 * 100)}%)</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(litProvinces / 34) * 100}%` }}
                />
              </div>
              {litCities > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-secondary)]">城市覆盖率</span>
                    <span className="text-xs font-mono">{litCities}/333 ({Math.round(litCities / 333 * 100)}%)</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(litCities / 333) * 100}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
