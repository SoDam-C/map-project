'use client';

import { useMemo } from 'react';
import type { GpsTrack } from '@/lib/types';
import { formatDistance, formatDuration } from './TrackUtils';
import { Clock, Route, MapPin, Trash2, Eye } from 'lucide-react';

interface TrackTimelineProps {
  tracks: GpsTrack[];
  activeTrackId?: string | null;
  onSelectTrack: (track: GpsTrack) => void;
  onDeleteTrack: (trackId: string) => void;
  isDark?: boolean;
}

export function TrackTimeline({
  tracks,
  activeTrackId,
  onSelectTrack,
  onDeleteTrack,
  isDark = true,
}: TrackTimelineProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, GpsTrack[]> = {};
    for (const t of tracks) {
      const dateKey = t.startTime.slice(0, 10); // YYYY-MM-DD
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, items }));
  }, [tracks]);

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <MapPin size={32} className="mb-3 opacity-50" />
        <p className="text-sm">暂无轨迹数据</p>
        <p className="text-xs mt-1 opacity-70">上传 GPS 轨迹后将在此显示</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(({ date, items }) => (
        <div key={date}>
          <div className={`text-xs font-medium px-1 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {date}
          </div>
          <div className="space-y-2">
            {items.map(track => (
              <TrackCard
                key={track.id}
                track={track}
                isActive={track.id === activeTrackId}
                onSelect={() => onSelectTrack(track)}
                onDelete={() => onDeleteTrack(track.id)}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrackCard({
  track,
  isActive,
  onSelect,
  onDelete,
  isDark,
}: {
  track: GpsTrack;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isDark: boolean;
}) {
  const startTime = track.startTime.slice(11, 16);
  const endTime = track.endTime.slice(11, 16);

  return (
    <div
      onClick={onSelect}
      className={`rounded-lg p-3 cursor-pointer transition-all ${
        isActive
          ? isDark
            ? 'bg-indigo-500/20 border border-indigo-500/40'
            : 'bg-indigo-50 border border-indigo-300'
          : isDark
            ? 'bg-white/5 border border-white/10 hover:bg-white/10'
            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {track.title || `轨迹 ${track.id.slice(0, 8)}`}
          </div>
          <div className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {startTime} — {endTime}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={e => { e.stopPropagation(); onSelect(); }}
            className={`p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
            }`}
            title="查看轨迹"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className={`p-1.5 rounded-md transition-colors ${
              isDark ? 'hover:bg-red-500/20 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-500'
            }`}
            title="删除轨迹"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className={`flex items-center gap-4 mt-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <span className="flex items-center gap-1">
          <Route size={12} />
          {formatDistance(track.distance)}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatDuration(track.duration)}
        </span>
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {track.pointCount} 点
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
          track.type === 'continuous' ? 'bg-green-500/20 text-green-400' :
          track.type === 'sport' ? 'bg-orange-500/20 text-orange-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {track.type === 'continuous' ? '持续定位' :
           track.type === 'sport' ? (track.sportType || '运动') : '导入'}
        </span>
      </div>
    </div>
  );
}
