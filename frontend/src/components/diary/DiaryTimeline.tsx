'use client';

import type { DiaryEntry } from '@/lib/types';
import { DiaryEntryCard } from './DiaryEntryCard';

interface Props {
  dates: string[];
  getEntriesForDate: (date: string) => DiaryEntry[];
  onEntryClick: (id: string) => void;
}

const WEEKDAYS = ['周日','周一','周二','周三','周四','周五','周六'];

export function DiaryTimeline({ dates, getEntriesForDate, onEntryClick }: Props) {
  // dates 已经是去重后的日期列表

  return (
    <div className="space-y-6">
      {dates.map(date => {
        const entries = getEntriesForDate(date);
        const d = new Date(date + 'T00:00:00');
        const weekday = WEEKDAYS[d.getDay()];
        const dayLabel = `${parseInt(date.slice(8))}日`;

        return (
          <div key={date}>
            {/* 日期标题 */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                {date} {weekday}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] opacity-60">
                {entries.length} 条
              </span>
            </div>

            {/* 条目列表 */}
            <div className="ml-4 border-l-2 border-white/10 pl-4 space-y-3">
              {entries.map(entry => (
                <DiaryEntryCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => onEntryClick(entry.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
