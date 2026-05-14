'use client';

import { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { TripRecord } from '@/lib/types';
import { TripEditor } from '@/components/footprint/TripEditor';
import { TripTimeline } from '@/components/footprint/TripTimeline';

interface TripDetailPanelProps {
  visible: boolean;
  onClose: () => void;
  trips: TripRecord[];
  createTrip: (title: string, transportType: import('@/lib/types').TransportType, startDate: string, endDate: string) => string;
  updateTrip: (id: string, updates: Partial<TripRecord>) => void;
  addWaypoint: (tripId: string, waypoint: { name: string; lat: number; lng: number; arrivedAt: string; transportType?: import('@/lib/types').TransportType; notes?: string }) => void;
  deleteTrip: (id: string) => void;
  getTripDistance: (trip: TripRecord) => number;
  onTripClick?: (trip: TripRecord) => void;
  isDark: boolean;
}

export function TripDetailPanel({
  visible, onClose,
  trips, createTrip, updateTrip, addWaypoint, deleteTrip, getTripDistance,
  onTripClick, isDark,
}: TripDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handler = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const timer = setTimeout(() => document.addEventListener('pointerdown', handler), 100);
    return () => { clearTimeout(timer); document.removeEventListener('pointerdown', handler); };
  }, [visible, onClose]);

  const bg = isDark ? 'bg-gray-950/95' : 'bg-white/95';
  const border = isDark ? 'border-white/10' : 'border-gray-200';

  return (
    <div
      ref={panelRef}
      className={`
        absolute top-0 right-0 z-20 h-full
        w-[360px] max-w-[85vw]
        ${bg} backdrop-blur-xl
        border-l ${border}
        transition-transform duration-300 ease-in-out
        flex flex-col
        ${visible ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      <div className={`flex items-center justify-between px-4 h-12 shrink-0 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
        <h2 className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>行程</h2>
        <button onClick={onClose} className={`p-1 rounded ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 space-y-3">
          <TripEditor
            onCreateTrip={createTrip}
            onUpdateTrip={updateTrip}
            onAddWaypoint={addWaypoint}
            isDark={isDark}
          />
          <TripTimeline
            trips={trips}
            distanceGetter={getTripDistance}
            onDeleteTrip={deleteTrip}
            onTripClick={onTripClick}
            isDark={isDark}
          />
        </div>
      </div>
    </div>
  );
}
