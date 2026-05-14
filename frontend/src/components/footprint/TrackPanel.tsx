'use client';

import { useState, useCallback, useRef } from 'react';
import type { GpsTrack, GpsPoint } from '@/lib/types';
import { TrackTimeline } from './TrackTimeline';
import { TrackLayer } from './TrackLayer';
import { useTracks } from '@/hooks/useTracks';
import { useFootprints } from '@/hooks/useFootprints';
import { Upload, RefreshCw, Zap, MapPin, Route, Clock } from 'lucide-react';
import type { Map as MapLibreMap } from 'maplibre-gl';

interface TrackPanelProps {
  map: MapLibreMap | null;
  isDark?: boolean;
  accentColor?: string;
}

export function TrackPanel({ map, isDark = true, accentColor = '#f59e0b' }: TrackPanelProps) {
  const {
    tracks,
    loading,
    stats,
    loadTracks,
    saveBatch,
    fetchPoints,
    deleteTrack,
    syncFromServer,
    uploadToServer,
    computeFootprints,
  } = useTracks();

  const { lightUp } = useFootprints();
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [activePoints, setActivePoints] = useState<GpsPoint[]>([]);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lighting, setLighting] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** 选中轨迹 → 加载 GPS 点 */
  const handleSelectTrack = useCallback(async (track: GpsTrack) => {
    setActiveTrackId(track.id);
    try {
      const points = await fetchPoints(track.id, 0, 5000);
      setActivePoints(points as GpsPoint[]);
      // 飞到轨迹 bounds
      if (map) {
        const [minLng, minLat, maxLng, maxLat] = track.bounds;
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
          padding: 80,
          duration: 1000,
        });
      }
    } catch (e) {
      console.error('[TrackPanel] Failed to load track points:', e);
    }
  }, [map, fetchPoints]);

  /** 删除轨迹 */
  const handleDeleteTrack = useCallback(async (trackId: string) => {
    await deleteTrack(trackId);
    if (activeTrackId === trackId) {
      setActiveTrackId(null);
      setActivePoints([]);
    }
  }, [deleteTrack, activeTrackId]);

  /** 导入 GPX 文件 */
  const handleImportGpx = useCallback(async (file: File) => {
    setUploading(true);
    setUploadStatus('解析 GPX 文件...');
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');

      const trkpts = doc.querySelectorAll('trkpt');
      if (trkpts.length === 0) throw new Error('No track points found');

      const points: GpsPoint[] = [];
      trkpts.forEach(pt => {
        const lat = parseFloat(pt.getAttribute('lat') || '0');
        const lng = parseFloat(pt.getAttribute('lon') || '0');
        if (lat === 0 && lng === 0) return;

        const timeEl = pt.querySelector('time');
        const eleEl = pt.querySelector('ele');
        points.push({
          lat,
          lng,
          elevation: eleEl ? parseFloat(eleEl.textContent || '') : undefined,
          accuracy: 10, // GPX 无精度信息
          timestamp: timeEl ? new Date(timeEl.textContent || '').getTime() : Date.now(),
        });
      });

      if (points.length === 0) throw new Error('No valid points');

      // 排序
      points.sort((a, b) => a.timestamp - b.timestamp);

      // 计算 bounds
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      for (const p of points) {
        if (p.lng < minLng) minLng = p.lng;
        if (p.lat < minLat) minLat = p.lat;
        if (p.lng > maxLng) maxLng = p.lng;
        if (p.lat > maxLat) maxLat = p.lat;
      }

      // 计算距离（简化）
      let distance = 0;
      for (let i = 1; i < points.length; i++) {
        const d = haversine(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
        distance += d;
      }

      const duration = (points[points.length - 1].timestamp - points[0].timestamp) / 1000;
      const now = new Date().toISOString();

      const track: GpsTrack = {
        id: crypto.randomUUID(),
        deviceId: 'web-import',
        title: file.name.replace(/\.gpx$/i, ''),
        type: 'imported',
        startTime: new Date(points[0].timestamp).toISOString(),
        endTime: new Date(points[points.length - 1].timestamp).toISOString(),
        distance: Math.round(distance),
        duration: Math.round(duration),
        pointCount: points.length,
        bounds: [minLng, minLat, maxLng, maxLat],
        createdAt: now,
        updatedAt: now,
      };

      setUploadStatus('保存到本地...');
      await saveBatch([track], [{ trackId: track.id, points }]);

      // 尝试上传到服务端
      try {
        setUploadStatus('上传到服务端...');
        await uploadToServer([track], [{ trackId: track.id, points }]);
      } catch { /* 上传失败不影响本地 */ }

      setUploadStatus(`导入成功：${points.length} 个点，${formatDistance(Math.round(distance))}`);
      // 自动点亮轨迹经过的区域
      setTimeout(() => handleLightUp(track.id), 500);
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (e) {
      console.error('[TrackPanel] GPX import failed:', e);
      setUploadStatus('导入失败：' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      setUploading(false);
    }
  }, [saveBatch, uploadToServer]);

  /** 同步服务端数据 */
  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncFromServer();
    } finally {
      setSyncing(false);
    }
  }, [syncFromServer]);

  /** 自动点亮轨迹经过的区域 */
  const handleLightUp = useCallback(async (trackId: string) => {
    setLighting(trackId);
    try {
      const result = await computeFootprints(trackId);
      if (result && result.footprints.length > 0) {
        for (const fp of result.footprints) {
          lightUp(fp.adcode, 'track', trackId);
        }
        setUploadStatus(`点亮了 ${result.footprints.length} 个区域`);
        setTimeout(() => setUploadStatus(null), 3000);
      } else {
        setUploadStatus('未匹配到行政区划');
        setTimeout(() => setUploadStatus(null), 2000);
      }
    } catch (e) {
      console.error('[TrackPanel] LightUp failed:', e);
      setUploadStatus('自动点亮失败');
      setTimeout(() => setUploadStatus(null), 2000);
    } finally {
      setLighting(null);
    }
  }, [computeFootprints, lightUp]);

  return (
    <>
      {/* 地图图层 */}
      <TrackLayer
        map={map}
        tracks={tracks}
        activeTrackPoints={activePoints}
        activeTrackId={activeTrackId}
        color={accentColor}
        onTrackClick={handleSelectTrack}
        visible={true}
      />

      {/* 轨迹面板 */}
      <div className="space-y-3">
        {/* 统计概览 */}
        <div className={`grid grid-cols-3 gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <div className={`rounded-lg p-2.5 text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Route size={12} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              <span className="text-xs opacity-60">总距离</span>
            </div>
            <div className="text-sm font-medium">{formatDistance(stats.totalDistance)}</div>
          </div>
          <div className={`rounded-lg p-2.5 text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock size={12} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              <span className="text-xs opacity-60">总时长</span>
            </div>
            <div className="text-sm font-medium">{formatDuration(stats.totalDuration)}</div>
          </div>
          <div className={`rounded-lg p-2.5 text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <MapPin size={12} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
              <span className="text-xs opacity-60">轨迹数</span>
            </div>
            <div className="text-sm font-medium">{stats.totalTracks}</div>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleImportGpx(file);
              e.target.value = '';
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 text-white disabled:opacity-50'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50'
            }`}
          >
            <Upload size={14} />
            {uploading ? '导入中...' : '导入 GPX'}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 text-white disabled:opacity-50'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50'
            }`}
            title="从服务端同步"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* 上传状态 */}
        {uploadStatus && (
          <div className={`text-xs px-3 py-2 rounded-lg ${
            isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-600'
          }`}>
            {uploadStatus}
          </div>
        )}

        {/* 选中轨迹操作 */}
        {activeTrackId && (
          <div className={`flex gap-2 p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <button
              onClick={() => handleLightUp(activeTrackId)}
              disabled={lighting !== null}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 disabled:opacity-50'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 disabled:opacity-50'
              }`}
            >
              <Zap size={14} className={lighting === activeTrackId ? 'animate-pulse' : ''} />
              {lighting === activeTrackId ? '点亮中...' : '自动点亮区域'}
            </button>
            <button
              onClick={() => { setActiveTrackId(null); setActivePoints([]); }}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 text-gray-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
              }`}
            >
              取消选中
            </button>
          </div>
        )}

        {/* 轨迹时间线 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={20} className="animate-spin opacity-50" />
          </div>
        ) : (
          <TrackTimeline
            tracks={tracks}
            activeTrackId={activeTrackId}
            onSelectTrack={handleSelectTrack}
            onDeleteTrack={handleDeleteTrack}
            isDark={isDark}
          />
        )}
      </div>
    </>
  );
}

/** Haversine 距离计算 */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  if (meters < 10000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters / 1000)}km`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}秒`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}分${s}秒` : `${m}分`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h < 24) return m > 0 ? `${h}时${m}分` : `${h}时`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh > 0 ? `${d}天${rh}时` : `${d}天`;
}
