'use client';

import { useState, useCallback, useRef } from 'react';
import { load, save } from '@/lib/storage';
import type { DiaryTrip, DiaryTripStore } from '@/lib/types';

const NAMESPACE = 'diary-trips' as const;

export function useDiaryTrips() {
  const [trips, setTrips] = useState<DiaryTripStore>(() => {
    if (typeof window === 'undefined') return {};
    return load<DiaryTripStore>(NAMESPACE) || {};
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((data: DiaryTripStore) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(NAMESPACE, data), 500);
  }, []);

  /** 创建旅行 */
  const createTrip = useCallback((
    title: string,
    startDate: string,
    endDate?: string,
  ): string => {
    const id = `dtrip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();
    const trip: DiaryTrip = {
      id,
      title,
      startDate,
      endDate: endDate || startDate,
      destinations: [],
      entryIds: [],
      trackIds: [],
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

  /** 更新旅行 */
  const updateTrip = useCallback((id: string, updates: Partial<DiaryTrip>) => {
    setTrips(prev => {
      const current = prev[id];
      if (!current) return prev;
      const next = {
        ...prev,
        [id]: { ...current, ...updates, updatedAt: new Date().toISOString() },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  /** 删除旅行 */
  const deleteTrip = useCallback((id: string) => {
    setTrips(prev => {
      const next = { ...prev };
      delete next[id];
      persist(next);
      return next;
    });
  }, [persist]);

  /** 获取旅行列表（按开始日期倒序） */
  const getTripsList = useCallback((): DiaryTrip[] => {
    return Object.values(trips).sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [trips]);

  /** 将条目添加到旅行 */
  const addEntryToTrip = useCallback((tripId: string, entryId: string) => {
    setTrips(prev => {
      const current = prev[tripId];
      if (!current) return prev;
      if (current.entryIds.includes(entryId)) return prev;
      const next = {
        ...prev,
        [tripId]: {
          ...current,
          entryIds: [...current.entryIds, entryId],
          updatedAt: new Date().toISOString(),
        },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  /** 从旅行移除条目 */
  const removeEntryFromTrip = useCallback((tripId: string, entryId: string) => {
    setTrips(prev => {
      const current = prev[tripId];
      if (!current) return prev;
      const next = {
        ...prev,
        [tripId]: {
          ...current,
          entryIds: current.entryIds.filter(id => id !== entryId),
          updatedAt: new Date().toISOString(),
        },
      };
      persist(next);
      return next;
    });
  }, [persist]);

  return {
    trips,
    createTrip,
    updateTrip,
    deleteTrip,
    getTripsList,
    addEntryToTrip,
    removeEntryFromTrip,
  };
}
