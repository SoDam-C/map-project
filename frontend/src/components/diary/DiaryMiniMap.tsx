'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Props {
  lat: number;
  lng: number;
  title: string;
}

export function DiaryMiniMap({ lat, lng, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          carto: {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
          },
        },
        layers: [{ id: 'carto-layer', type: 'raster', source: 'carto' }],
      },
      center: [lng, lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    });

    // 标记点
    new maplibregl.Marker({ color: '#3b82f6' })
      .setLngLat([lng, lat])
      .addTo(map);

    mapRef.current = map;

    return () => { map.remove(); };
  }, [lat, lng]);

  return <div ref={containerRef} className="w-full h-full" />;
}
