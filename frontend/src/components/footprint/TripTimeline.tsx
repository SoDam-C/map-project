'use client';

import { MapPin, Calendar, Route, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { TripRecord } from '@/lib/types';
import { TRANSPORT_TYPES } from '@/lib/types';

interface TripTimelineProps {
  trips: TripRecord[];
  distanceGetter: (trip: TripRecord) => number;
  onDeleteTrip?: (id: string) => void;
  onTripClick?: (trip: TripRecord) => void;
  isDark: boolean;
}

export function TripTimeline({ trips, distanceGetter, onDeleteTrip, onTripClick, isDark }: TripTimelineProps) {
  const text = isDark ? 'text-gray-400' : 'text-gray-500';
  const subText = isDark ? 'text-gray-600' : 'text-gray-400';

  if (trips.length === 0) return null;

  const transportLabel = (type: string) => {
    const config = TRANSPORT_TYPES.find(t => t.type === type);
    return config?.label || type;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-1">
      <div className={`px-3 py-1 text-[11px] ${subText} font-medium`}>行程记录</div>
      {trips.map(trip => {
        const distance = distanceGetter(trip);
        return (
          <div
            key={trip.id}
            className={`group px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
            }`}
            onClick={() => onTripClick?.(trip)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'} truncate`}>
                  {trip.title}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] ${subText} flex items-center gap-0.5`}>
                    <Route size={9} />
                    {transportLabel(trip.transportType)}
                  </span>
                  {distance > 0 && (
                    <span className={`text-[10px] ${subText}`}>
                      {formatDistance(distance)}
                    </span>
                  )}
                  <span className={`text-[10px] ${subText} flex items-center gap-0.5`}>
                    <Calendar size={9} />
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </span>
                </div>
                {trip.waypoints.length > 0 && (
                  <div className={`text-[10px] ${subText} mt-0.5`}>
                    {trip.waypoints.length} 个途经点
                  </div>
                )}
              </div>
              {onDeleteTrip && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); }}
                  className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-200 text-gray-400'
                  }`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
