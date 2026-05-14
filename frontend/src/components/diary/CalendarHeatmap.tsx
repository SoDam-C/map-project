'use client';

import { useMemo } from 'react';
import type { DiaryStore } from '@/lib/types';

interface Props {
  entries: DiaryStore;
  onDateClick?: (date: string) => void;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export function CalendarHeatmap({ entries, onDateClick }: Props) {
  const today = new Date();

  // 统计每天的内容字数
  const dailyWordCount = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(entries).forEach(e => {
      if (e.content) {
        counts[e.date] = (counts[e.date] || 0) + e.content.length;
      } else {
        counts[e.date] = (counts[e.date] || 0) + 1; // draft 也算
      }
    });
    return counts;
  }, [entries]);

  // 最近 365 天的数据
  const days = useMemo(() => {
    const result: { date: string; count: number; isToday: boolean }[] = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({
        date: key,
        count: dailyWordCount[key] || 0,
        isToday: i === 0,
      });
    }
    return result;
  }, [dailyWordCount, today]);

  // 最大值（用于颜色插值）
  const maxCount = Math.max(...days.map(d => d.count), 1);

  const getColor = (count: number): string => {
    if (count === 0) return 'bg-white/5';
    const ratio = count / maxCount;
    if (ratio < 0.25) return 'bg-green-900/60';
    if (ratio < 0.5) return 'bg-green-700/70';
    if (ratio < 0.75) return 'bg-green-500/80';
    return 'bg-green-400';
  };

  // 统计
  const activeDays = days.filter(d => d.count > 0).length;
  const longestStreak = useMemo(() => {
    let max = 0, current = 0;
    days.forEach(d => {
      if (d.count > 0) { current++; max = Math.max(max, current); }
      else current = 0;
    });
    return max;
  }, [days]);

  // 按周分组（GitHub 风格，列=周，行=星期几）
  const weeks: { date: string; count: number; isToday: boolean }[][] = [];
  let currentWeek: typeof weeks[0] = [];
  // 第一天需要补齐到正确的星期
  const firstDay = new Date(days[0].date + 'T00:00:00');
  const firstDow = firstDay.getDay();
  for (let i = 0; i < firstDow; i++) {
    currentWeek.push({ date: '', count: -1, isToday: false });
  }
  days.forEach(d => {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', count: -1, isToday: false });
    }
    weeks.push(currentWeek);
  }

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">写作活跃度</h3>
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          <span>{activeDays} 天有记录</span>
          <span>最长连续 {longestStreak} 天</span>
        </div>
      </div>

      {/* 月份标签 */}
      <div className="flex text-[10px] text-[var(--color-text-secondary)] mb-1 ml-8">
        {(() => {
          const monthPositions: { month: string; index: number }[] = [];
          let lastMonth = -1;
          weeks.forEach((week, wi) => {
            const firstValidDay = week.find(d => d.date);
            if (firstValidDay) {
              const m = new Date(firstValidDay.date + 'T00:00:00').getMonth();
              if (m !== lastMonth) {
                monthPositions.push({ month: MONTHS[m], index: wi });
                lastMonth = m;
              }
            }
          });
          return monthPositions.map((mp, i) => (
            <span key={i} className="absolute" style={{ left: `${mp.index * 14}px` }}>{mp.month}</span>
          ));
        })()}
      </div>

      {/* 热力图 */}
      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {/* 星期标签 */}
        <div className="flex flex-col gap-0.5 mr-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="w-3 h-3 text-[8px] text-[var(--color-text-secondary)] flex items-center justify-center">
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>

        {/* 网格 */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day, di) => (
              <div
                key={di}
                onClick={() => day.date && onDateClick?.(day.date)}
                className={`w-3 h-3 rounded-sm transition-colors ${day.count === -1 ? '' : getColor(day.count)} ${day.date ? 'cursor-pointer hover:ring-1 hover:ring-white/30' : ''} ${day.isToday ? 'ring-1 ring-blue-400' : ''}`}
                title={day.date ? `${day.date}: ${day.count > 0 ? `${day.count} 字` : '无记录'}` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-1 mt-3 justify-end text-[10px] text-[var(--color-text-secondary)]">
        <span>少</span>
        <div className="w-3 h-3 rounded-sm bg-white/5" />
        <div className="w-3 h-3 rounded-sm bg-green-900/60" />
        <div className="w-3 h-3 rounded-sm bg-green-700/70" />
        <div className="w-3 h-3 rounded-sm bg-green-500/80" />
        <div className="w-3 h-3 rounded-sm bg-green-400" />
        <span>多</span>
      </div>
    </div>
  );
}
