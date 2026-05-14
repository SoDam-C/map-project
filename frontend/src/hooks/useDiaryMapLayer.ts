'use client';

import { useEffect, useCallback } from 'react';
import { load } from '@/lib/storage';
import type { DiaryStore } from '@/lib/types';
import type maplibregl from 'maplibre-gl';

const SOURCE_ID = 'diary-markers';
const CIRCLE_LAYER = 'diary-circles';
const LABEL_LAYER = 'diary-labels';

/**
 * 在 MapLibre 地图上添加日记标记点图层
 * 参考 Google Maps：地点标记 + 弹窗
 */
export function useDiaryMapLayer(map: maplibregl.Map | null) {
  const addLayer = useCallback(() => {
    if (!map) return;

    const entries: DiaryStore = load('diary') || {};
    const withLocation = Object.values(entries).filter(e => e.lat && e.lng);

    if (withLocation.length === 0) return;

    // 移除已有图层
    if (map.getLayer(LABEL_LAYER)) map.removeLayer(LABEL_LAYER);
    if (map.getLayer(CIRCLE_LAYER)) map.removeLayer(CIRCLE_LAYER);
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);

    const features = withLocation.map(e => ({
      type: 'Feature' as const,
      properties: {
        id: e.id,
        title: e.title || e.locationName || '无标题',
        date: e.date,
        type: e.type,
        hasContent: e.content.length > 0,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [e.lng!, e.lat!] as [number, number],
      },
    }));

    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
    });

    map.addLayer({
      id: CIRCLE_LAYER,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'zoom'], 3, 4, 10, 8],
        'circle-color': [
          'case',
          ['boolean', ['get', 'hasContent'], false],
          '#3b82f6',
          '#64748b',
        ],
        'circle-stroke-width': 1.5,
        'circle-stroke-color': 'rgba(255,255,255,0.3)',
        'circle-opacity': 0.7,
      },
    });

    map.addLayer({
      id: LABEL_LAYER,
      type: 'symbol',
      source: SOURCE_ID,
      layout: {
        'text-field': ['get', 'title'],
        'text-size': 11,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#e2e8f0',
        'text-halo-color': 'rgba(0,0,0,0.8)',
        'text-halo-width': 1,
      },
      filter: ['>', ['zoom'], 6],
    });

    // 点击跳转日记详情
    map.on('click', CIRCLE_LAYER, (e) => {
      e.preventDefault();
      const props = e.features?.[0]?.properties;
      if (props?.id) {
        window.location.href = `/diary/${props.id}`;
      }
    });

    map.on('mouseenter', CIRCLE_LAYER, () => {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', CIRCLE_LAYER, () => {
      map.getCanvas().style.cursor = '';
    });
  }, [map]);

  const removeLayer = useCallback(() => {
    if (!map) return;
    try {
      if (map.getLayer(LABEL_LAYER)) map.removeLayer(LABEL_LAYER);
      if (map.getLayer(CIRCLE_LAYER)) map.removeLayer(CIRCLE_LAYER);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    } catch {}
  }, [map]);

  return { addLayer, removeLayer };
}
