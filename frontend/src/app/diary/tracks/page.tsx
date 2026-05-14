'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ArrowLeft, Play, Pause, RotateCcw, SkipForward, Gauge, Clock, Route } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface GpsPoint {
  lat: number;
  lng: number;
  elevation?: number;
  accuracy: number;
  speed?: number;
  bearing?: number;
  timestamp: number;
}

function TrackPlaybackContent() {
  const searchParams = useSearchParams();
  const trackId = searchParams.get('track');

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const animRef = useRef<number | null>(null);

  const [points, setPoints] = useState<GpsPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x, 8x
  const speeds = [1, 2, 4, 8];

  // 加载轨迹数据
  useEffect(() => {
    if (!trackId) { setLoading(false); return; }
    fetch(`/api/tracks/${trackId}/points?limit=5000`)
      .then(r => r.json())
      .then(data => {
        if (data.points) setPoints(data.points);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [trackId]);

  // 初始化地图
  useEffect(() => {
    if (!mapContainer.current || points.length === 0) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'Track Playback',
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '&copy; CartoDB',
          },
        },
        layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark' }],
      },
      center: [points[0].lng, points[0].lat],
      zoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.on('load', () => {
      // 完整轨迹线
      const lineCoords: [number, number][] = points.map(p => [p.lng, p.lat]);
      map.addSource('track-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: lineCoords },
        },
      });
      map.addLayer({
        id: 'track-line-layer',
        type: 'line',
        source: 'track-line',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-opacity': 0.4,
        },
      });

      // 已播放轨迹
      map.addSource('track-played', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] as [number, number][] },
        },
      });
      map.addLayer({
        id: 'track-played-layer',
        type: 'line',
        source: 'track-played',
        paint: {
          'line-color': '#22c55e',
          'line-width': 4,
        },
      });

      // 起点/终点标记
      new maplibregl.Marker({ color: '#22c55e' })
        .setLngLat([points[0].lng, points[0].lat])
        .addTo(map);
      new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat([points[points.length - 1].lng, points[points.length - 1].lat])
        .addTo(map);

      // 当前位置标记
      const el = document.createElement('div');
      el.innerHTML = '<div style="width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 0 10px rgba(59,130,246,0.5)"></div>';
      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([points[0].lng, points[0].lat])
        .addTo(map);

      // 适配视图
      const bounds = new maplibregl.LngLatBounds();
      points.forEach(p => bounds.extend([p.lng, p.lat]));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60 });
      }
    });

    mapRef.current = map;

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      map.remove();
    };
  }, [points]);

  // 更新已播放轨迹
  const updatePlayedLine = useCallback((index: number) => {
    const map = mapRef.current;
    if (!map || !map.getSource('track-played')) return;
    const coords = points.slice(0, index + 1).map(p => [p.lng, p.lat]);
    (map.getSource('track-played') as any).setData({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    });
    // 移动标记
    if (markerRef.current && points[index]) {
      markerRef.current.setLngLat([points[index].lng, points[index].lat]);
    }
  }, [points]);

  // 播放动画
  useEffect(() => {
    if (!playing || points.length === 0) return;

    let lastTime = performance.now();
    const step = () => {
      const now = performance.now();
      const elapsed = now - lastTime;
      const pointsPerFrame = speed * 2; // 速度控制
      const interval = 100; // ms per step

      if (elapsed >= interval / speed) {
        lastTime = now;
        setCurrentIndex(prev => {
          const next = Math.min(prev + pointsPerFrame, points.length - 1);
          updatePlayedLine(next);
          if (next >= points.length - 1) {
            setPlaying(false);
          }
          return next;
        });
      }

      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [playing, speed, points, updatePlayedLine]);

  const handlePlayPause = useCallback(() => setPlaying(p => !p), []);
  const handleReset = useCallback(() => {
    setPlaying(false);
    setCurrentIndex(0);
    updatePlayedLine(0);
  }, [updatePlayedLine]);
  const handleSkip = useCallback(() => {
    const next = Math.min(currentIndex + Math.floor(points.length * 0.1), points.length - 1);
    setCurrentIndex(next);
    updatePlayedLine(next);
  }, [currentIndex, points.length, updatePlayedLine]);

  const currentPoint = points[currentIndex];
  const progress = points.length > 0 ? ((currentIndex / (points.length - 1)) * 100) : 0;

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1a1a2e] text-white/60">
        加载轨迹...
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#1a1a2e] text-white/60 flex-col gap-2">
        <Route size={48} className="opacity-30" />
        <p>{trackId ? '轨迹不存在' : '请指定轨迹 ID'}</p>
        <Link href="/diary" className="text-blue-400 text-sm">返回日记</Link>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#1a1a2e] text-white">
      {/* 顶栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/60 backdrop-blur-md border-b border-white/10">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link href="/diary" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-medium text-sm flex items-center gap-2">
            <Route size={16} className="text-blue-400" />
            轨迹回放
          </span>
          <span className="text-xs text-white/40 ml-auto">
            {points.length} 个点
          </span>
        </div>
      </div>

      {/* 地图 */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* 播放控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/70 backdrop-blur-md border-t border-white/10 p-4">
        {/* 进度条 */}
        <div className="mb-3">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/40 mt-1">
            <span>{currentIndex} / {points.length - 1}</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* 信息 */}
          <div className="flex items-center gap-4 text-xs text-white/60">
            {currentPoint?.timestamp && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {new Date(currentPoint.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            {currentPoint?.speed !== undefined && (
              <span className="flex items-center gap-1">
                <Gauge size={12} />
                {(currentPoint.speed * 3.6).toFixed(1)} km/h
              </span>
            )}
            {currentPoint?.elevation !== undefined && (
              <span>{currentPoint.elevation.toFixed(0)}m</span>
            )}
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <RotateCcw size={18} />
            </button>
            <button onClick={handlePlayPause} className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors">
              {playing ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button onClick={handleSkip} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <SkipForward size={18} />
            </button>
            <div className="flex items-center gap-1 ml-2">
              {speeds.map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${speed === s ? 'bg-white/20 text-white' : 'text-white/40 hover:bg-white/10'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackPlaybackPage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#1a1a2e]" />}>
      <TrackPlaybackContent />
    </Suspense>
  );
}
