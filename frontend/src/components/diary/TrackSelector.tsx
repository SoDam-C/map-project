'use client';

import { useState, useEffect, useCallback } from 'react';
import { Route, Check, X } from 'lucide-react';

interface GpsTrack {
  id: string;
  startTime: string;
  endTime?: string;
  title?: string;
  distance?: number;
  type?: string;
}

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TrackSelector({ selectedIds, onChange }: Props) {
  const [tracks, setTracks] = useState<GpsTrack[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/tracks/batch')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data?.tracks)) {
          setTracks(data.tracks.sort((a: GpsTrack, b: GpsTrack) =>
            b.startTime.localeCompare(a.startTime)
          ));
        }
      })
      .catch(() => {});
  }, [open]);

  const toggle = useCallback((id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }, [selectedIds, onChange]);

  const formatDate = (iso: string) => iso.slice(0, 16).replace('T', ' ');
  const formatDist = (m?: number) => m ? `${(m / 1000).toFixed(1)} km` : '';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-full text-sm hover:bg-white/10 transition-colors text-left`}
      >
        <Route size={14} className="text-green-400 flex-shrink-0" />
        <span className={selectedIds.length > 0 ? 'text-[var(--color-text)]' : 'text-[var(--color-text-secondary)]'}>
          {selectedIds.length > 0 ? `已关联 ${selectedIds.length} 条轨迹` : '关联 GPS 轨迹'}
        </span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--color-bg)] border border-white/10 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto">
          {tracks.length === 0 ? (
            <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
              暂无轨迹数据
            </div>
          ) : (
            tracks.map(track => {
              const selected = selectedIds.includes(track.id);
              return (
                <button
                  key={track.id}
                  onClick={() => toggle(track.id)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 flex items-center gap-3 ${selected ? 'bg-blue-500/10' : ''}`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected ? 'bg-blue-600 border-blue-600' : 'border-white/30'}`}>
                    {selected && <Check size={10} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{track.title || track.id}</div>
                    <div className="text-[10px] text-[var(--color-text-secondary)] flex items-center gap-2">
                      <span>{formatDate(track.startTime)}</span>
                      {track.distance && <span>{formatDist(track.distance)}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
