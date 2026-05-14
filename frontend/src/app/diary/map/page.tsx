'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { initStorage, load } from '@/lib/storage';
import type { DiaryStore, DiaryEntry } from '@/lib/types';
import { ArrowLeft, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function DiaryMapPage() {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initStorage();
    const store = load<DiaryStore>('diary') || {};
    const withLocation = Object.values(store).filter(e => e.lat && e.lng);
    setEntries(withLocation);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !ready || entries.length === 0) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        name: 'Diary Map',
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
      center: [105, 35],
      zoom: 3,
    });

    map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    map.on('load', () => {
      // 添加日记标记点
      const features = entries.map(e => ({
        type: 'Feature' as const,
        properties: {
          id: e.id,
          title: e.title || e.locationName || '无标题',
          date: e.date,
          mood: e.mood || '',
          type: e.type,
          hasContent: e.content.length > 0,
          photoCount: e.photoRefs.length,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [e.lng!, e.lat!] as [number, number],
        },
      }));

      map.addSource('diary-points', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      // 圆点图层
      map.addLayer({
        id: 'diary-circles',
        type: 'circle',
        source: 'diary-points',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'zoom'], 3, 5, 10, 10],
          'circle-color': [
            'case',
            ['boolean', ['get', 'hasContent'], false],
            '#3b82f6',
            ['==', ['get', 'type'], 'track_entry'],
            '#22c55e',
            '#94a3b8',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
          'circle-opacity': 0.8,
        },
      });

      // 文字标签
      map.addLayer({
        id: 'diary-labels',
        type: 'symbol',
        source: 'diary-points',
        layout: {
          'text-field': ['get', 'title'],
          'text-size': 12,
          'text-offset': [0, 1.5],
          'text-anchor': 'top',
          'text-max-width': 8,
        },
        paint: {
          'text-color': '#e2e8f0',
          'text-halo-color': 'rgba(0,0,0,0.8)',
          'text-halo-width': 1,
        },
        filter: ['>', ['zoom'], 5],
      });

      // 点击弹窗
      map.on('click', 'diary-circles', (e) => {
        const props = e.features?.[0]?.properties;
        if (!props) return;

        const coordinates = (e.features?.[0]?.geometry as any)?.coordinates as [number, number];
        if (!coordinates) return;

        if (popupRef.current) popupRef.current.remove();

        popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: false })
          .setLngLat(coordinates)
          .setHTML(`
            <div style="font-family:system-ui;min-width:180px;cursor:pointer" onclick="window.location.href='/diary/${props.id}'">
              <div style="font-weight:600;font-size:14px;margin-bottom:4px">${props.title}</div>
              <div style="font-size:12px;color:#94a3b8">${props.date}</div>
              ${props.mood ? `<div style="font-size:12px;margin-top:2px">${props.mood}</div>` : ''}
              <div style="font-size:10px;color:#64748b;margin-top:4px">点击查看详情</div>
            </div>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'diary-circles', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'diary-circles', () => {
        map.getCanvas().style.cursor = '';
      });

      // 适配视图
      const bounds = new maplibregl.LngLatBounds();
      entries.forEach(e => {
        if (e.lat && e.lng) bounds.extend([e.lng, e.lat]);
      });
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
      }
    });

    mapRef.current = map;

    return () => {
      if (popupRef.current) popupRef.current.remove();
      map.remove();
    };
  }, [ready, entries]);

  return (
    <div className="h-screen w-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* 顶栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/diary" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-medium text-sm flex items-center gap-2">
            <MapPin size={16} className="text-blue-400" />
            日记地图
          </span>
          <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
            {entries.length} 个地点
          </span>
        </div>
      </div>

      {/* 地图 */}
      <div ref={mapContainer} className="absolute inset-0" style={{ marginTop: '56px' }} />

      {/* 图例 */}
      <div className="absolute bottom-6 left-4 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md border border-white/10 rounded-lg p-3">
        <div className="text-[10px] text-[var(--color-text-secondary)] space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            有内容
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            轨迹日记
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            待填充
          </div>
        </div>
      </div>
    </div>
  );
}
