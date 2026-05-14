'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { BasemapTheme } from '@/layers/types';
import { basemapStyles } from '@/lib/mapStyles';

export interface MapViewerHandle {
  getMap: () => maplibregl.Map | null;
}

/** 把底图文本图层改为优先显示中文名（跳过数据图层 layer-*） */
function applyChineseLabels(map: maplibregl.Map) {
  const zhField: maplibregl.DataDrivenPropertyValueSpecification<string> = [
    'coalesce',
    ['get', 'name:zh'],
    ['get', 'name'],
  ];
  const layers = map.getStyle()?.layers ?? [];
  for (const layer of layers) {
    // 跳过数据图层，只改底图图层
    if (layer.id.startsWith('layer-')) continue;
    if (layer.type === 'symbol' && layer.layout?.['text-field']) {
      try {
        map.setLayoutProperty(layer.id, 'text-field', zhField);
      } catch {
        // 某些图层可能不支持修改，忽略
      }
    }
  }
}

/** 获取底图样式（URL 或 style 对象） */
function getStyleValue(theme: BasemapTheme): string | maplibregl.StyleSpecification {
  const style = basemapStyles[theme];
  if (!style) return basemapStyles.dark!.url!;
  if (style.styleSpec) return style.styleSpec as maplibregl.StyleSpecification;
  return style.url!;
}

interface MapViewerProps {
  basemapTheme: BasemapTheme;
  onMapReady?: (map: maplibregl.Map) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export const MapViewer = forwardRef<MapViewerHandle, MapViewerProps>(
  ({ basemapTheme, onMapReady, initialCenter, initialZoom }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const onMapReadyRef = useRef(onMapReady);
    const isFirstMount = useRef(true);
    onMapReadyRef.current = onMapReady;

    useImperativeHandle(ref, () => ({
      getMap: () => mapRef.current,
    }));

    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: getStyleValue(basemapTheme),
        center: initialCenter ?? [10, 30],
        zoom: initialZoom ?? 2.5,
        attributionControl: false,
      });

      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right'
      );

      mapRef.current = map;

      map.on('load', () => {
        applyChineseLabels(map);
        onMapReadyRef.current?.(map);
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 切换底图 — 保留数据图层
    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      // 首次挂载跳过，避免和初始化冲突
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }

      if (!map.getStyle()) return;

      const currentStyle = map.getStyle();
      const dataSources: Record<string, unknown> = {};
      const dataLayers: unknown[] = [];

      if (currentStyle?.sources) {
        for (const [id, source] of Object.entries(currentStyle.sources)) {
          if (id.startsWith('layer-')) {
            dataSources[id] = source;
          }
        }
      }
      if (currentStyle?.layers) {
        for (const layer of currentStyle.layers) {
          if (layer.id.startsWith('layer-')) {
            dataLayers.push(layer);
          }
        }
      }

      // 先注册监听，再切换样式（内联 style 对象会同步触发 style.load）
      map.once('style.load', () => {
        applyChineseLabels(map);

        for (const [id, source] of Object.entries(dataSources)) {
          if (!map.getSource(id)) {
            map.addSource(id, source as maplibregl.SourceSpecification);
          }
        }
        for (const layer of dataLayers) {
          const spec = layer as maplibregl.LayerSpecification;
          if (!map.getLayer(spec.id)) {
            map.addLayer(spec);
          }
        }
      });

      map.setStyle(getStyleValue(basemapTheme));
    }, [basemapTheme]);

    return (
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    );
  }
);

MapViewer.displayName = 'MapViewer';
