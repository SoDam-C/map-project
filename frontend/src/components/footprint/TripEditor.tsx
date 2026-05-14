'use client';

import { useState, useCallback } from 'react';
import { Plus, X, Plane, Car, Train, Ship, Bike, MapPin, Calendar } from 'lucide-react';
import { TRANSPORT_TYPES, type TripRecord, type TransportType } from '@/lib/types';

interface TripEditorProps {
  onCreateTrip: (title: string, transportType: TransportType, startDate: string, endDate: string) => string;
  onUpdateTrip: (id: string, updates: Partial<TripRecord>) => void;
  onAddWaypoint: (tripId: string, waypoint: { name: string; lat: number; lng: number; arrivedAt: string; transportType?: TransportType; notes?: string }) => void;
  isDark: boolean;
}

const transportIcons: Record<string, any> = {
  plane: Plane, train: Train, car: Car, taxi: Car, bus: Car,
  cycling: Bike, running: Bike, walking: MapPin, ship: Ship, other: MapPin,
};

export function TripEditor({ onCreateTrip, onUpdateTrip, onAddWaypoint, isDark }: TripEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [transport, setTransport] = useState<TransportType>('train');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  const handleCreate = useCallback(() => {
    if (!title || !startDate) return;
    const id = onCreateTrip(title, transport, startDate, endDate || startDate);
    setActiveTripId(id);
    setTitle('');
    setStartDate('');
    setEndDate('');
  }, [title, transport, startDate, endDate, onCreateTrip]);

  const bg = isDark ? 'bg-gray-900/80 border-white/10' : 'bg-white/80 border-gray-200';
  const inputBg = isDark ? 'bg-gray-800 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-900';
  const text = isDark ? 'text-gray-300' : 'text-gray-700';
  const subText = isDark ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className={`rounded-lg shadow-lg backdrop-blur-xl ${bg} border`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2"
      >
        <Plus size={14} className={subText} />
        <span className={`text-xs ${text}`}>新建行程</span>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          <input
            type="text"
            placeholder="行程名称"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-2 py-1 rounded text-xs border ${inputBg}`}
          />

          <div className="flex gap-1 flex-wrap">
            {TRANSPORT_TYPES.map(t => {
              const Icon = transportIcons[t.type] || MapPin;
              const active = transport === t.type;
              return (
                <button
                  key={t.type}
                  onClick={() => setTransport(t.type)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors ${
                    active
                      ? (isDark ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50' : 'bg-blue-50 text-blue-600 border border-blue-200')
                      : (isDark ? 'bg-gray-800 text-gray-400 border border-white/5' : 'bg-gray-50 text-gray-500 border border-gray-200')
                  }`}
                >
                  <Icon size={10} />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className={`text-[10px] ${subText} block mb-0.5`}>开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-2 py-1 rounded text-xs border ${inputBg}`}
              />
            </div>
            <div className="flex-1">
              <label className={`text-[10px] ${subText} block mb-0.5`}>结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-2 py-1 rounded text-xs border ${inputBg}`}
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!title || !startDate}
            className={`w-full py-1.5 rounded text-xs font-medium transition-colors ${
              title && startDate
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : (isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-300')
            }`}
          >
            创建行程
          </button>
        </div>
      )}
    </div>
  );
}
