'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  getAllTracks,
  getTrack,
  putTrack,
  deleteTrack as dbDeleteTrack,
  getTrackPoints,
  putTrackPoints,
  getTrackPointCount,
  deleteTrackWithPoints,
  initIndexedDB,
  getIndexedDBStats,
} from '@/lib/indexeddb';
import type { GpsTrack, GpsPoint, TrackFootprintResult } from '@/lib/types';

export interface TrackListStats {
  totalTracks: number;
  totalDistance: number; // 米
  totalDuration: number; // 秒
  totalPoints: number;
}

export function useTracks() {
  const [tracks, setTracks] = useState<GpsTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TrackListStats>({
    totalTracks: 0,
    totalDistance: 0,
    totalDuration: 0,
    totalPoints: 0,
  });
  const initRef = useRef(false);

  /** 初始化：从 IndexedDB 加载轨迹列表 */
  const loadTracks = useCallback(async () => {
    setLoading(true);
    try {
      await initIndexedDB();
      const allTracks = await getAllTracks();
      const sorted = (allTracks as GpsTrack[]).sort(
        (a, b) => b.startTime.localeCompare(a.startTime),
      );
      setTracks(sorted);
      updateStats(sorted);
    } catch (e) {
      console.error('[useTracks] Failed to load tracks:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 计算统计信息 */
  const updateStats = useCallback(async (trackList: GpsTrack[]) => {
    let totalPoints = 0;
    for (const t of trackList) {
      try {
        const count = await getTrackPointCount(t.id);
        totalPoints += count;
      } catch { /* skip */ }
    }

    setStats({
      totalTracks: trackList.length,
      totalDistance: trackList.reduce((sum, t) => sum + t.distance, 0),
      totalDuration: trackList.reduce((sum, t) => sum + t.duration, 0),
      totalPoints,
    });
  }, []);

  /** 首次挂载时加载 */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    loadTracks();
  }, [loadTracks]);

  /** 保存轨迹元数据到 IndexedDB */
  const saveTrack = useCallback(async (track: GpsTrack) => {
    await initIndexedDB();
    await putTrack(track);
    // 刷新列表
    setTracks(prev => {
      const idx = prev.findIndex(t => t.id === track.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = track;
        return next;
      }
      return [track, ...prev].sort(
        (a, b) => b.startTime.localeCompare(a.startTime),
      );
    });
    return track;
  }, []);

  /** 保存 GPS 点到 IndexedDB */
  const savePoints = useCallback(async (trackId: string, points: GpsPoint[]) => {
    await initIndexedDB();
    await putTrackPoints(trackId, points);
  }, []);

  /** 批量保存轨迹+点（用于上传后本地持久化） */
  const saveBatch = useCallback(async (
    trackData: GpsTrack[],
    pointsData: Array<{ trackId: string; points: GpsPoint[] }>,
  ) => {
    await initIndexedDB();
    for (const track of trackData) {
      await putTrack(track);
    }
    for (const batch of pointsData) {
      await putTrackPoints(batch.trackId, batch.points);
    }
    await loadTracks();
  }, [loadTracks]);

  /** 获取单条轨迹的 GPS 点（分页） */
  const fetchPoints = useCallback(async (
    trackId: string,
    offset: number = 0,
    limit: number = 1000,
  ): Promise<GpsPoint[]> => {
    await initIndexedDB();
    return getTrackPoints(trackId, offset, limit) as Promise<GpsPoint[]>;
  }, []);

  /** 获取轨迹 GPS 点数量 */
  const getPointCount = useCallback(async (trackId: string): Promise<number> => {
    await initIndexedDB();
    return getTrackPointCount(trackId);
  }, []);

  /** 删除轨迹 */
  const deleteTrack = useCallback(async (trackId: string) => {
    await initIndexedDB();
    await deleteTrackWithPoints(trackId);
    setTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);

  /** 从 API 同步轨迹到 IndexedDB */
  const syncFromServer = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/tracks/batch');
      if (!resp.ok) throw new Error('Failed to fetch tracks');
      const data = await resp.json();
      const serverTracks: GpsTrack[] = data.tracks || [];

      await initIndexedDB();

      for (const track of serverTracks) {
        const existing = await getTrack(track.id);
        if (!existing || existing.updatedAt < track.updatedAt) {
          await putTrack(track);
        }
      }

      // 同步 GPS 点
      for (const track of serverTracks) {
        const localCount = await getTrackPointCount(track.id);
        if (localCount < track.pointCount) {
          // 获取服务端点（增量）
          const pointsResp = await fetch(
            `/api/tracks/${track.id}/points?offset=${localCount}&limit=${track.pointCount - localCount}`,
          );
          if (pointsResp.ok) {
            const pointsData = await pointsResp.json();
            if (pointsData.points?.length > 0) {
              await putTrackPoints(track.id, pointsData.points);
            }
          }
        }
      }

      await loadTracks();
    } catch (e) {
      console.error('[useTracks] Sync failed:', e);
    } finally {
      setLoading(false);
    }
  }, [loadTracks]);

  /** 上传轨迹到服务端 */
  const uploadToServer = useCallback(async (
    tracksToUpload: GpsTrack[],
    pointsToUpload: Array<{ trackId: string; points: GpsPoint[] }>,
  ) => {
    const resp = await fetch('/api/tracks/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tracks: tracksToUpload,
        points: pointsToUpload,
      }),
    });
    if (!resp.ok) throw new Error('Upload failed');
    return resp.json();
  }, []);

  /** 从轨迹自动计算点亮区域 */
  const computeFootprints = useCallback(async (
    trackId: string,
  ): Promise<TrackFootprintResult | null> => {
    try {
      const resp = await fetch(`/api/tracks/${trackId}/footprints`, {
        method: 'POST',
      });
      if (!resp.ok) return null;
      return resp.json();
    } catch (e) {
      console.error('[useTracks] Compute footprints failed:', e);
      return null;
    }
  }, []);

  /** 获取数据库统计 */
  const fetchDbStats = useCallback(async () => {
    await initIndexedDB();
    return getIndexedDBStats();
  }, []);

  /** 自动处理所有未点亮的轨迹 */
  const autoLightAllUnprocessed = useCallback(async (
    lightUpFn: (adcode: string, source: 'track', sourceId: string) => void,
  ) => {
    try {
      await initIndexedDB();
      const allTracks = await getAllTracks() as GpsTrack[];
      let newCount = 0;
      for (const track of allTracks) {
        if (track.footprintProcessed) continue;
        try {
          const result = await computeFootprints(track.id);
          if (result && result.footprints.length > 0) {
            for (const fp of result.footprints) {
              lightUpFn(fp.adcode, 'track', track.id);
            }
            newCount += result.footprints.length;
          }
          // 标记为已处理
          const updated = { ...track, footprintProcessed: true, updatedAt: new Date().toISOString() };
          await putTrack(updated);
        } catch {
          // 单条失败不影响其他
        }
      }
      if (newCount > 0) {
        console.log(`[useTracks] Auto-lit ${newCount} regions from tracks`);
        await loadTracks();
      }
    } catch (e) {
      console.error('[useTracks] autoLightAllUnprocessed failed:', e);
    }
  }, [computeFootprints, loadTracks]);

  return {
    tracks,
    loading,
    stats,
    loadTracks,
    saveTrack,
    savePoints,
    saveBatch,
    fetchPoints,
    getPointCount,
    deleteTrack,
    syncFromServer,
    uploadToServer,
    computeFootprints,
    fetchDbStats,
    autoLightAllUnprocessed,
  };
}
