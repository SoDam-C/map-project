'use client';

import type { DiaryTrip } from '@/lib/types';
import { Trash2, MapPin } from 'lucide-react';

interface Props {
  trip: DiaryTrip;
  entryCount: number;
  onClick: () => void;
  onDelete: () => void;
}

export function TripCard({ trip, entryCount, onClick, onDelete }: Props) {
  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-40 rounded-xl border border-white/10 bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition-colors group"
    >
      <div className="flex items-start justify-between">
        <h4 className="font-medium text-sm leading-snug flex-1">{trip.title}</h4>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="text-xs text-[var(--color-text-secondary)] mt-1.5 flex items-center gap-1">
        <MapPin size={10} />
        {trip.startDate}{trip.endDate !== trip.startDate && ` → ${trip.endDate}`}
      </div>
      <div className="text-xs text-[var(--color-text-secondary)] mt-1">
        {trip.destinations.length > 0 && (
          <span>{trip.destinations.join(' · ')}</span>
        )}
        {entryCount > 0 && <span className="ml-2 opacity-60">{entryCount} 条日记</span>}
      </div>
    </div>
  );
}
