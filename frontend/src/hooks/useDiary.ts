'use client';

import { useState, useCallback, useRef } from 'react';
import { load, save } from '@/lib/storage';
import type { DiaryEntry, DiaryEntryType, DiaryStore } from '@/lib/types';

const NAMESPACE = 'diary' as const;

export function useDiary() {
  const [entries, setEntries] = useState<DiaryStore>(() => {
    if (typeof window === 'undefined') return {};
    return load<DiaryStore>(NAMESPACE) || {};
  });
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((data: DiaryStore) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      save(NAMESPACE, data);
      // 同步到服务端
      syncToServer(data);
    }, 500);
  }, []);

  // 同步到服务端（fire-and-forget）
  const syncToServer = useCallback(async (data: DiaryStore) => {
    try {
      await fetch('/api/diary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: data }),
      });
    } catch {
      // 静默失败，不影响本地使用
    }
  }, []);

  // 从服务端拉取（首次加载或手动同步）
  const syncFromServer = useCallback(async () => {
    try {
      const resp = await fetch('/api/diary');
      if (!resp.ok) return;
      const { entries: serverEntries } = await resp.json();
      if (!serverEntries || typeof serverEntries !== 'object') return;

      // 合并：服务端数据覆盖本地（以 updatedAt 为准）
      setEntries(prev => {
        const merged = { ...prev };
        for (const [id, serverEntry] of Object.entries(serverEntries as Record<string, DiaryEntry>)) {
          const local = merged[id];
          if (!local || new Date(serverEntry.updatedAt) > new Date(local.updatedAt)) {
            merged[id] = serverEntry;
          }
        }
        save(NAMESPACE, merged);
        return merged;
      });
    } catch {
      // 静默失败
    }
  }, []);

  /** 生成唯一 ID */
  const genId = useCallback(() => {
    return `diary-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }, []);

  /** 创建日记条目 */
  const createEntry = useCallback((
    data: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>,
  ): string => {
    const id = genId();
    const now = new Date().toISOString();
    const entry: DiaryEntry = {
      ...data,
      id,
      photoRefs: data.photoRefs || [],
      createdAt: now,
      updatedAt: now,
    };
    setEntries(prev => {
      const next = { ...prev, [id]: entry };
      persist(next);
      return next;
    });
    return id;
  }, [genId, persist]);

  /** 更新日记条目 */
  const updateEntry = useCallback((id: string, updates: Partial<DiaryEntry>) => {
    setEntries(prev => {
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

  /** 删除日记条目 */
  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => {
      const next = { ...prev };
      delete next[id];
      persist(next);
      return next;
    });
  }, [persist]);

  /** 按日期获取条目 */
  const getEntriesByDate = useCallback((date: string): DiaryEntry[] => {
    return Object.values(entries)
      .filter(e => e.date === date)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [entries]);

  /** 按日期范围获取 */
  const getEntriesByDateRange = useCallback((from: string, to: string): DiaryEntry[] => {
    return Object.values(entries)
      .filter(e => e.date >= from && e.date <= to)
      .sort((a, b) => {
        const dc = b.date.localeCompare(a.date);
        if (dc !== 0) return dc;
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }, [entries]);

  /** 按旅行获取 */
  const getEntriesByTrip = useCallback((tripId: string): DiaryEntry[] => {
    return Object.values(entries)
      .filter(e => e.tripId === tripId)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [entries]);

  /** 按类型获取 */
  const getEntriesByType = useCallback((type: DiaryEntryType): DiaryEntry[] => {
    return Object.values(entries).filter(e => e.type === type);
  }, [entries]);

  /** 从 GPS 轨迹创建日记骨架 */
  const createFromTrack = useCallback((
    track: { id: string; startTime: string; endTime?: string; title?: string; bounds?: number[] },
    tripId?: string,
  ): string => {
    const startTime = track.startTime;
    const date = startTime.slice(0, 10);
    const endDate = track.endTime?.slice(0, 10);
    const lat = track.bounds ? (track.bounds[1] + track.bounds[3]) / 2 : undefined;
    const lng = track.bounds ? (track.bounds[0] + track.bounds[2]) / 2 : undefined;

    return createEntry({
      type: 'track_entry',
      date,
      startTime,
      endTime: track.endTime,
      title: track.title || `${date} 的记录`,
      lat,
      lng,
      content: '',
      photoRefs: [],
      status: 'draft',
      trackIds: [track.id],
      tripId,
    });
  }, [createEntry]);

  /** 获取所有日期（去重倒序） */
  const getAllDates = useCallback((): string[] => {
    const dates = new Set(Object.values(entries).map(e => e.date));
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  /** 统计 */
  const getStats = useCallback(() => {
    const all = Object.values(entries);
    return {
      total: all.length,
      withContent: all.filter(e => e.content.length > 0).length,
      drafts: all.filter(e => e.status === 'draft' && e.content.length === 0).length,
      withTrack: all.filter(e => e.type === 'track_entry').length,
      withPhotos: all.filter(e => e.photoRefs.length > 0).length,
    };
  }, [entries]);

  return {
    entries,
    createEntry,
    updateEntry,
    deleteEntry,
    getEntriesByDate,
    getEntriesByDateRange,
    getEntriesByTrip,
    getEntriesByType,
    createFromTrack,
    getAllDates,
    getStats,
    syncFromServer,
  };
}
