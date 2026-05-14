'use client';

import { useState, useCallback, useRef } from 'react';
import { load, save } from '@/lib/storage';
import type { TripRecord, TripWaypoint, TransportType } from '@/lib/types';

const NAMESPACE = 'trips' as const;

const MOCK_TRIPS: Record<string, TripRecord> = {
  'trip-1': {
    id: 'trip-1',
    title: '武汉樱花之旅',
    description: '春季赏樱',
    startDate: '2026-05-01',
    endDate: '2026-05-03',
    transportType: 'train',
    waypoints: [
      { id: 'wp-1', name: '武汉站', lat: 30.610, lng: 114.410, arrivedAt: '2026-05-01T09:00:00Z', transportType: 'train', notes: '高铁 G71' },
      { id: 'wp-2', name: '武汉大学', lat: 30.540, lng: 114.360, arrivedAt: '2026-05-01T10:30:00Z', transportType: 'walking' },
      { id: 'wp-3', name: '东湖', lat: 30.550, lng: 114.390, arrivedAt: '2026-05-02T09:00:00Z', transportType: 'taxi' },
    ],
    photoIds: ['photo-3'],
    footprints: ['420000', '420100'],
    createdAt: '2026-05-01T08:00:00Z',
    updatedAt: '2026-05-01T08:00:00Z',
  },
  'trip-2': {
    id: 'trip-2',
    title: '苏南水乡行',
    description: '南京-苏州',
    startDate: '2026-05-10',
    endDate: '2026-05-12',
    transportType: 'train',
    waypoints: [
      { id: 'wp-4', name: '南京南站', lat: 31.840, lng: 118.780, arrivedAt: '2026-05-10T10:00:00Z', transportType: 'train' },
      { id: 'wp-5', name: '夫子庙', lat: 32.024, lng: 118.788, arrivedAt: '2026-05-10T14:00:00Z', transportType: 'walking' },
      { id: 'wp-6', name: '苏州站', lat: 31.294, lng: 120.586, arrivedAt: '2026-05-11T09:00:00Z', transportType: 'train' },
      { id: 'wp-7', name: '拙政园', lat: 31.324, lng: 120.628, arrivedAt: '2026-05-11T10:30:00Z', transportType: 'walking' },
    ],
    photoIds: ['photo-4'],
    footprints: ['320000', '320100', '320500'],
    createdAt: '2026-05-10T08:00:00Z',
    updatedAt: '2026-05-10T08:00:00Z',
  },
  'trip-3': {
    id: 'trip-3',
    title: '福建海边度假',
    description: '福州→厦门',
    startDate: '2026-08-05',
    endDate: '2026-08-08',
    transportType: 'car',
    waypoints: [
      { id: 'wp-8', name: '三坊七巷', lat: 26.080, lng: 119.294, arrivedAt: '2026-08-05T11:00:00Z', transportType: 'walking' },
      { id: 'wp-9', name: '鼓浪屿', lat: 24.449, lng: 118.068, arrivedAt: '2026-08-06T09:00:00Z', transportType: 'ship' },
      { id: 'wp-10', name: '曾厝垵', lat: 24.442, lng: 118.105, arrivedAt: '2026-08-07T10:00:00Z', transportType: 'walking' },
    ],
    photoIds: ['photo-5'],
    footprints: ['350000', '350100', '350200'],
    createdAt: '2026-08-05T08:00:00Z',
    updatedAt: '2026-08-05T08:00:00Z',
  },
};

export function useTrips() {
  const [trips, setTrips] = useState<Record<string, TripRecord>>(() => {
    if (typeof window === 'undefined') return MOCK_TRIPS;
    const stored = load<Record<string, TripRecord>>(NAMESPACE);
    if (stored && Object.keys(stored).length > 0) return stored;
    return MOCK_TRIPS;
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((data: Record<string, TripRecord>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(NAMESPACE, data), 500);
  }, []);

  /** 创建新行程 */
  const createTrip = useCallback((
    title: string,
    transportType: TransportType,
    startDate: string,
    endDate: string,
  ): string => {
    const id = `trip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const trip: TripRecord = {
      id,
      title,
      startDate,
      endDate,
      transportType,
      waypoints: [],
      photoIds: [],
      footprints: [],
      createdAt: now,
      updatedAt: now,
    };

    setTrips(prev => {
      const next = { ...prev, [id]: trip };
      persist(next);
      return next;
    });

    return id;
  }, [persist]);

  /** 更新行程 */
  const updateTrip = useCallback((id: string, updates: Partial<TripRecord>) => {
    setTrips(prev => {
      const current = prev[id];
      if (!current) return prev;
      const next = { ...prev, [id]: { ...current, ...updates, updatedAt: new Date().toISOString() } };
      persist(next);
      return next;
    });
  }, [persist]);

  /** 添加途经点 */
  const addWaypoint = useCallback((tripId: string, waypoint: Omit<TripWaypoint, 'id'>) => {
    const wpId = `wp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setTrips(prev => {
      const current = prev[tripId];
      if (!current) return prev;
      const next = {
        ...prev,
        [tripId]: {
          ...current,
          waypoints: [...current.waypoints, { ...waypoint, id: wpId }],
          updatedAt: new Date().toISOString(),
        },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  /** 移除途经点 */
  const removeWaypoint = useCallback((tripId: string, waypointId: string) => {
    setTrips(prev => {
      const current = prev[tripId];
      if (!current) return prev;
      const next = {
        ...prev,
        [tripId]: {
          ...current,
          waypoints: current.waypoints.filter(wp => wp.id !== waypointId),
          updatedAt: new Date().toISOString(),
        },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  /** 设置行程路线 */
  const setTripRoute = useCallback((tripId: string, coordinates: [number, number][]) => {
    setTrips(prev => {
      const current = prev[tripId];
      if (!current) return prev;
      const next = {
        ...prev,
        [tripId]: {
          ...current,
          route: { type: 'LineString' as const, coordinates },
          updatedAt: new Date().toISOString(),
        },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  /** 删除行程 */
  const deleteTrip = useCallback((id: string) => {
    setTrips(prev => {
      const next = { ...prev };
      delete next[id];
      persist(next);
      return next;
    });
  }, [persist]);

  /** 按时间倒序获取行程列表 */
  const getTripsList = useCallback((): TripRecord[] => {
    return Object.values(trips).sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [trips]);

  /** 计算行程总里程（简化：途经点间直线距离累加） */
  const getTripDistance = useCallback((trip: TripRecord): number => {
    if (trip.route && trip.route.coordinates.length >= 2) {
      return calculateRouteDistance(trip.route.coordinates);
    }
    if (trip.waypoints.length >= 2) {
      const coords = trip.waypoints.map(wp => [wp.lng, wp.lat] as [number, number]);
      return calculateRouteDistance(coords);
    }
    return 0;
  }, []);

  return {
    trips,
    createTrip,
    updateTrip,
    addWaypoint,
    removeWaypoint,
    setTripRoute,
    deleteTrip,
    getTripsList,
    getTripDistance,
  };
}

/** 计算路线总距离（Haversine 公式，单位：米） */
function calculateRouteDistance(coordinates: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineDistance(
      coordinates[i - 1][1], coordinates[i - 1][0],
      coordinates[i][1], coordinates[i][0],
    );
  }
  return Math.round(total);
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
