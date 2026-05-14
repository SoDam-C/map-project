'use client';

import { useState, useCallback, useRef } from 'react';
import { extractGps, extractDateTaken, generateThumbnail } from './useExif';
import { load, save } from '@/lib/storage';
import type { PhotoRecord, PhotoImportStatus } from '@/lib/types';

const NAMESPACE = 'photos' as const;

const MOCK_PHOTOS: Record<string, PhotoRecord> = {
  'photo-1': {
    id: 'photo-1',
    lat: 28.001,
    lng: 120.699,
    takenAt: '2026-03-13T14:30:00Z',
    adcode: '330300',
    regionName: '温州市',
    thumbnail: '',
    tags: ['旅行', '温州'],
  },
  'photo-2': {
    id: 'photo-2',
    lat: 31.468,
    lng: 104.682,
    takenAt: '2026-04-22T10:15:00Z',
    adcode: '510700',
    regionName: '绵阳市',
    thumbnail: '',
    tags: ['旅行', '绵阳'],
  },
  'photo-3': {
    id: 'photo-3',
    lat: 30.593,
    lng: 114.305,
    takenAt: '2026-05-01T12:00:00Z',
    adcode: '420100',
    regionName: '武汉市',
    thumbnail: '',
    tags: ['旅行', '武汉'],
  },
  'photo-4': {
    id: 'photo-4',
    lat: 32.060,
    lng: 118.796,
    takenAt: '2026-05-10T15:30:00Z',
    adcode: '320100',
    regionName: '南京市',
    thumbnail: '',
    tags: ['旅行', '南京'],
  },
  'photo-5': {
    id: 'photo-5',
    lat: 24.479,
    lng: 118.089,
    takenAt: '2026-08-06T16:00:00Z',
    adcode: '350200',
    regionName: '厦门市',
    thumbnail: '',
    tags: ['旅行', '厦门'],
  },
};

export function usePhotos() {
  const [photos, setPhotos] = useState<Record<string, PhotoRecord>>(() => {
    if (typeof window === 'undefined') return MOCK_PHOTOS;
    const stored = load<Record<string, PhotoRecord>>(NAMESPACE);
    if (stored && Object.keys(stored).length > 0) return stored;
    return MOCK_PHOTOS;
  });
  const [importStatus, setImportStatus] = useState<PhotoImportStatus>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((data: Record<string, PhotoRecord>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(NAMESPACE, data), 500);
  }, []);

  /** 导入单张照片 */
  const importPhoto = useCallback(async (file: File): Promise<PhotoRecord | null> => {
    setImportStatus('reading');
    try {
      // 并行提取 EXIF 数据和生成缩略图
      const [gps, dateTaken, thumbnail] = await Promise.all([
        extractGps(file),
        extractDateTaken(file),
        generateThumbnail(file),
      ]);

      if (!gps) {
        setImportStatus('error');
        return null;
      }

      setImportStatus('geocoding');

      const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record: PhotoRecord = {
        id,
        lat: gps.latitude,
        lng: gps.longitude,
        takenAt: dateTaken || new Date(file.lastModified).toISOString(),
        thumbnail,
      };

      setPhotos(prev => {
        const next = { ...prev, [id]: record };
        persist(next);
        return next;
      });

      setImportStatus('done');
      setTimeout(() => setImportStatus('idle'), 1500);
      return record;
    } catch {
      setImportStatus('error');
      return null;
    }
  }, [persist]);

  /** 批量导入照片 */
  const importPhotos = useCallback(async (files: File[]): Promise<PhotoRecord[]> => {
    const results: PhotoRecord[] = [];
    for (const file of files) {
      const record = await importPhoto(file);
      if (record) results.push(record);
    }
    return results;
  }, [importPhoto]);

  /** 更新照片信息（关联 adcode、添加描述等） */
  const updatePhoto = useCallback((id: string, updates: Partial<PhotoRecord>) => {
    setPhotos(prev => {
      const current = prev[id];
      if (!current) return prev;
      const next = { ...prev, [id]: { ...current, ...updates } };
      persist(next);
      return next;
    });
  }, [persist]);

  /** 删除照片 */
  const deletePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const next = { ...prev };
      delete next[id];
      persist(next);
      return next;
    });
  }, [persist]);

  /** 按日期分组获取照片 */
  const getPhotosByDate = useCallback((): Record<string, PhotoRecord[]> => {
    const grouped: Record<string, PhotoRecord[]> = {};
    for (const photo of Object.values(photos)) {
      const dateKey = photo.takenAt.slice(0, 10); // YYYY-MM-DD
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(photo);
    }
    // 按日期倒序
    const sorted: Record<string, PhotoRecord[]> = {};
    Object.keys(grouped).sort().reverse().forEach(key => {
      sorted[key] = grouped[key].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
    });
    return sorted;
  }, [photos]);

  /** 按区域分组获取照片 */
  const getPhotosByRegion = useCallback((): Record<string, PhotoRecord[]> => {
    const grouped: Record<string, PhotoRecord[]> = {};
    for (const photo of Object.values(photos)) {
      const key = photo.adcode || `${photo.lat.toFixed(2)},${photo.lng.toFixed(2)}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(photo);
    }
    return grouped;
  }, [photos]);

  return {
    photos,
    importStatus,
    importPhoto,
    importPhotos,
    updatePhoto,
    deletePhoto,
    getPhotosByDate,
    getPhotosByRegion,
  };
}
