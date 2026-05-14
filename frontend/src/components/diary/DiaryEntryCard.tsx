'use client';

import type { DiaryEntry } from '@/lib/types';
import { MapPin, Route, FileText, Image } from 'lucide-react';

interface Props {
  entry: DiaryEntry;
  onClick: () => void;
}

function formatTime(iso?: string): string {
  if (!iso) return '';
  return iso.slice(11, 16);
}

export function DiaryEntryCard({ entry, onClick }: Props) {
  const isDraft = entry.status === 'draft' && !entry.content;
  const hasTrack = entry.type === 'track_entry' && (entry.trackIds?.length ?? 0) > 0;
  const hasPhotos = entry.photoRefs.length > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-4 transition-all hover:bg-white/5 border ${
        isDraft
          ? 'border-white/5 opacity-60'
          : entry.type === 'memory_entry'
          ? 'border-blue-500/20 bg-blue-500/5'
          : 'border-white/10'
      }`}
    >
      {/* 时间 + 类型标签 */}
      <div className="flex items-center gap-2 mb-1.5">
        {entry.startTime && (
          <span className="text-xs font-mono text-[var(--color-text-secondary)]">
            {formatTime(entry.startTime)}
            {entry.endTime && entry.endTime !== entry.startTime && ` - ${formatTime(entry.endTime)}`}
          </span>
        )}
        {isDraft && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[var(--color-text-secondary)]">
            记录
          </span>
        )}
        {hasTrack && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 flex items-center gap-0.5">
            <Route size={10} />
            有轨迹
          </span>
        )}
      </div>

      {/* 标题 */}
      <div className="flex items-start gap-2">
        {(entry.locationName || entry.lat) && (
          <MapPin size={14} className="text-[var(--color-text-secondary)] mt-0.5 flex-shrink-0" />
        )}
        <h3 className={`font-medium text-sm leading-snug ${isDraft ? 'text-[var(--color-text-secondary)]' : ''}`}>
          {entry.title || (entry.locationName || '无标题')}
        </h3>
      </div>

      {/* 内容预览 */}
      {entry.content && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
          {entry.content.slice(0, 120)}
          {entry.content.length > 120 ? '...' : ''}
        </p>
      )}

      {/* 底部：心情 + 标签 + 照片 */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {entry.mood && <span className="text-sm">{entry.mood}</span>}
        {entry.tags?.map(tag => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-[var(--color-text-secondary)]">
            #{tag}
          </span>
        ))}
        {hasPhotos && (
          <span className="text-[10px] text-[var(--color-text-secondary)] flex items-center gap-0.5 ml-auto">
            <Image size={10} />
            {entry.photoRefs.length}
          </span>
        )}
      </div>
    </button>
  );
}
