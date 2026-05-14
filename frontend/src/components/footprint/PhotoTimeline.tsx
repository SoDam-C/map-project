'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Image, MapPin, Trash2 } from 'lucide-react';
import type { PhotoRecord } from '@/lib/types';

interface PhotoTimelineProps {
  photosByDate: Record<string, PhotoRecord[]>;
  onDeletePhoto?: (id: string) => void;
  onPhotoClick?: (photo: PhotoRecord) => void;
  isDark: boolean;
}

export function PhotoTimeline({ photosByDate, onDeletePhoto, onPhotoClick, isDark }: PhotoTimelineProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const dates = Object.keys(photosByDate);

  if (dates.length === 0) return null;

  const text = isDark ? 'text-gray-400' : 'text-gray-500';
  const subText = isDark ? 'text-gray-600' : 'text-gray-400';

  const toggleDate = (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  return (
    <div className="space-y-1">
      <div className={`px-3 py-1 text-[11px] ${subText} font-medium`}>照片时间线</div>
      {dates.map(date => {
        const photos = photosByDate[date];
        const expanded = expandedDates.has(date);
        const dateLabel = formatDate(date);

        return (
          <div key={date}>
            <button
              onClick={() => toggleDate(date)}
              className={`w-full flex items-center gap-1 px-3 py-1 text-left`}
            >
              {expanded ? <ChevronDown size={12} className={subText} /> : <ChevronRight size={12} className={subText} />}
              <Image size={12} className={subText} />
              <span className={`text-[11px] ${text}`}>{dateLabel}</span>
              <span className={`text-[10px] ${subText}`}>({photos.length})</span>
            </button>
            {expanded && (
              <div className="px-3 pb-2 grid grid-cols-3 gap-1">
                {photos.map(photo => (
                  <div
                    key={photo.id}
                    className="relative group rounded overflow-hidden cursor-pointer"
                    onClick={() => onPhotoClick?.(photo)}
                  >
                    {photo.thumbnail ? (
                      <img
                        src={photo.thumbnail}
                        alt=""
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-indigo-500/20 flex items-center justify-center text-2xl">
                        {'\uD83D\uDCF8'}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    {onDeletePhoto && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeletePhoto(photo.id); }}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}
