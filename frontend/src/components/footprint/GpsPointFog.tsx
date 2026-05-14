'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import { Popup } from 'maplibre-gl';
import { Cloud, CloudOff, Clock } from 'lucide-react';
import type { GpsPointsData, TrackInfo } from '@/hooks/useGpsPoints';
import type { Feature, LineString, Point } from 'geojson';

interface GpsPointFogProps {
  map: MapLibreMap | null;
  gpsData: GpsPointsData;
  loading: boolean;
  isDark: boolean;
}

const FOG_IMAGE_ID = 'layer-fog-canvas';
const FOG_IMAGE_SRC = 'layer-fog-canvas-src';
const GPS_DOTS_HIT_ID = 'layer-gps-dots-hit';
const GPS_DOTS_SRC = 'layer-gps-dots-src';

const CANVAS_SIZE = 1024;
const CORRIDOR_RADIUS_M = 25;
const BLUR_MULTIPLIER = 3;
const ERASE_ALPHA = 0.45;
const CORRIDOR_BUFFER = 0.00025;
// Visibility: lit area width >= 1.2px → draw, < 0.5px → skip
const MIN_PX = 0.5;
const FULL_PX = 1.2;

// ── Time period presets ──

type TimePeriod = 'today' | 'yesterday' | '3days' | 'week' | 'month' | 'year' | 'all';

const TIME_PRESETS: { key: TimePeriod; label: string }[] = [
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: '3days', label: '近3天' },
  { key: 'week', label: '近一周' },
  { key: 'month', label: '近一月' },
  { key: 'year', label: '近一年' },
  { key: 'all', label: '全部' },
];

function getPeriodMs(period: TimePeriod): number | null {
  if (period === 'all') return null;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (period === 'today') return todayStart;
  if (period === 'yesterday') return todayStart - 86400000;
  const days: Record<string, number> = { '3days': 3, week: 7, month: 30, year: 365 };
  return todayStart - (days[period] ?? 0) * 86400000;
}

function speedColor(speed: number): string {
  if (speed < 5) return '#22c55e';
  if (speed < 12) return '#84cc16';
  if (speed < 20) return '#facc15';
  if (speed < 30) return '#f97316';
  return '#ef4444';
}

// ── Canvas fog + tracks renderer ──
// Everything on one canvas: fog clearing + speed lines + GPS dots.
// One rendering pass → perfect synchronization.

interface FogBounds {
  west: number; south: number; east: number; north: number;
}

function mercY(lat: number): number {
  const r = lat * Math.PI / 180;
  return Math.log(Math.tan(r) + 1 / Math.cos(r));
}

function renderFogCanvas(
  lines: Feature<LineString>[],
  points: Feature<Point>[],
  tracksInfo: TrackInfo[],
  map: MapLibreMap,
  fogRgba: string,
): { dataUrl: string; bounds: FogBounds } {
  const b = map.getBounds();
  const padFactor = 0.6;
  const lngSpan = b.getEast() - b.getWest();
  const latSpan = b.getNorth() - b.getSouth();

  const bounds: FogBounds = {
    west: b.getWest() - lngSpan * padFactor,
    east: b.getEast() + lngSpan * padFactor,
    north: b.getNorth() + latSpan * padFactor,
    south: b.getSouth() - latSpan * padFactor,
  };

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = fogRgba;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  const bLng = bounds.east - bounds.west;
  const mNorth = mercY(bounds.north);
  const mSouth = mercY(bounds.south);
  const mSpan = mNorth - mSouth;

  const geoToCanvas = (lng: number, lat: number): [number, number] => [
    (lng - bounds.west) / bLng * CANVAS_SIZE,
    (mNorth - mercY(lat)) / mSpan * CANVAS_SIZE,
  ];

  const centerLat = (bounds.north + bounds.south) / 2;
  const mpp = bLng / CANVAS_SIZE * 111320 * Math.cos(centerLat * Math.PI / 180);
  const corridorPx = CORRIDOR_RADIUS_M * 2 / mpp;

  // Viewport cull
  const margin = CORRIDOR_BUFFER + 0.003;
  const vpPoints = points.filter(pt => {
    const [lng, lat] = pt.geometry.coordinates;
    return lng >= bounds.west - margin && lng <= bounds.east + margin &&
           lat >= bounds.south - margin && lat <= bounds.north + margin;
  });

  if (vpPoints.length === 0) return { dataUrl: canvas.toDataURL(), bounds };

  // Group by track → per-track bbox
  const trackData = new Map<string, {
    pts: Feature<Point>[];
    bbox: [number, number, number, number];
  }>();

  for (const pt of vpPoints) {
    const tid = pt.properties?.trackId as string;
    if (!tid) continue;
    if (!trackData.has(tid)) {
      trackData.set(tid, { pts: [], bbox: [Infinity, Infinity, -Infinity, -Infinity] });
    }
    const d = trackData.get(tid)!;
    d.pts.push(pt);
    const [lng, lat] = pt.geometry.coordinates;
    if (lng < d.bbox[0]) d.bbox[0] = lng;
    if (lat < d.bbox[1]) d.bbox[1] = lat;
    if (lng > d.bbox[2]) d.bbox[2] = lng;
    if (lat > d.bbox[3]) d.bbox[3] = lat;
  }

  // Per-track visibility
  const visibleIds = new Set<string>();
  for (const [tid, { pts, bbox }] of trackData) {
    const wDeg = bbox[2] - bbox[0];
    const hDeg = bbox[3] - bbox[1];
    const cLat = (bbox[1] + bbox[3]) / 2;
    const wM = wDeg * 111320 * Math.cos(cLat * Math.PI / 180);
    const hM = hDeg * 111320;
    const bboxAreaM2 = wM * hM;
    const corridorAreaM2 = pts.length * Math.PI * CORRIDOR_RADIUS_M * CORRIDOR_RADIUS_M;
    const isDense = bboxAreaM2 > 0 && corridorAreaM2 / bboxAreaM2 > 0.2;
    const litWidthM = isDense ? Math.min(wM, hM) : CORRIDOR_RADIUS_M * 2;
    const litPx = litWidthM / mpp;
    if (litPx >= FULL_PX) visibleIds.add(tid);
  }

  if (visibleIds.size === 0) return { dataUrl: canvas.toDataURL(), bounds };

  // Viewport-cull lines
  const marginDeg = CORRIDOR_RADIUS_M / 111320 * BLUR_MULTIPLIER;
  const vpLines = lines.filter(line => {
    const coords = line.geometry.coordinates as [number, number][];
    for (const c of coords) {
      if (c[0] >= bounds.west - marginDeg && c[0] <= bounds.east + marginDeg &&
          c[1] >= bounds.south - marginDeg && c[1] <= bounds.north + marginDeg) {
        return true;
      }
    }
    return false;
  });

  // Build trackId → speeds lookup
  const speedsMap = new Map<string, number[]>();
  for (const t of tracksInfo) speedsMap.set(t.trackId, t.speeds);

  const effectivePx = Math.max(0.5, corridorPx);

  // ── Pass 1: Clear fog corridors ──
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const line of vpLines) {
    if (!visibleIds.has(line.properties?.trackId as string)) continue;
    const coords = line.geometry.coordinates as [number, number][];
    if (coords.length < 2) continue;
    ctx.lineWidth = effectivePx;
    ctx.shadowBlur = effectivePx * BLUR_MULTIPLIER;
    ctx.strokeStyle = `rgba(0,0,0,${ERASE_ALPHA})`;
    ctx.shadowColor = 'rgba(0,0,0,1)';
    ctx.beginPath();
    for (let i = 0; i < coords.length; i++) {
      const [x, y] = geoToCanvas(coords[i][0], coords[i][1]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // ── Pass 2: Draw speed-colored lines in cleared areas ──
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const lineW = Math.max(1, effectivePx * 0.35);

  for (const line of vpLines) {
    const tid = line.properties?.trackId as string;
    if (!visibleIds.has(tid)) continue;
    const speeds = speedsMap.get(tid);
    const coords = line.geometry.coordinates as [number, number][];
    ctx.lineWidth = lineW;

    for (let i = 0; i < coords.length - 1; i++) {
      const s = speeds ? speeds[Math.min(i, speeds.length - 1)] : 0;
      ctx.strokeStyle = speedColor(s);
      ctx.beginPath();
      const [x1, y1] = geoToCanvas(coords[i][0], coords[i][1]);
      const [x2, y2] = geoToCanvas(coords[i + 1][0], coords[i + 1][1]);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // ── Pass 3: Draw GPS dots ──
  const dotR = Math.max(1, effectivePx * 0.25);
  for (const pt of vpPoints) {
    if (!visibleIds.has(pt.properties?.trackId as string)) continue;
    const speed = pt.properties?.speed ?? 0;
    ctx.fillStyle = speedColor(speed);
    const c = pt.geometry.coordinates;
    const [x, y] = geoToCanvas(c[0], c[1]);
    ctx.beginPath();
    ctx.arc(x, y, dotR, 0, Math.PI * 2);
    ctx.fill();
  }

  return { dataUrl: canvas.toDataURL(), bounds };
}

// ── Component ──

export function GpsPointFog({
  map,
  gpsData,
  loading,
  isDark,
}: GpsPointFogProps) {
  const [fogEnabled, setFogEnabled] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const popupRef = useRef<Popup | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const startMs = getPeriodMs(timePeriod);
    if (startMs === null) return gpsData;

    const endMs = Date.now();
    const validIds = new Set(
      gpsData.tracks
        .filter(t => t.endTime >= startMs && t.startTime <= endMs)
        .map(t => t.trackId),
    );

    if (validIds.size === 0) {
      return {
        points: { type: 'FeatureCollection' as const, features: [] },
        lines: { type: 'FeatureCollection' as const, features: [] },
        totalPoints: 0,
        tracks: [] as TrackInfo[],
      };
    }

    return {
      ...gpsData,
      points: {
        type: 'FeatureCollection' as const,
        features: gpsData.points.features.filter(f =>
          validIds.has(f.properties?.trackId as string),
        ),
      },
      lines: {
        type: 'FeatureCollection' as const,
        features: gpsData.lines.features.filter(f =>
          validIds.has(f.properties?.trackId as string),
        ),
      },
      tracks: gpsData.tracks.filter(t => validIds.has(t.trackId)),
    };
  }, [gpsData, timePeriod]);

  const updateFog = useCallback(() => {
    const m = map;
    if (!m || !m.getSource(FOG_IMAGE_SRC)) return;

    const fogRgba = isDark ? 'rgba(15,23,42,0.48)' : 'rgba(100,116,139,0.42)';
    const { dataUrl, bounds } = renderFogCanvas(
      filtered.lines.features, filtered.points.features, filtered.tracks, m, fogRgba,
    );

    const src = m.getSource(FOG_IMAGE_SRC) as any;
    if (src) {
      src.updateImage({
        url: dataUrl,
        coordinates: [
          [bounds.west, bounds.north],
          [bounds.east, bounds.north],
          [bounds.east, bounds.south],
          [bounds.west, bounds.south],
        ],
      });
    }
  }, [map, filtered, isDark]);

  const scheduleFogUpdate = useCallback(() => {
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(updateFog, 150);
  }, [updateFog]);

  // Setup layers
  useEffect(() => {
    const m = map;
    if (!m) return;

    if (!fogCanvasRef.current) {
      fogCanvasRef.current = document.createElement('canvas');
      fogCanvasRef.current.width = CANVAS_SIZE;
      fogCanvasRef.current.height = CANVAS_SIZE;
      const ctx = fogCanvasRef.current.getContext('2d')!;
      ctx.fillStyle = isDark ? 'rgba(15,23,42,0.48)' : 'rgba(100,116,139,0.42)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    if (!m.getSource(FOG_IMAGE_SRC)) {
      m.addSource(FOG_IMAGE_SRC, {
        type: 'image',
        url: fogCanvasRef.current.toDataURL(),
        coordinates: [[-180, 85], [180, 85], [180, -85], [-180, -85]],
      });
    }
    if (!m.getLayer(FOG_IMAGE_ID)) {
      m.addLayer({
        id: FOG_IMAGE_ID,
        type: 'raster',
        source: FOG_IMAGE_SRC,
        paint: { 'raster-opacity': 1, 'raster-fade-duration': 0 },
        layout: { visibility: 'none' },
      });
    }

    // Invisible hit layer for hover popup (above fog)
    if (!m.getSource(GPS_DOTS_SRC)) {
      m.addSource(GPS_DOTS_SRC, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!m.getLayer(GPS_DOTS_HIT_ID)) {
      m.addLayer({
        id: GPS_DOTS_HIT_ID,
        type: 'circle',
        source: GPS_DOTS_SRC,
        minzoom: 12,
        paint: { 'circle-radius': 12, 'circle-opacity': 0 },
      });
    }

    const onStyleLoad = () => {
      if (!m.getSource(FOG_IMAGE_SRC)) {
        m.addSource(FOG_IMAGE_SRC, {
          type: 'image',
          url: fogCanvasRef.current!.toDataURL(),
          coordinates: [[-180, 85], [180, 85], [180, -85], [-180, -85]],
        });
      }
      if (!m.getLayer(FOG_IMAGE_ID)) {
        m.addLayer({
          id: FOG_IMAGE_ID,
          type: 'raster',
          source: FOG_IMAGE_SRC,
          paint: { 'raster-opacity': 1, 'raster-fade-duration': 0 },
          layout: { visibility: fogEnabled ? 'visible' : 'none' },
        });
      }
      if (!m.getSource(GPS_DOTS_SRC)) {
        m.addSource(GPS_DOTS_SRC, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }
      if (!m.getLayer(GPS_DOTS_HIT_ID)) {
        m.addLayer({
          id: GPS_DOTS_HIT_ID,
          type: 'circle',
          source: GPS_DOTS_SRC,
          minzoom: 12,
          paint: { 'circle-radius': 12, 'circle-opacity': 0 },
        });
      }
      const dotsSrc = m.getSource(GPS_DOTS_SRC) as any;
      if (dotsSrc) dotsSrc.setData(filtered.points);
      scheduleFogUpdate();
    };

    updateFog();
    m.on('zoomend', scheduleFogUpdate);
    m.on('moveend', scheduleFogUpdate);
    m.on('style.load', onStyleLoad);

    return () => {
      m.off('zoomend', scheduleFogUpdate);
      m.off('moveend', scheduleFogUpdate);
      m.off('style.load', onStyleLoad);
      if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
      try { if (m.getLayer(GPS_DOTS_HIT_ID)) m.removeLayer(GPS_DOTS_HIT_ID); } catch {}
      try { if (m.getLayer(FOG_IMAGE_ID)) m.removeLayer(FOG_IMAGE_ID); } catch {}
      try { if (m.getSource(GPS_DOTS_SRC)) m.removeSource(GPS_DOTS_SRC); } catch {}
      try { if (m.getSource(FOG_IMAGE_SRC)) m.removeSource(FOG_IMAGE_SRC); } catch {}
    };
  }, [map, isDark]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hover popup
  useEffect(() => {
    const m = map;
    if (!m) return;

    const popup = new Popup({ closeButton: false, closeOnClick: false, maxWidth: '240px', offset: 8 });
    popupRef.current = popup;
    let currentId: number | string | undefined = undefined;

    const onMove = (e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      if (!e.features || e.features.length === 0) {
        if (currentId !== undefined) {
          currentId = undefined;
          m.getCanvas().style.cursor = '';
          popup.remove();
        }
        return;
      }
      const f = e.features[0];
      if (f.id === currentId) return;
      currentId = f.id;
      m.getCanvas().style.cursor = 'pointer';

      const coords = (f.geometry as Point).coordinates.slice();
      while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
        coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
      }
      const p = f.properties || {};
      const speed = typeof p.speed === 'number' ? (p.speed * 3.6).toFixed(1) : '--';
      const ts = p.timestamp ? new Date(p.timestamp).toLocaleString('zh-CN') : '--';
      popup.setLngLat(coords as [number, number]).setHTML(
        `<div style="font-size:12px;line-height:1.6;font-family:system-ui">
          <div><b>速度</b> ${speed} km/h</div>
          <div><b>时间</b> ${ts}</div>
          <div><b>坐标</b> ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}</div>
        </div>`,
      ).addTo(m);
    };

    const onLeave = () => {
      currentId = undefined;
      m.getCanvas().style.cursor = '';
      popup.remove();
    };

    m.on('mousemove', GPS_DOTS_HIT_ID, onMove);
    m.on('mouseleave', GPS_DOTS_HIT_ID, onLeave);
    return () => {
      m.off('mousemove', GPS_DOTS_HIT_ID, onMove);
      m.off('mouseleave', GPS_DOTS_HIT_ID, onLeave);
      popup.remove();
    };
  }, [map]);

  // Re-bind hover after style switch
  useEffect(() => {
    const m = map;
    if (!m) return;

    const onStyleLoad = () => {
      const popup = popupRef.current;
      if (!popup) return;
      let currentId: number | string | undefined = undefined;

      const onMove = (e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        if (!e.features || e.features.length === 0) {
          if (currentId !== undefined) {
            currentId = undefined;
            m.getCanvas().style.cursor = '';
            popup.remove();
          }
          return;
        }
        const f = e.features[0];
        if (f.id === currentId) return;
        currentId = f.id;
        m.getCanvas().style.cursor = 'pointer';

        const coords = (f.geometry as Point).coordinates.slice();
        const p = f.properties || {};
        const speed = typeof p.speed === 'number' ? (p.speed * 3.6).toFixed(1) : '--';
        const ts = p.timestamp ? new Date(p.timestamp).toLocaleString('zh-CN') : '--';
        popup.setLngLat(coords as [number, number]).setHTML(
          `<div style="font-size:12px;line-height:1.6;font-family:system-ui">
            <div><b>速度</b> ${speed} km/h</div>
            <div><b>时间</b> ${ts}</div>
            <div><b>坐标</b> ${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}</div>
          </div>`,
        ).addTo(m);
      };
      const onLeave = () => {
        currentId = undefined;
        m.getCanvas().style.cursor = '';
        popup.remove();
      };

      m.on('mousemove', GPS_DOTS_HIT_ID, onMove);
      m.on('mouseleave', GPS_DOTS_HIT_ID, onLeave);
    };

    m.on('style.load', onStyleLoad);
    return () => { m.off('style.load', onStyleLoad); };
  }, [map]);

  // Toggle fog
  useEffect(() => {
    const m = map;
    if (!m) return;
    try {
      if (m.getLayer(FOG_IMAGE_ID)) {
        m.setLayoutProperty(FOG_IMAGE_ID, 'visibility', fogEnabled ? 'visible' : 'none');
      }
    } catch {}
  }, [map, fogEnabled]);

  // Update on data change
  useEffect(() => {
    updateFog();
    const m = map;
    if (!m) return;
    const dotsSrc = m.getSource(GPS_DOTS_SRC) as any;
    if (dotsSrc) dotsSrc.setData(filtered.points);
  }, [map, filtered, updateFog]);

  const toggleFog = useCallback(() => setFogEnabled(p => !p), []);

  return (
    <div className="relative space-y-2">
      <button
        onClick={toggleFog}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shadow-md transition-all ${
          fogEnabled
            ? 'bg-indigo-600 text-white shadow-indigo-500/30'
            : isDark
              ? 'bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        {fogEnabled ? <CloudOff size={14} /> : <Cloud size={14} />}
        {fogEnabled ? '关闭迷雾' : '开启迷雾'}
      </button>

      <div className={`flex flex-wrap gap-1 px-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <Clock size={12} className="mt-1 opacity-60" />
        {TIME_PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => setTimePeriod(p.key)}
            className={`px-2 py-0.5 rounded text-[10px] font-medium shadow-sm transition-all ${
              timePeriod === p.key
                ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                : isDark
                  ? 'bg-slate-800 text-slate-300 border border-slate-600 hover:bg-slate-700'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className={`px-3 py-2 rounded-lg text-xs shadow-sm ${
        isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-gray-600'
      }`}>
        <div className="flex justify-between mb-1">
          <span>轨迹点</span>
          <span className="font-medium">
            {loading ? '加载中...' : `${filtered.totalPoints.toLocaleString()} 个`}
          </span>
        </div>
        <div className="flex justify-between mb-1">
          <span>轨迹数</span>
          <span className="font-medium">{filtered.tracks.length}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/10">
          <span className="text-[10px] opacity-50">速度</span>
          {[
            { color: '#22c55e', label: '慢' },
            { color: '#facc15', label: '中' },
            { color: '#ef4444', label: '快' },
          ].map(s => (
            <span key={s.label} className="flex items-center gap-0.5 text-[10px]">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
        <div className="text-[10px] opacity-40 mt-1">缩放到街道级别查看轨迹详情</div>
      </div>
    </div>
  );
}
