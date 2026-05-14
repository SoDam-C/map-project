'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { GpsTrack, GpsPoint } from '@/lib/types';

interface TrackLayerProps {
  map: MapLibreMap | null;
  tracks: GpsTrack[];
  /** 当前选中轨迹的 GPS 点（用于渲染路径线） */
  activeTrackPoints?: GpsPoint[];
  activeTrackId?: string | null;
  /** 轨迹颜色 */
  color?: string;
  /** 点击轨迹回调 */
  onTrackClick?: (track: GpsTrack) => void;
  visible?: boolean;
}

const SOURCE_ID = 'track-routes';
const LINE_LAYER = 'track-line';
const POINT_LAYER = 'track-points';
const ACTIVE_LINE_LAYER = 'track-active-line';
const ACTIVE_POINT_LAYER = 'track-active-points';

export function TrackLayer({
  map,
  tracks,
  activeTrackPoints,
  activeTrackId,
  color = '#f59e0b',
  onTrackClick,
  visible = true,
}: TrackLayerProps) {
  const initialized = useRef(false);
  const activeTrackPointsRef = useRef(activeTrackPoints);
  activeTrackPointsRef.current = activeTrackPoints;
  const onTrackClickRef = useRef(onTrackClick);
  onTrackClickRef.current = onTrackClick;

  // 初始化图层
  useEffect(() => {
    const m = map;
    if (!m || initialized.current) return;
    initialized.current = true;

    // 已完成轨迹路径线（bounds 简化为起终点连线）
    m.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    m.addLayer({
      id: LINE_LAYER,
      type: 'line',
      source: SOURCE_ID,
      paint: {
        'line-color': color,
        'line-width': 2,
        'line-opacity': 0.7,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      filter: ['!=', ['get', 'id'], ''],
    });

    // 轨迹起终点标记
    m.addLayer({
      id: POINT_LAYER,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': 4,
        'circle-color': color,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
      filter: ['in', ['get', 'markerType'], ['literal', ['start', 'end']]],
    });

    // 选中轨迹详细路径
    m.addSource('track-active-route', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });

    m.addLayer({
      id: ACTIVE_LINE_LAYER,
      type: 'line',
      source: 'track-active-route',
      paint: {
        'line-color': color,
        'line-width': 3.5,
        'line-opacity': 0.9,
      },
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
    });

    m.addLayer({
      id: ACTIVE_POINT_LAYER,
      type: 'circle',
      source: 'track-active-route',
      paint: {
        'circle-radius': 3,
        'circle-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-stroke-color': color,
      },
      filter: ['in', ['get', 'markerType'], ['literal', ['start', 'end']]],
    });

    // 点击事件
    const onClick = (e: any) => {
      if (!onTrackClickRef.current) return;
      const features = m.queryRenderedFeatures(e.point, {
        layers: [LINE_LAYER, POINT_LAYER],
      });
      if (features.length > 0) {
        const trackId = features[0].properties?.trackId;
        if (trackId) {
          const track = tracks.find(t => t.id === trackId);
          if (track) onTrackClickRef.current(track);
        }
      }
    };
    m.on('click', onClick);

    return () => {
      m.off('click', onClick);
      try {
        if (m.getLayer(ACTIVE_POINT_LAYER)) m.removeLayer(ACTIVE_POINT_LAYER);
        if (m.getLayer(ACTIVE_LINE_LAYER)) m.removeLayer(ACTIVE_LINE_LAYER);
        if (m.getLayer(POINT_LAYER)) m.removeLayer(POINT_LAYER);
        if (m.getLayer(LINE_LAYER)) m.removeLayer(LINE_LAYER);
        if (m.getSource('track-active-route')) m.removeSource('track-active-route');
        if (m.getSource(SOURCE_ID)) m.removeSource(SOURCE_ID);
      } catch { /* ignore */ }
      initialized.current = false;
    };
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  // 更新轨迹列表（bounds 转为简化路径）
  useEffect(() => {
    const m = map;
    if (!m || !initialized.current) return;

    try {
      const source = m.getSource(SOURCE_ID) as any;
      if (!source) return;

      if (!visible) {
        source.setData({ type: 'FeatureCollection', features: [] });
        return;
      }

      const features: any[] = tracks.map(track => {
        const [minLng, minLat, maxLng, maxLat] = track.bounds;
        return {
          type: 'Feature',
          properties: {
            id: track.id,
            trackId: track.id,
            title: track.title || track.id,
            markerType: 'route',
          },
          geometry: {
            type: 'LineString',
            coordinates: [[minLng, minLat], [maxLng, maxLat]],
          },
        };
      });

      // 添加起终点标记
      for (const track of tracks) {
        const [minLng, minLat, maxLng, maxLat] = track.bounds;
        features.push({
          type: 'Feature',
          properties: {
            id: `${track.id}-start`,
            trackId: track.id,
            markerType: 'start',
          },
          geometry: {
            type: 'Point',
            coordinates: [minLng, minLat],
          },
        });
        features.push({
          type: 'Feature',
          properties: {
            id: `${track.id}-end`,
            trackId: track.id,
            markerType: 'end',
          },
          geometry: {
            type: 'Point',
            coordinates: [maxLng, maxLat],
          },
        });
      }

      source.setData({ type: 'FeatureCollection', features });
    } catch { /* ignore */ }
  }, [map, tracks, visible]);

  // 更新选中轨迹的详细路径
  useEffect(() => {
    const m = map;
    if (!m || !initialized.current) return;

    try {
      const source = m.getSource('track-active-route') as any;
      if (!source) return;

      if (!activeTrackPoints || activeTrackPoints.length === 0) {
        source.setData({ type: 'FeatureCollection', features: [] });
        return;
      }

      const features: any[] = [];

      // 路径线
      features.push({
        type: 'Feature',
        properties: { id: 'active-route' },
        geometry: {
          type: 'LineString',
          coordinates: activeTrackPoints.map(p => [p.lng, p.lat]),
        },
      });

      // 起终点
      if (activeTrackPoints.length > 0) {
        const first = activeTrackPoints[0];
        const last = activeTrackPoints[activeTrackPoints.length - 1];
        features.push({
          type: 'Feature',
          properties: { id: 'active-start', markerType: 'start' },
          geometry: { type: 'Point', coordinates: [first.lng, first.lat] },
        });
        if (first !== last) {
          features.push({
            type: 'Feature',
            properties: { id: 'active-end', markerType: 'end' },
            geometry: { type: 'Point', coordinates: [last.lng, last.lat] },
          });
        }
      }

      source.setData({ type: 'FeatureCollection', features });
    } catch { /* ignore */ }
  }, [map, activeTrackPoints]);

  // 飞到选中轨迹
  const flyToTrack = useCallback((track: GpsTrack) => {
    if (!map) return;
    const [minLng, minLat, maxLng, maxLat] = track.bounds;
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
      padding: 80,
      duration: 1000,
    });
  }, [map]);

  return null;
}
